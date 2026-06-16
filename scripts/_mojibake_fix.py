# -*- coding: utf-8 -*-
"""Stage A (v2, LINE-LEVEL): byte-precise reverse of cp936-misread mojibake.

The corruption is mixed at the STRING-VALUE level, not the char level: a given
line (string literal / comment) is either wholly corrupted or wholly clean.
Char-level reversal can't tell a clean single-char run (尺) from an incomplete
mojibake artifact (锛) -- but a multi-char run is decisive: it reverses to clean
Chinese iff the line is corrupted. So we classify per LINE, then recover (or keep)
all of that line's runs together.

Output *.fixed has ONLY uniform markers:
  U+FFFD  = a content char whose byte was truncated by 0x3F (to fill in Stage B)
  literal ? (0x3F) adjacent = the delimiter (closing quote / space / digit) 0x3F ate

Run:  python scripts/_mojibake_fix.py [--write]
"""
import sys, io, re, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CP1252_REV = {}
for b in range(0x80, 0xA0):
    try:
        CP1252_REV[bytes([b]).decode('cp1252')] = b
    except Exception:
        pass

MOJI_RUN = re.compile(r'[^\x00-\x7f]+')

def char_to_bytes(c):
    if c in CP1252_REV:
        return bytes([CP1252_REV[c]])
    try:
        return c.encode('gbk')
    except Exception:
        try:
            return c.encode('gb18030')
        except Exception:
            return b'\x3f'

def reverse_run(run):
    raw = bytearray()
    for c in run:
        raw += char_to_bytes(c)
    return bytes(raw).decode('utf-8', errors='replace')

def line_is_corrupted(line):
    """True iff some multi-char run reverses to clean leading Chinese, OR the
    line has a non-ASCII char immediately followed by a literal ? (0x3F) -- the
    signature of an eaten byte/quote (catches single-artifact lines like '30 灏?')."""
    if re.search(r'[^\x00-\x7f]\?', line):
        return True
    for m in MOJI_RUN.finditer(line):
        run = m.group(0)
        if len(run) < 2:
            continue
        rec = reverse_run(run)
        if rec and rec[0] != '�':
            fffd = rec.count('�')
            if fffd <= len(rec) * 0.4:  # mostly-clean reversal -> this line was corrupted
                return True
    return False

FILES = ['src/lib/enemyPool.ts', 'src/lib/enemyStatBlocks.ts', 'src/lib/traitRegistry.ts']
WRITE = '--write' in sys.argv

all_losses = []
for fn in FILES:
    src = open(fn, encoding='utf-8').read()
    lines = src.split('\n')
    out_lines = []
    n_corrupt = 0
    for line in lines:
        if line_is_corrupted(line):
            n_corrupt += 1
            out_lines.append(MOJI_RUN.sub(lambda m: reverse_run(m.group(0)), line))
        else:
            out_lines.append(line)
    fixed = '\n'.join(out_lines)
    nfffd = fixed.count('�')
    print(f'{fn}: corrupted_lines={n_corrupt}/{len(lines)}  U+FFFD_markers={nfffd}')
    if WRITE:
        open(fn + '.fixed', 'w', encoding='utf-8', newline='').write(fixed)
    for i, line in enumerate(fixed.split('\n'), 1):
        for col, ch in enumerate(line):
            if ch == '�':
                all_losses.append({'file': fn.split('/')[-1], 'line': i,
                                   'context': line.rstrip('\r')})

# residual non-ascii artifacts that are NOT FFFD and NOT in clean emoji/cjk?
print(f'\nTOTAL U+FFFD: {len(all_losses)}')
open('scripts/_losses.json', 'w', encoding='utf-8').write(json.dumps(all_losses, ensure_ascii=False, indent=1))
