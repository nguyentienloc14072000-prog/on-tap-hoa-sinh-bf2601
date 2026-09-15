from pathlib import Path
import json, re, logging
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)
SITE=Path(__file__).resolve().parents[1]
SOURCE=SITE.parent.parent/'An toàn trong kỹ thuật y sinh - ET4551'
OUT=SITE/'tmp'/'safety'
OUT.mkdir(parents=True,exist_ok=True)
catalog=[]
for prefix,folder in [('b','An toàn sinh học'),('r','An toàn bức xạ/Slide'),('e','An toàn điện/Slide')]:
    files=sorted((SOURCE/folder).glob('*.pdf'),key=lambda p:(int(re.match(r'\d+',p.name)[0]) if re.match(r'\d+',p.name) else 0,p.name))
    for n,p in enumerate(files,1):
        sid=f'at-{prefix}{n:02}'
        pages=[page.extract_text() or '' for page in PdfReader(p).pages]
        record={'id':sid,'path':str(p),'relative':p.relative_to(SOURCE).as_posix(),'file':p.name,'pages':len(pages),'bytes':p.stat().st_size,'text':pages}
        catalog.append(record)
        (OUT/f'{sid}.txt').write_text('\n\n'.join(f'--- TRANG PDF {i} ---\n{t}' for i,t in enumerate(pages,1)),encoding='utf-8')
        print(json.dumps({k:v for k,v in record.items() if k not in ('text','path')},ensure_ascii=False), 'chars',sum(map(len,pages)),'blank',[i for i,t in enumerate(pages,1) if len(t.strip())<30])
(OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False),encoding='utf-8')
