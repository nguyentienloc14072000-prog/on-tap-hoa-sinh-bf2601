from pathlib import Path
import hashlib, json, logging, shutil
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)
SITE=Path(__file__).resolve().parents[1]
ROOT=SITE.parent
DIST=SITE/'dist'
sources=sorted((ROOT/'Slide 2024').glob('*.pdf'))
if sources:
    source_entries=[(p,p.name) for p in sources]
else:
    source_entries=[(DIST/'sources'/f's{i:02}.pdf',json.loads((DIST/'data'/f's{i:02}.json').read_text(encoding='utf-8'))['source']['file']) for i in range(1,10)]
sources=[p for p,_ in source_entries]
assert len(sources)==9
modules=[]
all_ids=set()
for i,(source,source_name) in enumerate(source_entries,1):
    sid=f's{i:02}'
    m=json.loads((SITE/'content'/f'{sid}.json').read_text(encoding='utf-8'))
    m['source']={'file':source_name,'url':f'sources/{sid}.pdf','pages':len(PdfReader(source).pages),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
    for s in m['sections']:
        assert 1<=s['from']<=s['to']<=m['source']['pages']
    for q in m['questions']:
        assert q['id'] not in all_ids
        all_ids.add(q['id'])
        assert 1<=q['page']<=m['source']['pages']
        assert len(q['options'])==len(set(q['options']))==4
        assert 0<=q['answer']<4 and q['explanation'] and q['prompt']
    (DIST/'sources').mkdir(parents=True,exist_ok=True)
    if source.resolve()!=(DIST/m['source']['url']).resolve():
        shutil.copyfile(source,DIST/m['source']['url'])
    (DIST/'data').mkdir(parents=True,exist_ok=True)
    (DIST/'data'/f'{sid}.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
    md=[f"# {m['title']}",f"Nguồn duy nhất: Slide 2024/{source_name}",f"Số trang PDF: {m['source']['pages']}. Số trang dưới đây tính từ trang đầu PDF, không theo số in trên slide."]
    for s in m['sections']:
        md.extend([f"\n## {s['title']} (trang {s['from']}–{s['to']})"]+['- '+t for t in s['points']])
    md.append('\n## Trắc nghiệm\n')
    for n,q in enumerate(m['questions'],1):
        md.extend([f"### {n}. {q['prompt']}"]+[f"{chr(65+j)}. {o}" for j,o in enumerate(q['options'])]+[f"\nĐáp án: {chr(65+q['answer'])}. {q['explanation']} Nguồn: trang PDF {q['page']}.\n"])
    (SITE/'noi-dung-theo-file').mkdir(exist_ok=True)
    (SITE/'noi-dung-theo-file'/f'{sid}.md').write_text('\n\n'.join(md),encoding='utf-8')
    modules.append(m)
payload={'title':'Hóa sinh y sinh','course':'BF2601','sourceFolder':'Slide 2024','modules':modules}
raw=json.dumps(payload,ensure_ascii=False)
payload['version']=hashlib.sha256(raw.encode()).hexdigest()[:12]
(DIST/'data.js').write_text('window.STUDY_DATA = '+json.dumps(payload,ensure_ascii=False)+';\n',encoding='utf-8')
print(json.dumps({'files':len(modules),'pages':sum(m['source']['pages'] for m in modules),'questions':len(all_ids),'version':payload['version'],'pdf_bytes':sum(p.stat().st_size for p in (DIST/'sources').glob('*.pdf'))},ensure_ascii=False))
