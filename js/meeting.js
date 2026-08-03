function renderMeetingList(){
 const list=[...(state.meetingReports||[])].sort((a,b)=>String(b.start).localeCompare(String(a.start)));
 $('#meetingReportList').innerHTML=list.length?list.map(r=>`<div class="meetingCard" data-meeting-id="${r.id}"><div class="meetingCardTop"><div><span class="autoClassBadge">${esc(r.kind||'정기모임')}</span><b style="display:block;margin-top:5px">${esc(r.title)}</b><div class="small">${esc(r.place)} · ${String(r.start).replace('T',' ')}</div></div><div style="text-align:right"><b>${won(sumMeetingExpenses(r))}</b><div class="small">계획 ${won(r.planBudget||0)}</div></div></div></div>`).join(''):'<div class="empty">작성된 모임·여행 보고서가 없습니다.</div>';
 $$('#meetingReportList [data-meeting-id]').forEach(el=>{el.onclick=()=>{selectedMeetingId=el.dataset.meetingId;renderMeetingA4(selectedMeetingId)};el.ondblclick=()=>admin&&openMeetingEditor(el.dataset.meetingId)})
}

function sumMeetingExpenses(r){return (r.expenses||[]).reduce((s,x)=>s+Number(x.amount||0),0)}

function parseMeetingSchedule(text){
 return String(text||'').split(/\r?\n/).map(line=>line.split('|').map(v=>v.trim())).filter(parts=>parts.some(Boolean)).map(parts=>({time:parts[0]||'-',activity:parts[1]||parts[0]||'-',owner:parts[2]||'-'}))
}


function photoHtml(photos,representative=0){
 const all=[...(photos||[])];if(all.length&&representative>0&&representative<all.length){const [main]=all.splice(representative,1);all.unshift(main)}const p=all.slice(0,3);
 if(!p.length)return '<div class="photoPlaceholder">📸</div><div class="photoPlaceholder">🍽️</div><div class="photoPlaceholder">🐱</div>';
 return p.map(src=>`<div class="reportPhoto"><img src="${src}" alt="모임사진"></div>`).join('');
}

function renderPhotoPreview(){
 $('#mrPhotoPreview').innerHTML=(editingMeetingPhotos||[]).map((src,i)=>`<div class="photoPreviewItem ${i===editingRepresentative?'representative':''}">
  ${i===editingRepresentative?'<span class="photoBadge">대표</span>':''}<img src="${src}">
  <button type="button" data-photo-delete="${i}">×</button>
  <div class="photoControls"><button type="button" data-photo-left="${i}">←</button><button type="button" data-photo-main="${i}">★</button><button type="button" data-photo-right="${i}">→</button></div>
 </div>`).join('');
 $$('#mrPhotoPreview [data-photo-delete]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.photoDelete);editingMeetingPhotos.splice(i,1);if(editingRepresentative>=editingMeetingPhotos.length)editingRepresentative=Math.max(0,editingMeetingPhotos.length-1);renderPhotoPreview()});
 $$('#mrPhotoPreview [data-photo-main]').forEach(b=>b.onclick=()=>{editingRepresentative=Number(b.dataset.photoMain);renderPhotoPreview()});
 $$('#mrPhotoPreview [data-photo-left]').forEach(b=>b.onclick=()=>moveMeetingPhoto(Number(b.dataset.photoLeft),-1));
 $$('#mrPhotoPreview [data-photo-right]').forEach(b=>b.onclick=()=>moveMeetingPhoto(Number(b.dataset.photoRight),1));
}

function moveMeetingPhoto(i,delta){
 const ni=i+delta;if(ni<0||ni>=editingMeetingPhotos.length)return;
 [editingMeetingPhotos[i],editingMeetingPhotos[ni]]=[editingMeetingPhotos[ni],editingMeetingPhotos[i]];
 if(editingRepresentative===i)editingRepresentative=ni;else if(editingRepresentative===ni)editingRepresentative=i;
 renderPhotoPreview()
}

function compressImage(file,maxW=1200,maxH=900,quality=.78){
 return new Promise((resolve,reject)=>{
  const fr=new FileReader();
  fr.onerror=reject;
  fr.onload=()=>{
   const img=new Image();
   img.onerror=reject;
   img.onload=()=>{
    let w=img.width,h=img.height,scale=Math.min(1,maxW/w,maxH/h);w=Math.round(w*scale);h=Math.round(h*scale);
    const c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    resolve(c.toDataURL('image/jpeg',quality));
   };
   img.src=fr.result;
  };
  fr.readAsDataURL(file);
 })
}

async function loadMeetingPhotos(files){
 const arr=[...files].slice(0,Math.max(0,3-editingMeetingPhotos.length));
 for(const f of arr){
  try{editingMeetingPhotos.push(await compressImage(f))}
  catch(e){alert(`${f.name} 사진을 불러오지 못했습니다.`)}
 }
 renderPhotoPreview()
}


function renderMeetingA4(id){
 const r=(state.meetingReports||[]).find(x=>x.id===id);if(!r)return;
 const total=sumMeetingExpenses(r),att=(r.attendees||[]).length,before=balanceAt(String(r.start).slice(0,10)),after=before-total;
 const plan=Number(r.planBudget||0),difference=plan-total,schedule=parseMeetingSchedule(r.schedule);
 const scheduleRows=schedule.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(x.activity)}</td><td>${esc(x.owner)}</td></tr>`).join('')||'<tr><td>-</td><td>등록된 세부 일정 없음</td><td>-</td></tr>';
 const expenseRows=(r.expenses||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.item)}</td><td>${won(x.amount)}</td></tr>`).join('')||'<tr><td>1</td><td>지출 없음</td><td>0원</td></tr>';
 const dots=(r.attendees||[]).map(n=>{const mem=state.members.find(m=>m.name===n);return `<div class="memberDot">${mem?memberAvatarHtml(mem,true):'<div class="avatar">🐱</div>'}<b>${esc(n)}</b><small>✓ 참석</small></div>`}).join('');
 $('#meetingA4').style.display='block';$('#meetingActions').style.display='grid';
 $('#meetingA4').innerHTML=`
 <div class="a4Header"><div><div class="reportBrand"><img src="mascot.png"><div><div class="reportBrandName">🌶️ ${state.groupName}</div><div class="reportSlogan">함께하는 즐거움, 소중한 인연</div></div></div><h1>${esc(r.title)}</h1><div class="small">작성일 ${esc(r.createdDate)}　|　총무 작성</div></div><div><span class="reportRibbon">${esc(r.kind||'정기모임')} 계획 및 결과보고서</span><img class="headerMascot" src="report-cat.png"></div></div>
 <div class="reportTwoCol"><div class="a4Section"><h3>1. 모임(여행) 개요</h3><div class="meetingInfo"><div><b>구분</b>${esc(r.kind||'정기모임')}</div><div><b>장소</b>${esc(r.place)}</div><div><b>기간</b>${String(r.start).replace('T',' ')} ~ ${String(r.end).replace('T',' ')}</div><div><b>인원</b>계획 ${Number(r.expectedPeople||state.members.length)}명 / 참석 ${att}명</div><div style="grid-column:span 2"><b>목적</b>${esc(r.purpose||r.agenda||'-')}</div></div></div><div class="a4Section"><h3>2. 세부 일정</h3><div class="reportBox"><table class="a4Table"><tr><th>시간</th><th>일정·장소</th><th>담당</th></tr>${scheduleRows}</table></div></div></div>
 <div class="reportTwoCol"><div class="a4Section"><h3>3. 예산 계획</h3><div class="settleCards"><div>계획 예산<b>${won(plan)}</b></div><div>실제 지출<b>${won(total)}</b></div><div class="${difference>=0?'green':'red'}">차액<b>${won(Math.abs(difference))}</b></div><div>1인당 지출<b>${won(att?Math.round(total/att):0)}</b></div></div><div class="reportBox"><table class="a4Table"><tr><th>No.</th><th>실제 지출 항목</th><th>금액</th></tr>${expenseRows}<tr><td colspan="2">총 지출</td><td>${won(total)}</td></tr></table></div></div><div class="a4Section"><h3>4. 참석자 현황</h3><div class="memberDots" style="grid-template-columns:repeat(3,1fr)">${dots||'<div class="memoBox">미입력</div>'}</div></div></div>
 <div class="reportTwoCol"><div class="a4Section"><h3>5. 모임(여행) 사진</h3><div class="reportPhotos">${photoHtml(r.photos,r.representativePhoto||0)}</div></div><div class="a4Section"><h3>6. 결과 및 최종 정산</h3><div class="memoBox">${esc(r.result||r.agenda||'결과 미입력')}</div><div class="balanceStrip" style="margin-top:6px"><div>계획<b>${won(plan)}</b></div><div>실제<b>${won(total)}</b></div><div class="last">차액<b>${won(difference)}</b></div><div>잔액<b>${won(after)}</b></div></div></div></div>
 <div class="a4Section"><h3>7. 총무 의견 및 개선점</h3><div class="memoBox">${esc(r.memo||'다음 모임 일정은 추후 공지합니다.')}</div></div>
 <div class="a4Foot"><span class="reportFooterBrand">🌶️ ${state.groupName}는 서로를 존중하고 함께 즐기는 모임입니다. ❤️</span><div class="sign">총무<br>확인</div></div>`;
}

function renderAttendanceGrid(selected=[]){
 const chosen=new Set(selected||[]);
 $('#attendanceGrid').innerHTML=state.members.map(m=>`<label class="attendanceItem">${memberAvatarHtml(m,true)}<input type="checkbox" data-attendee="${esc(m.name)}" ${chosen.has(m.name)?'checked':''}><span><b>${esc(m.name)}</b><div class="small">참석</div></span></label>`).join('');
}

function selectedAttendees(){
 return $$('#attendanceGrid [data-attendee]:checked').map(x=>x.dataset.attendee)
}


function expenseRowHtml(item='',amount=''){
 return `<div class="expenseRow"><input class="field exItem" placeholder="지출 항목" value="${esc(item)}"><input class="field exAmount" type="number" placeholder="금액" value="${amount||''}"><button type="button" class="btn danger exDelete">×</button></div>`
}

function bindExpenseDeletes(){$$('#expenseRows .exDelete').forEach(b=>b.onclick=()=>b.parentElement.remove())}

function addExpenseRow(item='',amount=''){$('#expenseRows').insertAdjacentHTML('beforeend',expenseRowHtml(item,amount));bindExpenseDeletes()}

function openMeetingEditor(id=null){
 if(!requireAdmin())return;editingMeetingId=id;
 const r=(state.meetingReports||[]).find(x=>x.id===id);
 $('#meetingModalTitle').textContent=r?'모임(여행) 계획·결과 수정':'모임(여행) 계획·결과 작성';
 $('#mrKind').value=r?.kind||'정기모임';$('#mrExpectedPeople').value=r?.expectedPeople||state.members.length;
 $('#mrTitle').value=r?.title||'';$('#mrPlace').value=r?.place||'';
 $('#mrStart').value=r?.start||new Date().toISOString().slice(0,16);
 $('#mrEnd').value=r?.end||new Date(Date.now()+3*3600000).toISOString().slice(0,16);
 $('#mrPurpose').value=r?.purpose||'';$('#mrSchedule').value=r?.schedule||'';$('#mrPlanBudget').value=r?.planBudget||'';
 renderAttendanceGrid(r?.attendees||[]);$('#mrAttendees').value=(r?.attendees||[]).join(', ');
 $('#mrAgenda').value=r?.agenda||'';$('#mrResult').value=r?.result||'';$('#mrMemo').value=r?.memo||'';editingMeetingPhotos=[...(r?.photos||[])];editingRepresentative=Number(r?.representativePhoto||0);renderPhotoPreview();
 $('#expenseRows').innerHTML='';(r?.expenses?.length?r.expenses:[{item:'식사비',amount:''}]).forEach(x=>addExpenseRow(x.item,x.amount));
 $('#deleteMeetingReport').style.display=r?'block':'none';$('#meetingModal').classList.add('show')
}

function saveMeeting(){
 if(!requireAdmin())return;
 const title=$('#mrTitle').value.trim(),place=$('#mrPlace').value.trim(),start=$('#mrStart').value,end=$('#mrEnd').value;
 if(!title||!place||!start||!end)return alert('제목, 장소, 모임기간을 입력하세요.');
 const expenses=$$('#expenseRows .expenseRow').map(row=>({item:row.querySelector('.exItem').value.trim(),amount:Number(row.querySelector('.exAmount').value)||0})).filter(x=>x.item);
 const newId=editingMeetingId||'mr'+Date.now();const old=state.meetingReports.find(x=>x.id===editingMeetingId);const obj={id:newId,kind:$('#mrKind').value,expectedPeople:Number($('#mrExpectedPeople').value)||state.members.length,title,place,start,end,purpose:$('#mrPurpose').value.trim(),schedule:$('#mrSchedule').value.trim(),planBudget:Number($('#mrPlanBudget').value)||0,attendees:selectedAttendees(),agenda:$('#mrAgenda').value.trim(),result:$('#mrResult').value.trim(),expenses,memo:$('#mrMemo').value.trim(),photos:[...editingMeetingPhotos],representativePhoto:editingRepresentative,createdDate:old?.createdDate||reportDateText(),approved:true,reportNo:old?.reportNo||reportNumber('meeting',start,newId)};
 const i=state.meetingReports.findIndex(x=>x.id===editingMeetingId);if(i>=0)state.meetingReports[i]=obj;else state.meetingReports.push(obj);
 selectedMeetingId=obj.id;save();closeModal('meetingModal');render();renderMeetingA4(obj.id)
}

function deleteMeeting(){
 if(!editingMeetingId||!confirm('이 모임보고서를 삭제할까요?'))return;
 state.meetingReports=state.meetingReports.filter(x=>x.id!==editingMeetingId);if(selectedMeetingId===editingMeetingId)selectedMeetingId=null;
 save();closeModal('meetingModal');$('#meetingA4').style.display='none';$('#meetingActions').style.display='none';render()
}
