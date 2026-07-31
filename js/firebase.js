function mediaSafeState(obj){
 const c=clone(obj);
 c.reportAssets={signature:'',stamp:''};
 c.members=(c.members||[]).map(m=>({...m,photo:''}));
 c.transactions=(c.transactions||[]).map(t=>({...t,receipt:''}));
 c.meetingReports=(c.meetingReports||[]).map(r=>({...r,photos:[]}));
 return c
}

function setCloudStatus(mode,text,detail=''){
 const el=$('#cloudStatus'),d=$('#cloudDetail');if(el){el.className='cloudBadge '+mode;el.textContent=text}if(d&&detail)d.textContent=detail
}

function save(){
 localStorage.setItem(KEY,JSON.stringify(state));
 if(!cloudReady||cloudApplying)return;
 clearTimeout(cloudTimer);setCloudStatus('syncing','동기화 중');
 cloudTimer=setTimeout(async()=>{try{lastCloudWrite=Date.now();await cloudRef.set({state:mediaSafeState(state),updatedAt:firebase.firestore.FieldValue.serverTimestamp(),version:'7.1'},{merge:true});setCloudStatus('online','공유됨','마지막 변경사항이 Firebase에 저장되었습니다.')}catch(e){console.error(e);setCloudStatus('error','저장 실패',e.message||'Firebase 쓰기 실패')}},550)
}

async function initFirebase(){
 try{
  if(!window.firebase)throw new Error('Firebase SDK를 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
  if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
  db=firebase.firestore();cloudRef=db.doc(CLOUD_DOC_PATH);cloudReady=true;setCloudStatus('syncing','연결 중');
  unsubscribeCloud=cloudRef.onSnapshot(snap=>{
   if(!snap.exists){setCloudStatus('online','연결됨','클라우드 데이터가 없습니다. 총무가 현재 데이터를 올려주세요.');return}
   const remote=snap.data()?.state;if(!remote||!Array.isArray(remote.members)||!Array.isArray(remote.transactions))return;
   if(Date.now()-lastCloudWrite<1200)return;
   cloudApplying=true;
   const localMedia={members:Object.fromEntries((state.members||[]).map(m=>[m.id,m.photo||''])),receipts:Object.fromEntries((state.transactions||[]).map(t=>[t.id,t.receipt||''])),assets:state.reportAssets||{},meetings:Object.fromEntries((state.meetingReports||[]).map(r=>[r.id,r.photos||[]]))};
   remote.adminPin='123456';state=remote;state.members=(state.members||[]).map(m=>({...m,photo:localMedia.members[m.id]||''}));state.transactions=(state.transactions||[]).map(t=>({...t,receipt:localMedia.receipts[t.id]||''}));state.reportAssets=localMedia.assets;state.meetingReports=(state.meetingReports||[]).map(r=>({...r,photos:localMedia.meetings[r.id]||[]}));
   localStorage.setItem(KEY,JSON.stringify(state));render();cloudApplying=false;setCloudStatus('online','실시간 공유','클라우드 변경사항을 받았습니다.');
  },e=>{console.error(e);setCloudStatus('error','연결 오류',e.message||'Firestore 연결 실패')});
 }catch(e){console.error(e);setCloudStatus('error','오프라인',e.message||'Firebase 초기화 실패')}
}

async function uploadCurrentToCloud(){
 if(!requireAdmin())return;if(!cloudReady){alert('Firebase가 아직 연결되지 않았습니다.');return}
 if(!confirm('현재 휴대폰의 회원·거래·보고서 데이터를 Firebase 기준 데이터로 올릴까요?'))return;
 try{setCloudStatus('syncing','업로드 중');lastCloudWrite=Date.now();await cloudRef.set({state:mediaSafeState(state),updatedAt:firebase.firestore.FieldValue.serverTimestamp(),version:'7.1'},{merge:true});setCloudStatus('online','업로드 완료','다른 휴대폰에서 같은 주소를 열면 데이터가 표시됩니다.');alert('클라우드 업로드가 완료되었습니다.')}catch(e){alert('업로드 실패: '+e.message);setCloudStatus('error','업로드 실패',e.message)}
}

async function downloadCloudNow(){
 if(!cloudReady){alert('Firebase가 아직 연결되지 않았습니다.');return}
 try{const snap=await cloudRef.get();if(!snap.exists){alert('클라우드에 저장된 데이터가 없습니다.');return}const remote=snap.data()?.state;if(!remote)return;cloudApplying=true;state={...state,...remote,adminPin:'123456',reportAssets:state.reportAssets,members:(remote.members||[]).map(m=>({...m,photo:(state.members.find(x=>x.id===m.id)?.photo)||''})),transactions:(remote.transactions||[]).map(t=>({...t,receipt:(state.transactions.find(x=>x.id===t.id)?.receipt)||''}))};localStorage.setItem(KEY,JSON.stringify(state));render();cloudApplying=false;alert('클라우드 데이터를 다시 받았습니다.')}catch(e){alert('다운로드 실패: '+e.message)}
}
