"""Validate source-linked content and build the two-course static site."""
from pathlib import Path
import hashlib, json, logging, shutil
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)
SITE = Path(__file__).resolve().parents[1]
DIST = SITE / 'dist'

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False).encode()).hexdigest()[:12]

courses = json.loads((SITE / 'content/courses.json').read_text(encoding='utf-8'))
all_ids, modules = set(), []
for course in courses:
    course_modules = []
    for entry in course.pop('files'):
        sid = entry['id']
        source = SITE / course['localSourceRoot'] / entry['relative']
        bundled = DIST / 'sources' / f'{sid}.pdf'
        if not source.exists():
            source = bundled
        m = json.loads((SITE / 'content' / f'{sid}.json').read_text(encoding='utf-8'))
        assert m['id'] == sid
        m['courseId'] = course['id']
        m['source'] = {'file':entry['relative'].split('/')[-1], 'url':f'sources/{sid}.pdf',
                       'pages':len(PdfReader(source).pages), 'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
        assert m['sections'] and m['questions']
        for section in m['sections']:
            assert 1 <= section['from'] <= section['to'] <= m['source']['pages'], sid
        for q in m['questions']:
            assert q['id'] not in all_ids, q['id']
            all_ids.add(q['id'])
            assert 1 <= q['page'] <= m['source']['pages'], q['id']
            assert len(q['options']) == len(set(q['options'])) == 4, q['id']
            assert 0 <= q['answer'] < 4 and q['explanation'] and q['prompt'], q['id']
        bundled.parent.mkdir(parents=True, exist_ok=True)
        if source.resolve() != bundled.resolve():
            shutil.copyfile(source, bundled)
        (DIST / 'data').mkdir(exist_ok=True)
        (DIST / 'data' / f'{sid}.json').write_text(json.dumps(m, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        md = [f"# {m['title']}", f"Môn: {course['title']} · {course['code']}",
              f"Nguồn duy nhất: {course['sourceFolder']}/{entry['relative']}",
              f"Số trang PDF: {m['source']['pages']}. Trang nguồn tính từ trang đầu PDF, không theo số in trên slide."]
        for section in m['sections']:
            md.extend([f"\n## {section['title']} (trang {section['from']}–{section['to']})"] + ['- '+t for t in section['points']])
        md.append('\n## Trắc nghiệm\n')
        for n, q in enumerate(m['questions'], 1):
            md.extend([f"### {n}. {q['prompt']}"] + [f"{chr(65+j)}. {o}" for j, o in enumerate(q['options'])] +
                      [f"\nĐáp án: {chr(65+q['answer'])}. {q['explanation']} Nguồn: trang PDF {q['page']}.\n"])
        (SITE / 'noi-dung-theo-file').mkdir(exist_ok=True)
        (SITE / 'noi-dung-theo-file' / f'{sid}.md').write_text('\n\n'.join(md).rstrip()+'\n', encoding='utf-8')
        course_modules.append(m)
    course.pop('localSourceRoot')
    course['moduleIds'] = [m['id'] for m in course_modules]
    course['version'] = digest(course_modules)
    modules.extend(course_modules)
    print(json.dumps({'course':course['code'],'files':len(course_modules), 'pages':sum(m['source']['pages'] for m in course_modules),
                      'questions':sum(len(m['questions']) for m in course_modules), 'version':course['version']}, ensure_ascii=False))
payload = {'title':'Ôn tập kỹ thuật y sinh', 'courses':courses, 'modules':modules}
payload['version'] = digest(payload)
(DIST / 'data.js').write_text('window.STUDY_DATA = '+json.dumps(payload, ensure_ascii=False)+';\n', encoding='utf-8')
print(f'Total: {len(modules)} PDFs, {len(all_ids)} questions')
