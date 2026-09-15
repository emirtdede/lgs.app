#!/usr/bin/env python3
"""Static integrity audit for the LGS 2027 V3 development package.
Uses only Python standard library so it runs before application dependencies exist.
"""
from __future__ import annotations
from pathlib import Path
import hashlib, json, re, sys, zipfile, xml.etree.ElementTree as ET
from collections import defaultdict

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]; WARN=[]; PASS=[]
def ok(x): PASS.append(x)
def fail(x): FAIL.append(x)
def warn(x): WARN.append(x)
def require(rel):
    p=ROOT/rel
    if not p.exists(): fail(f"missing required file: {rel}")
    return p

required=[
 'AGENTS.md','GEMINI.md','GOAL_PROMPT.md','docs/00_DECISIONS_AND_PRECEDENCE.md',
 'docs/05_DOMAIN_MODEL_AND_INVARIANTS.md','docs/08_EXCEL_IMPORT_SPEC.md','docs/10_TIMER_AND_BENCHMARK_SPEC.md',
 'docs/32_RESOURCE_RESOLUTION_SPEC.md','docs/34_FINAL_PACKAGE_AUDIT.md',
 'data/LGS_2027_MASTER_PLAN.xlsx','data/resource_sources.json','data/calendar_overrides.json',
 'contracts/plan-import.schema.json','contracts/resource-item.schema.json','contracts/calendar-overrides.schema.json',
 'supabase/migrations/0001_initial_schema.sql','supabase/migrations/0002_rls.sql','supabase/migrations/0003_pairing_rpc.sql',
 'supabase/migrations/0004_study_evidence_rpc.sql','supabase/migrations/0005_plan_admin_rpc.sql','supabase/migrations/0006_family_lifecycle_rpc.sql',
 'antigravity/permissions.autonomous-project.json'
]
for r in required: require(r)

# JSON syntax and high-risk settings.
for rel in ['data/resource_sources.json','data/calendar_overrides.json','contracts/plan-import.schema.json','contracts/resource-item.schema.json','contracts/calendar-overrides.schema.json','antigravity/permissions.autonomous-project.json']:
    try: json.loads((ROOT/rel).read_text(encoding='utf-8')); ok(f'valid JSON: {rel}')
    except Exception as e: fail(f'invalid JSON {rel}: {e}')
try:
    cfg=json.loads((ROOT/'antigravity/permissions.autonomous-project.json').read_text())
    if cfg.get('toolPermission')!='proceed-in-sandbox': fail('toolPermission must be proceed-in-sandbox')
    if cfg.get('artifactReviewPolicy')!='always-proceed': fail('artifactReviewPolicy must be always-proceed for unattended project execution')
    if cfg.get('enableTerminalSandbox') is not True: fail('terminal sandbox must be enabled')
    if cfg.get('allowNonWorkspaceAccess') is not False: fail('allowNonWorkspaceAccess must be false')
    allow=cfg.get('permissions',{}).get('allow',[])
    if 'read_url(*)' in allow: fail('unrestricted read_url(*) must not be present in V3')
    for need in ['read_url(npmjs.org)','read_url(github.com)','read_url(supabase.com)','read_url(antigravity.google)','execute_url(localhost)']:
        if need not in allow: fail(f'missing required sandbox allow: {need}')
    ok('Antigravity sandbox/network profile hardened')
except Exception: pass

# Rules/skills/agents shape.
for p in sorted((ROOT/'.agents/rules').glob('*.md')):
    if p.name!='README.md' and len(p.read_text(encoding='utf-8'))>12000: fail(f'rule exceeds 12k chars: {p.name}')
skill_names=set()
for p in sorted((ROOT/'.agents/skills').glob('*/SKILL.md')):
    text=p.read_text(encoding='utf-8'); m=re.match(r'^---\s*\n(.*?)\n---',text,re.S)
    if not m: fail(f'missing skill YAML frontmatter: {p.relative_to(ROOT)}'); continue
    nm=re.search(r'^name:\s*(\S+)\s*$',m.group(1),re.M); ds=re.search(r'^description:\s*(.+)$',m.group(1),re.M)
    if not nm or not ds: fail(f'incomplete skill metadata: {p.relative_to(ROOT)}'); continue
    if nm.group(1) in skill_names: fail(f'duplicate skill name: {nm.group(1)}')
    skill_names.add(nm.group(1))
for p in sorted((ROOT/'.agents/agents').glob('*/agent.md')):
    txt=p.read_text(encoding='utf-8')
    for required_key in ['name:','description:','mainAgent: false','subagent: true','model: flash','commandExecutionPolicy: sandbox']:
        if required_key not in txt: fail(f'custom agent missing/invalid {required_key}: {p.relative_to(ROOT)}')
ok(f'{len(skill_names)} skills and custom agents checked')

# No placeholder ambiguity in canonical text.
for p in ROOT.rglob('*.md'):
    txt=p.read_text(encoding='utf-8',errors='ignore')
    for pat in [r'\bTODO\b',r'\bTBD\b',r'\bFIXME\b',r'choose one implementation']:
        if re.search(pat,txt,re.I): fail(f'ambiguity marker {pat!r}: {p.relative_to(ROOT)}')

# V1/V2 regression guards.
rpc=(ROOT/'supabase/migrations/0004_study_evidence_rpc.sql').read_text()
if "set status='flagged'" in rpc and re.search(r"set status='flagged'.{0,300}raise exception",rpc,re.S|re.I): fail('flagged update followed by exception may roll back')
for needle in ['already_completed','start_reading_session','finish_reading_session',"time '21:50'"]:
    if needle not in rpc: fail(f'missing study evidence behavior: {needle}')
else: ok('study evidence retry/reading/21:50 guards present')
rls=(ROOT/'supabase/migrations/0002_rls.sql').read_text()
if 'grant insert, update on public.mistakes, public.reading_sessions' in rls: fail('direct reading evidence DML still granted')
if 'resource_items_read' not in rls or 'resources.family_id is null or true' in rls: fail('resource family isolation missing/tautological')
else: ok('resource family isolation present')
schema=(ROOT/'supabase/migrations/0001_initial_schema.sql').read_text()
for needle in ['create table public.resource_items','resource_item_id uuid','create type public.task_type','question_session_timer_unique_idx','source_calendar_overrides_sha256','calendar_overrides_sha256']:
    if needle not in schema: fail(f'missing schema hardening: {needle}')
family=(ROOT/'supabase/migrations/0006_family_lifecycle_rpc.sql').read_text()
for needle in ['deferrable initially deferred','create_family_with_owner','transfer_family_ownership','exactly one owner']:
    if needle.lower() not in family.lower(): fail(f'missing family lifecycle invariant: {needle}')
else: ok('exactly-one-owner lifecycle present')

# Calendar override contract.
try:
    cal=json.loads((ROOT/'data/calendar_overrides.json').read_text())
    got={x.get('date'):x.get('availability') for x in cal.get('overrides',[])}
    if got.get('2027-05-17')!='full_day' or got.get('2027-05-18')!='full_day': fail('17–18 May 2027 full-day overrides missing')
    if any(not str(x.get('source','')).startswith('https://') for x in cal.get('overrides',[])): fail('calendar override lacks HTTPS evidence')
    ok('calendar availability overrides checked')
except Exception as e: fail(f'calendar override audit failed: {e}')

# Import contract includes N-011 and 3-hash binding language.
imp=(ROOT/'docs/08_EXCEL_IMPORT_SPEC.md').read_text()
if 'N-011' not in imp or 'calendar-overrides' not in imp.lower(): fail('N-011/calendar hash import contract missing')
plan_schema=(ROOT/'contracts/plan-import.schema.json').read_text()
if 'N-011' not in plan_schema: fail('normalized task schema missing N-011')

# Workbook source structural audit (immutable raw snapshot).
xlsx=ROOT/'data/LGS_2027_MASTER_PLAN.xlsx'
if xlsx.exists():
    NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main'; RNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    def colidx(ref):
        letters=re.match(r'([A-Z]+)',ref).group(1); n=0
        for ch in letters: n=n*26+ord(ch)-64
        return n-1
    try:
        with zipfile.ZipFile(xlsx) as z:
            wb=ET.fromstring(z.read('xl/workbook.xml')); rr=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
            rels={e.attrib['Id']:e.attrib['Target'] for e in rr}; paths={}
            for sh in wb.find(f'{{{NS}}}sheets'):
                target=rels[sh.attrib[f'{{{RNS}}}id']].lstrip('/'); target=target if target.startswith('xl/') else 'xl/'+target; paths[sh.attrib['name']]=target
            if len(paths)!=17: fail(f'workbook sheet count expected 17, got {len(paths)}')
            sst=[]
            if 'xl/sharedStrings.xml' in z.namelist():
                sr=ET.fromstring(z.read('xl/sharedStrings.xml')); sst=[''.join(t.text or '' for t in si.iter(f'{{{NS}}}t')) for si in sr]
            def cv(c):
                t=c.attrib.get('t'); v=c.find(f'{{{NS}}}v')
                if v is None:
                    ii=c.find(f'{{{NS}}}is'); return ''.join(tn.text or '' for tn in ii.iter(f'{{{NS}}}t')) if ii is not None else None
                return sst[int(v.text)] if t=='s' else v.text
            def rows(name):
                root=ET.fromstring(z.read(paths[name])); tmp=[]; maxc=0
                for row in root.findall(f'.//{{{NS}}}sheetData/{{{NS}}}row'):
                    d={}
                    for c in row.findall(f'{{{NS}}}c'):
                        i=colidx(c.attrib['r']); maxc=max(maxc,i); d[i]=cv(c)
                    tmp.append(d)
                return [[d.get(i) for i in range(maxc+1)] for d in tmp]
            gr=rows('Gunluk_Gorevler'); hdr=gr[0]; data=[dict(zip(hdr,r)) for r in gr[1:]]; dates=defaultdict(list)
            for r in data: dates[r['Tarih']].append(r)
            if len(data)!=2491: fail(f'Gunluk_Gorevler expected 2491 rows, got {len(data)}')
            if len(dates)!=256: fail(f'expected 256 dates, got {len(dates)}')
            if min(dates)!='2026-10-01' or max(dates)!='2027-06-13': fail('plan date bounds changed unexpectedly')
            def tm(s):
                if not s: return None
                h,m=map(int,s.split(':')); return h*60+m
            overlaps=[]; after=[]; routine=[]
            for dt,rs in dates.items():
                timed=sorted([r for r in rs if r.get('Başlangıç') and r.get('Bitiş')],key=lambda r:tm(r['Başlangıç']))
                for a,b in zip(timed,timed[1:]):
                    if tm(a['Bitiş'])>tm(b['Başlangıç']): overlaps.append(dt)
                after += [dt for r in timed if tm(r['Bitiş'])>1320]
                mc=sum(r.get('Ders')=='Matematik' and r.get('Görev Türü')=='Günlük Rutin' for r in rs)
                pc=sum(r.get('Ders')=='Türkçe' and r.get('Görev Türü')=='Günlük Rutin' for r in rs)
                if (mc,pc)!=(1,1): routine.append((dt,mc,pc))
            if overlaps: fail(f'workbook time overlaps: {overlaps[:5]}')
            if after: fail(f'workbook tasks ending after 22:00: {after[:5]}')
            if routine: fail(f'daily routine cardinality failures: {routine[:5]}')
            # Raw workbook intentionally still holds after-school placement for these dates; N-011 corrects effective plan.
            for dt in ['2027-05-17','2027-05-18']:
                starts=[r.get('Başlangıç') for r in dates[dt] if r.get('Başlangıç')]
                if not starts or min(starts)!='16:00': warn(f'raw holiday placement changed for {dt}; reevaluate N-011')
            ok('immutable workbook structural invariants checked')
    except Exception as e: fail(f'workbook audit failed: {e}')

# Manifest integrity (manifest intentionally excludes itself).
manifest=ROOT/'PACKAGE_MANIFEST.json'
if manifest.exists():
    try:
        m=json.loads(manifest.read_text(encoding='utf-8')); entries=m.get('files',[])
        listed=set()
        for e in entries:
            rel=e.get('path'); expected=e.get('sha256'); listed.add(rel)
            if not rel or not expected: fail('malformed manifest entry'); continue
            p=ROOT/rel
            if not p.exists(): fail(f'manifest missing file: {rel}'); continue
            got=hashlib.sha256(p.read_bytes()).hexdigest()
            if got!=expected: fail(f'manifest hash mismatch: {rel}')
        actual={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and p.name!='PACKAGE_MANIFEST.json'}
        if listed!=actual:
            missing=sorted(actual-listed); extra=sorted(listed-actual)
            if missing: fail(f'manifest does not list files: {missing[:10]}')
            if extra: fail(f'manifest lists absent files: {extra[:10]}')
        ok('manifest coverage and hashes checked')
    except Exception as e: fail(f'manifest audit failed: {e}')
else: fail('PACKAGE_MANIFEST.json missing')

print(f'PASS={len(PASS)} WARN={len(WARN)} FAIL={len(FAIL)}')
for x in PASS: print('[PASS]',x)
for x in WARN: print('[WARN]',x)
for x in FAIL: print('[FAIL]',x)
sys.exit(1 if FAIL else 0)
