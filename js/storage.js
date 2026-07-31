function load(){
 try{
  const raw=localStorage.getItem(KEY);
  if(!raw) return clone(seed);
  const obj=JSON.parse(raw);
  if(!obj || !Array.isArray(obj.members) || !Array.isArray(obj.transactions)) return clone(seed);
  if(!Array.isArray(obj.importHistory))obj.importHistory=[];
  if(!obj.monthlyReports)obj.monthlyReports={};
  if(!Array.isArray(obj.meetingReports))obj.meetingReports=[];
  if(!obj.reportAssets)obj.reportAssets={signature:'',stamp:''};
  if(!obj.closedMonths)obj.closedMonths={};
  if(!Array.isArray(obj.classificationRules))obj.classificationRules=[];
  obj.members=(obj.members||[]).map((m,i)=>({...m,avatar:m.avatar||['🐱','😺','😸','😻','😽','🐯'][i%6],photo:m.photo||''}));
  obj.transactions=(obj.transactions||[]).map(t=>({...t,receipt:t.receipt||''}));
  if(!obj.arrearsStartMonth)obj.arrearsStartMonth='2026-08';
  obj.adminPin='123456';
  return obj;
 }catch(e){
  return clone(seed);
 }
}

function backup(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='고추참치회_장부백업.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

async function restore(file){try{const obj=JSON.parse(await file.text());if(!obj.members||!obj.transactions)throw Error();state=obj;save();render();alert('복원이 완료되었습니다.')}catch(e){alert('올바른 백업 파일이 아닙니다.')}}

function changePin(){if(!requireAdmin())return;const old=prompt('현재 PIN을 입력하세요.');if(old!==state.adminPin)return alert('현재 PIN이 맞지 않습니다.');const p=prompt('새 PIN 4자리 이상');if(!p||p.length<4)return alert('4자리 이상 입력하세요.');state.adminPin=p;save();alert('PIN이 변경되었습니다.')}

const INSTALL_URL='https://gochuchamchi-ledger1.github.io/gochuchamchi-ledger/?v=710';
