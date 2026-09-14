from pathlib import Path
import json
import pypdfium2 as pdfium
ROOT = Path(__file__).resolve().parents[2]
SITE = Path(__file__).resolve().parents[1]
OUT = SITE/'tmp'/'scans'
OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads((SITE/'tmp/sources/catalog.json').read_text(encoding='utf-8'))[:9]
for item in catalog:
    doc=pdfium.PdfDocument(ROOT/item['file'])
    for i,text in enumerate(item['pages']):
        if item['id'] in ['s01','s02','s03','s04','s05'] or len(text.strip())<45:
            path=OUT/f"{item['id']}-{i+1:03}.png"
            if not path.exists():
                page=doc[i]
                bitmap=page.render(scale=1.65)
                bitmap.to_pil().convert('RGB').save(path)
                bitmap.close()
                page.close()
    print(item['id'],flush=True)
    doc.close()
