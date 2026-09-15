const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {restore}=require('../dist/state.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/data.js'),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.STUDY_DATA));
const [bf,et]=data.courses;
const map=c=>Object.fromEntries(data.modules.filter(m=>m.courseId===c.id).flatMap(m=>m.questions).map(q=>[q.id,q]));
const bfMap=map(bf),etMap=map(et),bfIds=Object.keys(bfMap),etIds=Object.keys(etMap);
const legacy={version:'9c6458474827',progress:{[bfIds[0]]:{attempts:3,lastCorrect:false}},session:{title:'Enzym · cả 4 phần',mode:'practice',status:'active',items:bfIds.slice(0,3).map(id=>({id,order:[2,0,3,1]})),index:1,answers:{[bfIds[0]]:2,[bfIds[1]]:1},checked:[bfIds[0]]}};
test('upgrading preserves legacy BF attempts, checked answer, position and shuffled order',()=>{
  const actual=restore(legacy,bf,bfMap);
  assert.equal(actual.version,bf.version);
  assert.deepEqual(actual.progress,legacy.progress);
  assert.deepEqual(actual.session,legacy.session);
  assert.deepEqual(restore(actual,bf,bfMap),actual);
});
test('course stores never import each other’s answers or sessions',()=>{
  const etStore=restore(legacy,et,etMap);
  assert.deepEqual(etStore.progress,{});assert.equal(etStore.session,null);
  etStore.progress[etIds[0]]={attempts:1,lastCorrect:true};
  assert.deepEqual(restore(etStore,et,etMap).progress,etStore.progress);
  assert.deepEqual(restore(etStore,bf,bfMap).progress,{});
  const contaminated=structuredClone(legacy);contaminated.progress[etIds[0]]={attempts:4,lastCorrect:false};
  contaminated.session.items[0].id=etIds[0];
  const restored=restore(contaminated,bf,bfMap);
  assert.deepEqual(restored.progress,legacy.progress);assert.equal(restored.session,null);
});
test('invalid or obsolete state cannot crash or inject phantom quiz answers',()=>{
  assert.deepEqual(restore({...legacy,version:'obsolete'},bf,bfMap).progress,{});
  for(const invalid of [null,{}, {...legacy.session,items:[null]}, {...legacy.session,answers:{constructor:1}}, {...legacy.session,items:[{id:'constructor',order:[0,1,2,3]}]}, {...legacy.session,checked:[bfIds[2]]}]){
    assert.equal(restore({...legacy,session:invalid},bf,bfMap).session,null);
  }
});
test('both courses have disjoint questions and the expected PDF grouping',()=>{
  assert.equal(bf.moduleIds.length,9);assert.equal(et.moduleIds.length,19);
  assert.equal(bfIds.length,218);assert.equal(etIds.length,307);
  assert.equal(bfIds.filter(id=>Object.hasOwn(etMap,id)).length,0);
  assert.equal(data.modules.filter(m=>m.courseId==='et4551').reduce((n,m)=>n+m.source.pages,0),791);
});
