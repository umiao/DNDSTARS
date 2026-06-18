import { expect, test, type APIRequestContext } from '@playwright/test'

const DM = 'http://127.0.0.1:6173'
const PLAYER = 'http://127.0.0.1:6174'

function center(col: number, row: number, gridSize = 70) {
  return {
    x: (col + 0.5) * gridSize,
    y: (row + 0.5) * gridSize,
  }
}

function heroCharacter(patch: Record<string, unknown> = {}) {
  return {
    id: 'hero-regression',
    name: 'E2E Adventurer',
    player: 'E2E',
    avatar: '🧝',
    accent: 'from-emerald-500 to-cyan-500',
    race: 'Human',
    charClass: '弓手',
    level: 5,
    background: '',
    experience: 0,
    reputation: 0,
    abilities: { str: 10, dex: 30, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    skills: [],
    maxHp: 100,
    currentHp: 100,
    tempHp: 0,
    hitDice: '1d8',
    ac: 99,
    speed: 30,
    initiativeBonus: 0,
    saveDC: 12,
    actionPoints: 2,
    currentAP: 2,
    passivePerception: 10,
    inspiration: 0,
    mana: 0,
    maxMana: 0,
    traits: [],
    combatSkills: [],
    conditions: [],
    notes: '',
    dmNotes: '',
    visibleToPlayers: true,
    combatBuffs: {},
    ...patch,
  }
}

async function putState(request: APIRequestContext, name: string, payload: unknown) {
  const res = await request.put(`${DM}/api/state/${name}`, { data: payload })
  expect(res.ok()).toBeTruthy()
}

async function postEvent(request: APIRequestContext, channel: string, payload: unknown) {
  const res = await request.post(`${DM}/api/events/${channel}`, { data: payload })
  expect(res.ok()).toBeTruthy()
}

async function getState<T>(request: APIRequestContext, name: string): Promise<T> {
  const res = await request.get(`${DM}/api/state/${name}`)
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as T
}

async function seedEncounter(request: APIRequestContext, mapId: string, opts: { playerFirst?: boolean } = {}) {
  const now = Date.now()
  await putState(request, 'characters', {
    characters: [
      heroCharacter(
        opts.playerFirst
          ? {
              traits: [
                {
                  id: 'precise-regression',
                  name: '精准打击',
                  level: 1,
                  uses: 1,
                  maxUses: 1,
                  description: '使得下一次攻击必定造成重击。',
                  featureKey: 'preciseStrike',
                },
              ],
            }
          : {},
      ),
    ],
    selectedId: 'hero-regression',
    updatedAt: now,
  })
  await putState(request, 'maps', {
    selectedId: mapId,
    updatedAt: now,
    maps: [
      {
        id: mapId,
        name: `E2E Combat Regression ${mapId}`,
        width: 980,
        height: 700,
        gridSize: 70,
        gridOffsetX: 0,
        gridOffsetY: 0,
        showGrid: true,
        builtinGridDetected: false,
        feetPerCell: 5,
        gridColor: '#c4b5fd',
        gridOpacity: 0.28,
        showCoordinates: true,
        snapMonstersToGrid: true,
        tokens: [
          {
            id: 'goblin-regression',
            label: 'E2E Goblin',
            ...center(1, 1),
            color: '#f87171',
            emoji: '👺',
            size: 1,
            type: 'enemy',
            hp: 20,
            maxHp: 20,
            poolId: 'goblin',
            showHpOnToken: true,
            showDetailOnToken: true,
          },
          {
            id: 'red-dragon-regression',
            label: 'E2E Red Dragon Wyrmling',
            ...center(2, 2),
            color: '#ef4444',
            emoji: '🐉',
            size: 1,
            type: 'enemy',
            hp: 40,
            maxHp: 40,
            poolId: 'wyrmling-red',
            showHpOnToken: true,
            showDetailOnToken: true,
          },
          {
            id: 'player-regression',
            label: 'E2E Adventurer',
            ...center(10, 1),
            color: '#34d399',
            emoji: '🧝',
            size: 1,
            type: 'player',
            characterId: 'hero-regression',
          },
        ],
      },
    ],
  })
  await putState(request, 'combat-log', { mapId, entries: [], updatedAt: now })
  await putState(request, 'dodge', { id: `${mapId}:none`, mapId, status: 'done', updatedAt: now })
  await putState(request, 'player-action', { id: `${mapId}:none`, mapId, status: 'done', updatedAt: now })
  await putState(request, 'player-action-ack', { id: `${mapId}:none`, mapId, actionId: 'none', status: 'accepted', round: 1, initiativeIndex: 0, updatedAt: now })
  await putState(request, 'combat', {
    mapId,
    active: true,
    round: 1,
    initiativeIndex: 0,
    initiativeOrder: opts.playerFirst
      ? [
          { tokenId: 'player-regression', label: 'E2E Adventurer', emoji: '🧝', color: '#34d399', roll: 20 },
          { tokenId: 'goblin-regression', label: 'E2E Goblin', emoji: '👺', color: '#f87171', roll: 10 },
          { tokenId: 'red-dragon-regression', label: 'E2E Red Dragon Wyrmling', emoji: '🐉', color: '#ef4444', roll: 5 },
        ]
      : [
          { tokenId: 'goblin-regression', label: 'E2E Goblin', emoji: '👺', color: '#f87171', roll: 20 },
          { tokenId: 'player-regression', label: 'E2E Adventurer', emoji: '🧝', color: '#34d399', roll: 10 },
          { tokenId: 'red-dragon-regression', label: 'E2E Red Dragon Wyrmling', emoji: '🐉', color: '#ef4444', roll: 5 },
        ],
    enemyApByToken: {
      'goblin-regression': { current: 2, max: 2 },
      'red-dragon-regression': { current: 2, max: 2 },
    },
    updatedAt: now,
  })
}

test('goblin-first mixed enemy encounter does not silently skip the goblin turn', async ({ browser, request }) => {
  const mapId = `e2e-mixed-enemy-${Date.now()}`
  await seedEncounter(request, mapId)

  const context = await browser.newContext()
  const dm = await context.newPage()
  const player = await context.newPage()
  await Promise.all([
    dm.goto(`${DM}/maps`, { waitUntil: 'domcontentloaded' }),
    player.goto(`${PLAYER}/maps`, { waitUntil: 'domcontentloaded' }),
  ])

  await expect
    .poll(
      async () => {
        const dodge = await getState<{
          mapId?: string
          status?: string
          result?: { attackerTokenId?: string; targetTokenId?: string }
        }>(request, 'dodge')
        return dodge.mapId === mapId && dodge.status === 'pending' ? dodge.result?.attackerTokenId : ''
      },
      { timeout: 45_000 },
    )
    .toBe('goblin-regression')

  const combat = await getState<{
    round: number
    initiativeIndex: number
    enemyApByToken: Record<string, { current: number; max: number }>
  }>(request, 'combat')
  expect(combat.round).toBe(1)
  expect(combat.initiativeIndex).toBe(0)
  expect(combat.enemyApByToken['goblin-regression']?.current).toBe(1)

  await context.close()
})

test('player precise strike activation is accepted by DM authority', async ({ browser, request }) => {
  const mapId = `e2e-precise-${Date.now()}`
  await seedEncounter(request, mapId, { playerFirst: true })

  const context = await browser.newContext()
  const dm = await context.newPage()
  const player = await context.newPage()
  await Promise.all([
    dm.goto(`${DM}/maps`, { waitUntil: 'domcontentloaded' }),
    player.goto(`${PLAYER}/maps`, { waitUntil: 'domcontentloaded' }),
  ])

  await expect
    .poll(
      async () => {
        const combat = await getState<{ mapId?: string; active?: boolean; initiativeIndex?: number }>(request, 'combat')
        return combat.mapId === mapId && combat.active && combat.initiativeIndex === 0
      },
      { timeout: 20_000 },
    )
    .toBe(true)

  const now = Date.now()
  const action = {
    id: `${mapId}:player-action:${now}:1`,
    mapId,
    sourceMode: 'player',
    status: 'pending',
    type: 'activate-feature',
    actorTokenId: 'player-regression',
    characterId: 'hero-regression',
    featureKey: 'preciseStrike',
    round: 1,
    initiativeIndex: 0,
    seq: 1,
    updatedAt: now,
  }
  await putState(request, 'player-action', action)
  await postEvent(request, 'player-action-player-to-dm', action)

  await expect
    .poll(
      async () => {
        const characters = await getState<{
          characters: Array<{ id: string; currentAP: number; combatBuffs?: { preciseStrikeReady?: boolean } }>
        }>(request, 'characters')
        const hero = characters.characters.find((item) => item.id === 'hero-regression')
        return { ap: hero?.currentAP, ready: !!hero?.combatBuffs?.preciseStrikeReady }
      },
      { timeout: 30_000 },
    )
    .toEqual({ ap: 1, ready: true })

  await expect
    .poll(
      async () => {
        const ack = await getState<{ actionId?: string; status?: string; reason?: string }>(request, 'player-action-ack')
        return ack.actionId === action.id ? ack.status : ''
      },
      { timeout: 20_000 },
    )
    .toBe('accepted')

  await context.close()
})
