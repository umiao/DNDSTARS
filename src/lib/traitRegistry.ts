import type { Character, Trait } from '../types/character'
import { isShadowDancer } from './characterClasses'
import { isArcherLineClass } from './archerSkillTree'

/** 鑱屼笟鐗规€ч敭锛堝紦鎵?/ 閫愰鑰?/ 褰辫垶鑰咃級 */
export const CLASS_FEATURE_KEYS = [
  // 鈥斺€?寮撴墜 鈥斺€?
  'doubleArrow',
  'armorPiercingArrow',
  'stableMind',
  'eagleEye',
  'preciseStrike',
  'galeCombo',
  'agileLeap',
  'wildernessGuide',
  'piercingInsight',
  'silentDraw',
  // 鈥斺€?閫愰鑰?鈥斺€?
  'animalMastery',
  'calmMind',
  'arcaneSurge',
  'huntingMark',
  'arcaneDevour',
  'calmSpirit',
  'trackingArrow',
  'explosiveArrow',
  'swiftShot',
  'huntingCombo',
  'swiftRecall',
  'vengeanceBlood',
  'runeArrow',
  'focusedSpirit',
  'shadowVeil',
  'stillWater',
  'finale',
  'arcaneDance',
  // 鈥斺€?褰辫垶鑰?鈥斺€?
  'galeDancer',
  'takeoff',
  'comboFist',
  'multiStrike',
  'illusionDance',
  'flexibleBody',
  'waterWalk',
  'heavyFist',
  'critBlock',
  'fateShackle',
  'showtime',
  'windBlade',
  'transcendentSoul',
  // 鈥斺€?宸插簾寮冿紙杩佺Щ鐢級 鈥斺€?
  'steadyDraw',
  'swiftStep',
  'natureWhisper',
  'flawObservation',
  'fatalChain',
  'calmingAura',
  'lastingControl',
] as const

export type ClassFeatureKey = (typeof CLASS_FEATURE_KEYS)[number]

export type TraitUsage = 'perCombat' | 'perDay' | 'perLongRest' | 'passive' | 'unlimited'

export interface ClassFeatureDef {
  key: ClassFeatureKey
  name: string
  description: string
  usage: TraitUsage
  maxUsesAtRank?: (featureRank: number, charLevel?: number) => number
  rangeAtRank?: (featureRank: number) => number
  diceAtRank?: (featureRank: number) => number
  valueAtRank?: (featureRank: number) => number
  /** 涓嶅湪鎶夋嫨闈㈡澘灞曠ず锛堜粎鍏煎鏃у瓨妗ｏ級 */
  deprecated?: boolean
}

export type MetaChoiceKey =
  | 'knowledgeBoost'
  | 'abilityBoost'
  | 'proficiencyBoost'
  | 'featureUpgrade'
  | 'skillUpgrade'

export interface TraitChoiceOption {
  kind: 'feature' | 'meta'
  featureKey?: ClassFeatureKey
  metaKey?: MetaChoiceKey
  label: string
  description: string
}

export interface TraitChoiceGroup {
  id: string
  title: string
  hint: string
  minLevel: number
  pickCount: number
  autoGrant?: MetaChoiceKey[]
  autoGrantFeatures?: ClassFeatureKey[]
  options: TraitChoiceOption[]
  applies: (c: Character) => boolean
}

export const MAX_FEATURE_LEVEL = 4

export const FEATURE_RANK_THRESHOLDS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const

const META_LABELS: Record<MetaChoiceKey, { label: string; description: string }> = {
  knowledgeBoost: {
    label: '鑷€夊璇?+1',
    description: '浠婚€変竴椤瑰璇嗙啛缁冩彁鍗?1 绾э紙鐢?DM 鎴栫帺瀹跺湪瑙掕壊鍗′笂鏍囨敞锛夈€?,
  },
  abilityBoost: {
    label: '灞炴€у€?+2',
    description: '鑾峰緱 2 鐐瑰睘鎬у€兼彁鍗囷紝鍙嚜鐢卞垎閰嶈嚦浠绘剰灞炴€э紙涓婇檺 100锛夈€?,
  },
  proficiencyBoost: {
    label: '鑷€夌啛缁冮」 +1',
    description: '浠婚€変竴椤规鍣?宸ュ叿/鎶€鑳界啛缁冩彁鍗?1 绾с€?,
  },
  featureUpgrade: {
    label: '鑷€夌壒鎬?+1',
    description: '娑堣€楀悗绔嬪嵆鑾峰緱 1 涓壒鎬у崌绾х偣锛岀敤浜庢彁鍗囧凡鏈夎亴涓氱壒鎬х瓑绾с€?,
  },
  skillUpgrade: {
    label: '鑷€夋妧鑳?+1',
    description: '浠婚€変竴椤瑰凡瀛﹀紦鎵嬫妧鑳芥爲鎶€鑳芥彁鍗?1 闃躲€?,
  },
}

const perLongRestPlusOne = (rank: number) => rank
const perCombatPlusOne = (rank: number) => rank
const diceEqualsRank = (rank: number) => rank
const diceCap3 = (rank: number) => Math.min(3, rank)

function metaOption(key: MetaChoiceKey): TraitChoiceOption {
  const m = META_LABELS[key]
  return { kind: 'meta', metaKey: key, label: m.label, description: m.description }
}

function feat(key: ClassFeatureKey, def: ClassFeatureDef): TraitChoiceOption {
  return {
    kind: 'feature',
    featureKey: key,
    label: def.name,
    description: formatFeatureDescription(def, 1),
  }
}

export const CLASS_FEATURE_DEFS: ClassFeatureDef[] = [
  // 鈥斺€?寮撴墜 鈥斺€?
  {
    key: 'doubleArrow',
    name: '鍙岀',
    usage: 'perLongRest',
    description:
      '褰撲綘閲婃斁鍙彂灏勪竴鏋氱鐭㈢殑杩滅▼鍩虹灏勫嚮鏃讹紝浣犲彲浠ュ皢鍙戝皠鐨勭鐭㈡敼涓轰袱鏀€傛瘡鏃?{uses} 娆★紱姣忔彁鍗?1 绾э紝姣忔棩浣跨敤涓婇檺 +1銆?,
    maxUsesAtRank: (r) => r,
  },
  {
    key: 'armorPiercingArrow',
    name: '绌跨敳绠?,
    usage: 'perLongRest',
    description:
      '褰撲綘閲婃斁鍙彂灏勪竴鏋氱鐭㈢殑杩滅▼鍩虹灏勫嚮閫犳垚閲嶅嚮鏃讹紝鍙鐩爣鍚庢柟鐩寸嚎璺濈 15 灏哄唴鐨勬墍鏈夎鑹查€犳垚绛夊悓浜庢湰娆′激瀹充竴鍗婄殑浼ゅ銆傛瘡鎻愬崌 1 绾э紝璇ョ壒鎬у彲棰濆浣跨敤 1 娆°€?,
    maxUsesAtRank: (r) => r,
  },
  {
    key: 'stableMind',
    name: '残影脱身',
    usage: 'perLongRest',
    description:
      '当你进行敏捷豁免成功，但仍会受到伤害后，可以消耗 1 AP 取消本次攻击受到的所有伤害。每提升 1 级特性，长休可额外使用 1 次。',
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'eagleEye',
    name: '楣扮溂',
    usage: 'perLongRest',
    description:
      '2 鍥炲悎鍐呭皢浣犵殑鏁忔嵎鍊间复鏃跺鍔?{value} 鐐癸紱姣忔彁鍗?1 绾х壒鎬э紝鎻愬崌鐨勪复鏃舵晱鎹峰€奸澶栧鍔?5 鐐广€傞暱浼戝彲浣跨敤 2 娆★紝婵€娲诲悗鎸佺画 2 鍥炲悎銆?,
    maxUsesAtRank: () => 2,
    valueAtRank: (r) => 10 + (r - 1) * 5,
  },
  {
    key: 'preciseStrike',
    name: '绮惧噯鎵撳嚮',
    usage: 'perLongRest',
    description:
      '涓诲姩婵€娲婚渶 1 AP銆備娇寰椾笅涓€娆℃敾鍑诲繀瀹氶€犳垚閲嶅嚮銆傞暱浼戝彲浣跨敤 1 娆★紱姣忔彁鍗?1 绾х壒鎬э紝闀夸紤鍙澶栦娇鐢?1 娆°€?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'galeCombo',
    name: '鐤鹃杩炲嚮',
    usage: 'perLongRest',
    description:
      '褰撲綘瀵规晫瀵硅鑹叉柦鍔犲€掑湴/鍑婚鐘舵€佷笖瀵规柟璞佸厤澶辫触鏃讹紝浣犲彲浠ユ棤闇€娑堣€?AP锛岄噴鏀句竴涓凡鍑嗗濂界殑鎶€鑳芥垨涓绘鍣ㄦ敾鍑汇€傝鐗规€у彲浣跨敤 1 娆★紱姣忔彁鍗?1 绾э紝浣跨敤涓婇檺 +1銆?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'agileLeap',
    name: '鐏靛阀璺宠穬',
    usage: 'perLongRest',
    description:
      '姣忓綋浣犻棯閬挎垚鍔熸椂锛屽彲鏃犻渶娑堣€?AP 绉诲姩 10 灏猴紝鏃犺鍥伴毦鍦板舰鍜岄殰纰嶇墿銆傝鐗规€ч暱浼戝彲浣跨敤 2 娆★紱姣忔彁鍗?1 绾х壒鎬э紝绉诲姩璺濈澧炲姞 5 灏恒€?,
    maxUsesAtRank: () => 2,
    rangeAtRank: (r) => 10 + (r - 1) * 5,
  },
  {
    key: 'wildernessGuide',
    name: '鑽掗噹鎸囧紩鑰?,
    usage: 'passive',
    description:
      '浣犵啛鎮夎嚜鐒朵箣閬擄細鐧藉ぉ姹傜敓閴村畾鍏锋湁浼樺娍锛岄噹澶栧療瑙夐壌瀹氳幏寰椾紭鍔裤€傝嫢鎷ユ湁榛戞殫瑙嗚锛屽鏅氭眰鐢熼壌瀹氬悓鏍疯幏寰椾紭鍔裤€傝鐗规€ч暱浼戝彲浣跨敤 1 娆＄壒娈婃寚寮曪紱姣忔彁鍗?1 绾у彲棰濆浣跨敤 1 娆°€?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'piercingInsight',
    name: '鐪嬬牬锛?,
    usage: 'passive',
    description:
      '褰撲綘鏀诲嚮涓€鍚嶇敓鍛藉€煎皯浜?10% 鐨勬晫浜烘椂锛岄澶栭€犳垚 {dice}D4 鐐逛激瀹炽€傛瘡鎻愬崌 1 绾х壒鎬э紝浼ゅ棰濆澧炲姞 1D4銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'silentDraw',
    name: '鏃犲０璧峰鸡',
    usage: 'passive',
    description:
      '鑻ヤ綘鍦ㄦ垬鏂椾腑鍏堟敾椤哄簭绗竴涓鍔紝鍒欎綘鐨勬敾鍑婚澶栭€犳垚 {dice}D6 鐐瑰悓绫诲瀷浼ゅ銆傛瘡鎻愬崌 1 绾х壒鎬э紝棰濆閫犳垚 1D6 鐐逛激瀹炽€?,
    diceAtRank: diceEqualsRank,
  },
  // 鈥斺€?閫愰鑰?鈥斺€?
  {
    key: 'animalMastery',
    name: '鍔ㄧ墿瀛︿笓绮?,
    usage: 'passive',
    description:
      '浣犵煡鏅撳姩鐗╃殑寮辩偣鍙婅鍔ㄦ柟寮忋€備笌鍔ㄧ墿鎴栫被鍔ㄧ墿鐢熺墿鎴樻枟鏃讹紝棰濆閫犳垚 {dice}D6 鐐瑰悓绫诲瀷浼ゅ銆傛瘡鎻愬崌 1 绾у鍔?1D6銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'calmMind',
    name: '闈欏績',
    usage: 'passive',
    description:
      '褰撲綘鍦ㄥ洖鍚堝紑濮嬫椂鏈浜庢皵鍠樼姸鎬佹椂锛岃幏寰楅潤蹇冪姸鎬侊紝浼ゅ楠板鍔?{dice}D6銆傛瘡褰撲綘鍙楀埌鏀诲嚮鎴栬€呮秷鑰?AP 绉诲姩鍚庯紝澶卞幓闈欏績鐘舵€佸苟鑾峰緱姘斿枠鐘舵€侊紝鐩磋嚦浣犱笅涓€鍥炲悎缁撴潫銆傛瘡鎻愬崌 1 绾у鍔?1D6銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'arcaneSurge',
    name: '榄旀硶娴秾',
    usage: 'perLongRest',
    description:
      '浣犺幏寰椾娇鐢ㄩ瓟娉曞嵎杞寸殑鑳藉姏銆傚綋浣犲彈鍒拌嚧鍛戒激瀹虫椂锛屽彲鐑ф瘉涓€鏋氬嵎杞磋€屽皢鐢熷懡鍊兼敼涓?1銆傛瘡鎻愬崌 1 绾э紝闀夸紤鍙澶栦娇鐢?1 娆°€?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'huntingMark',
    name: '鐙╃寧鍗拌',
    usage: 'passive',
    description:
      '姣忓綋浣犲涓€鍚嶆晫瀵圭敓鐗╅€犳垚浼ゅ鍚庯紝闄勭潃 1 鏋氱嫨鐚庡嵃璁帮紙鏈€澶?4 灞傦級銆傛敾鍑诲甫鍗拌鐢熺墿鏃堕澶栭€犳垚 {dice}D8 浼ゅ锛涜甯﹀嵃璁扮敓鐗╂敾鍑绘椂棰濆鍙楀埌 {dice}D4 浼ゅ銆傛瘡鎻愬崌 1 绾у悇 +1D8/+1D4銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'arcaneDevour',
    name: '榄旇兘鍚炲櫖',
    usage: 'passive',
    description:
      '褰撲綘灏勫嚭甯︽湁榄旀硶浼ゅ鐨勭鐭㈡椂锛屽鎵€鏈夊彈鍒颁激瀹崇殑鐩爣棰濆閫犳垚 {dice}D6 鐐规棤灞炴€ч瓟娉曚激瀹炽€傛瘡鎻愬崌 1 绾у鍔?1D6銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'calmSpirit',
    name: '瀹夊畾蹇冪',
    usage: 'passive',
    description:
      '姣忔淇濇寔闈欏績鐘舵€佺粨鏉熷洖鍚堟椂鑾峰緱 1 灞傞潤蹇冩爣璁帮紙涓婇檺 4锛夈€傚彲娑堣€楁爣璁帮細1 鏋氱Щ鍔ㄨ嚦澶?10 灏猴紙姣忕骇 +5 灏猴級锛? 鏋氭毚鍑荤巼 +20%锛堟瘡绾?+10%锛夛紱3 鏋氫竴椤规妧鑳?CD -1锛? 鏋氬啀鑾峰緱涓€涓畬鏁村洖鍚堛€?,
  },
  {
    key: 'trackingArrow',
    name: '杩借釜绠?,
    usage: 'perLongRest',
    description:
      '閫夋嫨涓€鍚嶅甫鐙╃寧鍗拌鐨勭敓鐗╂椂锛屽彧瑕佸叾鍦ㄦ敾鍑昏寖鍥村唴锛屽缁堣涓哄彲瑙侊紝骞堕澶栫粰浜?1 鏋氱嫨鐚庡嵃璁般€傞暱浼戝墠 {uses} 娆★紱姣忔鍗囩骇 +1 闀夸紤涓婇檺銆?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'explosiveArrow',
    name: '鐖嗚绠煝',
    usage: 'passive',
    description:
      '鑻ユ敾鍑婚€犳垚閲嶅嚮锛岄澶栭€犳垚 {dice}D12 鐐圭伀鐒颁激瀹冲苟鍙犲姞 1 灞傜伀鐒版爣璁般€傛瘡鎻愬崌 1 绾ч澶?+1D12銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'swiftShot',
    name: '娉㈡緶涓嶆儕',
    usage: 'passive',
    description:
      '褰撴垬鏂楀紑濮嬫椂锛岄粯璁ゅ浜庨潤蹇冪姸鎬併€傛瘡褰撲綘鍒囨崲闈欏績/姘斿枠鐘舵€佹椂锛屽洖澶?{dice}D4 鐐圭敓鍛藉€笺€傛瘡鎻愬崌 1 绾э紝棰濆鍥炲 1D4 鐐圭敓鍛藉€笺€?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'huntingCombo',
    name: '鐙╃寧杩炲嚮',
    usage: 'passive',
    description:
      '褰撲綘鏀诲嚮甯︽湁鐙╃寧鍗拌鐨勭敓鐗╂椂锛屽拷瑙嗗叾闂伩鍊硷紝骞跺鍔?20% 鏆村嚮浼ゅ銆傛瘡鎻愬崌 1 绾ч澶?+5% 鏆村嚮浼ゅ銆?,
  },
  {
    key: 'swiftRecall',
    name: '杩呮嵎鍥炴函',
    usage: 'passive',
    description:
      '褰撲綘浣跨敤榄旀硶鏀诲嚮鎴愬姛浣夸竴鍚嶇敓鐗╄幏寰楀紓甯哥姸鎬佹椂锛屼綘鑾峰緱 1 鏋氶€氱敤浠ょ墝锛堝彲鐢ㄤ簬鍑忓皯 1 椤规妧鑳?CD 鎴栭澶?1 AP锛岀敱 DM 瑁佸畾锛夈€?,
  },
  {
    key: 'vengeanceBlood',
    name: '澶嶄粐涔嬭',
    usage: 'perLongRest',
    description:
      '姣忓綋浣犲甯︾嫨鐚庡嵃璁扮殑鐢熺墿閫犳垚浼ゅ鏃讹紝鍙洖澶嶇瓑鍚屼簬鏈浼ゅ涓€鍗婄殑鐢熷懡鍊笺€傞暱浼戝墠 {uses} 娆★紱姣忔鍗囩骇 +1 娆°€?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'runeArrow',
    name: '绗︽枃绠?,
    usage: 'passive',
    description:
      '浣犲皠鍑虹殑榄旀硶绠煝涓嶅啀娑堣€楃鐭㈡暟閲忋€傛瘡鍦烘垬鏂楀紑濮嬪墠锛屽彲灏嗕竴椤归€犳垚榄旀硶浼ゅ鐨勬妧鑳界殑鍐峰嵈璋冩暣涓?0銆?,
  },
  {
    key: 'focusedSpirit',
    name: '闆嗕腑绮剧',
    usage: 'perLongRest',
    description:
      '褰撲綘琚懡涓椂锛岄潤蹇冪姸鎬佷笉浼氳鎵撴柇銆傞暱浼戝墠鍙娇鐢?2 娆★紱姣忔彁鍗?1 绾э紝闀夸紤鍓嶄娇鐢ㄤ笂闄?+1銆?,
    maxUsesAtRank: (r) => r + 1,
  },
  {
    key: 'shadowVeil',
    name: '褰遍亖涔嬫湳',
    usage: 'perCombat',
    description:
      '娑堣€椾竴鍚嶆晫瀵圭敓鐗╄韩涓?2 鏋氱嫨鐚庡嵃璁帮紝鍦ㄦ湰鍥炲悎鍐呴伄钄藉叾瑙嗛噹锛涜鐢熺墿闇€鎶曟幏鍛戒腑楠板鎶椾綘鐨勮眮鍏?DC锛屼綘瀵瑰叾鎵€鏈夋敾鍑绘棤娉曡闂伩涓旈澶栭€犳垚 1D6 鐐逛激瀹炽€?,
    maxUsesAtRank: perCombatPlusOne,
  },
  {
    key: 'stillWater',
    name: '蹇冨姝㈡按',
    usage: 'passive',
    description:
      '褰撲綘淇濇寔闈欏績鐘舵€佹椂锛屽懆鍥?15 灏哄唴鍙嬫柟鍗曚綅鑾峰緱 10 鐐逛复鏃剁敓鍛藉€硷紙姣忔彁鍗?1 绾ч澶?+10锛夛紝涓斾綘涓嶅啀鑾峰緱姘斿枠鐘舵€併€?,
  },
  {
    key: 'finale',
    name: '鏇茬粓',
    usage: 'perCombat',
    description:
      '棰濆娑堣€?1 AP 婵€娲伙細褰撲笅涓€鍚嶆晫瀵圭敓鐗╃殑鐙╃寧鍗拌鍙犲姞鑷?4 灞傛椂锛屽叾绔嬪埢鍙楀埌 6D10 鐐瑰姏鍦轰激瀹冲苟琚檿鐪╋紝绉婚櫎鎵€鏈夌嫨鐚庡嵃璁般€傛瘡鎻愬崌 1 绾у鍔?1D8 鐐逛激瀹炽€?,
    maxUsesAtRank: perCombatPlusOne,
  },
  {
    key: 'arcaneDance',
    name: '榄旇兘鐙傝垶',
    usage: 'passive',
    description:
      '浣犲彲涓烘墍鏈夋敾鍑绘寚瀹氫激瀹崇被鍨嬪苟鍙犲姞瀵瑰簲鐘舵€侊細鐏劙锛堢噧鐑э級銆佸啺鍐伙紙瀵掑啺锛夈€佹瘨绱狅紙涓瘨锛夈€侀吀铓€銆佸姏鍦恒€佸績鐏点€?,
  },
  // 鈥斺€?褰辫垶鑰?鈥斺€?
  {
    key: 'galeDancer',
    name: '鐤鹃鑸炶€?,
    usage: 'perLongRest',
    description:
      '褰撲綘灏嗚杩涘叆璐熼潰鐘舵€佽€岃繘琛岃眮鍏嶉壌瀹氭椂锛岃眮鍏?+3锛涜眮鍏嶆垚鍔熷悗鍙笉娑堣€?AP 閲婃斁涓€涓凡鍑嗗濂界殑椋炵┖杩炶涪銆傞暱浼戝墠 {uses} 娆★紱姣忔鍗囩骇 +1 娆°€?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'takeoff',
    name: '璧烽',
    usage: 'passive',
    description:
      '褰撲綘鏀诲嚮澶勪簬鍑婚鐘舵€佺殑鏁屼汉鏃讹紝寮哄寲鏃嬮椋炶吙锛岄澶栭檮甯?{dice}D6 鐐逛激瀹炽€傛瘡鎻愬崌 1 绾?+1D6锛屾渶澶?3D6銆?,
    diceAtRank: diceCap3,
  },
  {
    key: 'comboFist',
    name: '杩炵画鎷?,
    usage: 'passive',
    description:
      '姣忓綋浣犱笉娑堣€?AP 閲婃斁涓€涓妧鑳芥椂锛岄澶栨柦鍔?{dice}D6 鐐逛激瀹炽€傛瘡鎻愬崌 1 绾ч澶?+1D6銆?,
    diceAtRank: diceEqualsRank,
  },
  {
    key: 'multiStrike',
    name: '澶氶噸鎵撳嚮',
    usage: 'unlimited',
    description:
      '鑻ユ湰鍥炲悎鍐呭鍚屼竴鏁屼汉閫犳垚 3 娈垫垨浠ヤ笂鎵撳嚮锛屽彲娑堣€?1 鐐规皵浣垮叾杩涜鍏锋湁鍔ｅ娍鐨勪綋璐ㄨ眮鍏嶏紝澶辫触鍒欑湬鏅?1 鍥炲悎銆?,
  },
  {
    key: 'illusionDance',
    name: '杩峰够鑸炴',
    usage: 'perLongRest',
    description:
      '娑堣€?1 鐐规皵鍦ㄥ師鍦拌捣鑸炪€傝嚦澶?1 鍚嶈兘鐪嬭浣犵殑鏁屼汉杩涜鎰熺煡璞佸厤锛屽け璐ュ垯娑堣€楁墍鏈夌Щ鍔ㄥ姏鑷充綘韬墠 10 灏哄锛岀洿鑷冲叾涓嬪洖鍚堢粨鏉熸垨鍙楀埌浼ゅ銆傞暱浼?1 娆★紱姣忔鍗囩骇 +1 鐩爣锛屾渶澶?3 涓€?,
    maxUsesAtRank: perLongRestPlusOne,
  },
  {
    key: 'flexibleBody',
    name: '鐏垫椿韬函',
    usage: 'unlimited',
    description:
      '娑堣€?1 鐐规皵锛屼娇浣犵殑闂伩閴村畾鎴栨晱鎹疯眮鍏嶉壌瀹氳幏寰?+5 鍔犲€笺€傛瘡鎻愬崌 1 绾ч澶?+2銆?,
  },
  {
    key: 'waterWalk',
    name: '鍑屾尝寰',
    usage: 'passive',
    description: '姝ュ饱杞荤泩涓斾笉鍙戝嚭澹板搷銆傞殣鍖块壌瀹氳幏寰椾紭鍔匡紝姘镐箙鑾峰緱 3 鐐规晱鎹峰€兼彁鍗囥€?,
  },
  {
    key: 'heavyFist',
    name: '閲嶆嫵',
    usage: 'unlimited',
    description:
      '姣忓綋浣犲彂鍔ㄥ甫鏈夎礋闈㈡晥鏋滅殑鏀诲嚮鏃讹紝鍙秷鑰?1 鐐规皵灏嗗叾涓竴鍚嶇洰鏍囩殑鏁忔嵎璞佸厤瑙嗕负澶辫触銆傚崌绾у悗锛屼綘鐨勪笅涓€娆℃敾鍑昏幏寰椾紭鍔裤€?,
  },
  {
    key: 'critBlock',
    name: '閲嶅嚮灏侀攣',
    usage: 'unlimited',
    description:
      '褰撲綘 10 灏鸿寖鍥村唴鐨勪竴鍚嶆晫瀵圭敓鐗╁鍙︿竴鍚嶇敓鐗╄繘琛岄潪榄旀硶浼ゅ鏀诲嚮鏃讹紝鍙秷鑰?1 鐐规皵浠ｆ浛鍏惰繘琛屼竴娆￠棯閬块壌瀹氥€傝嫢鎴愬姛鍒欒涓鸿瑙掕壊鎴愬姛闂伩銆?,
  },
  {
    key: 'fateShackle',
    name: '鍛借繍鏋烽攣',
    usage: 'unlimited',
    description:
      '浣犲鏁屽瑙掕壊鏂藉姞鐨勬帶鍒跺嵆灏嗙粨鏉熸椂锛屽彲娑堣€?1 鐐规皵浠ゅ叾鍦ㄥ洖鍚堢粨鏉熸椂鍐嶈繘琛屼竴娆″搴旇眮鍏嶏紱璞佸厤澶辫触鍒欐晥鏋滄椂闂村鍔?1 鍥炲悎銆?,
  },
  {
    key: 'showtime',
    name: '婕斿嚭鏃堕棿',
    usage: 'perCombat',
    description:
      '娑堣€?1 鐐规皵锛屾寔缁?2 鍥炲悎锛氭墍鏈夊彲瑙佹晫瀵硅鑹茶眮鍏嶈幏寰楀姡鍔匡紝浣犻棯閬挎椂瀵规柟鏀诲嚮鑾峰緱鍔ｅ娍锛屼綘鐨勬敾鍑婚壌瀹氳幏寰椾紭鍔裤€?,
    maxUsesAtRank: perCombatPlusOne,
  },
  {
    key: 'windBlade',
    name: '椋庡垉涔辫垶',
    usage: 'perCombat',
    description:
      '鎸佺画 30 绉掞紝娑堣€?3 AP 涓庨瓟鍔涳紝鍙敜椋庡垉閫犳垚 6D8 绌垮埡浼ゅ锛堣眮鍏嶆垚鍔熷噺鍗婏級銆傛瘡鎻愬崌 1 绾?+2D8锛屾渶澶?8D8銆?,
    maxUsesAtRank: perCombatPlusOne,
    diceAtRank: (r) => Math.min(8, 6 + (r - 1) * 2),
  },
  {
    key: 'transcendentSoul',
    name: '瓒呭嚒榄?,
    usage: 'passive',
    description: '鐭紤鏃朵篃鍙洖澶嶆皵銆傛瘡娆＄煭浼戞渶澶氬洖澶嶆皵涓婇檺涓€鍗婃暟閲忕殑姘斻€?,
  },
  // 鈥斺€?搴熷純锛堣縼绉伙級 鈥斺€?
  {
    key: 'steadyDraw',
    name: '绋冲鸡',
    usage: 'passive',
    deprecated: true,
    description: '（已废弃）由「残影脱身」取代。'
  },
  {
    key: 'swiftStep',
    name: '杩呮嵎姝?,
    usage: 'passive',
    deprecated: true,
    description: '锛堝凡搴熷純锛?,
  },
  {
    key: 'natureWhisper',
    name: '闂亾鑷劧',
    usage: 'passive',
    deprecated: true,
    description: '锛堝凡搴熷純锛?,
  },
  {
    key: 'flawObservation',
    name: '鐮寸唤瑙傚療',
    usage: 'passive',
    deprecated: true,
    description: '锛堝凡搴熷純锛夌敱銆岀湅鐮达紒銆嶅彇浠ｃ€?,
  },
  {
    key: 'fatalChain',
    name: '鑷村懡杩為攣',
    usage: 'passive',
    deprecated: true,
    description: '锛堝凡搴熷純锛夌敱銆岄噸鎷炽€嶅彇浠ｃ€?,
  },
  {
    key: 'calmingAura',
    name: '瀹夊畾蹇冪锛堟棫锛?,
    usage: 'passive',
    deprecated: true,
    description: '锛堝凡搴熷純锛夎鏂扮増銆屽畨瀹氬績绁炪€嶄笌銆屽績濡傛姘淬€嶃€?,
  },
  {
    key: 'lastingControl',
    name: '闀挎晥鎺屾帶',
    usage: 'passive',
    deprecated: true,
    description: '锛堝凡搴熷純锛夌敱銆屽懡杩愭灧閿併€嶅彇浠ｃ€?,
  },
]

const FEATURE_MAP = new Map(CLASS_FEATURE_DEFS.map((d) => [d.key, d]))

const ACTIVE_FEATURE_KEYS = new Set(
  CLASS_FEATURE_DEFS.filter((d) => !d.deprecated).map((d) => d.key),
)

export function getClassFeatureDef(key: ClassFeatureKey): ClassFeatureDef | undefined {
  return FEATURE_MAP.get(key)
}

export function formatFeatureDescription(def: ClassFeatureDef, featureRank: number): string {
  const uses = def.maxUsesAtRank?.(featureRank)
  const range = def.rangeAtRank?.(featureRank)
  const dice = def.diceAtRank?.(featureRank)
  const value = def.valueAtRank?.(featureRank)
  return def.description
    .replace(/\{uses\}/g, uses != null ? String(uses) : '鈥?)
    .replace(/\{rank\}/g, String(featureRank))
    .replace(/\{range\}/g, range != null ? String(range) : '鈥?)
    .replace(/\{dice\}/g, dice != null ? String(dice) : '鈥?)
    .replace(/\{value\}/g, value != null ? String(value) : '鈥?)
}

export function usageLabel(usage: TraitUsage): string {
  switch (usage) {
    case 'perCombat':
      return '娆?鎴?
    case 'perDay':
      return '娆?闀夸紤'
    case 'perLongRest':
      return '娆?闀夸紤'
    case 'passive':
      return '琚姩'
    default:
      return ''
  }
}

export function isBaseArcher(charClass: string): boolean {
  return charClass.includes('寮撴墜') && charClass !== '閫愰鑰? && charClass !== '褰辫垶鑰?
}

export function isWindrunner(charClass: string): boolean {
  return charClass === '閫愰鑰?
}

function defOf(key: ClassFeatureKey): ClassFeatureDef {
  return FEATURE_MAP.get(key)!
}

export const TRAIT_CHOICE_GROUPS: TraitChoiceGroup[] = [
  {
    id: 'archer-lv1',
    title: '寮撴墜 路 LV1 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鍙岀銆佺┛鐢茬銆?,
    minLevel: 1,
    pickCount: 1,
    applies: (c) => isBaseArcher(c.charClass),
    options: ['doubleArrow', 'armorPiercingArrow'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'archer-lv3',
    title: '寮撴墜 路 LV3 鑱屼笟鐗规€?,
    hint: '请选择 1 项：残影脱身、鹰眼。'
    minLevel: 3,
    pickCount: 1,
    applies: (c) => isBaseArcher(c.charClass),
    options: ['stableMind', 'eagleEye'].map((k) => feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey))),
  },
  {
    id: 'archer-lv5',
    title: '寮撴墜 路 LV5 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細绮惧噯鎵撳嚮銆佺柧椋庤繛鍑汇€?,
    minLevel: 5,
    pickCount: 1,
    applies: (c) => isBaseArcher(c.charClass),
    options: ['preciseStrike', 'galeCombo'].map((k) => feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey))),
  },
  {
    id: 'archer-lv8',
    title: '寮撴墜 路 LV8 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鐏靛阀璺宠穬銆佽崚閲庢寚寮曡€呫€?,
    minLevel: 8,
    pickCount: 1,
    applies: (c) => isBaseArcher(c.charClass),
    options: ['agileLeap', 'wildernessGuide'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'archer-lv12',
    title: '寮撴墜 路 LV12 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鐪嬬牬锛併€佹棤澹拌捣寮︺€?,
    minLevel: 12,
    pickCount: 1,
    applies: (c) => isBaseArcher(c.charClass),
    options: ['piercingInsight', 'silentDraw'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv15',
    title: '閫愰鑰?路 LV15 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鍔ㄧ墿瀛︿笓绮俱€侀潤蹇冦€侀瓟娉曟氮娑屻€?,
    minLevel: 15,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['animalMastery', 'calmMind', 'arcaneSurge'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv18',
    title: '閫愰鑰?路 LV18 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鐙╃寧鍗拌銆侀瓟鑳藉悶鍣€佸畨瀹氬績绁炪€?,
    minLevel: 18,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['huntingMark', 'arcaneDevour', 'calmSpirit'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv21',
    title: '閫愰鑰?路 LV21 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細杩借釜绠€佺垎瑁傜鐭€?,
    minLevel: 21,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['trackingArrow', 'explosiveArrow'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv25',
    title: '閫愰鑰?路 LV25 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細杩呮嵎灏勫嚮銆佺嫨鐚庤繛鍑汇€佽繀鎹峰洖婧€?,
    minLevel: 25,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['swiftShot', 'huntingCombo', 'swiftRecall'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv30',
    title: '閫愰鑰?路 LV30 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細澶嶄粐涔嬭銆佺鏂囩銆?,
    minLevel: 30,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['vengeanceBlood', 'runeArrow'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv35',
    title: '閫愰鑰?路 LV35 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細闆嗕腑绮剧銆佸奖閬佷箣鏈€?,
    minLevel: 35,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['focusedSpirit', 'shadowVeil'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'windrunner-lv40',
    title: '閫愰鑰?路 LV40 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細蹇冨姝㈡按銆佹洸缁堛€侀瓟鑳界媯鑸炪€?,
    minLevel: 40,
    pickCount: 1,
    applies: (c) => isWindrunner(c.charClass),
    options: ['stillWater', 'finale', 'arcaneDance'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'shadowdancer-lv15',
    title: '褰辫垶鑰?路 LV15 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鐤鹃鑸炶€呫€佽捣椋炪€?,
    minLevel: 15,
    pickCount: 1,
    applies: (c) => isShadowDancer(c.charClass),
    options: ['galeDancer', 'takeoff'].map((k) => feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey))),
  },
  {
    id: 'shadowdancer-lv18',
    title: '褰辫垶鑰?路 LV18 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細杩炵画鎷炽€佸閲嶆墦鍑汇€?,
    minLevel: 18,
    pickCount: 1,
    applies: (c) => isShadowDancer(c.charClass),
    options: ['comboFist', 'multiStrike'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'shadowdancer-lv21',
    title: '褰辫垶鑰?路 LV21 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細杩峰够鑸炴銆佺伒娲昏韩韬€?,
    minLevel: 21,
    pickCount: 1,
    applies: (c) => isShadowDancer(c.charClass),
    options: ['illusionDance', 'flexibleBody'].map((k) =>
      feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey)),
    ),
  },
  {
    id: 'shadowdancer-lv25',
    title: '褰辫垶鑰?路 LV25 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細鍑屾尝寰銆侀噸鎷炽€?,
    minLevel: 25,
    pickCount: 1,
    applies: (c) => isShadowDancer(c.charClass),
    options: ['waterWalk', 'heavyFist'].map((k) => feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey))),
  },
  {
    id: 'shadowdancer-lv35',
    title: '褰辫垶鑰?路 LV35 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細閲嶅嚮灏侀攣銆佸懡杩愭灧閿侊紝鎴栬嚜閫夌壒鎬?+1銆?,
    minLevel: 35,
    pickCount: 1,
    applies: (c) => isShadowDancer(c.charClass),
    options: [
      feat('critBlock', defOf('critBlock')),
      feat('fateShackle', defOf('fateShackle')),
      metaOption('featureUpgrade'),
    ],
  },
  {
    id: 'shadowdancer-lv40',
    title: '褰辫垶鑰?路 LV40 鑱屼笟鐗规€?,
    hint: '璇烽€夋嫨 1 椤癸細婕斿嚭鏃堕棿銆侀鍒冧贡鑸炪€?,
    minLevel: 40,
    pickCount: 1,
    applies: (c) => isShadowDancer(c.charClass),
    options: ['showtime', 'windBlade'].map((k) => feat(k as ClassFeatureKey, defOf(k as ClassFeatureKey))),
  },
  {
    id: 'shadowdancer-lv45',
    title: '褰辫垶鑰?路 LV45 閲岀▼纰?,
    hint: '鑾峰緱鐗规€э細瓒呭嚒榄傘€?,
    minLevel: 45,
    pickCount: 0,
    autoGrantFeatures: ['transcendentSoul'],
    applies: (c) => isShadowDancer(c.charClass),
    options: [],
  },
]

export function getTraitChoicesDone(c: Character): Record<string, boolean> {
  return c.traitChoicesDone ?? {}
}

export function isChoiceGroupDone(c: Character, groupId: string): boolean {
  if (getTraitChoicesDone(c)[groupId]) return true
  if (groupId === 'archer-lv1' && c.archerLv1ChoiceDone) return true
  if (groupId === 'archer-lv3' && c.archerLv3ChoiceDone) return true
  return false
}

export function pendingTraitChoices(c: Character): TraitChoiceGroup[] {
  if (!isArcherLineClass(c.charClass)) return []
  return TRAIT_CHOICE_GROUPS.filter(
    (g) => c.level >= g.minLevel && g.applies(c) && !isChoiceGroupDone(c, g.id),
  )
}

export function createClassTrait(key: ClassFeatureKey, _charLevel = 1): Trait {
  const def = getClassFeatureDef(key)!
  const featureRank = 1
  const maxUses = def.maxUsesAtRank?.(featureRank) ?? 0
  return {
    id: `feat-${key}`,
    name: def.name,
    level: featureRank,
    uses: maxUses,
    maxUses,
    description: formatFeatureDescription(def, featureRank),
    featureKey: key,
  }
}

export function applyTraitFeatureRank(trait: Trait, featureRank: number): Trait {
  if (!trait.featureKey) return trait
  const def = getClassFeatureDef(trait.featureKey)
  if (!def) return trait
  const cappedRank = Math.min(MAX_FEATURE_LEVEL, Math.max(1, featureRank))
  const maxUses = def.maxUsesAtRank?.(cappedRank) ?? 0
  const uses = maxUses > 0 ? Math.min(trait.uses, maxUses) : trait.uses
  return {
    ...trait,
    name: def.name,
    level: cappedRank,
    maxUses,
    uses: maxUses > trait.maxUses ? maxUses : uses,
    description: formatFeatureDescription(def, cappedRank),
  }
}

export function syncClassTraitUses(c: Character): Character {
  let traits = c.traits
  for (const def of CLASS_FEATURE_DEFS) {
    if (def.deprecated) continue
    const t = traits.find((x) => x.featureKey === def.key)
    if (!t) continue
    traits = traits.map((x) => {
      if (x.featureKey !== def.key) return x
      return applyTraitFeatureRank(x, x.level)
    })
  }
  return { ...c, traits }
}

export function isArcherLineFeatureKey(key: ClassFeatureKey | undefined): boolean {
  return !!key && ACTIVE_FEATURE_KEYS.has(key)
}

export function stripArcherLineTraits(traits: Trait[]): Trait[] {
  return traits.filter((t) => !t.featureKey || ACTIVE_FEATURE_KEYS.has(t.featureKey))
}

/** 褰辫垶鑰呮皵涓婇檺 */
export function maxQiForLevel(level: number): number {
  if (level >= 50) return 6
  if (level >= 40) return 5
  if (level >= 30) return 4
  if (level >= 20) return 3
  if (level >= 15) return 2
  return 0
}

export function syncQiForCharacter(c: Character): Character {
  if (!isShadowDancer(c.charClass)) return { ...c, qi: undefined }
  const max = maxQiForLevel(c.level)
  const qi = Math.min(max, Math.max(0, c.qi ?? max))
  return { ...c, qi }
}

export function metaChoiceLabel(key: MetaChoiceKey): string {
  return META_LABELS[key].label
}

export function metaChoiceDescription(key: MetaChoiceKey): string {
  return META_LABELS[key].description
}

const DEPRECATED_KEY_MAP: Partial<Record<ClassFeatureKey, ClassFeatureKey>> = {
  steadyDraw: 'stableMind',
  flawObservation: 'piercingInsight',
  lastingControl: 'fateShackle',
  fatalChain: 'heavyFist',
  calmingAura: 'calmSpirit',
}

export function migrateTraitKey(key: ClassFeatureKey): ClassFeatureKey {
  return DEPRECATED_KEY_MAP[key] ?? key
}

export function migrateCharacterTraits(c: Character): Character {
  const seen = new Set<ClassFeatureKey>()
  const traits: Trait[] = []
  for (const t of c.traits) {
    if (!t.featureKey) {
      traits.push(t)
      continue
    }
    const mapped = migrateTraitKey(t.featureKey)
    const def = getClassFeatureDef(mapped)
    if (!def || def.deprecated) continue
    if (seen.has(mapped)) continue
    seen.add(mapped)
    const base = t.featureKey === mapped ? t : createClassTrait(mapped, c.level)
    traits.push(
      applyTraitFeatureRank(
        { ...base, level: t.level, uses: t.uses, maxUses: t.maxUses },
        t.level,
      ),
    )
  }
  return syncClassTraitUses({ ...c, traits })
}

export function resetCombatTraitUses(c: Character): Character {
  let traits = c.traits
  for (const def of CLASS_FEATURE_DEFS) {
    if (def.deprecated || def.usage !== 'perCombat' || !def.maxUsesAtRank) continue
    traits = traits.map((t) => {
      if (t.featureKey !== def.key) return t
      const maxUses = def.maxUsesAtRank!(t.level)
      return { ...t, uses: maxUses, maxUses }
    })
  }
  return {
    ...syncQiForCharacter(c),
    traits,
    combatBuffs: {
      ...c.combatBuffs,
      doubleArrowReady: undefined,
      preciseStrikeReady: undefined,
      steadyDrawUsedThisTurn: undefined,
      silentDrawUsed: undefined,
      calmSpiritStacks: undefined,
      calmSpiritCritBonusPercent: undefined,
      calmSpiritMoveFeet: undefined,
      movedFeetThisTurn: undefined,
      tookDamageThisTurn: undefined,
      outOfBreathTurns: undefined,
      galeComboReady: undefined,
      agileLeapMoveFeet: undefined,
      freeMoveFeet: undefined,
      burstKickExtraD6: undefined,
      windKickTreatKnockbackTargetId: undefined,
      wildernessGuideBoost: undefined,
    },
  }
}
