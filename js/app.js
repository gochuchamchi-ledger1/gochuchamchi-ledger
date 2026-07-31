const KEY='gochuchamchi-v5-data';
const FIREBASE_CONFIG={apiKey:'AIzaSyA46ZSYVenzkY0dPod85SWIhcK1voDDD24',authDomain:'gochuchamchi-7.firebaseapp.com',projectId:'gochuchamchi-7',storageBucket:'gochuchamchi-7.firebasestorage.app',messagingSenderId:'633073478568',appId:'1:633073478568:web:127832c1732948263a0b9d'};
const CLOUD_DOC_PATH='groups/gochuchamchi/app/state';
let db=null,cloudRef=null,cloudReady=false,cloudApplying=false,cloudTimer=null,lastCloudWrite=0,unsubscribeCloud=null;

const categories=['전체','회비','입출금통장 이자','식사비','모임비','기타수입','기타지출','미분류'];
const seed={
 groupName:'고추참치회',bank:'카카오뱅크',startBalance:2091253,startMonth:'2026-01',arrearsStartMonth:'2026-08',adminPin:'123456',importHistory:[],monthlyReports:{},meetingReports:[],reportAssets:{signature:'',stamp:''},closedMonths:{},classificationRules:[],
 members:[
  {id:'m1',name:'정지협',fee:40000,startMonth:'2026-01'},
  {id:'m2',name:'강상구',fee:50000,startMonth:'2026-01'},
  {id:'m3',name:'이상진',fee:50000,startMonth:'2026-01'},
  {id:'m4',name:'이주현',fee:40000,startMonth:'2026-01'},
  {id:'m5',name:'김명균',fee:50000,startMonth:'2026-01'},
  {id:'m6',name:'강광욱',fee:30000,startMonth:'2026-01'}],
 transactions:[{"id":"kb001","datetime":"2026-01-01T09:56","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb002","datetime":"2026-01-01T10:00","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb003","datetime":"2026-01-01T10:02","type":"입금","amount":30000,"description":"이주현","category":"회비","member":"이주현","status":"금액확인","memo":"기준 회비 40,000원"},{"id":"kb004","datetime":"2026-01-01T10:04","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb005","datetime":"2026-01-01T10:19","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb006","datetime":"2026-01-02T08:19","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb007","datetime":"2026-01-12T12:07","type":"입금","amount":160,"description":"프렌즈 체크카드 캐시백","category":"미분류","member":"","status":"확인필요","memo":"원본메모: 25"},{"id":"kb008","datetime":"2026-01-22T00:01","type":"출금","amount":38000,"description":"주식회사 카카오모빌","category":"미분류","member":"","status":"확인필요","memo":"원본메모: 25"},{"id":"kb009","datetime":"2026-01-24T05:19","type":"입금","amount":155,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"},{"id":"kb010","datetime":"2026-01-30T20:38","type":"입금","amount":38000,"description":"이상진","category":"회비","member":"이상진","status":"금액확인","memo":"기준 회비 50,000원"},{"id":"kb011","datetime":"2026-02-01T10:01","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb012","datetime":"2026-02-01T10:02","type":"입금","amount":40000,"description":"이주현","category":"회비","member":"이주현","status":"자동확정","memo":"원본메모: 25"},{"id":"kb013","datetime":"2026-02-01T10:03","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb014","datetime":"2026-02-01T10:04","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb015","datetime":"2026-02-01T10:12","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb016","datetime":"2026-02-08T09:30","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb017","datetime":"2026-02-10T11:30","type":"입금","amount":76,"description":"프렌즈 체크카드 캐시백","category":"미분류","member":"","status":"확인필요","memo":"원본메모: 25"},{"id":"kb018","datetime":"2026-02-28T05:43","type":"입금","amount":212,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"},{"id":"kb019","datetime":"2026-03-01T07:35","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb020","datetime":"2026-03-01T08:31","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb021","datetime":"2026-03-01T10:02","type":"입금","amount":40000,"description":"이주현","category":"회비","member":"이주현","status":"자동확정","memo":"원본메모: 25"},{"id":"kb022","datetime":"2026-03-01T10:03","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb023","datetime":"2026-03-01T10:04","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb024","datetime":"2026-03-01T13:57","type":"출금","amount":50000,"description":"이상진","category":"미분류","member":"","status":"확인필요","memo":"원본메모: 25"},{"id":"kb025","datetime":"2026-03-01T13:57","type":"입금","amount":100000,"description":"이상진","category":"회비","member":"이상진","status":"복수개월확인","memo":"2개월분 가능"},{"id":"kb026","datetime":"2026-03-01T18:01","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb027","datetime":"2026-03-03T09:51","type":"출금","amount":50000,"description":"이상진","category":"미분류","member":"","status":"확인필요","memo":"원본메모: 25"},{"id":"kb028","datetime":"2026-03-28T05:27","type":"입금","amount":189,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"},{"id":"kb029","datetime":"2026-04-01T09:42","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb030","datetime":"2026-04-01T10:04","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb031","datetime":"2026-04-01T10:06","type":"입금","amount":40000,"description":"이주현","category":"회비","member":"이주현","status":"자동확정","memo":"원본메모: 25"},{"id":"kb032","datetime":"2026-04-01T10:09","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb033","datetime":"2026-04-01T11:13","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb034","datetime":"2026-04-14T12:33","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb035","datetime":"2026-04-25T05:27","type":"입금","amount":204,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"},{"id":"kb036","datetime":"2026-05-01T10:02","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb037","datetime":"2026-05-01T10:02","type":"입금","amount":40000,"description":"이주현","category":"회비","member":"이주현","status":"자동확정","memo":"원본메모: 25"},{"id":"kb038","datetime":"2026-05-01T10:04","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb039","datetime":"2026-05-01T10:06","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb040","datetime":"2026-05-01T10:08","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb041","datetime":"2026-05-01T18:05","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb042","datetime":"2026-05-09T22:02","type":"출금","amount":60000,"description":"이승윤","category":"미분류","member":"","status":"확인필요","memo":"원본메모: 25"},{"id":"kb043","datetime":"2026-05-23T05:39","type":"입금","amount":222,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"},{"id":"kb044","datetime":"2026-06-01T09:07","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb045","datetime":"2026-06-01T09:11","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb046","datetime":"2026-06-01T09:17","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb047","datetime":"2026-06-01T10:07","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb048","datetime":"2026-06-01T10:08","type":"입금","amount":40000,"description":"이주현","category":"회비","member":"이주현","status":"자동확정","memo":"원본메모: 25"},{"id":"kb049","datetime":"2026-06-01T10:11","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb050","datetime":"2026-06-27T05:40","type":"입금","amount":297,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"},{"id":"kb051","datetime":"2026-07-01T08:06","type":"입금","amount":40000,"description":"정지협","category":"회비","member":"정지협","status":"자동확정","memo":"원본메모: 25"},{"id":"kb052","datetime":"2026-07-01T08:40","type":"입금","amount":50000,"description":"김명균","category":"회비","member":"김명균","status":"자동확정","memo":"원본메모: 25"},{"id":"kb053","datetime":"2026-07-01T09:00","type":"입금","amount":50000,"description":"강상구","category":"회비","member":"강상구","status":"자동확정","memo":"원본메모: 25"},{"id":"kb054","datetime":"2026-07-01T10:04","type":"입금","amount":50000,"description":"이상진","category":"회비","member":"이상진","status":"자동확정","memo":"원본메모: 25"},{"id":"kb055","datetime":"2026-07-01T10:06","type":"입금","amount":40000,"description":"이주현","category":"회비","member":"이주현","status":"자동확정","memo":"원본메모: 25"},{"id":"kb056","datetime":"2026-07-01T10:09","type":"입금","amount":30000,"description":"강광욱","category":"회비","member":"강광욱","status":"자동확정","memo":"원본메모: 25"},{"id":"kb057","datetime":"2026-07-25T05:39","type":"입금","amount":251,"description":"입출금통장 이자","category":"입출금통장 이자","member":"","status":"자동확정","memo":"원본메모: 25"}]
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x)), won=n=>(Number(n)||0).toLocaleString('ko-KR')+'원', ym=d=>String(d).slice(0,7);
let state=load(),admin=false,editingTx=null,editingMember=null,activeCategory='전체',deferredPrompt=null,pendingImport=[],editingMeetingId=null,selectedMeetingId=null,editingMeetingPhotos=[],editingRepresentative=0,currentAssetType='signature',editingMemberPhoto='',editingMemberAvatar='🐱',editingReceipt='';




















































function go(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');$$('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));render();scrollTo(0,0)}


function closeModal(id){$('#'+id).classList.remove('show')}


function requireAdmin(){if(admin)return true;alert('총무 모드에서 사용할 수 있습니다.');return false}


async function toggleAdmin(){
 if(admin){admin=false;render();return}
 const pin=prompt('총무 PIN을 입력하세요.');if(pin===state.adminPin){admin=true;render()}else if(pin!==null)alert('PIN이 맞지 않습니다.')
}

































































async function shareInstallLink(){
 const title='고추참치회 장부 앱';
 const text=`고추참치회 장부 앱 설치 링크입니다.\n링크를 연 뒤 설정 → 앱 설치를 눌러주세요.\n\n${INSTALL_URL}`;
 try{
  if(navigator.share){
   await navigator.share({title,text,url:INSTALL_URL});
   return;
  }
 }catch(e){
  if(e?.name==='AbortError')return;
 }
 try{
  await navigator.clipboard.writeText(text);
  alert('설치 링크가 복사되었습니다.\n카카오톡이나 문자에 붙여넣어 보내세요.');
 }catch(e){
  prompt('아래 설치 링크를 길게 눌러 복사하세요.',INSTALL_URL);
 }
}



function installApp(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{deferredPrompt=null;$('#installBanner').classList.remove('show')})}else alert('Chrome 메뉴에서 “앱 설치”를 선택하세요. 기존 Chrome 배지 바로가기는 삭제한 뒤 다시 설치하세요.')}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBanner').classList.add('show')});
window.addEventListener('appinstalled',()=>{$('#installBanner').classList.remove('show');alert('앱 설치가 완료되었습니다.')});


function startApp(){
 try{
$$('.navbtn').forEach(b=>b.onclick=()=>go(b.dataset.screen));


function on(id,event,handler){
 const el=$('#'+id);
 if(el)el.addEventListener(event,handler);
 else console.warn('[V6.0.1] 선택 요소 없음:',id);
}
on('modeBtn','click',toggleAdmin);
on('fab','click',()=>openTx());
on('saveTx','click',saveTx);
on('deleteTx','click',deleteTx);
on('chooseReceipt','click',()=>$('#receiptFile')?.click());
on('receiptFile','change',e=>{if(e.target.files?.[0])loadReceipt(e.target.files[0]);e.target.value=''});
['fAmount','fDate','fCategory','fMember'].forEach(id=>on(id,'change',updateAllocationPreview));

on('addMemberBtn','click',()=>openMember());
on('saveMember','click',saveMember);
on('deleteMember','click',deleteMember);
on('chooseMemberPhoto','click',()=>$('#memberPhotoFile')?.click());
on('memberPhotoFile','change',e=>{if(e.target.files?.[0])loadMemberPhoto(e.target.files[0]);e.target.value=''});
on('removeMemberPhoto','click',()=>{editingMemberPhoto='';renderMemberAvatarPreview()});

on('homeMonth','change',render);
on('txMonth','change',renderTransactions);
on('txSearch','input',renderTransactions);
on('memberSearch','input',renderMembers);
on('reportMonth','change',renderReport);
on('arrearsMonth','change',renderArrears);
on('arrearsSearch','input',renderArrears);

$$('#categoryTabs button').forEach(b=>b.onclick=()=>{$$('#categoryTabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeCategory=b.dataset.cat;renderTransactions()});

on('importBtn','click',()=>requireAdmin()&&$('#excelFile')?.click());
on('excelFile','change',e=>{if(e.target.files?.[0])importExcel(e.target.files[0]);e.target.value=''});
on('cancelImport','click',()=>{pendingImport=[];closeModal('importModal')});
on('confirmImport','click',confirmImport);

on('arrearsStartMenu','click',changeArrearsStart);
on('autoRuleMenu','click',showAutoRules);
on('importHistoryMenu','click',()=>{renderImportHistory();$('#importHistoryModal')?.classList.add('show')});

$$('#report .reportTab').forEach(b=>b.onclick=()=>{$$('#report .reportTab').forEach(x=>x.classList.remove('active'));$$('.reportPane').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.reportPane)?.classList.add('active')});

on('finalizeMonthly','click',finalizeMonthly);
on('closeMonthBtn','click',toggleMonthClose);
on('monthlyPng','click',()=>saveReportPng('monthly'));
on('monthlyShare','click',()=>saveReportPng('monthly',true));
on('monthlyPrint','click',()=>printReport('monthly'));

on('newMeetingReport','click',()=>openMeetingEditor());
on('addExpense','click',()=>addExpenseRow());
on('saveMeetingReport','click',saveMeeting);
on('deleteMeetingReport','click',deleteMeeting);
on('chooseMeetingPhotos','click',()=>$('#mrPhotos')?.click());
on('mrPhotos','change',e=>{loadMeetingPhotos(e.target.files);e.target.value=''});
on('meetingPng','click',()=>saveReportPng('meeting'));
on('meetingShare','click',()=>saveReportPng('meeting',true));
on('meetingPrint','click',()=>printReport('meeting'));

on('installBtn','click',installApp);
on('installMenu','click',installApp);
on('shareInstallMenu','click',shareInstallLink);
on('pinMenu','click',changePin);
on('signatureMenu','click',()=>openAssetManager('signature'));
on('stampMenu','click',()=>openAssetManager('stamp'));
on('assetChoose','click',()=>$(currentAssetType==='signature'?'#signatureFile':'#stampFile')?.click());
on('assetDelete','click',deleteAsset);
on('signatureFile','change',e=>{if(e.target.files?.[0])saveAssetFile(e.target.files[0],'signature');e.target.value=''});
on('stampFile','change',e=>{if(e.target.files?.[0])saveAssetFile(e.target.files[0],'stamp');e.target.value=''});

on('uploadCloud','click',uploadCurrentToCloud);
on('downloadCloud','click',downloadCloudNow);
on('backupMenu','click',backup);
on('restoreMenu','click',()=>$('#restoreFile')?.click());
on('restoreFile','change',e=>e.target.files?.[0]&&restore(e.target.files[0]));
on('exportCsvMenu','click',exportTransactionsCsv);
on('resetMenu','click',()=>{if(confirm('현재 데이터를 모두 초기화할까요?')){state=clone(seed);save();render()}});

document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
const params=new URLSearchParams(location.search);if(params.get('screen'))go(params.get('screen'));if(params.get('action')==='add')setTimeout(()=>openTx(),500);
render();
 initFirebase();
 }catch(err){
  console.error(err);
  alert('앱 실행 오류: '+(err.message||err));
 }
}
document.addEventListener('DOMContentLoaded',startApp);
