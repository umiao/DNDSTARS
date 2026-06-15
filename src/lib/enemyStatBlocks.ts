import type { AbilityKey } from './dnd'
import { GOBLIN_EQUIPMENT, HOBGOBLIN_EQUIPMENT } from './equipmentDefaults'
import type { CharacterEquipment } from '../types/equipment'

export interface MonsterTrait {
  name: string
  description: string
}

export interface MonsterAction {
  name: string
  description: string
}

export interface MonsterSkillNote {
  name: string
  bonus: string
}

export interface EnemyStatBlock {
  cr: string
  ac: number
  speed: string
  abilities: Record<AbilityKey, number>
  /** 瑁呭鏍忥紙鍚敤娲剧敓鎴樻枟鏁板€硷級 */
  equipment?: CharacterEquipment
  skills?: MonsterSkillNote[]
  senses?: string
  languages?: string
  traits: MonsterTrait[]
  actions: MonsterAction[]
}

/** 灏?DND 鏍囧噯灞炴€э紙8鈥?0锛夋槧灏勪负鏈簲鐢ㄥ睘鎬у垎鍊硷紙25鈥?9 = 璋冩暣鍊?0锛?*/
export function dndAbility(standard: number): number {
  const mod = Math.floor((standard - 10) / 2)
  return 25 + mod * 5
}

const A = dndAbility

export const ENEMY_STAT_BLOCKS: Record<string, EnemyStatBlock> = {
  goblin: {
    cr: '1/4',
    ac: 14,
    speed: '30 灏?,
    abilities: { str: A(8), dex: A(14), con: A(10), int: A(10), wis: A(8), cha: A(8) },
    equipment: { ...GOBLIN_EQUIPMENT },
    skills: [{ name: '闅愬尶', bonus: '+6' }],
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '閫氱敤璇€佸摜甯冩灄璇?,
    traits: [
      {
        name: '杩呮嵎閫冮€?,
        description: '鍝ュ竷鏋楀彲鍦ㄨ嚜宸辩殑姣忎釜鍥炲悎鐢ㄩ檮璧犲姩浣滄墽琛屾挙绂绘垨韬茶棌鍔ㄤ綔銆?,
      },
    ],
    actions: [
      {
        name: '寮垁',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏猴紝鍗曚竴鐩爣銆傚懡涓細5锛?d6 + 2锛夋尌鐮嶄激瀹炽€?,
      },
      {
        name: '鐭紦',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+4锛屽皠绋?80/320 灏猴紝鍗曚竴鐩爣銆傚懡涓細5锛?d6 + 2锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  hobgoblin: {
    cr: '1/2',
    ac: 18,
    speed: '30 灏?,
    abilities: { str: A(13), dex: A(12), con: A(12), int: A(10), wis: A(10), cha: A(9) },
    equipment: { ...HOBGOBLIN_EQUIPMENT },
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '閫氱敤璇€佸摜甯冩灄璇?,
    traits: [
      {
        name: '鍐涗簨绾緥',
        description: '30 灏哄唴鑻ユ湁鏈け鑳界殑鍙嬫柟澶у湴绮撅紝璇ュぇ鍦扮簿瀵规敾鍑绘瀹氫笌璞佸厤鍏锋湁浼樺娍銆?,
      },
    ],
    actions: [
      {
        name: '闀垮墤',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+3锛岃Е鍙?5 灏恒€傚懡涓細5锛?d8 + 1锛夋尌鐮嶄激瀹筹紝鎴栦娇鐢ㄥ弻鎵嬫椂 6锛?d10 + 1锛夈€?,
      },
      {
        name: '闀垮紦',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+3锛屽皠绋?150/600 灏恒€傚懡涓細5锛?d8 + 1锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  orc: {
    cr: '1/2',
    ac: 13,
    speed: '30 灏?,
    abilities: { str: A(16), dex: A(12), con: A(16), int: A(7), wis: A(11), cha: A(10) },
    skills: [{ name: '濞佸悡', bonus: '+2' }],
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '閫氱敤璇€佸吔浜鸿',
    traits: [
      {
        name: '鍑舵伓鏀诲嚮',
        description: '杩戞垬姝﹀櫒鍛戒腑鏃讹紝鍙澶栭€犳垚 4锛?d8锛夌偣浼ゅ锛堟瘡鐭紤鎴栭暱浼戜竴娆★級銆?,
      },
    ],
    actions: [
      {
        name: '宸ㄦ枾',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+5锛岃Е鍙?5 灏恒€傚懡涓細9锛?d12 + 3锛夋尌鐮嶄激瀹炽€?,
      },
      {
        name: '鏍囨灙',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+5锛屽皠绋?30/120 灏恒€傚懡涓細6锛?d6 + 3锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  bugbear: {
    cr: '1',
    ac: 16,
    speed: '30 灏?,
    abilities: { str: A(17), dex: A(14), con: A(14), int: A(11), wis: A(12), cha: A(11) },
    skills: [
      { name: '闅愬尶', bonus: '+6' },
      { name: '鐢熷瓨', bonus: '+2' },
    ],
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '閫氱敤璇€佸摜甯冩灄璇?,
    traits: [
      {
        name: '浼忓嚮鑰?,
        description: '鑻ュ湪绗竴杞垬鏂椾腑鍏堜簬鐩爣琛屽姩锛屽璇ョ洰鏍囩殑鏀诲嚮妫€瀹氬叿鏈変紭鍔裤€?,
      },
      {
        name: '铔姏绐佽',
        description: '杩戞垬鏀诲嚮鍛戒腑鏃讹紝棰濆閫犳垚 7锛?d6锛夌偣浼ゅ锛堟瘡鍥炲悎涓€娆★級銆?,
      },
    ],
    actions: [
      {
        name: '鏅ㄦ槦',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細11锛?d8 + 3锛夌┛鍒轰激瀹炽€?,
      },
      {
        name: '鏍囨灙',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+4锛屽皠绋?30/120 灏恒€傚懡涓細5锛?d6 + 3锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  skeleton: {
    cr: '1/4',
    ac: 13,
    speed: '30 灏?,
    abilities: { str: A(10), dex: A(14), con: A(15), int: A(6), wis: A(8), cha: A(5) },
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '鐞嗚В閫氱敤璇瓑锛屼絾涓嶄細璇?,
    traits: [
      {
        name: '鏄撲激',
        description: '鍙楅挐鍑讳激瀹虫椂鏄撲激銆?,
      },
    ],
    actions: [
      {
        name: '鐭墤',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細5锛?d6 + 2锛夌┛鍒轰激瀹炽€?,
      },
      {
        name: '鐭紦',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+4锛屽皠绋?80/320 灏恒€傚懡涓細5锛?d6 + 2锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  zombie: {
    cr: '1/4',
    ac: 8,
    speed: '20 灏?,
    abilities: { str: A(13), dex: A(6), con: A(16), int: A(3), wis: A(6), cha: A(5) },
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '鐞嗚В閫氱敤璇瓑锛屼絾涓嶄細璇?,
    traits: [
      {
        name: '涓嶆鍧氶煣',
        description: '鍙楅潪鍏夎€€銆侀潪閲嶅嚮浼ゅ闄嶈嚦 0 鐢熷懡鏃讹紝鍙繘琛?CON 璞佸厤锛圖C 5 + 鎵€鍙椾激瀹筹級锛屾垚鍔熷垯鏀逛负 1 鐢熷懡锛堟瘡闀夸紤涓€娆★級銆?,
      },
    ],
    actions: [
      {
        name: '鐚涘嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+3锛岃Е鍙?5 灏恒€傚懡涓細4锛?d6 + 1锛夐挐鍑讳激瀹炽€?,
      },
    ],
  },
  ghoul: {
    cr: '1',
    ac: 12,
    speed: '30 灏?,
    abilities: { str: A(13), dex: A(15), con: A(10), int: A(7), wis: A(10), cha: A(6) },
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '閫氱敤璇?,
    traits: [
      {
        name: '浜＄伒鏈川',
        description: '鍏嶇柅姣掔礌浼ゅ锛涢瓍鎯戙€佸姏绔€佷腑姣掔姸鎬併€?,
      },
    ],
    actions: [
      {
        name: '鐖嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細7锛?d4 + 2锛夋尌鐮嶄激瀹筹紱鐩爣椤婚€氳繃 DC 10 浣撹川璞佸厤锛屽惁鍒欓夯鐥?1 鍒嗛挓銆?,
      },
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+2锛岃Е鍙?5 灏猴紙浠呭楹荤椆銆佹潫缂氭垨鏃犳剰璇嗙洰鏍囷級銆傚懡涓細9锛?d6 + 2锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  wolf: {
    cr: '1/4',
    ac: 13,
    speed: '40 灏?,
    abilities: { str: A(12), dex: A(15), con: A(12), int: A(3), wis: A(12), cha: A(6) },
    skills: [
      { name: '瀵熻', bonus: '+3' },
      { name: '闅愬尶', bonus: '+4' },
    ],
    senses: '琚姩瀵熻 13',
    traits: [
      {
        name: '闆嗙兢鎴樻湳',
        description: '鑻?5 灏哄唴鏈夋湭澶辫兘鐨勫弸鏂癸紝瀵圭洰鏍囩殑鏀诲嚮妫€瀹氬叿鏈変紭鍔裤€?,
      },
      {
        name: '鏁忛攼鍡呭惉瑙?,
        description: '瀵熻渚濊禆鍡呰鎴栧惉瑙夌殑妫€瀹氬叿鏈変紭鍔裤€?,
      },
    ],
    actions: [
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細7锛?d4 + 1锛夌┛鍒轰激瀹筹紱鐩爣椤婚€氳繃 DC 11 鍔涢噺璞佸厤锛屽惁鍒欏€掑湴銆?,
      },
    ],
  },
  'dire-wolf': {
    cr: '1',
    ac: 14,
    speed: '50 灏?,
    abilities: { str: A(17), dex: A(15), con: A(15), int: A(3), wis: A(12), cha: A(7) },
    skills: [
      { name: '瀵熻', bonus: '+3' },
      { name: '闅愬尶', bonus: '+4' },
    ],
    traits: [
      {
        name: '闆嗙兢鎴樻湳',
        description: '鑻?5 灏哄唴鏈夋湭澶辫兘鐨勫弸鏂癸紝瀵圭洰鏍囩殑鏀诲嚮妫€瀹氬叿鏈変紭鍔裤€?,
      },
    ],
    actions: [
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+5锛岃Е鍙?5 灏恒€傚懡涓細10锛?d6 + 3锛夌┛鍒轰激瀹筹紱鐩爣椤婚€氳繃 DC 13 鍔涢噺璞佸厤锛屽惁鍒欏€掑湴銆?,
      },
    ],
  },
  'brown-bear': {
    cr: '1',
    ac: 11,
    speed: '40 灏猴紝鏀€鐖?30 灏?,
    abilities: { str: A(19), dex: A(10), con: A(16), int: A(2), wis: A(13), cha: A(7) },
    skills: [{ name: '瀵熻', bonus: '+3' }],
    senses: '琚姩瀵熻 13',
    traits: [
      {
        name: '鏁忛攼鍡呭惉瑙?,
        description: '瀵熻渚濊禆鍡呰鎴栧惉瑙夌殑妫€瀹氬叿鏈変紭鍔裤€?,
      },
    ],
    actions: [
      {
        name: '澶氶噸鏀诲嚮',
        description: '杩涜涓ゆ鏀诲嚮锛氫竴娆″晝鍜紝涓€娆＄埅鍑汇€?,
      },
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+6锛岃Е鍙?5 灏恒€傚懡涓細8锛?d8 + 4锛夌┛鍒轰激瀹炽€?,
      },
      {
        name: '鐖嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+6锛岃Е鍙?5 灏恒€傚懡涓細11锛?d6 + 4锛夋尌鐮嶄激瀹炽€?,
      },
    ],
  },
  'giant-spider': {
    cr: '1',
    ac: 14,
    speed: '30 灏猴紝鏀€鐖?30 灏?,
    abilities: { str: A(14), dex: A(16), con: A(12), int: A(2), wis: A(11), cha: A(4) },
    skills: [{ name: '闅愬尶', bonus: '+7' }],
    senses: ' blindsight 10 灏猴紝榛戞殫瑙嗚 60 灏?,
    traits: [
      {
        name: '铔涜',
        description: '鍙部 difficult 琛ㄩ潰鏀€鐖紝鍖呮嫭鍊掑悐澶╄姳鏉匡紝鏃犻渶妫€瀹氥€?,
      },
      {
        name: '缃戠細鎰熺煡',
        description: '鎰熺煡缃戜腑鐢熺墿鐨勭簿纭綅缃€?,
      },
    ],
    actions: [
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+5锛岃Е鍙?5 灏恒€傚懡涓細7锛?d8 + 3锛夌┛鍒轰激瀹筹紝澶栧姞 9锛?d8锛夋瘨绱犱激瀹筹紙DC 11 浣撹川鍑忓崐锛夈€?,
      },
      {
        name: '鍚愮綉',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+5锛屽皠绋?30/60 灏恒€傚懡涓細鐩爣鏉熺細锛圖C 12 鍔涢噺鎴栨晱鎹疯眮鍏嶆專鑴憋級銆?,
      },
    ],
  },
  slime: {
    cr: '1/2',
    ac: 8,
    speed: '20 灏猴紝鏀€鐖?20 灏?,
    abilities: { str: A(10), dex: A(5), con: A(16), int: A(1), wis: A(6), cha: A(2) },
    senses: ' blindsight 60 灏猴紙鐩茶澶栧け鏄庯級',
    traits: [
      {
        name: '鏃犲畾褰?,
        description: '鍙尋杩?1 瀵稿缂濋殭锛涙棤闇€棰濆鍔ㄤ綔鍗冲彲閫氳繃 1 瀵哥┖闂淬€?,
      },
      {
        name: '鍒嗚',
        description: '鍙楅挐鍑汇€侀棯鐢垫垨 slashing 浼ゅ涓旂敓鍛藉€?鈮?0 鏃讹紝鍒嗚涓轰袱涓緝灏忓彶鑾卞锛堝悇鍗婄敓鍛斤級銆?,
      },
    ],
    actions: [
      {
        name: '浼冻',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+3锛岃Е鍙?5 灏恒€傚懡涓細4锛?d6 + 1锛夐挐鍑讳激瀹筹紝澶栧姞 7锛?d6锛夊己閰镐激瀹炽€?,
      },
    ],
  },
  bandit: {
    cr: '1/8',
    ac: 12,
    speed: '30 灏?,
    abilities: { str: A(11), dex: A(12), con: A(12), int: A(10), wis: A(10), cha: A(10) },
    languages: '閫氱敤璇?,
    actions: [
      {
        name: '寮垁',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+3锛岃Е鍙?5 灏恒€傚懡涓細4锛?d6 + 1锛夋尌鐮嶄激瀹炽€?,
      },
      {
        name: '杞诲缉',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+3锛屽皠绋?80/320 灏恒€傚懡涓細5锛?d8 + 1锛夌┛鍒轰激瀹炽€?,
      },
    ],
    traits: [],
  },
  guard: {
    cr: '1/8',
    ac: 16,
    speed: '30 灏?,
    abilities: { str: A(13), dex: A(12), con: A(12), int: A(10), wis: A(11), cha: A(10) },
    skills: [{ name: '瀵熻', bonus: '+2' }],
    languages: '閫氱敤璇?,
    actions: [
      {
        name: '鐭?,
        description: '杩戞垬鎴栬繙绋嬫鍣ㄦ敾鍑伙細鍛戒腑 +3锛岃Е鍙?5 灏烘垨灏勭▼ 20/60 灏恒€傚懡涓細4锛?d6 + 1锛夌┛鍒烘垨 5锛?d8 + 1锛夈€?,
      },
    ],
    traits: [],
  },
  cultist: {
    cr: '1/8',
    ac: 12,
    speed: '30 灏?,
    abilities: { str: A(11), dex: A(10), con: A(10), int: A(10), wis: A(11), cha: A(10) },
    skills: [{ name: '娆虹瀿', bonus: '+2' }, { name: '瀹楁暀', bonus: '+2' }],
    languages: '閫氱敤璇?,
    traits: [
      {
        name: '榛戞殫铏旇瘹',
        description: '瀵归瓍鎯戞垨鎭愭厡鐨勮眮鍏嶅叿鏈変紭鍔裤€?,
      },
    ],
    actions: [
      {
        name: '寮垁',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+3锛岃Е鍙?5 灏恒€傚懡涓細4锛?d6 + 1锛夋尌鐮嶄激瀹炽€?,
      },
    ],
  },
  'mage-apprentice': {
    cr: '1/4',
    ac: 11,
    speed: '30 灏?,
    abilities: { str: A(9), dex: A(12), con: A(10), int: A(14), wis: A(11), cha: A(11) },
    skills: [{ name: '濂ョ', bonus: '+4' }, { name: '鍘嗗彶', bonus: '+4' }],
    languages: '閫氱敤璇?,
    traits: [
      {
        name: '鏂芥硶',
        description: '鏅哄姏涓烘柦娉曞睘鎬э紙娉曟湳璞佸厤 DC 12锛屾硶鏈敾鍑?+4锛夈€傚凡鐭ワ細娉曞笀涔嬫墜銆佸厜浜湳銆侀瓟娉曢寮癸紙3 鍙戯級銆佹姢鐩炬湳銆?,
      },
    ],
    actions: [
      {
        name: '鍖曢',
        description: '杩戞垬鎴栬繙绋嬫鍣ㄦ敾鍑伙細鍛戒腑 +3锛岃Е鍙?5 灏烘垨灏勭▼ 20/60 灏恒€傚懡涓細3锛?d4 + 1锛夌┛鍒轰激瀹炽€?,
      },
    ],
  },
  ogre: {
    cr: '2',
    ac: 11,
    speed: '40 灏?,
    abilities: { str: A(19), dex: A(8), con: A(16), int: A(5), wis: A(7), cha: A(7) },
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '閫氱敤璇€佸法浜鸿',
    actions: [
      {
        name: '宸ㄦ',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+6锛岃Е鍙?5 灏恒€傚懡涓細13锛?d8 + 4锛夐挐鍑讳激瀹炽€?,
      },
      {
        name: '鏍囨灙',
        description: '杩滅▼姝﹀櫒鏀诲嚮锛氬懡涓?+6锛屽皠绋?30/120 灏恒€傚懡涓細11锛?d6 + 4锛夌┛鍒轰激瀹炽€?,
      },
    ],
    traits: [],
  },
  troll: {
    cr: '5',
    ac: 15,
    speed: '30 灏?,
    abilities: { str: A(18), dex: A(13), con: A(20), int: A(7), wis: A(9), cha: A(7) },
    skills: [{ name: '瀵熻', bonus: '+2' }],
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '宸ㄤ汉璇?,
    traits: [
      {
        name: '鍐嶇敓',
        description: '鍥炲悎寮€濮嬫椂鎭㈠ 10 鐢熷懡锛涗粎鍙楀己閰告垨鐏劙浼ゅ鏃惰鍥炲悎鍐嶇敓澶辨晥锛涚敓鍛戒负 0 涓旀湭鍙椾笂杩颁激瀹虫椂浠嶆浜°€?,
      },
      {
        name: '鏁忛攼鍡呭惉瑙?,
        description: '瀵熻渚濊禆鍡呰鎴栧惉瑙夌殑妫€瀹氬叿鏈変紭鍔裤€?,
      },
    ],
    actions: [
      {
        name: '澶氶噸鏀诲嚮',
        description: '涓€娆″晝鍜笌涓ゆ鐖嚮銆?,
      },
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+7锛岃Е鍙?5 灏恒€傚懡涓細7锛?d6 + 4锛夌┛鍒轰激瀹炽€?,
      },
      {
        name: '鐖嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+7锛岃Е鍙?5 灏恒€傚懡涓細11锛?d6 + 4锛?slashing 浼ゅ銆?,
      },
    ],
  },
  owlbear: {
    cr: '3',
    ac: 13,
    speed: '40 灏?,
    abilities: { str: A(20), dex: A(12), con: A(17), int: A(3), wis: A(12), cha: A(7) },
    skills: [{ name: '瀵熻', bonus: '+3' }],
    senses: '榛戞殫瑙嗚 60 灏?,
    traits: [
      {
        name: '鏁忛攼鍡呭惉瑙?,
        description: '瀵熻渚濊禆鍡呰鎴栧惉瑙夌殑妫€瀹氬叿鏈変紭鍔裤€?,
      },
    ],
    actions: [
      {
        name: '澶氶噸鏀诲嚮',
        description: '涓€娆″枡鍑讳笌涓€娆＄埅鍑汇€?,
      },
      {
        name: '鍠欏嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+7锛岃Е鍙?5 灏恒€傚懡涓細10锛?d10 + 5锛夌┛鍒轰激瀹炽€?,
      },
      {
        name: '鐖嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+7锛岃Е鍙?5 灏恒€傚懡涓細14锛?d8 + 5锛夋尌鐮嶄激瀹炽€?,
      },
    ],
  },
  harpy: {
    cr: '1',
    ac: 11,
    speed: '20 灏猴紝椋炶 40 灏?,
    abilities: { str: A(12), dex: A(13), con: A(12), int: A(7), wis: A(10), cha: A(13) },
    senses: '榛戞殫vision 60 灏?,
    languages: '閫氱敤璇?,
    traits: [
      {
        name: '璇辨儜涔嬫瓕',
        description: '鍚姩闇€ 1 鍔ㄤ綔锛?0 灏哄唴鍚鑰呴』閫氳繃 DC 11 鎰熺煡璞佸厤锛屽惁鍒欒榄呮儜骞惰蛋鍚戦拱韬コ濡栵紙鐩磋嚦鍙椾激鎴栨瓕鏇茬粨鏉燂級銆?,
      },
    ],
    actions: [
      {
        name: '鐖嚮锛埫?锛?,
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+3锛岃Е鍙?5 灏恒€傚懡涓細6锛?d4 + 1锛夋尌鐮嶄激瀹炽€?,
      },
    ],
  },
  'wyrmling-red': {
    cr: '4',
    ac: 17,
    speed: '30 尺，攀爬 30 尺，飞行 60 尺',
    abilities: { str: A(17), dex: A(10), con: A(15), int: A(12), wis: A(11), cha: A(15) },
    skills: [{ name: '察觉', bonus: '+4' }, { name: '隐匿', bonus: '+2' }],
    senses: '盲视 10 尺，黑暗视觉 60 尺',
    languages: '龙语',
    traits: [
      {
        name: '火焰抗性',
        description: '对火焰伤害具有抗性。',
      },
    ],
    actions: [
      {
        name: '啃咬',
        description: '近战武器攻击：命中 +5，触及 5 尺。命中：1D10+3 穿刺伤害，外加 1D6 火焰伤害。',
      },
      {
        name: '火焰吐息',
        description: '15 尺锥形区域，区域内生物进行 DC12 敏捷豁免，失败受到 4D6 火焰伤害，成功减半。测试用 AI：第一回合默认优先使用。',
      },
    ],
  },
  'wyrmling-green': {
    cr: '2',
    ac: 17,
    speed: '30 灏猴紝椋炶 60 灏猴紝娓告吵 30 灏?,
    abilities: { str: A(15), dex: A(12), con: A(13), int: A(14), wis: A(11), cha: A(13) },
    skills: [{ name: '瀵熻', bonus: '+4' }, { name: '娆虹瀿', bonus: '+4' }, { name: '闅愬尶', bonus: '+4' }],
    senses: ' blindsight 10 灏猴紝榛戞殫瑙嗚 60 灏?,
    languages: '榫欒',
    traits: [
      {
        name: '姘撮檰涓ゆ爾',
        description: '鍙湪绌烘皵涓庢按涓懠鍚搞€?,
      },
    ],
    actions: [
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細7锛?d10 + 2锛夌┛鍒轰激瀹筹紝澶栧姞 3锛?d6锛夋瘨绱犱激瀹炽€?,
      },
      {
        name: '姣掓皵鍚愭伅',
        description: '15 灏洪敟褰㈠尯鍩燂紝DC 11 浣撹川璞佸厤锛屽け璐?21锛?d6锛夋瘨绱犱激瀹筹紝鎴愬姛鍑忓崐锛堝厖鑳?5鈥?锛夈€?,
      },
    ],
  },
  imp: {
    cr: '1',
    ac: 13,
    speed: '20 灏猴紝椋炶 40 灏?,
    abilities: { str: A(6), dex: A(17), con: A(13), int: A(11), wis: A(12), cha: A(14) },
    skills: [{ name: '娆虹瀿', bonus: '+4' }, { name: '娲炴倝', bonus: '+3' }, { name: '闅愬尶', bonus: '+4' }],
    senses: '榛戞殫瑙嗚 120 灏?,
    languages: '鐐肩嫳璇€侀€氱敤璇?,
    traits: [
      {
        name: '榄旀硶鎶楁€?,
        description: '瀵规姉娉曟湳涓庡叾浠栭瓟娉曟晥搴旂殑璞佸厤鍏锋湁浼樺娍銆?,
      },
      {
        name: '闅愬舰',
        description: '闄勮禒鍔ㄤ綔闅愬舰锛岀洿鑷虫敾鍑汇€佹柦娉曟垨缁撴潫涓撴敞銆?,
      },
    ],
    actions: [
      {
        name: '閽夊埡',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+5锛岃Е鍙?5 灏恒€傚懡涓細5锛?d4 + 3锛夌┛鍒轰激瀹筹紝澶栧姞 10锛?d6锛夋瘨绱犱激瀹炽€?,
      },
    ],
  },
  'animated-armor': {
    cr: '1',
    ac: 18,
    speed: '25 灏?,
    abilities: { str: A(14), dex: A(11), con: A(13), int: A(1), wis: A(3), cha: A(1) },
    senses: ' blindsight 60 灏猴紙鐩茶澶栧け鏄庯級',
    traits: [
      {
        name: '鍙嶉瓟娉曟槗鎰?,
        description: '澶勪簬鍙嶉瓟娉曞満涓櫡鍏ュけ鑳斤紱瀵?dispel magic 鐨勮眮鍏嶈嚜鍔ㄥけ璐ャ€?,
      },
    ],
    actions: [
      {
        name: '鐚涘嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細5锛?d6 + 2锛夐挐鍑讳激瀹炽€?,
      },
    ],
  },
  gargoyle: {
    cr: '2',
    ac: 15,
    speed: '30 灏猴紝椋炶 60 灏?,
    abilities: { str: A(15), dex: A(11), con: A(16), int: A(6), wis: A(11), cha: A(7) },
    skills: [{ name: '闅愬尶', bonus: '+4' }],
    senses: '榛戞殫瑙嗚 60 灏?,
    languages: '鍦熸棌璇?,
    traits: [
      {
        name: '鎷熷舰',
        description: '闈欐鏃跺彲涓庣煶璐ㄨ〃闈㈣瀺涓轰竴浣擄紝瀵熻妫€瀹氶渶瀵规姉 DC 15 鎵嶈兘鍙戠幇銆?,
      },
    ],
    actions: [
      {
        name: '澶氶噸鏀诲嚮',
        description: '涓€娆″晝鍜€佷竴娆＄埅鍑汇€佷竴娆?horns锛堣嫢鏁版嵁绠€鍖栧垯鍚堝苟涓虹埅鍑幻?锛夈€?,
      },
      {
        name: '鍟冨挰',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細5锛?d6 + 2锛?piercing 浼ゅ銆?,
      },
      {
        name: '鐖嚮',
        description: '杩戞垬姝﹀櫒鏀诲嚮锛氬懡涓?+4锛岃Е鍙?5 灏恒€傚懡涓細5锛?d6 + 2锛?slashing 浼ゅ銆?,
      },
    ],
  },
}

export function getEnemyStatBlock(id: string): EnemyStatBlock | undefined {
  return ENEMY_STAT_BLOCKS[id]
}
