import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultTokenSizeForMap, realignTokensToGrid, snapToCellCenter } from '../lib/gridCombat'
import { applyGridDetectPatch, type GridDetectResult } from '../lib/gridDetect'
import { enemyTemplateToTokenPatch, type EnemyTemplate } from '../lib/enemyPool'
import { putImage, deleteImage } from '../lib/imageStore'
import { loadSharedResource, saveSharedResource } from '../lib/sharedApi'
import { canWriteSharedState, isPlayerPort } from '../lib/appMode'
function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

let lastSharedMapsSnapshot = ''
let lastSharedMapsUpdatedAt = 0

interface SharedMapsState {
  maps: BattleMap[]
  selectedId: string | null
  updatedAt?: number
}

function mergePlayerTokenCombatFields(localMaps: BattleMap[], sharedMaps: BattleMap[]): BattleMap[] {
  const sharedMapById = new Map(sharedMaps.map((map) => [map.id, map]))
  return localMaps.map((map) => {
    const sharedMap = sharedMapById.get(map.id)
    if (!sharedMap) return map
    const sharedTokenById = new Map(sharedMap.tokens.map((token) => [token.id, token]))
    return {
      ...map,
      tokens: map.tokens.map((token) => {
        const sharedToken = sharedTokenById.get(token.id)
        if (!sharedToken) return token
        const dmControlledPosition =
          token.type !== 'player'
            ? {
                x: sharedToken.x,
                y: sharedToken.y,
              }
            : {}
        return {
          ...token,
          ...dmControlledPosition,
          hp: sharedToken.hp,
          maxHp: sharedToken.maxHp,
          burningTurns: sharedToken.burningTurns,
          igniteTurns: sharedToken.igniteTurns,
          poisonTurns: sharedToken.poisonTurns,
          knockbackTurns: sharedToken.knockbackTurns,
          stunTurns: sharedToken.stunTurns,
          restrainedTurns: sharedToken.restrainedTurns,
          vulnerableTurns: sharedToken.vulnerableTurns,
          noMoveTurns: sharedToken.noMoveTurns,
          huntingMarkStacks: sharedToken.huntingMarkStacks,
        }
      }),
    }
  })
}

function publishMapsState(state: Pick<MapState, 'maps' | 'selectedId'>): void {
  void (async () => {
    let maps = state.maps
    if (isPlayerPort()) {
      const shared = await loadSharedResource<SharedMapsState>('maps')
      if (shared?.maps) maps = mergePlayerTokenCombatFields(maps, shared.maps)
    }
    const payload: SharedMapsState = { maps, selectedId: state.selectedId, updatedAt: Date.now() }
    lastSharedMapsUpdatedAt = payload.updatedAt ?? Date.now()
    lastSharedMapsSnapshot = JSON.stringify(payload)
    await saveSharedResource('maps', payload)
  })()
}

export interface Token {
  id: string
  label: string
  x: number // 画布坐标（图片像素）
  y: number
  color: string // 边框/底色
  emoji: string
  size: number // 直径（格数的倍数，1 = 一格）
  type: 'player' | 'enemy' | 'npc' | 'obstacle'
  characterId?: string // 关联的角色（点击 token 即可调出其技能栏）
  hp?: number // 生命值（用于未关联角色的敌人/NPC）
  maxHp?: number
  /** 玩家端是否在 Token 上方显示血量条（DM 始终显示；默认对玩家可见） */
  showHpOnToken?: boolean
  /** 玩家端点击时是否显示怪物详情（DM 始终显示；默认对玩家可见） */
  showDetailOnToken?: boolean
  /** 燃烧剩余回合，0 或未设置 = 未燃烧 */
  burningTurns?: number
  /** 点燃剩余回合，0 或未设置 = 未点燃 */
  igniteTurns?: number
  /** 中毒剩余回合，0 或未设置 = 未中毒 */
  poisonTurns?: number
  /** 击飞剩余回合，0 或未设置 = 未被击飞 */
  knockbackTurns?: number
  /** 眩晕剩余回合，0 或未设置 = 未眩晕 */
  stunTurns?: number
  /** 束缚剩余回合，0 或未设置 = 未束缚 */
  restrainedTurns?: number
  /** 脆弱剩余回合，0 或未设置 = 未脆弱 */
  vulnerableTurns?: number
  /** 禁止移动剩余回合，0 或未设置 = 可移动 */
  noMoveTurns?: number
  /** 逐风者 · 狩猎印记层数（0–4） */
  huntingMarkStacks?: number
  /** 来自怪物池的模板 id */
  poolId?: string
  obstacleKind?: string
}

export interface BattleMap {
  id: string
  name: string
  width: number
  height: number
  gridSize: number // 每格像素（1 格 = 5 尺）
  gridOffsetX: number
  gridOffsetY: number
  showGrid: boolean
  /** 上传时识别到底图自带网格 */
  builtinGridDetected?: boolean
  feetPerCell?: number
  /** 叠加网格颜色 #RRGGBB */
  gridColor?: string
  /** 叠加网格不透明度 0–1 */
  gridOpacity?: number
  /** 显示地图格子的 X/Y 坐标轴 */
  showCoordinates?: boolean
  /** 勾选后敌人/NPC 拖放时吸附到格心 */
  snapMonstersToGrid?: boolean
  tokens: Token[]
}

const TOKEN_PRESETS = {
  player: { color: '#34d399', emoji: '🛡️' },
  enemy: { color: '#f87171', emoji: '👹' },
  npc: { color: '#fbbf24', emoji: '🧑' },
  obstacle: { color: '#94a3b8', emoji: '🪨' },
}

interface MapState {
  maps: BattleMap[]
  selectedId: string | null
  loadShared: () => Promise<void>
  select: (id: string | null) => void
  addMap: (meta: {
    name: string
    width: number
    height: number
    blob: Blob
    gridDetect?: GridDetectResult
  }) => Promise<string>
  updateMap: (id: string, patch: Partial<BattleMap>) => void
  removeMap: (id: string) => void
  addToken: (mapId: string, type: Token['type']) => void
  addObstacle: (mapId: string, kind: string) => void
  addEnemyFromPool: (mapId: string, template: EnemyTemplate) => string | null
  addCharacterToken: (
    mapId: string,
    payload: { characterId: string; name: string; emoji: string; type?: Token['type'] },
  ) => void
  updateToken: (mapId: string, tokenId: string, patch: Partial<Token>) => void
  removeToken: (mapId: string, tokenId: string) => void
}

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      maps: [],
      selectedId: null,
      loadShared: async () => {
        const shared = await loadSharedResource<SharedMapsState>('maps')
        if (!shared?.maps) {
          if (canWriteSharedState()) publishMapsState(get())
          return
        }
        if (!isPlayerPort() && (shared.updatedAt ?? 0) < lastSharedMapsUpdatedAt) return
        lastSharedMapsUpdatedAt = shared.updatedAt ?? lastSharedMapsUpdatedAt
        const snapshot = JSON.stringify(shared)
        if (snapshot === lastSharedMapsSnapshot) return
        lastSharedMapsSnapshot = snapshot
        set({ maps: shared.maps, selectedId: shared.selectedId ?? shared.maps[0]?.id ?? null })
      },
      select: (id) => set({ selectedId: id }),

      addMap: async ({ name, width, height, blob, gridDetect }) => {
        const id = uid()
        await putImage(id, blob)
        const gridPatch = gridDetect ? applyGridDetectPatch(gridDetect) : { builtinGridDetected: false }
        const map: BattleMap = {
          id,
          name,
          width,
          height,
          gridSize: gridPatch.gridSize ?? 70,
          gridOffsetX: gridPatch.gridOffsetX ?? 0,
          gridOffsetY: gridPatch.gridOffsetY ?? 0,
          showGrid: gridPatch.showGrid ?? true,
          builtinGridDetected: gridPatch.builtinGridDetected,
          feetPerCell: 5,
          gridColor: '#c4b5fd',
          gridOpacity: 0.28,
          showCoordinates: true,
          snapMonstersToGrid: true,
          tokens: [],
        }
        set((s) => ({ maps: [...s.maps, map], selectedId: id }))
        publishMapsState(get())
        return id
      },

      updateMap: (id, patch) => {
        set((s) => ({
          maps: s.maps.map((m) => {
            if (m.id !== id) return m
            const next = { ...m, ...patch }
            const gridChanged =
              (patch.gridSize != null && patch.gridSize !== m.gridSize) ||
              (patch.gridOffsetX != null && patch.gridOffsetX !== m.gridOffsetX) ||
              (patch.gridOffsetY != null && patch.gridOffsetY !== m.gridOffsetY)
            if (gridChanged) {
              next.tokens = realignTokensToGrid(next.tokens, next)
            }
            return next
          }),
        }))
        publishMapsState(get())
      },

      removeMap: (id) => {
        void deleteImage(id)
        set((s) => {
          const maps = s.maps.filter((m) => m.id !== id)
          return { maps, selectedId: s.selectedId === id ? (maps[0]?.id ?? null) : s.selectedId }
        })
        publishMapsState(get())
      },

      addToken: (mapId, type) => {
        const map = get().maps.find((m) => m.id === mapId)
        if (!map) return
        const preset = TOKEN_PRESETS[type]
        const defaultHp = type === 'enemy' ? 20 : type === 'npc' ? 12 : undefined
        const spawn = snapToCellCenter(map.width / 2, map.height / 2, map)
        const tokenSize = defaultTokenSizeForMap(map)
        const token: Token = {
          id: uid(),
          label: type === 'player' ? '玩家' : type === 'enemy' ? '敌人' : 'NPC',
          x: spawn.x,
          y: spawn.y,
          color: preset.color,
          emoji: preset.emoji,
          size: tokenSize,
          type,
          hp: defaultHp,
          maxHp: defaultHp,
        }
        set((s) => ({
          maps: s.maps.map((m) => (m.id === mapId ? { ...m, tokens: [...m.tokens, token] } : m)),
        }))
        publishMapsState(get())
      },

      addObstacle: (mapId, kind) => {
        const map = get().maps.find((m) => m.id === mapId)
        if (!map) return
        const templates: Record<string, { label: string; emoji: string; size: number; color: string }> = {
          rock: { label: '石头', emoji: '🪨', size: 1, color: '#94a3b8' },
          chair: { label: '椅子', emoji: '🪑', size: 1, color: '#a16207' },
          pillar: { label: '石柱', emoji: '🏛️', size: 1, color: '#cbd5e1' },
          table: { label: '翻倒的桌子', emoji: '▰', size: 2, color: '#92400e' },
        }
        const tpl = templates[kind] ?? templates.rock
        const spawn = snapToCellCenter(map.width / 2, map.height / 2, map)
        const token: Token = {
          id: uid(),
          label: tpl.label,
          x: spawn.x,
          y: spawn.y,
          color: tpl.color,
          emoji: tpl.emoji,
          size: tpl.size,
          type: 'obstacle',
          obstacleKind: kind,
          showHpOnToken: false,
          showDetailOnToken: false,
        }
        set((s) => ({
          maps: s.maps.map((m) => (m.id === mapId ? { ...m, tokens: [...m.tokens, token] } : m)),
        }))
        publishMapsState(get())
      },

      addEnemyFromPool: (mapId, template) => {
        const map = get().maps.find((m) => m.id === mapId)
        if (!map) return null
        const spawn = snapToCellCenter(map.width / 2, map.height / 2, map)
        const patch = enemyTemplateToTokenPatch(template)
        const token: Token = {
          id: uid(),
          label: patch.label ?? template.name,
          x: spawn.x,
          y: spawn.y,
          color: patch.color ?? '#f87171',
          emoji: patch.emoji ?? '👹',
          size: patch.size ?? defaultTokenSizeForMap(map),
          type: 'enemy',
          hp: patch.hp,
          maxHp: patch.maxHp,
          poolId: patch.poolId,
          showHpOnToken: patch.showHpOnToken ?? true,
          showDetailOnToken: patch.showDetailOnToken ?? true,
        }
        set((s) => ({
          maps: s.maps.map((m) => (m.id === mapId ? { ...m, tokens: [...m.tokens, token] } : m)),
        }))
        publishMapsState(get())
        return token.id
      },
      addCharacterToken: (mapId, { characterId, name, emoji, type = 'player' }) => {
        const map = get().maps.find((m) => m.id === mapId)
        if (!map) return
        const preset = TOKEN_PRESETS[type]
        const spawn = snapToCellCenter(map.width / 2, map.height / 2, map)
        const token: Token = {
          id: uid(),
          label: name,
          x: spawn.x,
          y: spawn.y,
          color: preset.color,
          emoji,
          size: defaultTokenSizeForMap(map),
          type,
          characterId,
        }
        set((s) => ({
          maps: s.maps.map((m) => (m.id === mapId ? { ...m, tokens: [...m.tokens, token] } : m)),
        }))
        publishMapsState(get())
      },

      updateToken: (mapId, tokenId, patch) => {
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? { ...m, tokens: m.tokens.map((t) => (t.id === tokenId ? { ...t, ...patch } : t)) }
              : m,
          ),
        }))
        publishMapsState(get())
      },

      removeToken: (mapId, tokenId) => {
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId ? { ...m, tokens: m.tokens.filter((t) => t.id !== tokenId) } : m,
          ),
        }))
        publishMapsState(get())
      },
    }),
    { name: 'stars-maps' },
  ),
)
