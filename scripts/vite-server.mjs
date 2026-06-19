import { createServer } from 'vite'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i]
  const next = process.argv[i + 1]
  if (key.startsWith('--')) {
    args.set(key.slice(2), next && !next.startsWith('--') ? next : true)
    if (next && !next.startsWith('--')) i += 1
  }
}

const host = String(args.get('host') ?? '127.0.0.1')
const port = Number(args.get('port') ?? 5173)
const strictPort = args.has('strictPort') || args.get('strict-port') === true
const sharedRoot = process.env.STARS_SHARED_ROOT
  ? path.resolve(process.env.STARS_SHARED_ROOT)
  : path.resolve(
      process.env.LOCALAPPDATA ?? process.env.APPDATA ?? os.tmpdir(),
      'StarsApp',
      'shared',
    )
const stateRoot = path.join(sharedRoot, 'state')
const imageRoot = path.join(sharedRoot, 'images')
const legacySharedRoot = path.resolve(process.cwd(), '.stars-shared')
const legacyStateRoot = path.join(legacySharedRoot, 'state')
const legacyImageRoot = path.join(legacySharedRoot, 'images')
const eventClients = new Map()
const eventBacklog = new Map()
const EVENT_BACKLOG_LIMIT = 1200

function safeName(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '')
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function addEventClient(channel, res) {
  const clients = eventClients.get(channel) ?? new Set()
  clients.add(res)
  eventClients.set(channel, clients)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })
  res.write(`event: ready\ndata: {"channel":"${channel}"}\n\n`)
  const backlog = eventBacklog.get(channel) ?? []
  for (const payload of backlog) {
    res.write(`event: message\ndata: ${JSON.stringify(payload)}\n\n`)
  }
  return () => {
    clients.delete(res)
    if (clients.size === 0) eventClients.delete(channel)
  }
}

function publishEvent(channel, payload) {
  const backlog = eventBacklog.get(channel) ?? []
  backlog.push(payload)
  if (backlog.length > EVENT_BACKLOG_LIMIT) backlog.splice(0, backlog.length - EVENT_BACKLOG_LIMIT)
  eventBacklog.set(channel, backlog)
  const clients = eventClients.get(channel)
  if (!clients) return
  const text = `event: message\ndata: ${JSON.stringify(payload)}\n\n`
  for (const client of clients) client.write(text)
}

async function handleSharedApi(req, res) {
  const parsed = new URL(req.url ?? '/', `http://${host}:${port}`)
  if (!parsed.pathname.startsWith('/api/')) return false
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }

  try {
    const eventMatch = parsed.pathname.match(/^\/api\/events\/([a-zA-Z0-9_-]+)$/)
    if (eventMatch) {
      const channel = safeName(eventMatch[1])
      if (req.method === 'DELETE') {
        if (channel === '_all') eventBacklog.clear()
        else eventBacklog.delete(channel)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
        return true
      }
      if (req.method === 'GET') {
        const remove = addEventClient(channel, res)
        req.on('close', remove)
        return true
      }
      if (req.method === 'POST') {
        const body = await readBody(req)
        const payload = JSON.parse(body.toString('utf8'))
        publishEvent(channel, payload)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
        return true
      }
    }

    const stateMatch = parsed.pathname.match(/^\/api\/state\/([a-zA-Z0-9_-]+)$/)
    if (stateMatch) {
      const name = safeName(stateMatch[1])
      const filePath = path.join(stateRoot, `${name}.json`)
      if (req.method === 'GET') {
        try {
          let data
          try {
            data = await readFile(filePath, 'utf8')
          } catch {
            data = await readFile(path.join(legacyStateRoot, `${name}.json`), 'utf8')
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(data)
        } catch {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end('null')
        }
        return true
      }
      if (req.method === 'PUT') {
        await mkdir(stateRoot, { recursive: true })
        const body = await readBody(req)
        JSON.parse(body.toString('utf8'))
        const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
        await writeFile(tmpPath, body)
        await rename(tmpPath, filePath)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
        return true
      }
      if (req.method === 'DELETE') {
        await rm(filePath, { force: true })
        await rm(path.join(legacyStateRoot, `${name}.json`), { force: true })
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
        return true
      }
    }

    const imageMatch = parsed.pathname.match(/^\/api\/images\/([a-zA-Z0-9_-]+)$/)
    if (imageMatch) {
      const id = safeName(imageMatch[1])
      const filePath = path.join(imageRoot, id)
      const metaPath = path.join(imageRoot, `${id}.json`)
      if (req.method === 'GET') {
        try {
          let sourcePath = filePath
          let sourceMetaPath = metaPath
          try {
            await readFile(metaPath, 'utf8')
          } catch {
            sourcePath = path.join(legacyImageRoot, id)
            sourceMetaPath = path.join(legacyImageRoot, `${id}.json`)
          }
          const meta = JSON.parse(await readFile(sourceMetaPath, 'utf8'))
          res.writeHead(200, { 'Content-Type': meta.type || 'application/octet-stream' })
          createReadStream(sourcePath).pipe(res)
        } catch {
          res.writeHead(404)
          res.end('Not Found')
        }
        return true
      }
      if (req.method === 'PUT') {
        await mkdir(imageRoot, { recursive: true })
        const body = await readBody(req)
        await writeFile(filePath, body)
        await writeFile(metaPath, JSON.stringify({ type: req.headers['content-type'] || 'application/octet-stream' }))
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
        return true
      }
      if (req.method === 'DELETE') {
        await rm(filePath, { force: true })
        await rm(metaPath, { force: true })
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"ok":true}')
        return true
      }
    }

    res.writeHead(404)
    res.end('Not Found')
    return true
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: String(error?.message ?? error) }))
    return true
  }
}

const server = await createServer({
  clearScreen: false,
  server: {
    host,
    port,
    strictPort,
  },
})

const sharedApiMiddleware = (req, res, next) => {
  void handleSharedApi(req, res).then((handled) => {
    if (!handled) next()
  })
}

if (Array.isArray(server.middlewares.stack)) {
  server.middlewares.stack.unshift({ route: '', handle: sharedApiMiddleware })
} else {
  server.middlewares.use(sharedApiMiddleware)
}

await server.listen()
server.printUrls()

const close = async () => {
  await server.close()
  process.exit(0)
}

process.on('SIGINT', close)
process.on('SIGTERM', close)

setInterval(() => {}, 1 << 30)
