function paidFor(member,m,excludeId=null){
 return state.transactions.reduce((s,t)=>s+(t.id!==excludeId&&t.member===member.name?transactionAllocations(t).filter(a=>a.month===m).reduce((x,a)=>x+Number(a.amount||0),0):0),0)
}

function isMonthClosed(m){return !!state.closedMonths?.[m]}

function ensureMonthEditable(m){
 if(!isMonthClosed(m))return true;
 alert(`${m.replace('-','년 ')}월은 마감되어 수정할 수 없습니다. 결산 화면에서 마감을 해제하세요.`);
 return false
}

function arrearsBreakdown(member,through){
 const baseline=state.arrearsStartMonth||'2026-08';
 if(through<baseline)return [];
 const memberStart=member.startMonth||state.startMonth;
 const calcStart=memberStart>baseline?memberStart:baseline;
 const count=monthsBetween(calcStart,through);
 return Array.from({length:count},(_,i)=>{
  const month=addMonths(calcStart,i),due=Number(member.fee||0),paid=paidFor(member,month);
  return {month,due,paid,shortfall:Math.max(0,due-paid)}
 })
}

function arrears(member,through){
 return arrearsBreakdown(member,through).reduce((total,row)=>total+row.shortfall,0)
}



function renderFeeHistory(){
 const end=$('#homeMonth').value||nowMonth(),months=Array.from({length:12},(_,i)=>addMonths(end,i-11));
 $('#feeHistoryTitle').textContent=`${months[0].replace('-','년 ')}월 ~ ${end.replace('-','년 ')}월 회비`;
 const head='<tr><th>회원</th>'+months.map(m=>`<th>${Number(m.slice(5))}월</th>`).join('')+'<th>합계</th></tr>';
 const body=state.members.map(mem=>{
  const vals=months.map(m=>paidFor(mem,m));
  return `<tr><td><b>${esc(mem.name)}</b></td>${vals.map((v,i)=>`<td class="${v>=mem.fee?'green':'red'}">${won(v)}</td>`).join('')}<td><b>${won(vals.reduce((a,b)=>a+b,0))}</b></td></tr>`;
 }).join('');
 const totals=months.map(m=>state.members.reduce((s,mem)=>s+paidFor(mem,m),0));
 const foot=`<tr><th>월 합계</th>${totals.map(v=>`<th>${won(v)}</th>`).join('')}<th>${won(totals.reduce((a,b)=>a+b,0))}</th></tr>`;
 $('#feeHistory').innerHTML=head+body+foot;
}


function renderArrears(){
 const through=$('#arrearsMonth').value||nowMonth(),q=($('#arrearsSearch')?.value||'').trim().toLowerCase();
 const allRows=state.members.map(mem=>{const detail=arrearsBreakdown(mem,through),unpaid=detail.filter(x=>x.shortfall>0);return {mem,detail,unpaid,amount:unpaid.reduce((s,x)=>s+x.shortfall,0)}}),unpaidRows=allRows.filter(x=>x.amount>0);
 $('#aTotal').textContent=won(unpaidRows.reduce((s,x)=>s+x.amount,0));$('#aMembers').textContent=unpaidRows.length+'명';
 const rows=unpaidRows.filter(x=>x.mem.name.toLowerCase().includes(q)).sort((a,b)=>b.amount-a.amount);
 $('#arrearsList').innerHTML=rows.length?rows.map(x=>{
  const current=x.detail.find(d=>d.month===through)||{due:Number(x.mem.fee),paid:0,shortfall:Number(x.mem.fee)};
  const chips=x.unpaid.slice(-6).map(d=>`<span class="arrearsMonthChip">${Number(d.month.slice(5))}월 ${won(d.shortfall)}</span>`).join('');
  return `<div class="member arrearsMember"><div class="memberTop"><div class="memberIdentity">${memberAvatarHtml(x.mem,true)}<div><b>${esc(x.mem.name)}</b><div class="small">이번 달 ${won(current.paid)} / ${won(current.due)} · 미납 ${x.unpaid.length}개월</div></div></div><div style="text-align:right"><b class="red">${won(x.amount)}</b><div class="small">누적 미수</div><button class="btn soft arrearsShareBtn" data-arrears-share="${x.mem.id}">안내 이미지</button></div><div>⚠️</div></div><div class="arrearsMonths">${chips}</div></div>`
 }).join(''):'<div class="empty">조건에 맞는 미수금이 없습니다. 🎉</div>';
 $$('#arrearsList [data-arrears-share]').forEach(b=>b.onclick=()=>saveArrearsNotice(b.dataset.arrearsShare))
}


function changeArrearsStart(){
 if(!requireAdmin())return;
 const v=prompt('미수금 계산 시작월을 YYYY-MM 형식으로 입력하세요.',state.arrearsStartMonth||'2026-08');
 if(!v)return;
 if(!/^\d{4}-\d{2}$/.test(v))return alert('예: 2026-08 형식으로 입력하세요.');
 state.arrearsStartMonth=v;save();render();alert(`${v.replace('-','년 ')}월부터 미수금을 계산합니다.`);
}


async function drawArrearsNotice(member,through){
 const amount=arrears(member,through),c=document.createElement('canvas');c.width=1080;c.height=1350;const ctx=c.getContext('2d');
 ctx.fillStyle='#fff8f2';ctx.fillRect(0,0,c.width,c.height);
 ctx.fillStyle='#e74336';ctx.fillRect(0,0,c.width,210);
 ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='900 64px sans-serif';ctx.fillText('🌶️ 고추참치회 회비 안내',540,105);
 ctx.font='600 28px sans-serif';ctx.fillText(`${through.replace('-','년 ')}월 기준`,540,160);
 if(member.photo){const img=await loadCanvasImage(member.photo);if(img){ctx.save();ctx.beginPath();ctx.arc(540,355,105,0,Math.PI*2);ctx.clip();ctx.drawImage(img,435,250,210,210);ctx.restore()}}
 else{ctx.font='120px sans-serif';ctx.fillStyle='#fff0e8';ctx.beginPath();ctx.arc(540,355,110,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4c302a';ctx.fillText(member.avatar||'🐱',540,395)}
 ctx.fillStyle='#3f2c28';ctx.font='900 54px sans-serif';ctx.fillText(`${member.name} 회원님`,540,545);
 ctx.font='600 34px sans-serif';ctx.fillText('미납 회비를 안내드립니다.',540,605);
 ctx.fillStyle='#fff';roundRect(ctx,115,685,850,260,30,'#fff','#efc7bc');
 ctx.fillStyle='#73534b';ctx.font='700 32px sans-serif';ctx.fillText('누적 미납 금액',540,765);
 ctx.fillStyle='#d93127';ctx.font='900 78px sans-serif';ctx.fillText(won(amount),540,865);
 ctx.fillStyle='#4f3a35';ctx.font='700 31px sans-serif';ctx.fillText(`입금은행: ${state.bank}`,540,1040);
 ctx.font='500 25px sans-serif';ctx.fillStyle='#7a625b';ctx.fillText('입금 후 총무에게 알려주시면 확인하겠습니다.',540,1100);
 ctx.font='700 26px sans-serif';ctx.fillStyle='#e74336';ctx.fillText('함께하는 즐거움, 소중한 인연 ❤️',540,1230);
 return c
}

async function saveArrearsNotice(memberId){
 if(!requireAdmin())return;
 const member=state.members.find(m=>m.id===memberId),through=$('#arrearsMonth').value||nowMonth();if(!member)return;
 try{
  const canvas=await drawArrearsNotice(member,through),blob=await canvasToPngBlob(canvas,3);
  const file=new File([blob],`고추참치회_${member.name}_${through}_미납안내.png`,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'고추참치회 회비 안내',files:[file]})}
  else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}
 }catch(e){console.error(e);alert('미납 안내 이미지 저장에 실패했습니다.')}
}
