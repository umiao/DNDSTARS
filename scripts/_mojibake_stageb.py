# -*- coding: utf-8 -*-
"""Stage B: fill the U+FFFD loss markers left by Stage A (_mojibake_fix.py).

Each loss = ONE content char eaten by a 0x3F byte; the adjacent literal ? (0x3F)
also consumed a delimiter (almost always the closing quote ').

Reconstruction sources (audit trail for hr=1):
  * dice damage count: DERIVED, not guessed -- D&D writes "avg (NdS+M)" with
    avg = floor(N*(S+1)/2 + M), so N = round((avg-M)/((S+1)/2)).
  * sentence-final 。, 命中/触及/射程, ）, —— separators: forced by structure.
  * names/tags/titles: standard D&D 5e CN terms + the recovered 2-char body.
  * lines tagged INFER below are human-judgement reconstructions (the lost byte
    is unrecoverable); everything else is forced by the recovered body.

Run:  python scripts/_mojibake_stageb.py            # report + assert clean
      python scripts/_mojibake_stageb.py --write     # overwrite the real .ts files
"""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

F = '�'        # lost content char
Q = '?'             # the eaten delimiter (0x3F)
WRITE = '--write' in sys.argv

def dice_count(avg, sides, mod):
    return round((avg - mod) / ((sides + 1) / 2))

# ---------- pass 1: dice notation  N�?dS [+ M]）  (F=（, ?=count digit) ----------
DICE = re.compile(r'(\d+)' + F + r'\?d(\d+)((?: \+ (\d+))?)')
def fix_dice(text):
    def repl(m):
        avg = int(m.group(1)); sides = int(m.group(2))
        mod = int(m.group(4)) if m.group(4) else 0
        return f'{avg}（{dice_count(avg, sides, mod)}d{sides}{m.group(3)}'
    return DICE.sub(repl, text)

# ---------- pass 2: generic forced substrings ----------
GENERIC = [
    ('：命' + F + Q, '：命中 '),
    ('触' + F + Q, '触及 '),
    ('射' + F + Q, '射程 '),
    # ）before a latin damage-type word that followed the dice close
    (' + 4' + F + Q + 'slashing', ' + 4）slashing'),
    (' + 2' + F + Q + 'piercing', ' + 2）piercing'),
    (' + 2' + F + Q + 'slashing', ' + 2）slashing'),
    # comment section separators (spaces eaten on the corrupted ones):
    ('// —' + F + Q + '弓手 —' + F + Q, '// —— 弓手 ——'),
    ('// —' + F + Q + '逐风' + F + Q + '—' + F + Q, '// —— 逐风者 ——'),
    ('// —' + F + Q + '影舞' + F + Q + '—' + F + Q, '// —— 影舞者 ——'),
    ('// —' + F + Q + '已废弃（迁移用） —' + F + Q, '// —— 已废弃（迁移用） ——'),
    ('// —' + F + Q + '废弃（迁移） —' + F + Q, '// —— 废弃（迁移） ——'),
    # formatFeatureDescription null-placeholder  '—'
    (": '" + F + Q + ')', ": '—')"),
    # ----- word-completion mid-string losses (lost char + eaten space) -----
    ('消' + F + Q, '消耗 '),
    ('使' + F + Q, '使用 '),
    ('提' + F + Q, '提升 '),
    ('额' + F + Q, '额外 '),
    ('增' + F + Q, '增加 '),
    ('回' + F + Q, '回复 '),
    ('少' + F + Q, '少于 '),
    ('附' + F + Q, '附加 '),
    ('施' + F + Q, '施加 '),
    ('给' + F + Q, '给予 '),
    ('改' + F + Q, '改为 '),
    ('豁' + F + Q, '豁免 '),
    ('眩' + F + Q, '眩晕 '),
    ('身' + F + Q, '身上 '),
    ('周' + F + Q, '周围 '),
    ('技' + F + Q, '技能 '),
    ('调整' + F + Q, '调整为 '),
    ('叠加' + F + Q, '叠加至 '),
    # ----- context-specific mid-string -----
    ('最' + F + Q + '3D', '最高 3D'),
    ('最' + F + Q + '8D', '最高 8D'),
    ('最' + F + Q + '4 层', '最多 4 层'),
    ('最' + F + Q + '3 个', '最多 3 个'),
    ('（每' + F + Q, '（每级 '),
    ('升 1 ' + F + Q, '升 1 级 '),
    ('（' + F + Q + 'DM', '（由 DM'),     # INFER metaknowledge note
    ('上' + F + Q, '上限 '),
    ('至' + F + Q, '至少 '),
    ('长' + F + Q, '长休 '),
    ('获' + F + Q, '获得 '),
    ('持' + F + Q, '持续 '),
    ('特' + F + Q, '特性 '),
]

# ---------- pass 3: explicit per-value reconstructions ----------
# (broken_substring, fixed_substring).  Order matters (longer/specific first).
EXPLICIT = [
    # ===== enemyPool.ts =====
    ('快速放置敌' + F + Q + 'token' + F + Q + '*/', '快速放置敌人 token） */'),
    ('maps.ts' + F + Q + '*/', 'maps.ts） */'),
    ("name: '哥布" + F + Q + ",",  "name: '哥布林',"),
    ("'哥布" + F + Q + "]",        "'哥布林']"),
    ("name: '大地" + F + Q + ",",  "name: '大地精',"),   # INFER hobgoblin = 大地精
    ("name: '熊地" + F + Q + ",",  "name: '熊地精',"),   # INFER bugbear = 熊地精
    ("name: '食尸" + F + Q + ",",  "name: '食尸鬼',"),   # ghoul
    ("name: '史莱" + F + Q + ",",  "name: '史莱姆',"),   # slime
    ("name: '邪教" + F + Q + ",",  "name: '邪教徒',"),   # cultist
    ("name: '食人" + F + Q + ",",  "name: '食人魔',"),   # ogre
    ("name: '小魔" + F + Q + ",",  "name: '小魔鬼',"),   # INFER imp (body=小魔)
    ("name: '石像" + F + Q + ",",  "name: '石像鬼',"),   # gargoyle
    ("'施法" + F + Q + "]",        "'施法者']"),         # caster tag
    ("'泥" + F + Q + ",",          "'泥浆',"),           # INFER slime tag = 泥浆
    # emoji variation-selector U+FE0F lost (the FFFD = ️)
    ("'\U0001F9DF‍♂" + F + Q + ",", "'\U0001F9DF‍♂️',"),  # 🧟‍♂️ ghoul
    ("'\U0001F577" + F + Q + ",", "'\U0001F577️',"),  # 🕷️ spider
    ("'\U0001F5E1" + F + Q + ",", "'\U0001F5E1️',"),  # 🗡️ dagger
    ("'\U0001F6E1" + F + Q + ",", "'\U0001F6E1️',"),  # 🛡️ shield
    ("'\U0001F56F" + F + Q + ",", "'\U0001F56F️',"),  # 🕯️ candle

    # ===== enemyStatBlocks.ts =====
    # explanatory comment (INFER wording; comment only, no runtime effect)
    ("/** " + F + Q + "DND 标准属性（8" + F + Q + "0）映射为本应用属性分值（25" + F + Q + "9 = 调整" + F + Q + "0" + F + Q + "*/",
     "/** 据 DND 标准属性（8到20）映射为本应用属性分值（25到79，调整 ±0） */"),
    ("name: '迅捷逃" + F + Q + ",",   "name: '迅捷逃脱',"),
    ("name: '伏击" + F + Q + ",",     "name: '伏击者',"),
    ("name: '敏锐嗅听" + F + Q + ",", "name: '敏锐嗅听觉',"),
    ("name: '无定" + F + Q + ",",     "name: '无定形',"),
    ("name: '魔法抗" + F + Q + ",",   "name: '魔法抗性',"),
    ("name: '反魔法易" + F + Q + ",", "name: '反魔法易伤',"),
    ("name: '爪击（" + F + Q + F + Q + ",", "name: '爪击（爪）',"),  # INFER harpy
    ("speed: '40 尺，攀" + F + Q + "30 " + F + Q + ",", "speed: '40 尺，攀爬 30 尺',"),
    ("speed: '30 尺，攀" + F + Q + "30 " + F + Q + ",", "speed: '30 尺，攀爬 30 尺',"),
    ("speed: '20 尺，攀" + F + Q + "20 " + F + Q + ",", "speed: '20 尺，攀爬 20 尺',"),
    ("speed: '30 " + F + Q + ",",  "speed: '30 尺',"),
    ("speed: '20 " + F + Q + ",",  "speed: '20 尺',"),
    ("speed: '40 " + F + Q + ",",  "speed: '40 尺',"),
    ("speed: '25 " + F + Q + ",",  "speed: '25 尺',"),
    ("speed: '50 " + F + Q + ",",  "speed: '50 尺',"),
    ("尺，飞行 40 " + F + Q + ",",  "尺，飞行 40 尺',"),
    ("尺，飞行 60 " + F + Q + ",",  "尺，飞行 60 尺',"),
    ("，飞行 60 尺，游泳 30 " + F + Q + ",",  "，飞行 60 尺，游泳 30 尺',"),
    # senses ending in 尺
    ("黑暗视觉 60 " + F + Q + ",",  "黑暗视觉 60 尺',"),
    ("黑暗视觉 120 " + F + Q + ",", "黑暗视觉 120 尺',"),
    ("blindsight 10 尺，黑暗视觉 60 " + F + Q + ",", "blindsight 10 尺，黑暗视觉 60 尺',"),
    # languages
    ("'通用语、哥布林" + F + Q + ",",     "'通用语、哥布林语',"),
    ("'理解通用语等，但不会" + F + Q + ",", "'理解通用语等，但不会说',"),  # INFER 说
    ("'巨人" + F + Q + ",",               "'巨人语',"),
    ("'炼狱语、通用" + F + Q + ",",        "'炼狱语、通用语',"),
    ("'土族" + F + Q + ",",               "'土族语',"),               # INFER 土族语
    ("languages: '通用" + F + Q + ",",    "languages: '通用语',"),    # lone Common (语 lost)
    ("senses: '黑暗vision 60 " + F + Q + ",", "senses: '黑暗vision 60 尺',"),  # harpy (preserve src 'vision')
    # 'wolf/dire-wolf pack tactics: '若 5 尺内...'
    ("'" + F + Q + "5 尺内有未失能的友方", "'若 5 尺内有未失能的友方"),
    # mid-string CON/麻痹/倒地 etc handled by 命中/触及/dice + trailing 。; specials:
    ("可进" + F + Q + "CON 豁免",        "可进行 CON 豁免"),         # zombie undead fortitude
    ("否则麻" + F + Q + "1 分钟",        "否则麻痹 1 分钟"),
    ("启动需 1 动作" + F + Q + "0 尺内", "启动需 1 动作，10 尺内"),    # harpy luring song
    ("可挤" + F + Q + "1 寸宽缝隙",      "可挤入 1 寸宽缝隙"),         # slime amorphous (INFER 入)
    ("生命" + F + Q + Q + "0 时", "生命值 ≤ 0 时"),                  # slime split: 鈮=≤ (INFER)
    ("处于反魔法场中陷入失能；" + F + Q + "dispel magic", "处于反魔法场中陷入失能；对 dispel magic"),
    ("法术攻" + F + Q + "+4）",          "法术攻击 +4）"),            # mage spellcasting
    ("一" + F + Q + "horns（若数据简化则合并为爪击" + F + Q + "）",
     "一对 horns（若数据简化则合并为爪击）"),                         # INFER gargoyle 一对
    # wyrmling-green breath (model on clean wyrmling-red)
    ("体质豁免，失" + F + Q + "21",      "体质豁免，失败 21"),         # INFER 失败
    ("成功减半（充" + F + Q + "5" + F + Q + "）", "成功减半（充能 5–6）"),  # INFER recharge 充能 5–6

    # ===== traitRegistry.ts =====
    ("职业特" + F + Q,  "职业特性'"),       # all group titles
    ("里程" + F + Q,    "里程碑'"),
    ("'职业特性键（弓" + F + Q + "/ 逐风" + F + Q + "/ 影舞者）", "'职业特性键（弓手 / 逐风者 / 影舞者）"),
    ("name: '穿甲" + F + Q + ",",     "name: '穿甲箭',"),
    ("name: '荒野指引" + F + Q + ",", "name: '荒野指引者',"),
    ("name: '看破" + F + Q + ",",     "name: '看破！',"),
    ("name: '动物学专" + F + Q + ",", "name: '动物学专精',"),
    ("name: '追踪" + F + Q + ",",     "name: '追踪箭',"),
    ("name: '符文" + F + Q + ",",     "name: '符文箭',"),
    ("name: '疾风舞" + F + Q + ",",   "name: '疾风舞者',"),
    ("name: '连续" + F + Q + ",",     "name: '连续拳',"),
    ("name: '超凡" + F + Q + ",",     "name: '超凡魂',"),
    ("name: '迅捷" + F + Q + ",",     "name: '迅捷步',"),   # INFER swiftStep
    ("（旧" + F + Q + ",",            "（旧）',"),
    ("description: '（已废弃" + F + Q + ",", "description: '（已废弃）',"),  # ） lost, not 。
    # META labels
    ("label: '自选学" + F + Q + "+1',", "label: '自选学识 +1',"),
    ("label: '属性" + F + Q + "+2',",   "label: '属性值 +2',"),
    ("label: '自选特" + F + Q + "+1',", "label: '自选特性 +1',"),
    ("label: '自选技" + F + Q + "+1',", "label: '自选技能 +1',"),
    ("武" + F + Q + "工具/技能熟练提",  "武器/工具/技能熟练提"),
    # usageLabel returns
    ("return '" + F + Q + F + Q,  "return '每场'"),   # INFER perCombat = 每场
    ("return '" + F + Q + "长休'", "return '每长休'"),
    # titles: '逐风者 · LVxx' / '影舞者 · LVxx' (者 lost, eaten space before ·) -- MUST precede bare
    ("'逐风" + F + Q + "·", "'逐风者 ·"),
    ("'影舞" + F + Q + "·", "'影舞者 ·"),
    # isBaseArcher / isWindrunner string comparisons
    ("'逐风" + F + Q + " &&", "'逐风者' &&"),
    ("=== '逐风" + F + Q, "=== '逐风者'"),
    ("'影舞" + F + Q + "\n", "'影舞者'\n"),
    ("'影舞" + F + Q,  "'影舞者'"),
    ("'逐风" + F + Q,  "'逐风者'"),
    # line 650 fully-garbled hint
    ("hint: '请选择 1 项：追踪箭、爆裂箭矃6" + F + "9" + F + Q + ",",
     "hint: '请选择 1 项：追踪箭、爆裂箭。',"),
    # class-feature-keys comment (5: 职业特性键 already clean)
    ("（弓" + F + Q + "/ 逐风" + F + Q + "/ 影舞者）", "（弓手 / 逐风者 / 影舞者）"),
    # slime split: 值≤ both eaten (鈮 = ≤). game data as recovered.
    ("生命" + F + Q + F + Q + "0 时", "生命值≤0 时"),    # INFER ≤ (byte-evidenced)
    # doubleArrow: '每日 {uses} 次' (desc references 每日使用上限)
    ("两支。每" + F + Q + "{uses}", "两支。每日 {uses}"),  # INFER 日
    # calmSpirit: heavy multi-loss; reconstruct full RAW value (INFER 移动至/层2/层4)
    ("'每次保持静心状态结束回合时获得 1 层静心标记（上限 4）。可消耗标记：1 枚移动至" + F + Q
     + "10 尺（每级 +5 尺）" + F + Q + " 枚暴击率 +20%（每" + F + Q + "+10%）；3 枚一项技" + F + Q
     + "CD -1" + F + Q + " 枚再获得一个完整回合" + F + Q + ",",
     "'每次保持静心状态结束回合时获得 1 层静心标记（上限 4）。可消耗标记：1 枚移动至 10 尺（每级 +5 尺）；2 枚暴击率 +20%（每级 +10%）；3 枚一项技能 CD -1；4 枚再获得一个完整回合。',"),
]

def apply_fixes(text):
    text = fix_dice(text)
    # EXPLICIT first (matches RAW .fixed forms) so GENERIC word-rules don't pre-mangle
    for a, b in EXPLICIT:
        text = text.replace(a, b)
    for a, b in GENERIC:
        text = text.replace(a, b)
    # pass 4 (line-aware): remaining X�? is the sentence-final 。 ONLY on description/
    # hint / bare-string-literal lines. Single-char names resolved by block context.
    lines = text.split('\n')
    tmpl_id = None
    block_key = None
    for i, raw in enumerate(lines):
        m = re.search(r"id: '([\w-]+)'", raw)
        if m:
            tmpl_id = m.group(1)
        mk = re.match(r"^  ('?[\w-]+'?): \{", raw)   # 2-space-indent stat-block key
        if mk:
            block_key = mk.group(1).strip("'")
        if F + Q not in raw:
            continue
        st = raw.lstrip()
        if st.startswith('description:') or st.startswith('hint:') or st.startswith("'"):
            lines[i] = raw.replace(F + Q, "。'")          # sentence end
        elif st.startswith("name: '" + F + Q):
            ch = {'wolf': '狼'}.get(tmpl_id) or ('矛' if block_key == 'guard' else None)  # INFER guard weapon 矛
            if ch:
                lines[i] = raw.replace("name: '" + F + Q + ",", "name: '" + ch + "',")
    return '\n'.join(lines)

FILES = ['src/lib/enemyPool.ts', 'src/lib/enemyStatBlocks.ts', 'src/lib/traitRegistry.ts']
ok = True
for fn in FILES:
    fixed = open(fn + '.fixed', encoding='utf-8').read()
    out = apply_fixes(fixed)
    remaining = out.count(F)
    # also flag any residual literal CJK-then-? (uncaught corruption)
    cjkq = len(re.findall(r'[^\x00-\x7f]\?', out))
    print(f'{fn}: residual U+FFFD={remaining}  residual <cjk>?={cjkq}')
    if remaining or cjkq:
        ok = False
        for ln, line in enumerate(out.split('\n'), 1):
            if F in line or re.search(r'[^\x00-\x7f]\?', line):
                print(f'    L{ln}: {line.strip()[:90]}')
    if WRITE and ok:
        open(fn, 'w', encoding='utf-8', newline='').write(out)
        print(f'  WROTE {fn}')

print('\nCLEAN' if ok else '\nRESIDUALS REMAIN -- not written')
