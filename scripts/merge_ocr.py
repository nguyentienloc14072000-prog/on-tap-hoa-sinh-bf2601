from pathlib import Path
import json
SITE=Path(__file__).resolve().parents[1]
p=SITE/'tmp/sources/catalog.json'
data=json.loads(p.read_text(encoding='utf-8'))[:9]
for item in data:
    for i,t in enumerate(item['pages']):
        o=SITE/'tmp/scans'/f"{item['id']}-{i+1:03}.txt"
        if not t.strip() and o.exists():
            item['pages'][i]=o.read_text(encoding='utf-8-sig')
    (SITE/'tmp/sources'/f"{item['id']}.txt").write_text('\n\n'.join(f'=== TRANG {i+1} ===\n{t}' for i,t in enumerate(item['pages'])),encoding='utf-8')
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
