function renderReport(){
 renderMonthlyA4();renderMonthCloseStatus();
 renderMeetingList();
 if(selectedMeetingId)renderMeetingA4(selectedMeetingId);
}

function renderMonthlyA4(){
 const m=$('#reportMonth').value||nowMonth(),s=summary(m),snapshot=state.monthlyReports[m];
 const arrearsTotal=state.members.reduce((a,x)=>a+arrears(x,m),0), paid=state.members.filter(x=>paidFor(x,m)>=x.fee).length;
 const memberRows=state.members.map(mem=>{const p=paidFor(mem,m),lack=Math.max(0,mem.fee-p);return `<tr><td>${esc(mem.name)}</td><td>${won(mem.fee)}</td><td>${won(p)}</td><td>${lack?won(lack):'완납'}</td></tr>`}).join('');
 const dots=state.members.map(mem=>`<div class="memberDot">${memberAvatarHtml(mem,true)}<b>${esc(mem.name)}</b><small>${paidFor(mem,m)>=mem.fee?'● 완납':'○ 미납'}</small></div>`).join('');
 $('#monthlyA4').innerHTML=`
 <div class="a4Header"><div><div class="reportBrand"><img src="mascot.png"><div><div class="reportBrandName">🌶️ ${state.groupName}</div><div class="reportSlogan">함께하는 즐거움, 소중한 인연</div></div></div><h1>${m.slice(0,4)}년 <em>${Number(m.slice(5,7))}월</em> 월 회계보고서</h1><div class="small">작성일 ${snapshot?.createdDate||reportDateText()}　|　총무 작성</div></div><div><span class="reportRibbon">월 회계보고서</span><img class="headerMascot" src="report-cat.png"></div></div>
 <div class="a4Section"><h3>월별 요약</h3><div class="summaryCards"><div class="summaryCard"><div class="ico">🪙</div><span>전월 이월잔액</span><b>${won(s.opening)}</b></div><div class="summaryCard"><div class="ico">👥</div><span>회비 수입</span><b>${won(s.dues)}</b></div><div class="summaryCard"><div class="ico">🌱</div><span>이자·기타수입</span><b>${won(s.interest+s.otherIn)}</b></div><div class="summaryCard bad"><div class="ico">💸</div><span>총 지출</span><b>${won(s.out)}</b></div><div class="summaryCard good" style="grid-column:span 4"><div class="ico">👛</div><span>월말 잔액</span><b>${won(s.closing)}</b></div></div></div>
 <div class="reportTwoCol"><div><div class="a4Section"><h3>수입 / 지출 내역</h3><div class="reportBox"><table class="a4Table"><tr><th>구분</th><th>항목</th><th>금액</th></tr><tr><td>수입</td><td>회비</td><td>${won(s.dues)}</td></tr><tr><td>수입</td><td>이자·기타</td><td>${won(s.interest+s.otherIn)}</td></tr><tr><td>지출</td><td>총 지출</td><td>${won(s.out)}</td></tr><tr><td colspan="2">당월 증감</td><td>${won(s.dues+s.interest+s.otherIn-s.out)}</td></tr></table></div></div></div><div><div class="a4Section"><h3>회원별 회비 납부 현황</h3><div class="reportBox"><table class="a4Table"><tr><th>회원</th><th>월회비</th><th>납부액</th><th>상태</th></tr>${memberRows}</table></div></div></div></div>
 <div class="a4Section"><h3>회원 현황 · ${paid}/${state.members.length}명 완납</h3><div class="memberDots">${dots}</div></div>
 <div class="a4Section"><h3>통장 잔액 현황</h3><div class="balanceStrip"><div>전월 잔액<b>${won(s.opening)}</b></div><div>금월 수입<b>${won(s.dues+s.interest+s.otherIn)}</b></div><div>금월 지출<b>${won(s.out)}</b></div><div class="last">금월 잔액<b>${won(s.closing)}</b></div></div></div>
 <div class="reportTwoCol"><div class="a4Section"><h3>미수금 현황</h3><div class="summaryCards" style="grid-template-columns:1fr 1fr"><div class="summaryCard bad"><span>총 미수금</span><b>${won(arrearsTotal)}</b></div><div class="summaryCard good"><span>미납 회원</span><b>${state.members.length-paid}명</b></div></div></div><div class="a4Section"><h3>총무 의견</h3><div class="memoBox">${esc(snapshot?.memo||'회비 입금 및 장부 내역을 확인했습니다. 즐거운 모임을 준비하겠습니다. 😊')}</div></div></div>
 <div class="a4Foot"><span class="reportFooterBrand">🌶️ ${state.groupName}는 서로를 존중하고 함께 즐기는 모임입니다.</span><div class="sign">총무<br>확인</div></div>`;
}


function renderMonthCloseStatus(){
 const m=$('#reportMonth').value||nowMonth(),closed=state.closedMonths?.[m];
 $('#monthCloseStatus').innerHTML=closed?`<div class="closedNotice">🔒 ${m.replace('-','년 ')}월 마감 완료 · ${new Date(closed.date).toLocaleString('ko-KR')} · 총무 확정 거래는 잠겨 있습니다.</div>`:'';
 $('#closeMonthBtn').textContent=closed?'마감 해제':'월 마감';
 $('#closeMonthBtn').className=closed?'btn line':'btn danger'
}

function toggleMonthClose(){
 if(!requireAdmin())return;
 const m=$('#reportMonth').value||nowMonth(),closed=state.closedMonths?.[m];
 if(closed){
  const pin=prompt('마감을 해제하려면 총무 PIN을 입력하세요.');
  if(pin!==state.adminPin)return alert('PIN이 올바르지 않습니다.');
  if(!confirm(`${m.replace('-','년 ')}월 마감을 해제할까요?`))return;
  delete state.closedMonths[m];save();render();alert('월 마감을 해제했습니다.')
 }else{
  const review=summary(m).review;
  if(review>0&&!confirm(`확인 필요 거래가 ${review}건 있습니다. 그래도 마감할까요?`))return;
  if(!state.monthlyReports[m]?.confirmed&&!confirm('월 회계보고서가 아직 확정되지 않았습니다. 보고서도 자동 확정하고 마감할까요?'))return;
  if(!state.monthlyReports[m]?.confirmed)state.monthlyReports[m]={createdDate:reportDateText(),memo:'월 마감 시 자동 확정',confirmed:true};
  state.closedMonths[m]={date:new Date().toISOString(),by:'총무'};save();render();alert(`${m.replace('-','년 ')}월 마감이 완료되었습니다.`)
 }
}


function finalizeMonthly(){
 if(!requireAdmin())return;
 const m=$('#reportMonth').value||nowMonth();
 const memo=prompt('총무 의견 또는 특이사항을 입력하세요.','특이사항 없음');
 if(memo===null)return;
 state.monthlyReports[m]={createdDate:reportDateText(),memo,confirmed:true};
 save();renderMonthlyA4();alert(`${m.replace('-','년 ')}월 회계보고서를 확정했습니다.`);
}

function reportNumber(kind,dateText,id=''){
 const d=String(dateText||new Date().toISOString()).slice(0,10).replaceAll('-','');
 const tail=String(id||Date.now()).replace(/\D/g,'').slice(-3).padStart(3,'0');
 return `${kind==='monthly'?'M':'G'}-${d}-${tail}`;
}

function loadCanvasImage(src){
 return new Promise(resolve=>{
  const img=new Image();
  img.onload=()=>resolve(img);
  img.onerror=()=>resolve(null);
  img.src=src;
 })
}

function roundRect(ctx,x,y,w,h,r,fill,stroke){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 if(fill){ctx.fillStyle=fill;ctx.fill()}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
}

function fitText(ctx,text,maxWidth,startSize,minSize=18,weight='700'){
 let size=startSize;
 while(size>minSize){ctx.font=`${weight} ${size}px sans-serif`;if(ctx.measureText(String(text)).width<=maxWidth)break;size-=1}
 return size
}

function canvasText(ctx,text,x,y,size=28,weight='400',color='#241b19',align='left'){
 ctx.font=`${weight} ${size}px sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(text),x,y)
}

function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=5){
 const words=String(text||'').split(/\s+/);let line='',lines=[];
 for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}
 if(line)lines.push(line);lines=lines.slice(0,maxLines);lines.forEach((v,i)=>ctx.fillText(v,x,y+i*lineHeight));return lines.length*lineHeight
}

function drawHeaderBrand(ctx,title,subtitle,mascot,tuna){
 roundRect(ctx,28,26,1184,170,26,'#fffaf4','#eaa99b');
 if(mascot){ctx.save();ctx.beginPath();ctx.arc(105,105,58,0,Math.PI*2);ctx.clip();ctx.drawImage(mascot,47,47,116,116);ctx.restore();ctx.strokeStyle='#d93429';ctx.lineWidth=5;ctx.beginPath();ctx.arc(105,105,58,0,Math.PI*2);ctx.stroke()}
 canvasText(ctx,'고추참치회 🌶️',180,85,43,'900','#c92720');
 canvasText(ctx,'함께하는 즐거움, 소중한 인연',182,122,20,'600','#6e554f');
 const fs=fitText(ctx,title,760,54,34,'900');canvasText(ctx,title,180,177,fs,'900','#341c18');
 if(tuna)ctx.drawImage(tuna,1025,45,135,115);
 canvasText(ctx,subtitle,1190,177,20,'600','#735d58','right');
}

function drawSectionRibbon(ctx,num,title,x,y,w=1160){
 roundRect(ctx,x,y,Math.min(w,360),44,8,'#d73529');
 canvasText(ctx,`${num}. ${title}`,x+18,y+31,23,'900','#fff');
}

function drawSummaryCard(ctx,x,y,w,h,icon,label,value,tone='blue'){
 const fills={blue:'#f6f9ff',green:'#f2fbf2',red:'#fff4f2',orange:'#fff9ef'};
 const colors={blue:'#173f75',green:'#18723d',red:'#ce2b24',orange:'#8b5b00'};
 roundRect(ctx,x,y,w,h,18,fills[tone]||'#fff','#ead8d0');
 canvasText(ctx,icon,x+w/2,y+42,30,'400','#333','center');
 canvasText(ctx,label,x+w/2,y+72,17,'700','#675752','center');
 const fs=fitText(ctx,value,w-20,27,20,'900');canvasText(ctx,value,x+w/2,y+112,fs,'900',colors[tone]||'#222','center');
}

function drawTable(ctx,x,y,width,headers,rows,colWidths,rowH=40){
 const total=colWidths.reduce((a,b)=>a+b,0),scale=width/total;let cy=y;
 roundRect(ctx,x,cy,width,rowH,8,'#fff0e9','#e4cfc8');
 let cx=x;headers.forEach((h,i)=>{const cw=colWidths[i]*scale;canvasText(ctx,h,cx+cw/2,cy+27,17,'800','#56362f','center');cx+=cw});cy+=rowH;
 rows.forEach((row,ri)=>{ctx.fillStyle=ri%2?'#fffaf7':'#fff';ctx.fillRect(x,cy,width,rowH);ctx.strokeStyle='#eadbd5';ctx.strokeRect(x,cy,width,rowH);cx=x;row.forEach((v,i)=>{const cw=colWidths[i]*scale;canvasText(ctx,v,i===0?cx+10:cx+cw-10,cy+27,16,ri===rows.length-1?'800':'500',ri===rows.length-1?'#b7251e':'#3e312e',i===0?'left':'right');ctx.strokeStyle='#eadbd5';ctx.beginPath();ctx.moveTo(cx+cw,cy);ctx.lineTo(cx+cw,cy+rowH);ctx.stroke();cx+=cw});cy+=rowH});return cy
}


async function drawApprovalAssets(ctx,x,y,approved=true){
 const sigSrc=state.reportAssets?.signature,stampSrc=state.reportAssets?.stamp;
 if(approved){
  if(stampSrc){const stamp=await loadCanvasImage(stampSrc);if(stamp)ctx.drawImage(stamp,x,y,92,92)}
  else{roundRect(ctx,x,y,92,92,46,'#fff0e9','#d73529');canvasText(ctx,'승인',x+46,y+40,22,'900','#c7251d','center');canvasText(ctx,'완료',x+46,y+67,19,'900','#c7251d','center')}
 }
 if(sigSrc){const sig=await loadCanvasImage(sigSrc);if(sig)ctx.drawImage(sig,x+115,y+12,190,70)}
 else{canvasText(ctx,'총무 서명',x+130,y+55,22,'800','#402d29')}
}



async function drawMemberAvatarCanvas(ctx,mem,cx,cy,r=42){
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.closePath();ctx.fillStyle='#fff1e8';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#e9b9a8';ctx.stroke();ctx.clip();
 if(mem?.photo){
  const img=await loadCanvasImage(mem.photo);
  if(img){const size=r*2,ratio=Math.max(size/img.width,size/img.height),dw=img.width*ratio,dh=img.height*ratio;ctx.drawImage(img,cx-dw/2,cy-dh/2,dw,dh)}
  ctx.restore();
 }else{
  ctx.restore();canvasText(ctx,mem?.avatar||'🐱',cx,cy+r*.38,Math.round(r*1.15),'400','#3b2b27','center');
 }
}


async function drawMonthlyReportCanvas(){
 const c=document.createElement('canvas');c.width=1240;c.height=1754;const ctx=c.getContext('2d');
 ctx.fillStyle='#fffaf4';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#d9362b';ctx.fillRect(0,0,c.width,16);
 const [mascot,tuna]=await Promise.all([loadCanvasImage('mascot.png'),loadCanvasImage('report-cat.png')]);
 const m=$('#reportMonth').value||nowMonth(),sum=summary(m),snapshot=state.monthlyReports[m],arrearsTotal=state.members.reduce((a,v)=>a+arrears(v,m),0);
 drawHeaderBrand(ctx,`${m.slice(0,4)}년 ${Number(m.slice(5,7))}월 월 회계보고서`,`${snapshot?'총무 확정':'미확정'} · ${snapshot?.createdDate||reportDateText()}`,mascot,tuna);
 drawSectionRibbon(ctx,1,'월별 요약',40,220);
 const cards=[['🪙','전월 이월잔액',won(sum.opening),'blue'],['👥','회비 수입',won(sum.dues),'blue'],['🌱','이자·기타수입',won(sum.interest+sum.otherIn),'green'],['💸','총 지출',won(sum.out),'red'],['👛','월말 잔액',won(sum.closing),'green'],['⚠️','총 미수금',won(arrearsTotal),'red']];
 cards.forEach((v,i)=>drawSummaryCard(ctx,40+i*193,278,178,118,...v));
 drawSectionRibbon(ctx,2,'수입 / 지출 내역',40,420,560);drawSectionRibbon(ctx,3,'회원별 회비 납부 현황',630,420,570);
 const finRows=[['회비 수입',won(sum.dues),'회원 회비'],['이자 수입',won(sum.interest),'카카오뱅크'],['기타 수입',won(sum.otherIn),'-'],['수입 합계',won(sum.dues+sum.interest+sum.otherIn),''],['총 지출',won(sum.out),'-']];
 drawTable(ctx,40,476,550,['항목','금액','비고'],finRows,[2.2,1.4,1.6],43);
 const memberRows=state.members.map(mem=>[mem.name,won(mem.fee),won(paidFor(mem,m)),arrears(mem,m)?won(arrears(mem,m)):'완납']);
 drawTable(ctx,630,476,570,['회원','월 회비','납부액','상태'],memberRows,[1.4,1.4,1.4,1.2],43);
 drawSectionRibbon(ctx,4,`회원 현황 · ${state.members.filter(v=>paidFor(v,m)>=v.fee).length}/${state.members.length}명 완납`,40,770,1160);
 roundRect(ctx,40,828,1160,190,18,'#fff','#ecd5cc');
 const count=Math.max(1,state.members.length),gap=1160/count;
 for(let i=0;i<state.members.length;i++){const mem=state.members[i],cx=40+gap*i+gap/2;await drawMemberAvatarCanvas(ctx,mem,cx,884,48);canvasText(ctx,mem.name,cx,958,20,'800','#402d29','center');const complete=paidFor(mem,m)>=mem.fee;canvasText(ctx,complete?'● 완납':'○ 미납',cx,987,17,'700',complete?'#178143':'#cf2822','center')}
 drawSectionRibbon(ctx,5,'통장 잔액 현황',40,1050,760);drawSectionRibbon(ctx,6,'미수금 현황',830,1050,370);
 const balRows=[['전월 잔액',won(sum.opening)],['금월 수입',won(sum.dues+sum.interest+sum.otherIn)],['금월 지출',won(sum.out)],['금월 잔액',won(sum.closing)]];
 drawTable(ctx,40,1106,750,['구분','금액'],balRows,[1.6,1.4],43);
 roundRect(ctx,830,1106,370,205,18,'#fff','#ecd5cc');canvasText(ctx,'총 미수금',1015,1160,22,'800','#5f4944','center');canvasText(ctx,won(arrearsTotal),1015,1220,42,'900',arrearsTotal?'#cf2822':'#178143','center');canvasText(ctx,`미납 회원 ${state.members.filter(v=>arrears(v,m)>0).length}명`,1015,1265,19,'700','#6d5954','center');
 drawSectionRibbon(ctx,7,'총무 의견',40,1340,1160);roundRect(ctx,40,1398,1160,170,18,'#fff','#ecd5cc');ctx.font='24px sans-serif';ctx.fillStyle='#463632';wrapCanvasText(ctx,snapshot?.memo||'특이사항 없음',70,1450,1080,39,3);
 canvasText(ctx,`${snapshot?.createdDate||reportDateText()}`,760,1600,21,'600','#66524d');await drawApprovalAssets(ctx,875,1572,!!snapshot);
 roundRect(ctx,28,1662,1184,64,0,'#f7d5c9');canvasText(ctx,'🌶️  고추참치회는 서로를 존중하고 함께 즐기는 모임입니다.  🐟',620,1703,22,'800','#b52b23','center');
 return c
}

async function drawMeetingReportCanvas(){
 const r=(state.meetingReports||[]).find(v=>v.id===selectedMeetingId);if(!r)return null;
 const c=document.createElement('canvas');c.width=1240;c.height=1754;const ctx=c.getContext('2d');ctx.fillStyle='#fffaf4';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#d9362b';ctx.fillRect(0,0,c.width,16);
 const [mascot,tuna]=await Promise.all([loadCanvasImage('mascot.png'),loadCanvasImage('report-cat.png')]);
 const total=sumMeetingExpenses(r),att=(r.attendees||[]).length,plan=Number(r.planBudget||0),difference=plan-total;
 drawHeaderBrand(ctx,`${r.kind||'모임'} 계획 및 결과보고서`,`총무 작성 · ${r.createdDate||reportDateText()}`,mascot,tuna);
 drawSectionRibbon(ctx,1,'모임(여행) 개요',40,220,560);drawSectionRibbon(ctx,2,'세부 일정',630,220,570);
 const infoRows=[['제목',r.title],['장소',r.place],['기간',`${String(r.start).replace('T',' ')} ~ ${String(r.end).replace('T',' ')}`],['인원',`계획 ${Number(r.expectedPeople||state.members.length)}명 / 참석 ${att}명`],['목적',r.purpose||r.agenda||'-']];
 drawTable(ctx,40,276,550,['구분','내용'],infoRows,[1.1,2.9],42);
 const schedules=parseMeetingSchedule(r.schedule).slice(0,5).map(x=>[x.time,x.activity,x.owner]);if(!schedules.length)schedules.push(['-','등록된 일정 없음','-']);
 drawTable(ctx,630,276,570,['시간','일정·장소','담당'],schedules,[1,2.6,1],42);
 drawSectionRibbon(ctx,3,'예산 계획',40,550,560);drawSectionRibbon(ctx,4,'참석자 현황',630,550,570);
 drawSummaryCard(ctx,40,608,170,108,'📋','계획 예산',won(plan),'blue');drawSummaryCard(ctx,225,608,170,108,'💸','실제 지출',won(total),'red');drawSummaryCard(ctx,410,608,170,108,'💰','차액',won(difference),difference>=0?'green':'red');
 const expRows=(r.expenses||[]).slice(0,4).map(x=>[x.item,won(x.amount)]);if(!expRows.length)expRows.push(['지출 없음','0원']);expRows.push(['합계',won(total)]);drawTable(ctx,40,734,550,['항목','금액'],expRows,[2.2,1.2],38);
 roundRect(ctx,630,608,570,324,18,'#fff','#ead6ce');const people=r.attendees||[];
 for(let i=0;i<Math.min(people.length,12);i++){const name=people[i],mem=state.members.find(v=>v.name===name),col=i%6,row=Math.floor(i/6),cx=706+col*88,cy=674+row*124;await drawMemberAvatarCanvas(ctx,mem||{name,avatar:'🐱'},cx,cy,36);canvasText(ctx,name,cx,cy+58,16,'800','#47332f','center');canvasText(ctx,'참석',cx,cy+80,13,'700','#178143','center')}
 if(!people.length)canvasText(ctx,'참석자를 입력해 주세요.',915,770,22,'700','#8b7771','center');
 drawSectionRibbon(ctx,5,'모임(여행) 사진',40,970,760);drawSectionRibbon(ctx,6,'결과 및 최종 정산',830,970,370);
 const ordered=[...(r.photos||[])];const ri=Number(r.representativePhoto||0);if(ordered.length&&ri>0&&ri<ordered.length){const [main]=ordered.splice(ri,1);ordered.unshift(main)}
 for(let i=0;i<3;i++){const x=40+i*253;roundRect(ctx,x,1028,235,230,16,'#f5eee9','#dfc9c0');if(ordered[i]){const ph=await loadCanvasImage(ordered[i]);if(ph){const ratio=Math.max(235/ph.width,230/ph.height),dw=ph.width*ratio,dh=ph.height*ratio;ctx.save();ctx.beginPath();ctx.rect(x,1028,235,230);ctx.clip();ctx.drawImage(ph,x+(235-dw)/2,1028+(230-dh)/2,dw,dh);ctx.restore()}}else{canvasText(ctx,'📷',x+118,1120,50,'400','#7d6963','center');canvasText(ctx,`여행 사진 ${i+1}`,x+118,1180,18,'700','#7d6963','center')}}
 roundRect(ctx,830,1028,370,230,18,'#fff','#ead6ce');canvasText(ctx,'계획 예산',860,1072,18,'700','#6d5954');canvasText(ctx,won(plan),1170,1072,21,'900','#173f75','right');canvasText(ctx,'실제 지출',860,1117,18,'700','#6d5954');canvasText(ctx,won(total),1170,1117,21,'900','#cf2822','right');canvasText(ctx,'차액',860,1162,18,'700','#6d5954');canvasText(ctx,won(difference),1170,1162,21,'900',difference>=0?'#178143':'#cf2822','right');ctx.font='18px sans-serif';ctx.fillStyle='#493733';wrapCanvasText(ctx,r.result||r.agenda||'결과를 입력해 주세요.',860,1210,310,28,2);
 drawSectionRibbon(ctx,7,'총무 의견 및 개선점',40,1300,1160);roundRect(ctx,40,1358,1160,205,18,'#fff','#ead6ce');ctx.font='23px sans-serif';ctx.fillStyle='#493733';wrapCanvasText(ctx,r.memo||'다음 모임을 위한 의견을 입력해 주세요.',70,1410,1100,38,4);
 canvasText(ctx,r.createdDate||reportDateText(),760,1595,20,'600','#66524d');await drawApprovalAssets(ctx,875,1560,true);
 roundRect(ctx,28,1640,1184,76,0,'#f7d5c9');canvasText(ctx,'🌶️  고추참치회는 서로를 존중하고 함께 즐기는 모임입니다.  🐟',620,1688,22,'800','#b52b23','center');
 return c
}

async function canvasToPngBlob(canvas,retries=3){
 let lastErr;
 for(let i=0;i<retries;i++){
  try{
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error('PNG 변환 실패')),'image/png'));
   if(blob.size>1000)return blob;
  }catch(e){lastErr=e}
  await new Promise(r=>setTimeout(r,350*(i+1)));
 }
 throw lastErr||new Error('PNG 생성 실패')
}

async function saveReportPng(type,share=false){
 if(!requireAdmin())return;
 const btn=type==='monthly'?$('#monthlyPng'):$('#meetingPng');const oldText=btn?.textContent;
 try{
  if(btn){btn.disabled=true;btn.textContent='사진 생성 중…'}
  const c=type==='monthly'?await drawMonthlyReportCanvas():await drawMeetingReportCanvas();
  if(!c)return alert('먼저 보고서를 선택하세요.');
  const blob=await canvasToPngBlob(c,3);
  const m=$('#reportMonth').value||nowMonth();
  const r=(state.meetingReports||[]).find(v=>v.id===selectedMeetingId);
  const safe=s=>String(s||'보고서').replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,'_');
  const name=type==='monthly'?`고추참치회_${m.replace('-','년')}월_월회계보고서.png`:`고추참치회_${safe(r?.title)}.png`;
  const file=new File([blob],name,{type:'image/png'});
  if(share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:name,files:[file]})}
  else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},4000)}
 }catch(err){
  console.error('PNG 저장 오류',err);
  alert('사진 저장에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도하세요. 계속 실패하면 Chrome에서 실행해 주세요.');
 }finally{if(btn){btn.disabled=false;btn.textContent=oldText}}
}

function printReport(type){
 if(!requireAdmin())return;
 const src=type==='monthly'?$('#monthlyA4'):$('#meetingA4');
 if(!src||src.style.display==='none')return alert('먼저 보고서를 선택하세요.');
 const w=window.open('','_blank');
 const linkedStyles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>`<link rel="stylesheet" href="${link.href}">`).join('');
 w.document.write(`<html><head><meta charset="utf-8"><base href="${location.href}"><title>고추참치회 보고서</title>${linkedStyles}<style>body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif}.a4{width:190mm;min-height:277mm;padding:10mm}.a4Header{display:flex;justify-content:space-between;border-bottom:3px solid #e65f54}.a4Header img{width:65px}.a4Meta{display:grid;grid-template-columns:1fr 1fr;gap:6px}.a4Meta div,.a4Section div{padding:6px}.a4Table{width:100%;border-collapse:collapse}.a4Table th,.a4Table td{border:1px solid #bbb;padding:6px}.a4Summary{display:grid;grid-template-columns:1fr 1fr}.a4Summary div{display:flex;justify-content:space-between}.a4Section h3{background:#fff0ec;padding:6px}.a4Foot{display:flex;justify-content:space-between;margin-top:20px}.sign{border-top:1px solid #333;width:120px;text-align:center}@page{size:A4;margin:10mm}
/* V5.1 REPORT DESIGN */
.a4{background:linear-gradient(180deg,#fffdfa,#fff9f3);border:1px solid #efb8aa;border-radius:18px;padding:18px;box-shadow:0 14px 40px rgba(139,42,28,.14);position:relative;font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif}
.a4:before{content:"";position:absolute;inset:0;border:7px solid rgba(230,95,84,.045);border-radius:18px;pointer-events:none}
.reportBrand{display:flex;align-items:center;gap:10px}.reportBrand img{width:68px;height:68px;border-radius:50%;border:3px solid #d9362b;object-fit:cover;background:#fff}.reportBrandName{font-size:20px;font-weight:950;color:#c6251d}.reportSlogan{font-size:10px;color:#79625c;margin-top:2px}
.a4Header{border:0;padding:0 0 10px;margin-bottom:9px;align-items:flex-start}.a4Header h1{font-size:25px;letter-spacing:-1px;color:#361c18}.a4Header h1 em{font-style:normal;color:#d52e24}.headerMascot{width:105px!important;height:92px!important;border:0!important;border-radius:20px!important;object-fit:cover!important}.reportRibbon{display:inline-block;background:linear-gradient(135deg,#d72d22,#f0614d);color:#fff;padding:5px 14px;border-radius:4px 16px 4px 16px;font-size:12px;font-weight:900;box-shadow:0 4px 10px #e75b4a44}
.a4Meta{grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:9px}.a4Meta div{background:#fff;border:1px solid #f0d3ca;border-radius:10px;padding:6px 7px;font-size:9px}.a4Meta b{display:block;color:#c72c23;font-size:9px;margin-bottom:2px}
.a4Section{margin-top:9px;position:relative}.a4Section h3{display:inline-block;font-size:12px;color:#fff;background:linear-gradient(90deg,#ce3025,#ec5a45);border:0;border-radius:5px 13px 3px 5px;padding:5px 15px 5px 9px;margin:0 0 6px;box-shadow:0 3px 8px #db493333}.a4Section h3:before{content:"🌶️";font-size:10px;margin-right:4px}
.summaryCards{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.summaryCard{background:#fff;border:1px solid #ecd8d0;border-radius:11px;padding:8px 5px;text-align:center;min-height:66px}.summaryCard .ico{font-size:18px}.summaryCard span{display:block;font-size:9px;color:#6f5d58;margin:2px 0}.summaryCard b{font-size:13px;color:#173f75}.summaryCard.good{background:#f4fbf3}.summaryCard.good b{color:#16713d}.summaryCard.bad{background:#fff4f2}.summaryCard.bad b{color:#cf2822}
.reportTwoCol{display:grid;grid-template-columns:1fr 1.06fr;gap:7px}.reportBox{background:#fff;border:1px solid #efd9d1;border-radius:11px;padding:7px}.a4Table{font-size:9px;border-radius:8px;overflow:hidden}.a4Table th,.a4Table td{padding:4px;border:1px solid #eadbd5}.a4Table th{background:#fff0e9;color:#60342c}.a4Table tr:last-child{font-weight:900;background:#fff6f1}.a4Table th:first-child,.a4Table td:first-child{position:static}
.memberDots{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.memberDot{text-align:center;background:#fff;border:1px solid #efd8cf;border-radius:12px;padding:6px 2px}.memberDot .avatar{width:34px;height:34px;border-radius:50%;margin:auto;background:#fff1e6;display:flex;align-items:center;justify-content:center;font-size:21px;border:1px solid #efc9ba}.memberDot b{display:block;font-size:8px;margin-top:3px}.memberDot small{font-size:8px;color:#178043}
.memoBox{background:linear-gradient(135deg,#fff,#fff3e9);border:1px solid #efd6c9;border-radius:11px;min-height:50px;padding:8px;font-size:10px;line-height:1.55}.balanceStrip{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid #e7d2ca;border-radius:10px;overflow:hidden}.balanceStrip div{text-align:center;padding:7px 3px;border-right:1px solid #eadbd5;font-size:8px}.balanceStrip div:last-child{border:0}.balanceStrip b{display:block;font-size:11px;margin-top:3px}.balanceStrip .last b{color:#168048}
.a4Foot{border-top:1px dashed #e4bfb4;padding-top:8px;margin-top:10px;align-items:center}.reportFooterBrand{font-weight:850;color:#d03327}.sign{border:0;width:auto;background:#fff0e9;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;color:#c92720;font-weight:900;transform:rotate(-8deg);outline:2px solid #d84a3e;outline-offset:-5px;padding:0}
.meetingInfo{display:grid;grid-template-columns:1fr 1fr;gap:5px}.meetingInfo div{background:#fff;border:1px solid #eed8d0;border-radius:9px;padding:7px;font-size:9px}.meetingInfo b{color:#c82c22;margin-right:4px}.settleCards{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.settleCards div{text-align:center;background:#fff;border:1px solid #ead7cf;border-radius:11px;padding:8px 3px;font-size:8px}.settleCards b{display:block;font-size:12px;margin-top:4px}.settleCards .green b{color:#16723d}.photoPlaceholders{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.photoPlaceholder{height:72px;border-radius:10px;background:linear-gradient(135deg,#f1d3bd,#ffe7d8);display:flex;align-items:center;justify-content:center;font-size:25px;border:1px solid #e7c5b7}.reportActions .btn{box-shadow:0 4px 12px rgba(89,42,34,.08)}
@media(max-width:520px){.a4{padding:10px;min-height:720px}.a4Header h1{font-size:18px}.headerMascot{width:74px!important;height:68px!important}.reportBrand img{width:46px;height:46px}.reportBrandName{font-size:15px}.summaryCard{padding:5px 2px;min-height:57px}.summaryCard b{font-size:10px}.a4Meta{grid-template-columns:1fr 1fr}.reportTwoCol{grid-template-columns:1fr}.photoPlaceholder{height:48px}}


/* V5.2 */
.photoUploadBox{border:1px dashed #e39c8d;border-radius:14px;padding:10px;background:#fff8f5}
.photoPreviewGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.photoPreviewItem{position:relative;aspect-ratio:4/3;border-radius:10px;overflow:hidden;border:1px solid #ead6cf;background:#f8eee9}
.photoPreviewItem img{width:100%;height:100%;object-fit:cover}
.photoPreviewItem button{position:absolute;right:4px;top:4px;border:0;width:25px;height:25px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;font-weight:900}
.reportPhotos{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.reportPhoto{aspect-ratio:4/3;border-radius:10px;overflow:hidden;border:1px solid #e2cfc7;background:#f4e6df}
.reportPhoto img{width:100%;height:100%;object-fit:cover}
.reportQr{display:flex;align-items:center;gap:8px;font-size:9px;color:#75635e}
.reportQr img{width:58px;height:58px;border:1px solid #ddd;border-radius:5px;background:#fff;padding:2px}
.approvalStamp{display:inline-flex;align-items:center;justify-content:center;width:58px;height:58px;border:3px double #d9271e;border-radius:50%;color:#d9271e;font-weight:950;font-size:11px;line-height:1.15;text-align:center;transform:rotate(-7deg)}
.reportNo{font-size:9px;color:#8d7a75;margin-top:3px}
.v52Foot{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-top:12px}
.photoHelp{font-size:11px;color:#7d6a65;margin-top:5px}
@media(max-width:520px){.photoPreviewGrid,.reportPhotos{grid-template-columns:repeat(3,1fr)}.reportQr img{width:48px;height:48px}}


/* V5.3 */
.assetPreview{display:flex;align-items:center;gap:12px;padding:10px;background:#fff;border:1px solid var(--line);border-radius:14px}
.assetPreview img{width:78px;height:58px;object-fit:contain;background:#fff9f4;border:1px dashed #d9bdb5;border-radius:10px}
.assetPreview .emptyAsset{width:78px;height:58px;display:flex;align-items:center;justify-content:center;background:#fff9f4;border:1px dashed #d9bdb5;border-radius:10px;font-size:11px;color:#8b7771}
.photoPreviewItem.representative{outline:3px solid #e14b3e;outline-offset:2px}
.photoControls{position:absolute;left:4px;right:4px;bottom:4px;display:flex;justify-content:center;gap:3px}
.photoControls button{position:static;width:27px;height:25px;border-radius:8px;background:rgba(255,255,255,.92);color:#6b3029;border:1px solid #e1b9af;font-size:12px}
.photoBadge{position:absolute;left:5px;top:5px;background:#e23a2f;color:#fff;border-radius:10px;padding:2px 6px;font-size:9px;font-weight:900}
.customSignature{max-width:120px;max-height:52px;object-fit:contain}
.customStamp{width:58px;height:58px;object-fit:contain;transform:rotate(-7deg)}


/* V5.4 */
.memberIdentity{display:flex;align-items:center;gap:10px;min-width:0}
.memberAvatar{width:48px;height:48px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#fff2eb;border:2px solid #f1b8aa;flex:0 0 auto;font-size:29px}
.memberAvatar img{width:100%;height:100%;object-fit:cover}
.memberAvatar.sm{width:34px;height:34px;font-size:21px}
.avatarChooser{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}
.avatarChoice{border:1px solid var(--line);border-radius:12px;background:#fff;padding:7px;font-size:27px;min-height:48px}
.avatarChoice.active{outline:3px solid #e75649;background:#fff1ed}
.avatarPhotoPreview{width:82px;height:82px;border-radius:50%;overflow:hidden;border:2px solid #efb6a8;background:#fff4ef;display:flex;align-items:center;justify-content:center;font-size:38px}
.avatarPhotoPreview img{width:100%;height:100%;object-fit:cover}
.allocationBox{border:1px solid #efd4cb;background:#fff8f5;border-radius:13px;padding:10px}
.allocationList{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
.allocationChip{font-size:11px;padding:5px 8px;border-radius:999px;background:#fff;border:1px solid #e7c5bb}
.closeBadge{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#fee2e2;color:#b42318;font-size:11px;font-weight:900}
.closedNotice{background:#fff0f0;border:1px solid #f3b6b6;color:#8f1d1d;border-radius:12px;padding:9px 10px;font-size:12px;margin-bottom:8px}
.autoClassBadge{font-size:10px;padding:3px 7px;border-radius:999px;background:#e8f7ed;color:#16703b;font-weight:850}
.reviewTools{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}


/* V5.5.1 */
.receiptBox{border:1px solid #efd2c8;background:#fff8f4;border-radius:14px;padding:10px}
.receiptPreview{margin-top:8px;display:flex;align-items:center;gap:10px}
.receiptPreview img{width:96px;height:96px;object-fit:cover;border-radius:12px;border:1px solid #e4c6bd;background:#fff}
.attendanceGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.attendanceItem{display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #ead2ca;border-radius:12px;background:#fff}
.attendanceItem input{width:20px;height:20px}
.attendanceItem .memberAvatar{width:34px;height:34px;font-size:20px}
.arrearsShareBtn{margin-top:7px}
.receiptThumb{width:54px;height:54px;border-radius:9px;object-fit:cover;border:1px solid #e4c9c0}
.reportReceipts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.reportReceipts img{width:100%;height:120px;object-fit:cover;border-radius:10px;border:1px solid #dfc7be}

</style></head><body>${src.outerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`);
 w.document.close()
}



function openAssetManager(type){
 if(!requireAdmin())return;currentAssetType=type;
 $('#assetModalTitle').textContent=type==='signature'?'총무 서명 등록':'승인 도장 등록';
 const src=state.reportAssets?.[type]||'';
 $('#assetPreview').innerHTML=src?`<img src="${src}"><div><b>${type==='signature'?'총무 서명':'승인 도장'}</b><div class="small">현재 등록된 이미지</div></div>`:`<div class="emptyAsset">미등록</div><div><b>${type==='signature'?'총무 서명':'승인 도장'}</b><div class="small">이미지를 선택해 등록하세요.</div></div>`;
 $('#assetModal').classList.add('show')
}

async function saveAssetFile(file,type){
 try{
  const data=await compressImage(file,type==='signature'?900:500,type==='signature'?350:500,.86);
  state.reportAssets=state.reportAssets||{signature:'',stamp:''};state.reportAssets[type]=data;save();render();openAssetManager(type);
  alert(type==='signature'?'총무 서명이 등록되었습니다.':'승인 도장이 등록되었습니다.');
 }catch(e){alert('이미지 등록에 실패했습니다. 다른 사진으로 다시 시도하세요.')}
}

function deleteAsset(){
 if(!requireAdmin())return;
 state.reportAssets=state.reportAssets||{signature:'',stamp:''};state.reportAssets[currentAssetType]='';save();render();openAssetManager(currentAssetType)
}
