function transactionAllocations(t){
 if(Array.isArray(t.allocations)&&t.allocations.length)return t.allocations;
 if(t.type==='입금'&&t.category==='회비'&&t.member)return [{month:ym(t.datetime),amount:Number(t.amount||0)}];
 return []
}

function buildAllocations(memberName,amount,startMonth,excludeId=null){
 const mem=state.members.find(x=>x.name===memberName);if(!mem||!amount)return [];
 const fee=Number(mem.fee||0);if(!fee)return [];
 const baseline=state.arrearsStartMonth||state.startMonth||startMonth;
 const memberStart=mem.startMonth||state.startMonth||startMonth;
 const calcStart=memberStart>baseline?memberStart:baseline;
 const result=[];let remain=Number(amount);
 const pastCount=startMonth>=calcStart?monthsBetween(calcStart,startMonth):0;
 for(let i=0;i<pastCount&&remain>0;i++){
  const month=addMonths(calcStart,i),already=paidFor(mem,month,excludeId),needed=Math.max(0,fee-already);
  if(needed){const part=Math.min(needed,remain);result.push({month,amount:part});remain-=part}
 }
 let nextMonth=result.length?addMonths(result[result.length-1].month,1):pastCount?addMonths(startMonth,1):(startMonth<calcStart?calcStart:startMonth),i=0;
 while(remain>0&&i<60){const part=Math.min(fee,remain);result.push({month:nextMonth,amount:part});remain-=part;nextMonth=addMonths(nextMonth,1);i++}
 return result
}

function renderPayments(m){
 $('#paymentStatus').innerHTML=state.members.map(mem=>{const p=paidFor(mem,m),pct=Math.min(100,Math.round(p/mem.fee*100)),status=p>=mem.fee?'완납':p>0?'부분납':'미납';return `<div class="member"><div class="memberTop"><div class="memberIdentity">${memberAvatarHtml(mem,true)}<div><b>${esc(mem.name)}</b><div class="progress"><i style="width:${pct}%"></i></div></div></div><div style="text-align:right"><b>${won(p)}</b><div class="small">/ ${won(mem.fee)}</div></div><span class="paymentState ${p>=mem.fee?'paid':p>0?'partial':'unpaid'}">${status}</span></div></div>`}).join('')
}

function txHtml(t){
 const warn=!['자동확정','확인완료'].includes(t.status),cls=t.type==='입금'?'green':'red';
 return `<div class="tx" data-id="${t.id}"><div class="txTop"><div><div class="txTitle">${esc(t.description||t.category)}</div><div class="meta"><span>${t.datetime.slice(0,10)}</span><span class="chip">${esc(t.category)}</span>${t.member?`<span class="chip">${esc(t.member)}</span>`:''}<span class="chip ${warn?'warn':'ok'}">${esc(t.status)}</span></div></div><div class="amt ${cls}">${t.type==='입금'?'+':'-'}${won(t.amount)}</div></div></div>`
}

function renderTransactions(){
 const m=$('#txMonth').value||nowMonth(),q=($('#txSearch').value||'').toLowerCase().trim();
 let a=monthTx(m).filter(t=>(t.description+' '+t.member+' '+t.category).toLowerCase().includes(q));
 if(activeCategory!=='전체')a=a.filter(t=>t.category===activeCategory);
 $('#txList').innerHTML=a.reverse().map(txHtml).join('')||'<div class="empty">해당 거래가 없습니다.</div>';
 $$('#txList .tx').forEach(el=>el.onclick=()=>admin?openTx(el.dataset.id):alert('총무 모드에서 수정할 수 있습니다.'));
}

function renderReceiptPreview(){
 const box=$('#receiptPreview');if(!box)return;
 box.innerHTML=editingReceipt?`<img src="${editingReceipt}" alt="영수증"><div style="flex:1"><b>영수증 첨부됨</b><div class="small">거래 저장 시 함께 보관됩니다.</div><button type="button" class="btn line full" id="removeReceipt" style="margin-top:6px">영수증 제거</button></div>`:'<div class="small">첨부된 영수증이 없습니다.</div>';
 const rm=$('#removeReceipt');if(rm)rm.onclick=()=>{editingReceipt='';renderReceiptPreview()}
}

async function loadReceipt(file){
 try{editingReceipt=await compressImage(file,1000,1400,.8);renderReceiptPreview()}
 catch(e){alert('영수증 사진을 불러오지 못했습니다.')}
}


function updateAllocationPreview(){
 const amount=Number($('#fAmount').value||0),member=$('#fMember').value,category=$('#fCategory').value,start=String($('#fDate').value||'').slice(0,7);
 const box=$('#allocationPreview');
 if(category!=='회비'||!member||!amount||!start){box.style.display='none';return}
 const allocations=buildAllocations(member,amount,start,editingTx);
 $('#allocationList').innerHTML=allocations.map(a=>`<span class="allocationChip">${a.month.replace('-','년 ')}월 ${won(a.amount)}</span>`).join('');
 box.style.display='block'
}


function openTx(id=null){
 if(!requireAdmin())return;editingTx=id;const t=state.transactions.find(x=>x.id===id);if(t&&!ensureMonthEditable(ym(t.datetime)))return;
 $('#txModalTitle').textContent=t?'거래 수정':'거래 추가';$('#fDate').value=t?.datetime||new Date().toISOString().slice(0,16);$('#fType').value=t?.type||'입금';$('#fAmount').value=t?.amount||'';$('#fDesc').value=t?.description||'';fillSelects();$('#fCategory').value=t?.category||'미분류';$('#fMember').value=t?.member||'';$('#fStatus').value=t?.status||'확인필요';$('#fMemo').value=t?.memo||'';editingReceipt=t?.receipt||'';renderReceiptPreview();$('#deleteTx').style.display=t?'block':'none';updateAllocationPreview();$('#txModal').classList.add('show')
}

function saveTx(){
 const amount=Number($('#fAmount').value),dt=$('#fDate').value;if(!dt||!amount)return alert('날짜와 금액을 입력하세요.');
 if(!ensureMonthEditable(ym(dt)))return;
 const category=$('#fCategory').value,member=$('#fMember').value;
 const obj={id:editingTx||'u'+Date.now(),datetime:dt,type:$('#fType').value,amount,description:$('#fDesc').value.trim(),category,member,status:$('#fStatus').value,memo:$('#fMemo').value,receipt:editingReceipt||''};
 if(obj.type==='입금'&&category==='회비'&&member)obj.allocations=buildAllocations(member,amount,ym(dt),editingTx);
 const old=state.transactions.find(x=>x.id===editingTx);
 if(old&&ym(old.datetime)!==ym(dt)&&!ensureMonthEditable(ym(old.datetime)))return;
 const i=state.transactions.findIndex(x=>x.id===editingTx);if(i>=0)state.transactions[i]=obj;else state.transactions.push(obj);
 learnClassificationRule(obj);save();closeModal('txModal');render()
}

function deleteTx(){const t=state.transactions.find(x=>x.id===editingTx);if(t&&!ensureMonthEditable(ym(t.datetime)))return;if(confirm('이 거래를 삭제할까요?')){state.transactions=state.transactions.filter(x=>x.id!==editingTx);save();closeModal('txModal');render()}}

function classify(desc,type){
 const text=String(desc||'').trim();
 const name=state.members.find(m=>text.includes(m.name));
 if(type==='입금'&&name)return {category:'회비',member:name.name,status:'자동확정',source:'회원명'};
 if(type==='입금'&&/이자|예금이자/.test(text))return {category:'입출금통장 이자',member:'',status:'자동확정',source:'기본규칙'};
 const learned=[...(state.classificationRules||[])].sort((a,b)=>String(b.keyword).length-String(a.keyword).length).find(r=>r.type===type&&text.includes(r.keyword));
 if(learned)return {category:learned.category,member:learned.member||'',status:'자동확정',source:'학습규칙'};
 if(type==='출금'&&/식당|횟집|고기|치킨|카페|커피|주점|포차/.test(text))return {category:'식사비',member:'',status:'확인필요',source:'추천규칙'};
 if(type==='입금'&&/캐시백|환급|환불/.test(text))return {category:'기타수입',member:'',status:'확인필요',source:'추천규칙'};
 return {category:type==='입금'?'미분류':'기타지출',member:'',status:'확인필요',source:'미분류'}
}

function learnClassificationRule(t){
 const keyword=String(t.description||'').trim();
 if(!keyword||keyword.length<2||t.category==='미분류')return;
 const idx=state.classificationRules.findIndex(r=>r.keyword===keyword&&r.type===t.type);
 const rule={keyword,type:t.type,category:t.category,member:t.member||'',updatedAt:new Date().toISOString()};
 if(idx>=0)state.classificationRules[idx]=rule;else state.classificationRules.unshift(rule);
 state.classificationRules=state.classificationRules.slice(0,100)
}

function showAutoRules(){
 if(!requireAdmin())return;
 const rules=state.classificationRules||[];
 const text=rules.length?rules.slice(0,30).map((r,i)=>`${i+1}. [${r.type}] ${r.keyword} → ${r.category}${r.member?' / '+r.member:''}`).join('\n'):'아직 학습된 규칙이 없습니다.';
 alert(`자동분류 규칙 (${rules.length}개)\n\n${text}\n\n거래를 수정하고 저장하면 같은 거래명이 다음 업로드부터 자동 분류됩니다.`)
}

function loadXlsxLibrary(){
 return new Promise((resolve,reject)=>{
  if(window.XLSX){resolve();return;}
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  s.onload=resolve;
  s.onerror=()=>reject(new Error('엑셀 모듈을 불러오지 못했습니다.'));
  document.head.appendChild(s);
 });
}

function pickHeaderRow(matrix){
 return matrix.findIndex(row=>{
  const joined=(row||[]).map(x=>String(x).replace(/\s/g,'')).join('|');
  return /(거래일시|거래일자|거래일)/.test(joined)&&/(거래금액|입금액|출금액|금액)/.test(joined);
 })
}

function rowsFromSheet(ws){
 const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
 const idx=pickHeaderRow(matrix);
 if(idx<0)return [];
 const headers=matrix[idx].map(x=>String(x).trim());
 return matrix.slice(idx+1).filter(r=>r.some(v=>v!==''&&v!=null)).map(r=>{
  const obj={};headers.forEach((h,i)=>{if(h)obj[h]=r[i]??''});return obj
 })
}

function parseBankRow(row){
 const date=normDate(findVal(row,['거래일시','거래일자','거래일','일시','날짜']));
 const desc=normalizedText(findVal(row,['내용','거래내용','적요','입금자','상대','받는분','보낸분']));
 const inAmt=normalizedAmount(findVal(row,['입금액','입금금액']));
 const outAmt=normalizedAmount(findVal(row,['출금액','출금금액']));
 const rawAmt=normalizedAmount(findVal(row,['거래금액','금액']));
 const rawType=normalizedText(findVal(row,['입출금','입출금구분','구분','거래구분']));
 const type=inAmt>0?'입금':outAmt>0?'출금':/출금/.test(rawType)||rawAmt<0?'출금':'입금';
 const amount=Math.abs(inAmt||outAmt||rawAmt);
 if(!date||!amount)return null;
 const c=classify(desc,type);
 return {id:'x'+Date.now()+Math.random().toString(36).slice(2),datetime:date,type,amount,description:desc||'카카오뱅크 거래',category:c.category,member:c.member,status:c.status,memo:`카카오뱅크 엑셀 업로드 · ${c.source||'자동분류'}`}
}

function renderImportPreview(fileName){
 const newCount=pendingImport.filter(x=>!x.duplicate).length;
 const dupCount=pendingImport.filter(x=>x.duplicate).length;
 const reviewCount=pendingImport.filter(x=>!x.duplicate&&x.tx.status!=='자동확정').length;
 $('#importFileName').textContent=fileName;
 $('#pTotal').textContent=pendingImport.length+'건';
 $('#pNew').textContent=newCount+'건';
 $('#pDup').textContent=dupCount+'건';
 $('#pReview').textContent=reviewCount+'건';
 $('#confirmImport').textContent=`신규 ${newCount}건 반영`;
 const rows=pendingImport.slice(0,100).map((x,i)=>{
  const tag=x.duplicate?'<span class="chip badgeDup">중복</span>':x.tx.status==='자동확정'?'<span class="chip badgeNew">신규</span>':'<span class="chip badgeReview">확인필요</span>';
  return `<tr>
   <td><input class="previewCheck" type="checkbox" data-import-index="${i}" ${x.duplicate?'disabled':'checked'}></td>
   <td>${tag}</td><td>${esc(x.tx.datetime.replace('T',' '))}</td><td>${esc(x.tx.type)}</td>
   <td><b>${won(x.tx.amount)}</b></td><td>${esc(x.tx.description)}</td><td>${esc(x.tx.member||'-')}</td><td>${esc(x.tx.category)}</td>
  </tr>`
 }).join('');
 $('#importPreviewTable').innerHTML='<tr><th>선택</th><th>판정</th><th>일시</th><th>구분</th><th>금액</th><th>내용</th><th>회원</th><th>분류</th></tr>'+rows;
 $('#importModal').classList.add('show');
}

async function importExcel(file){
 try{await loadXlsxLibrary()}catch(e){alert('엑셀 업로드 기능을 불러오지 못했습니다. 인터넷 연결을 확인하세요.');return}
 try{
  const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array',cellDates:true});
  let parsed=[];
  for(const name of wb.SheetNames){
   const rows=rowsFromSheet(wb.Sheets[name]);
   if(rows.length){parsed=rows;break}
  }
  if(!parsed.length)throw new Error('거래내역 표를 찾지 못했습니다.');
  const existing=new Set(state.transactions.map(duplicateKey));
  const seen=new Set();
  pendingImport=parsed.map(parseBankRow).filter(Boolean).map(tx=>{
   const key=duplicateKey(tx),duplicate=existing.has(key)||seen.has(key);
   seen.add(key);return {tx,duplicate}
  });
  if(!pendingImport.length)throw new Error('반영할 거래가 없습니다.');
  renderImportPreview(file.name)
 }catch(e){console.error(e);alert('파일을 읽지 못했습니다.\n'+(e.message||'비밀번호가 제거된 일반 xlsx/csv 파일인지 확인하세요.'))}
}

function confirmImport(){
 const selected=[...document.querySelectorAll('[data-import-index]:checked')].map(x=>pendingImport[Number(x.dataset.importIndex)]).filter(Boolean);
 const add=selected.filter(x=>!x.duplicate).map(x=>{const t=x.tx;if(t.type==='입금'&&t.category==='회비'&&t.member)t.allocations=buildAllocations(t.member,t.amount,ym(t.datetime));return t});
 const dup=pendingImport.filter(x=>x.duplicate).length;
 if(!add.length)return alert('반영할 신규 거래가 없습니다.');
 state.transactions.push(...add);
 state.importHistory.unshift({date:new Date().toISOString(),added:add.length,duplicates:dup,review:add.filter(x=>x.status!=='자동확정').length});
 state.importHistory=state.importHistory.slice(0,20);
 save();closeModal('importModal');pendingImport=[];render();
 alert(`업로드 완료\n신규 ${add.length}건 반영\n중복 ${dup}건 제외`);
}

function renderImportHistory(){
 const list=state.importHistory||[];
 $('#importHistoryList').innerHTML=list.length?list.map(h=>`<div class="historyItem"><b>${new Date(h.date).toLocaleString('ko-KR')}</b><div class="small">신규 ${h.added}건 · 중복 ${h.duplicates}건 · 확인필요 ${h.review}건</div></div>`).join(''):'<div class="empty">아직 업로드 이력이 없습니다.</div>';
}
