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
 const createdAt=new Date().toISOString(),payload={...state,backupMeta:{version:'8.4',createdAt}};
 localStorage.setItem('gochuchamchi-last-backup',createdAt);
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`고추참치회_장부백업_${createdAt.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);renderDataHealth()
}

function validateBackupData(obj){
 if(!obj||!Array.isArray(obj.members)||!Array.isArray(obj.transactions))throw new Error('회원 또는 거래 목록이 없습니다.');
 if(obj.members.some(m=>!m.id||!m.name||!Number(m.fee)))throw new Error('회원 정보가 올바르지 않습니다.');
 if(obj.transactions.some(t=>!t.id||!t.datetime||!['입금','출금'].includes(t.type)||!Number.isFinite(Number(t.amount))))throw new Error('거래 정보가 올바르지 않습니다.');
 return true
}

async function restore(file){try{const obj=JSON.parse(await file.text());validateBackupData(obj);if(!confirm(`회원 ${obj.members.length}명, 거래 ${obj.transactions.length}건을 복원할까요? 현재 데이터는 덮어씁니다.`))return;state=obj;save();render();alert('백업 검증과 복원이 완료되었습니다.')}catch(e){alert('올바른 백업 파일이 아닙니다.\\n'+(e.message||''))}}

function csvCell(v){return `"${String(v??'').replace(/"/g,'""')}"`}

function exportTransactionsCsv(){
 const headers=['날짜시간','구분','금액','내용','분류','회원','상태','메모'];
 const rows=sorted().map(t=>[t.datetime,t.type,t.amount,t.description,t.category,t.member,t.status,t.memo].map(csvCell).join(','));
 const csv='\uFEFF'+[headers.map(csvCell).join(','),...rows].join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=`고추참치회_거래내역_${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

function renderDataHealth(){
 const el=$('#dataHealth');if(!el)return;
 const last=localStorage.getItem('gochuchamchi-last-backup'),review=state.transactions.filter(t=>!['자동확정','확인완료'].includes(t.status)).length;
 el.innerHTML=`<b>데이터 상태</b><div class="healthGrid"><span>회원 <strong>${state.members.length}명</strong></span><span>거래 <strong>${state.transactions.length}건</strong></span><span>확인 필요 <strong>${review}건</strong></span><span>최근 백업 <strong>${last?new Date(last).toLocaleDateString('ko-KR'):'없음'}</strong></span></div>`
}

function changePin(){if(!requireAdmin())return;const old=prompt('현재 PIN을 입력하세요.');if(old!==state.adminPin)return alert('현재 PIN이 맞지 않습니다.');const p=prompt('새 PIN 4자리 이상');if(!p||p.length<4)return alert('4자리 이상 입력하세요.');state.adminPin=p;save();alert('PIN이 변경되었습니다.')}

const INSTALL_URL='https://gochuchamchi-ledger1.github.io/gochuchamchi-ledger/?v=850';
