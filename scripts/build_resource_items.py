import zipfile, xml.etree.ElementTree as ET, re, sys, os, json
from datetime import datetime, timezone
import jsonschema

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/extracted_playlist_videos.json', 'r', encoding='utf-8') as f:
    all_videos = json.load(f)

with open('data/resource_sources.json', 'r', encoding='utf-8') as f:
    sources_data = json.load(f)

# Compute SHA-256 of resource_sources.json
import hashlib
sources_sha256 = hashlib.sha256(open('data/resource_sources.json', 'rb').read()).hexdigest()

xlsx = 'data/LGS_2027_MASTER_PLAN.xlsx'
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

def colidx(ref):
    letters = re.match(r'([A-Z]+)', ref).group(1)
    n = 0
    for ch in letters: n = n * 26 + ord(ch) - 64
    return n - 1

with zipfile.ZipFile(xlsx) as z:
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rr = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rels = {e.attrib['Id']: e.attrib['Target'] for e in rr}
    paths = {sh.attrib['name']: rels[sh.attrib[f'{{{RNS}}}id']].lstrip('/') for sh in wb.find(f'{{{NS}}}sheets')}
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        sr = ET.fromstring(z.read('xl/sharedStrings.xml'))
        sst = [''.join(t.text or '' for t in si.iter(f'{{{NS}}}t')) for si in sr]
    def cv(c):
        t = c.attrib.get('t')
        v = c.find(f'{{{NS}}}v')
        if v is None:
            ii = c.find(f'{{{NS}}}is')
            return ''.join(tn.text or '' for tn in ii.iter(f'{{{NS}}}t')) if ii is not None else None
        return sst[int(v.text)] if t == 's' else v.text

    def get_sheet_rows(name):
        root = ET.fromstring(z.read('xl/' + paths[name] if not paths[name].startswith('xl/') else paths[name]))
        rows = []
        for row in root.findall(f'.//{{{NS}}}sheetData/{{{NS}}}row'):
            d = {}
            for c in row.findall(f'{{{NS}}}c'):
                d[colidx(c.attrib['r'])] = cv(c)
            rows.append(d)
        if not rows: return []
        max_idx = max(rows[0].keys()) if rows[0] else 0
        hdr = [rows[0].get(i) for i in range(max_idx + 1)]
        return [{hdr[i]: r.get(i) for i in range(len(hdr))} for r in rows[1:]]

    daily_tasks = get_sheet_rows('Gunluk_Gorevler')
    math_roadmap = get_sheet_rows('Matematik_Yol')
    turk_roadmap = get_sheet_rows('Turkce_Yol')
    fen_roadmap = get_sheet_rows('Fen_Yol')
    ink_roadmap = get_sheet_rows('Inkilap_Yol')
    din_roadmap = get_sheet_rows('Din_Yol')
    eng_roadmap = get_sheet_rows('Ingilizce_Yol')

print(f'Total daily rows: {len(daily_tasks)}')
