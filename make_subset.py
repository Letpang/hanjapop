#!/usr/bin/env python3
import json, subprocess, os, sys

# ── 1. 앱에서 쓰는 한자 추출 ──────────────────────────────────────
with open('frontend/src/hanja_unified.json', 'r') as f:
    data = json.load(f)

hanja_chars = set()
for item in data:
    hanja_chars.add(item['hanja'])
    for w in item.get('words', []):
        for c in w.get('word', ''):
            hanja_chars.add(c)
    for h in item.get('syn', []) + item.get('ant', []):
        hanja_chars.add(h)

hanja_chars = set(c for c in hanja_chars if '一' <= c <= '鿿' or '㐀' <= c <= '䶿')

# ── 2. 유니코드 codepoint 목록 구성 ───────────────────────────────
codepoints = set()

# 한자
for c in hanja_chars:
    codepoints.add(ord(c))

# 완성형 한글 (AC00~D7A3, 가~힣)
for cp in range(0xAC00, 0xD7A4):
    codepoints.add(cp)

# 한글 자모 (ㄱ~ㅣ)
for cp in range(0x3131, 0x3164):
    codepoints.add(cp)

# Basic Latin (영문/숫자/기호)
for cp in range(0x0020, 0x007F):
    codepoints.add(cp)

# Latin-1 Supplement
for cp in range(0x00A0, 0x00FF):
    codepoints.add(cp)

# 자주 쓰는 특수문자/구두점
extras = '。、・「」『』【】〔〕…·×÷±→←↑↓♪♬★☆●○■□▲△▶◀'
for c in extras:
    codepoints.add(ord(c))

unicodes_arg = ','.join(f'U+{cp:04X}' for cp in sorted(codepoints))
print(f'총 유니코드 포인트: {len(codepoints)}')

# ── 3. 서브셋 생성 ─────────────────────────────────────────────────
font_dir = 'genjyuugothic-20150607'
out_dir = 'frontend/public/fonts'
os.makedirs(out_dir, exist_ok=True)

# Regular(400), Medium(500), Bold(700), Heavy(900) 4종
weights = [
    ('GenJyuuGothic-Regular.ttf', 'GenJyuuGothic-Regular.woff2'),
    ('GenJyuuGothic-Medium.ttf',  'GenJyuuGothic-Medium.woff2'),
    ('GenJyuuGothic-Bold.ttf',    'GenJyuuGothic-Bold.woff2'),
    ('GenJyuuGothic-Heavy.ttf',   'GenJyuuGothic-Heavy.woff2'),
]

for src, dst in weights:
    src_path = os.path.join(font_dir, src)
    dst_path = os.path.join(out_dir, dst)
    print(f'생성 중: {dst} ...')
    result = subprocess.run([
        '/Library/Frameworks/Python.framework/Versions/3.13/bin/pyftsubset', src_path,
        f'--unicodes={unicodes_arg}',
        '--output-file=' + dst_path,
        '--flavor=woff2',
        '--layout-features=*',
        '--name-IDs=*',
    ], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'  오류: {result.stderr[:200]}')
    else:
        size = os.path.getsize(dst_path) / 1024
        print(f'  완료: {size:.0f} KB')

print('\n모든 서브셋 생성 완료!')
