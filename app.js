(() => {
  'use strict';
  const data = window.STUDY_DATA;
  const app = document.getElementById('app');
  if (!data?.modules?.length) {
    app.innerHTML = '<h1>Chưa mở được nội dung</h1><p>Hãy tải lại trang để thử lại.</p><button class="button" onclick="location.reload()">Tải lại</button>';
    app.removeAttribute('aria-busy');
    return;
  }
  const modules = data.modules;
  const moduleMap = Object.fromEntries(modules.map(m => [m.id, m]));
  const questions = modules.flatMap(m => m.questions.map(q => ({...q, moduleId:m.id})));
  const questionMap = Object.fromEntries(questions.map(q => [q.id, q]));
  const key = 'bf2601-review-v1';
  const setup = document.getElementById('setup-dialog');
  const finishDialog = document.getElementById('finish-dialog');
  let store = {version:data.version, progress:{}, session:null};
  let reviewOnlyWrong = false;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceLink = (mid, page, label) => `<a class="source-link" href="${moduleMap[mid].source.url}#page=${page}" target="_blank" rel="noopener">${esc(label || `Trang PDF ${page}`)} <span aria-hidden="true">↗</span></a>`;
  function storageNotice() {
    const n=document.getElementById('storage-notice');
    n.hidden=false; n.textContent='Trình duyệt không cho lưu tiến độ. Bạn vẫn làm bài được trong lần mở này.';
  }
  function save() { try {localStorage.setItem(key, JSON.stringify(store));} catch {storageNotice();} }
  function validSession(s) {
    return s && ['practice','exam'].includes(s.mode) && ['active','complete'].includes(s.status) && Array.isArray(s.items) && s.items.length>0 && s.items.length<=questions.length && new Set(s.items.map(x=>x.id)).size===s.items.length && s.items.every(x=>questionMap[x.id] && Array.isArray(x.order) && x.order.length===4 && [0,1,2,3].every(n=>x.order.includes(n))) && Number.isInteger(s.index) && s.index>=0 && s.index<s.items.length && s.answers && typeof s.answers==='object' && Object.values(s.answers).every(x=>Number.isInteger(x) && x>=0 && x<4) && Array.isArray(s.checked) && s.checked.every(id=>s.items.some(x=>x.id===id) && Number.isInteger(s.answers[id]));
  }
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if (saved?.version===data.version) {
      const progress={};
      for (const [id,p] of Object.entries(saved.progress||{})) if(questionMap[id] && Number.isInteger(p.attempts) && p.attempts>0 && typeof p.lastCorrect==='boolean') progress[id]=p;
      store={version:data.version,progress,session:validSession(saved.session)?saved.session:null};
    }
  } catch { /* Unreadable saved state is ignored; the lesson remains usable. */ }
  function shuffle(items) {
    const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
  }
  function stats(m) {
    const done=m.questions.filter(q=>store.progress[q.id]);
    return {done:done.length,wrong:done.filter(q=>!store.progress[q.id].lastCorrect).length};
  }
  function titleForScope(scope) {
    return scope==='all'?'Tất cả tài liệu':scope==='enzym'?'Enzym · cả 4 phần':moduleMap[scope]?.title||'Ôn lại câu sai';
  }
  function poolFor(scope) {
    return scope==='all'?questions:scope==='enzym'?questions.filter(q=>moduleMap[q.moduleId].group==='Enzym học lâm sàng'):questions.filter(q=>q.moduleId===scope);
  }
  function moveTo(hash) {if(location.hash===hash) render();else location.hash=hash;}
  function home() {
    const attempted=Object.keys(store.progress).length;
    const wrong=Object.entries(store.progress).filter(([,p])=>!p.lastCorrect).map(([id])=>id);
    const session=store.session;
    app.innerHTML=`<div class="heading"><div><p class="eyebrow">TỦ TÀI LIỆU</p><h1>Hôm nay bạn ôn phần nào?</h1><p class="subtle">Đọc lại kiến thức, làm trắc nghiệm và đối chiếu với slide gốc.</p></div><button class="button primary" data-action="setup" data-scope="all">Ôn tổng hợp <span aria-hidden="true">→</span></button></div>
      <div class="overview"><div><strong>${modules.length}</strong> tài liệu</div><div><strong>${modules.reduce((n,m)=>n+m.source.pages,0)}</strong> trang PDF</div><div><strong>${questions.length}</strong> câu trắc nghiệm</div><div class="personal"><strong>${attempted}/${questions.length}</strong> câu đã luyện</div></div>
      ${session?.status==='active'?`<div class="resume"><div><strong>Bài ôn đang làm</strong><span>${esc(session.title)} · ${Object.keys(session.answers).length}/${session.items.length} câu đã chọn</span></div><button class="button primary" data-action="resume">Tiếp tục làm bài</button></div>`:''}
      ${wrong.length?`<div class="wrong-strip"><span><strong>${wrong.length} câu</strong> cần ôn lại trên trình duyệt này</span><button class="button" data-action="all-wrong">Luyện câu sai</button></div>`:''}
      <div class="library">${[...new Set(modules.map(m=>m.group))].map((g,gi)=>`<section class="module-group" aria-labelledby="group-${gi}"><div class="group-title"><h2 id="group-${gi}">${esc(g)}</h2>${gi===0?'<button class="text-button" data-action="setup" data-scope="enzym">Ôn cả 4 phần →</button>':''}</div><div class="chapter-grid">${modules.filter(m=>m.group===g).map(m=>{const st=stats(m);return `<article class="chapter-card"><div class="card-meta"><span class="file-tag">PDF ${m.id.slice(1)}</span><span>${m.source.pages} trang · ${m.questions.length} câu</span></div><h3><a href="#study/${m.id}">${esc(m.title)}</a></h3><p>${esc(m.description)}</p><div class="mini-progress"><span style="width:${st.done/m.questions.length*100}%"></span></div><div class="card-progress">${st.done?`${st.done}/${m.questions.length} câu đã luyện${st.wrong?` · ${st.wrong} câu cần ôn`:''}`:'Chưa luyện tập'}</div><div class="card-footer"><a class="button" href="#study/${m.id}">Đọc bài</a><button class="button primary" data-action="setup" data-scope="${m.id}" aria-label="Làm quiz ${esc(m.title)}">Làm quiz</button></div></article>`}).join('')}</div></section>`).join('')}</div>
      <details class="about-source"><summary>Phạm vi tài liệu và cách ôn</summary><p>Nội dung được biên soạn từ 9 PDF trong thư mục Slide 2024. Không bổ sung kiến thức từ Internet, thí nghiệm, tiểu luận hay đề thi.</p><p>Mỗi tài liệu có ghi nhớ ngắn, quiz và PDF gốc đầy đủ. Quiz chọn các ý rõ ràng trong bài; phần ghi nhớ không thay thế toàn bộ slide. Số trang dẫn nguồn là vị trí trang trong PDF, có thể khác số in trên slide.</p><p>Mỗi câu chỉ chọn một đáp án. Câu hỏi và thứ tự đáp án được trộn khi bắt đầu lượt mới. Tiến độ thuộc trình duyệt này, không đồng bộ giữa những người dùng.</p></details>`;
  }
  function study(id) {
    const m=moduleMap[id]; if(!m){moveTo('#home');return;}
    app.innerHTML=`<a class="back-link" href="#home">← Tủ tài liệu</a><div class="heading study-heading"><div><p class="eyebrow">${esc(m.group)}</p><h1>${esc(m.title)}</h1><p class="subtle">${m.source.pages} trang PDF · ${m.questions.length} câu hỏi</p></div><button class="button primary" data-action="setup" data-scope="${id}">Làm quiz phần này</button></div><div class="study-layout"><aside class="study-nav"><label for="lesson-picker">Tài liệu đang ôn</label><select id="lesson-picker">${modules.map(x=>`<option value="${x.id}" ${x.id===id?'selected':''}>${esc(x.title)}</option>`).join('')}</select><p class="eyebrow">NỘI DUNG CẦN NHỚ</p><ol>${m.sections.map((s,i)=>`<li><button class="text-button" data-action="section" data-section="note-${i}">${esc(s.title)}</button></li>`).join('')}</ol><div class="original-file"><strong>PDF gốc</strong><p>${esc(m.source.file)}</p>${sourceLink(id,1,'Mở toàn bộ tài liệu')}<a class="download" href="${m.source.url}" download="${esc(m.source.file)}">Tải PDF</a></div></aside><div class="notes">${m.sections.map((s,i)=>`<section class="note-panel" id="note-${i}" tabindex="-1"><div class="note-title"><span class="number">${String(i+1).padStart(2,'0')}</span><h2>${esc(s.title)}</h2></div><ul>${s.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>${sourceLink(id,s.from,`Nguồn: trang PDF ${s.from}${s.to===s.from?'':'–'+s.to}`)}</section>`).join('')}<div class="study-end"><p>Thử nhớ lại trước khi xem đáp án.</p><button class="button primary" data-action="setup" data-scope="${id}">Bắt đầu trắc nghiệm</button></div></div></div>`;
    document.getElementById('lesson-picker').onchange=e=>moveTo('#study/'+e.target.value);
  }
  function openSetup(scope='all') {
    if(!['all','enzym',...modules.map(m=>m.id)].includes(scope))throw new Error('Phạm vi không hợp lệ.');
    setup.innerHTML=`<form id="setup-form"><div class="dialog-top"><h2 id="setup-title">Chuẩn bị bài ôn</h2><button type="button" class="close-button" data-action="close-setup" aria-label="Đóng">×</button></div><label for="scope">Phạm vi ôn tập</label><select id="scope" name="scope"><option value="all">Tất cả tài liệu</option><option value="enzym">Enzym · cả 4 phần</option>${modules.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('')}</select><p id="pool-count" class="subtle small"></p><fieldset><legend>Cách làm bài</legend><label class="mode-option"><input type="radio" name="mode" value="practice" checked><span><strong>Luyện tập</strong><small>Xem đáp án và giải thích sau mỗi câu.</small></span></label><label class="mode-option"><input type="radio" name="mode" value="exam"><span><strong>Tự kiểm tra</strong><small>Chấm điểm và xem giải thích khi nộp bài.</small></span></label></fieldset><label for="count">Số câu mỗi lượt</label><select id="count" name="count"></select><p class="small subtle">Câu hỏi và các lựa chọn được trộn lại mỗi lượt.</p>${store.session?.status==='active'?'<p class="small">Bắt đầu lượt mới sẽ thay bài đang làm. Kết quả các câu đã chấm vẫn được giữ.</p>':''}<div class="dialog-actions"><button type="button" class="button" data-action="close-setup">Để sau</button><button class="button primary" type="submit">Bắt đầu làm bài</button></div></form>`;
    const picker=setup.querySelector('#scope');picker.value=scope;
    const update=()=>{const n=poolFor(picker.value).length;setup.querySelector('#pool-count').textContent=`Có ${n} câu hỏi trong phạm vi này.`;setup.querySelector('#count').innerHTML=[10,20,30].filter(x=>x<n).map(x=>`<option value="${x}">${x} câu</option>`).join('')+`<option value="${n}">Tất cả · ${n} câu</option>`;};
    picker.onchange=update;update();
    setup.querySelector('form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);startQuiz(poolFor(fd.get('scope')).map(q=>q.id),Number(fd.get('count')),fd.get('mode'),titleForScope(fd.get('scope')));setup.close();};
    setup.showModal();
  }
  function startQuiz(ids,count,mode,title) {
    if(!Array.isArray(ids)||!ids.length||ids.some(id=>!questionMap[id])||!Number.isInteger(count)||count<1||!['practice','exam'].includes(mode))throw new Error('Thiết lập bài ôn không hợp lệ.');
    store.session={title,mode,status:'active',index:0,items:shuffle([...new Set(ids)]).slice(0,count).map(id=>({id,order:shuffle([0,1,2,3])})),answers:{},checked:[]};
    save();moveTo('#quiz');
  }
  function isCorrect(s,id) {return s.answers[id]===questionMap[id].answer;}
  function record(id,correct) {
    const old=store.progress[id];store.progress[id]={attempts:(old?.attempts||0)+1,lastCorrect:correct};
  }
  function quiz() {
    const s=store.session;if(!s){moveTo('#home');return;}if(s.status==='complete'){results();return;}
    const item=s.items[s.index],q=questionMap[item.id],m=moduleMap[q.moduleId],checked=s.checked.includes(q.id),selected=s.answers[q.id];
    const answered=Object.keys(s.answers).length;
    app.innerHTML=`<div class="quiz-top"><a class="back-link" href="#home">← Tủ tài liệu</a><span class="pill">${s.mode==='practice'?'Luyện tập':'Tự kiểm tra'}</span></div><div class="quiz-layout"><div class="quiz-content"><p class="quiz-scope">${esc(s.title)}</p><div class="question-progress"><strong>Câu ${s.index+1}<span class="subtle"> / ${s.items.length}</span></strong><span>${answered} câu đã chọn</span></div><progress value="${answered}" max="${s.items.length}" aria-label="Số câu đã chọn">${answered}/${s.items.length}</progress><section class="question-panel"><p class="question-source">${esc(m.title)}</p><h1 class="question-title" id="question-title" tabindex="-1">${esc(q.prompt)}</h1><fieldset class="answers"><legend class="sr-only">Chọn một đáp án</legend>${item.order.map((oi,displayIndex)=>{const correct=checked&&oi===q.answer;const wrong=checked&&oi===selected&&!isCorrect(s,q.id);return `<label class="answer ${selected===oi?'selected':''} ${correct?'correct':''} ${wrong?'incorrect':''}"><input type="radio" name="answer" value="${oi}" ${selected===oi?'checked':''} ${checked?'disabled':''}><span class="answer-letter">${String.fromCharCode(65+displayIndex)}</span><span class="answer-text">${esc(q.options[oi])}${correct?'<strong class="answer-state">Đáp án đúng</strong>':wrong?'<strong class="answer-state">Bạn đã chọn</strong>':''}</span></label>`}).join('')}</fieldset><div id="feedback" aria-live="polite">${checked?feedback(q,isCorrect(s,q.id)):''}</div><div class="question-actions">${s.mode==='practice'&&!checked?`<button class="button primary" id="check-answer" data-action="check" ${selected===undefined?'disabled':''}>Kiểm tra đáp án</button>`:`<span class="small subtle">${s.mode==='exam'?'Bạn có thể đổi lựa chọn trước khi nộp bài.':'Đã lưu câu trả lời.'}</span>`}</div></section><div class="quiz-bottom"><button class="button" data-action="previous" ${s.index===0?'disabled':''}>← Câu trước</button>${s.index<s.items.length-1?`<button class="button primary" data-action="next">${selected===undefined?'Bỏ qua, câu tiếp':'Câu tiếp theo'} →</button>`:'<button class="button primary" data-action="finish">Nộp bài & xem kết quả</button>'}</div></div><aside class="question-nav"><h2>Các câu trong lượt ôn</h2><div class="question-dots">${s.items.map((it,i)=>{const done=s.checked.includes(it.id),chosen=s.answers[it.id]!==undefined;const state=done?(isCorrect(s,it.id)?'correct':'incorrect'):chosen?'chosen':'';return `<button class="question-dot ${i===s.index?'current':''} ${state}" data-action="jump" data-index="${i}" ${i===s.index?'aria-current="step"':''} aria-label="Câu ${i+1}${done?(isCorrect(s,it.id)?', đúng':', sai'):chosen?', đã chọn':', chưa chọn'}">${i+1}</button>`}).join('')}</div><p class="small subtle">Có thể quay lại các câu đã bỏ qua.</p><button class="button finish-button" data-action="finish">Nộp bài</button><p class="save-note">Tự lưu trên trình duyệt này.</p></aside></div>`;
    app.querySelectorAll('input[name="answer"]').forEach(input=>input.onchange=()=>{
      if(s.checked.includes(q.id))return;
      s.answers[q.id]=Number(input.value);save();quiz();
      app.querySelector(`input[name="answer"][value="${input.value}"]`)?.focus({preventScroll:true});
    });
  }
  function feedback(q,correct) {return `<div class="feedback ${correct?'good':'bad'}"><strong>${correct?'Chính xác.':'Chưa đúng. Đáp án: '+esc(q.options[q.answer])}</strong><p>${esc(q.explanation)}</p>${sourceLink(q.moduleId,q.page,`Đối chiếu trang PDF ${q.page}`)}</div>`;}
  function checkAnswer() {
    const s=store.session;if(!s||s.status!=='active'||s.mode!=='practice')return;
    const id=s.items[s.index].id;if(s.answers[id]===undefined||s.checked.includes(id))return;
    s.checked.push(id);record(id,isCorrect(s,id));save();quiz();
    app.querySelector('#feedback')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function requestFinish() {
    const s=store.session;if(!s||s.status!=='active')return;
    const unanswered=s.items.filter(x=>s.answers[x.id]===undefined).length;
    finishDialog.innerHTML=`<div class="dialog-top"><h2 id="finish-title">Nộp bài ôn này?</h2></div><p>${unanswered?`Còn ${unanswered} câu chưa chọn đáp án. Các câu này sẽ được tính là chưa đúng và có thể ôn lại sau.`:'Bạn đã chọn đáp án cho tất cả các câu.'}</p><div class="dialog-actions"><button class="button" data-action="cancel-finish">Tiếp tục làm</button><button class="button primary" data-action="confirm-finish">Nộp bài</button></div>`;finishDialog.showModal();
  }
  function complete() {
    const s=store.session;if(!s||s.status!=='active')return;
    for(const it of s.items) if(!s.checked.includes(it.id))record(it.id,isCorrect(s,it.id));
    s.status='complete';save();finishDialog.close();reviewOnlyWrong=false;results();focusMain();
  }
  function results() {
    const s=store.session;if(!s)return;
    const correct=s.items.filter(it=>isCorrect(s,it.id)).length;
    const wrong=s.items.filter(it=>!isCorrect(s,it.id));
    const unanswered=s.items.filter(it=>s.answers[it.id]===undefined).length;
    const shown=reviewOnlyWrong?wrong:s.items;
    app.innerHTML=`<a class="back-link" href="#home">← Tủ tài liệu</a><div class="result-header"><div><p class="eyebrow">KẾT QUẢ BÀI ÔN</p><h1>${correct===s.items.length?'Bạn đã trả lời đúng tất cả!':'Thêm một lượt ôn hoàn thành.'}</h1><p class="subtle">${esc(s.title)}</p></div><div class="score"><strong>${correct}<span>/${s.items.length}</span></strong><span>câu đúng · ${Math.round(correct/s.items.length*100)}%</span></div></div><div class="result-actions"><button class="button primary" data-action="retry-wrong" ${wrong.length?'':'disabled'}>Làm lại ${wrong.length} câu chưa đúng</button><button class="button" data-action="retry-all">Làm lại lượt này</button><a class="button" href="#home">Chọn tài liệu khác</a></div><p class="subtle small">${correct} đúng · ${wrong.length-unanswered} sai · ${unanswered} chưa trả lời. Câu chưa trả lời được tính vào số câu chưa đúng.</p><div class="review-heading"><h2>Xem lại và đối chiếu</h2><label class="review-toggle"><input type="checkbox" id="wrong-only" ${reviewOnlyWrong?'checked':''}> Chỉ câu chưa đúng</label></div><div class="review-list">${shown.length?shown.map(it=>{const q=questionMap[it.id],ok=isCorrect(s,it.id),ans=s.answers[it.id];return `<article class="review-item"><div class="review-item-title"><span class="result-mark ${ok?'good':'bad'}">${ok?'Đúng':ans===undefined?'Chưa trả lời':'Sai'}</span><span class="small subtle">Câu ${s.items.indexOf(it)+1} · ${esc(moduleMap[q.moduleId].group)}</span></div><h3>${esc(q.prompt)}</h3>${!ok?`<p class="your-answer">Bạn chọn: ${ans===undefined?'Chưa chọn':esc(q.options[ans])}</p>`:''}<p class="correct-answer">Đáp án: ${esc(q.options[q.answer])}</p><p>${esc(q.explanation)}</p>${sourceLink(q.moduleId,q.page,`${moduleMap[q.moduleId].source.file} · trang ${q.page}`)}</article>`}).join(''):'<div class="empty-state">Không có câu chưa đúng trong lượt này.</div>'}</div>`;
    document.getElementById('wrong-only').onchange=e=>{reviewOnlyWrong=e.target.checked;results();document.getElementById('wrong-only').focus({preventScroll:true});};
  }
  function focusMain(){document.getElementById('main').focus({preventScroll:true});window.scrollTo({top:0});}
  function jump(index){const s=store.session;if(!s||s.status!=='active'||!Number.isInteger(index)||index<0||index>=s.items.length)return;s.index=index;save();quiz();document.getElementById('question-title')?.focus({preventScroll:true});window.scrollTo({top:0});}
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
    const s=store.session;
    switch(b.dataset.action){
      case 'setup':openSetup(b.dataset.scope);break;
      case 'close-setup':setup.close();break;
      case 'resume':moveTo('#quiz');break;
      case 'check':checkAnswer();break;
      case 'next':jump(s.index+1);break;
      case 'previous':jump(s.index-1);break;
      case 'jump':jump(Number(b.dataset.index));break;
      case 'finish':requestFinish();break;
      case 'cancel-finish':finishDialog.close();break;
      case 'confirm-finish':complete();break;
      case 'retry-wrong':{const ids=s.items.filter(it=>!isCorrect(s,it.id)).map(x=>x.id);if(ids.length)startQuiz(ids,ids.length,'practice','Ôn lại câu chưa đúng');break;}
      case 'retry-all':startQuiz(s.items.map(x=>x.id),s.items.length,s.mode,s.title);break;
      case 'all-wrong':{const ids=Object.entries(store.progress).filter(([,p])=>!p.lastCorrect).map(([id])=>id);if(ids.length){openSetup('all');const form=setup.querySelector('form');form.querySelector('#scope').closest('select').disabled=true;form.querySelector('#pool-count').textContent=`Ôn lại ${ids.length} câu chưa đúng đã lưu trên trình duyệt này.`;form.querySelector('#count').innerHTML=`<option value="${ids.length}">Tất cả · ${ids.length} câu cần ôn</option>`;form.onsubmit=e=>{e.preventDefault();startQuiz(ids,ids.length,new FormData(form).get('mode'),'Ôn lại câu chưa đúng');setup.close();};}break;}
      case 'section':{const el=document.getElementById(b.dataset.section);el?.scrollIntoView({behavior:'smooth',block:'start'});el?.focus({preventScroll:true});break;}
    }
  });
  function render(){const route=location.hash||'#home';if(route.startsWith('#study/'))study(route.slice(7));else if(route==='#quiz')quiz();else home();app.removeAttribute('aria-busy');}
  addEventListener('hashchange',()=>{render();focusMain();});
  render();
  // Expose the same user-visible setup action when WebMCP is available.
  const context=document.modelContext;
  if(context?.registerTool){
    const lifecycle=new AbortController();
    const tools=[
      {name:'list_study_materials',title:'Liệt kê tài liệu ôn tập',description:'Read the available Slide 2024 materials and question counts.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>modules.map(m=>({id:m.id,title:m.title,pages:m.source.pages,questions:m.questions.length}))},
      {name:'open_quiz_setup',title:'Mở thiết lập bài ôn',description:'Open the visible quiz setup dialog for a material, all materials, or the four enzyme files. This does not start or submit a quiz.',inputSchema:{type:'object',properties:{scope:{type:'string',enum:['all','enzym',...modules.map(m=>m.id)]}},required:['scope'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||typeof input.scope!=='string'||!['all','enzym',...modules.map(m=>m.id)].includes(input.scope))throw new Error('Phạm vi không hợp lệ.');if(finishDialog.open)throw new Error('Hãy hoàn tất hộp thoại nộp bài trước.');if(setup.open)setup.close();openSetup(input.scope);return{status:'setup_open',scope:input.scope,availableQuestions:poolFor(input.scope).length};}}
    ];
    for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
    addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
