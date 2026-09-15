// Per-course progress; the legacy BF2601 snapshot is migrated without losing answers.
(function(root) {
  'use strict';
  function validSession(s, questionMap) {
    if (!s || typeof s.title!=='string' || !['practice','exam'].includes(s.mode) || !['active','complete'].includes(s.status) || !Array.isArray(s.items) || !s.items.length || s.items.length>Object.keys(questionMap).length) return false;
    const ids=s.items.map(x=>x?.id);
    return new Set(ids).size===ids.length && s.items.every(x=>x && Object.hasOwn(questionMap,x.id) && Array.isArray(x.order) && x.order.length===4 && [0,1,2,3].every(n=>x.order.includes(n))) && Number.isInteger(s.index) && s.index>=0 && s.index<s.items.length && s.answers && !Array.isArray(s.answers) && typeof s.answers==='object' && Object.entries(s.answers).every(([id,x])=>ids.includes(id) && Number.isInteger(x) && x>=0 && x<4) && Array.isArray(s.checked) && new Set(s.checked).size===s.checked.length && s.checked.every(id=>ids.includes(id) && Number.isInteger(s.answers[id]));
  }
  function restore(saved, course, questionMap) {
    const result={version:course.version,progress:{},session:null};
    if(!saved || ![course.version,...(course.legacyVersions||[])].includes(saved.version))return result;
    for(const [id,p] of Object.entries(saved.progress||{})) {
      if(Object.hasOwn(questionMap,id) && p && Number.isInteger(p.attempts) && p.attempts>0 && typeof p.lastCorrect==='boolean')result.progress[id]={attempts:p.attempts,lastCorrect:p.lastCorrect};
    }
    if(validSession(saved.session,questionMap))result.session=saved.session;
    return result;
  }
  const api={restore,validSession};
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.StudyState=api;
})(typeof window==='object'?window:globalThis);
