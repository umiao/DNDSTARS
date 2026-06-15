import { enemyHasDerivedCombat, getEnemyMaxHp } from './enemyCombatStats'

/** 鎬墿姹犳ā鏉匡紙鐢ㄤ簬 DM 蹇€熸斁缃晫浜?token锛?*/
export interface EnemyTemplate {
  id: string
  name: string
  emoji: string
  color: string
  maxHp: number
  /** 榛樿绛変簬 maxHp */
  hp?: number
  size?: number
  tags: string[]
  description?: string
}

export const ENEMY_POOL: EnemyTemplate[] = [
  {
    id: 'goblin',
    name: '鍝ュ竷鏋?,
    emoji: '馃懞',
    color: '#4ade80',
    maxHp: 12,
    tags: ['绫讳汉鐢熺墿', '灏忓瀷', '鍝ュ竷鏋?],
    description: '鏁忔嵎鐨勫皬鍨嬬被浜虹敓鐗╋紝甯告垚缇ゅ嚭鐜般€?,
  },
  {
    id: 'hobgoblin',
    name: '澶у湴绮?,
    emoji: '馃獤',
    color: '#f87171',
    maxHp: 22,
    tags: ['绫讳汉鐢熺墿', '涓瀷', '鍝ュ竷鏋?],
    description: '绾緥涓ユ槑銆佸ソ鎴樼殑绫讳汉鐢熺墿銆?,
  },
  {
    id: 'orc',
    name: '鍏戒汉',
    emoji: '馃懝',
    color: '#ef4444',
    maxHp: 30,
    size: 1.25,
    tags: ['绫讳汉鐢熺墿', '涓瀷', '鍏戒汉'],
    description: '寮哄．濂芥垬鐨勬垬澹€?,
  },
  {
    id: 'bugbear',
    name: '鐔婂湴绮?,
    emoji: '馃惢',
    color: '#b45309',
    maxHp: 45,
    size: 1.5,
    tags: ['绫讳汉鐢熺墿', '澶у瀷', '鍝ュ竷鏋?],
    description: '娼滆浼忓嚮鐨勫ぇ鍨嬬被浜虹敓鐗┿€?,
  },
  {
    id: 'skeleton',
    name: '楠烽珔',
    emoji: '馃拃',
    color: '#e2e8f0',
    maxHp: 18,
    tags: ['浜＄伒', '涓瀷', '涓嶆'],
    description: '鐢遍瓟娉曢┍鍔ㄧ殑楠搁鎴樺＋銆?,
  },
  {
    id: 'zombie',
    name: '鍍靛案',
    emoji: '馃',
    color: '#84cc16',
    maxHp: 28,
    tags: ['浜＄伒', '涓瀷', '涓嶆'],
    description: '琛屽姩杩熺紦浣嗚€愭墦鐨勪骸鐏点€?,
  },
  {
    id: 'ghoul',
    name: '椋熷案楝?,
    emoji: '馃鈥嶁檪锔?,
    color: '#a3e635',
    maxHp: 26,
    tags: ['浜＄伒', '涓瀷', '涓嶆'],
    description: '鐖嚮鍙夯鐥圭洰鏍囩殑浜＄伒銆?,
  },
  {
    id: 'wolf',
    name: '鐙?,
    emoji: '馃惡',
    color: '#94a3b8',
    maxHp: 16,
    tags: ['閲庡吔', '涓瀷', '鍔ㄧ墿'],
    description: '甯歌鐨勭兢灞呮帬椋熻€呫€?,
  },
  {
    id: 'dire-wolf',
    name: '鎭愮嫾',
    emoji: '馃惡',
    color: '#64748b',
    maxHp: 37,
    size: 1.25,
    tags: ['閲庡吔', '澶у瀷', '鍔ㄧ墿'],
    description: '浣撳瀷宸ㄥぇ鐨勭嫾锛屽挰鍚堝姏鎯婁汉銆?,
  },
  {
    id: 'brown-bear',
    name: '妫曠唺',
    emoji: '馃惢',
    color: '#92400e',
    maxHp: 42,
    size: 1.5,
    tags: ['閲庡吔', '澶у瀷', '鍔ㄧ墿'],
    description: '鍔涘ぇ鏃犵┓鐨勬．鏋楃寷鍏姐€?,
  },
  {
    id: 'giant-spider',
    name: '宸ㄥ瀷铚樿洓',
    emoji: '馃暦锔?,
    color: '#1e293b',
    maxHp: 26,
    tags: ['閲庡吔', '澶у瀷', '铔涘舰'],
    description: '鍙悙涓濇潫缂氱寧鐗╃殑宸ㄨ洓銆?,
  },
  {
    id: 'slime',
    name: '鍙茶幈濮?,
    emoji: '馃',
    color: '#38bdf8',
    maxHp: 22,
    tags: ['娉ユ€?, '澶у瀷', '鍏冪礌'],
    description: '閰告€у嚌鑳剁姸鎬墿锛屽垎瑁傚悗鍙娈栥€?,
  },
  {
    id: 'bandit',
    name: '寮虹洍',
    emoji: '馃棥锔?,
    color: '#78716c',
    maxHp: 16,
    tags: ['绫讳汉鐢熺墿', '涓瀷', '浜虹被'],
    description: '鎷﹁矾鎶㈠姭鐨勪骸鍛藉緬銆?,
  },
  {
    id: 'guard',
    name: '瀹堝崼',
    emoji: '馃洝锔?,
    color: '#6366f1',
    maxHp: 24,
    tags: ['绫讳汉鐢熺墿', '涓瀷', '浜虹被'],
    description: '鐫€鐢茬殑鍩庨晣鎴栬濉炲崼鍏点€?,
  },
  {
    id: 'cultist',
    name: '閭暀寰?,
    emoji: '馃暞锔?,
    color: '#7c3aed',
    maxHp: 14,
    tags: ['绫讳汉鐢熺墿', '涓瀷', '浜虹被'],
    description: '宕囨嫓榛戞殫瀛樺湪鐨勭媯鐑€呫€?,
  },
  {
    id: 'mage-apprentice',
    name: '娉曞笀瀛﹀緬',
    emoji: '馃',
    color: '#818cf8',
    maxHp: 18,
    tags: ['绫讳汉鐢熺墿', '涓瀷', '鏂芥硶鑰?],
    description: '鎺屾彙鍩虹娉曟湳鐨勫寰掓硶甯堛€?,
  },
  {
    id: 'ogre',
    name: '椋熶汉榄?,
    emoji: '馃',
    color: '#ea580c',
    maxHp: 59,
    size: 2,
    tags: ['宸ㄤ汉', '澶у瀷', '铔姏'],
    description: '鎰氱浣嗙牬鍧忓姏鏋佸己鐨勫ぇ鍨嬫€墿銆?,
  },
  {
    id: 'troll',
    name: '宸ㄩ瓟',
    emoji: '馃懢',
    color: '#16a34a',
    maxHp: 84,
    size: 2,
    tags: ['宸ㄤ汉', '澶у瀷', '鍐嶇敓'],
    description: '鎷ユ湁鍐嶇敓鑳藉姏鐨勭豢鐨法浜恒€?,
  },
  {
    id: 'owlbear',
    name: '鏋唺',
    emoji: '馃',
    color: '#78350f',
    maxHp: 59,
    size: 2,
    tags: ['鎬吔', '澶у瀷', '閲庡吔'],
    description: '鐚ご楣颁笌鐔婄殑鍙€曟贩鍚堜綋銆?,
  },
  {
    id: 'harpy',
    name: '楣拌韩濂冲',
    emoji: '馃',
    color: '#f472b6',
    maxHp: 38,
    tags: ['鎬吔', '涓瀷', '椋炶'],
    description: '鎷ユ湁榄呮儜涔嬫瓕鐨勯琛屾€墿銆?,
  },
  {
    id: 'wyrmling-red',
    name: '红龙雏龙',
    emoji: '🐉',
    color: '#dc2626',
    maxHp: 52,
    size: 1.5,
    tags: ['龙类', '中型', '火焰'],
    description: '年幼的红龙，第一回合会优先使用火焰吐息。',
  },
  {
    id: 'wyrmling-green',
    name: '缁块緳闆忛緳',
    emoji: '馃悏',
    color: '#22c55e',
    maxHp: 48,
    size: 1.5,
    tags: ['榫欑被', '涓瀷', '姣掔礌'],
    description: '鐙＄尵鐨勫勾杞荤豢榫欍€?,
  },
  {
    id: 'imp',
    name: '灏忛瓟楝?,
    emoji: '馃槇',
    color: '#9333ea',
    maxHp: 14,
    tags: ['閭瓟', '灏忓瀷', '椋炶'],
    description: '灏忓瀷榄旈锛屾搮闀块獨鎵颁笌鎴忓紕銆?,
  },
  {
    id: 'animated-armor',
    name: '娲诲寲鐩旂敳',
    emoji: '馃',
    color: '#cbd5e1',
    maxHp: 33,
    tags: ['鏋勮', '涓瀷', '榄旀硶'],
    description: '琚瓟娉曢┍鍔ㄧ殑绌虹洈鐢层€?,
  },
  {
    id: 'gargoyle',
    name: '鐭冲儚楝?,
    emoji: '馃椏',
    color: '#57534e',
    maxHp: 52,
    size: 1.25,
    tags: ['鍏冪礌', '涓瀷', '椋炶'],
    description: '鐭宠川椋炶鍏冪礌鐢熺墿銆?,
  },
]

export function getEnemyTemplate(id: string): EnemyTemplate | undefined {
  return ENEMY_POOL.find((e) => e.id === id)
}

export function searchEnemyPool(query: string, pool: EnemyTemplate[] = ENEMY_POOL): EnemyTemplate[] {
  const q = query.trim().toLowerCase()
  if (!q) return pool
  return pool.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.description?.toLowerCase().includes(q),
  )
}

export function enemyTemplateToTokenPatch(template: EnemyTemplate): Partial<TokenFields> {
  const maxHp = enemyHasDerivedCombat(template.id)
    ? getEnemyMaxHp(template.id)
    : template.maxHp
  const hp = template.hp ?? maxHp
  return {
    label: template.name,
    emoji: template.emoji,
    color: template.color,
    maxHp,
    hp,
    size: template.size,
    poolId: template.id,
    type: 'enemy' as const,
    showHpOnToken: true,
    showDetailOnToken: true,
  }
}

/** 鍐欏叆 token 鐨勫瓧娈碉紙閬垮厤寰幆渚濊禆 maps.ts锛?*/
export interface TokenFields {
  label: string
  emoji: string
  color: string
  maxHp?: number
  hp?: number
  size?: number
  poolId?: string
  type: 'enemy'
  showHpOnToken?: boolean
  showDetailOnToken?: boolean
}
