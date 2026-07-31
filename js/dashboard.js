function render(){
 const m=$('#homeMonth').value||nowMonth(),s=summary(m);
 const arrearsRows=state.members.map(mem=>arrears(mem,m)),totalArrears=arrearsRows.reduce((a,b)=>a+b,0),unpaid=arrearsRows.filter(v=>v>0).length;
 $('#groupTitle').textContent=state.groupName;$('#modeBtn').textContent=admin?'총무 모드':'조회 모드';$('#modeBtn').style.background=admin?'#dcfce7':'#fff0ca';
 $('#kBalance').textContent=won(totalBalance());$('#kDues').textContent=won(s.dues);$('#kOut').textContent=won(s.out);$('#kMembers').textContent=state.members.length+'명';$('#kUnpaid').textContent=unpaid+'명';$('#kArrears').textContent=won(totalArrears);
 $('#dashboardStatus').innerHTML=`<span>📅 ${m.replace('-','년 ')}월</span><span>입금 ${won(s.dues+s.interest+s.otherIn)}</span><span>확인 필요 ${s.review}건</span>`;
 renderPayments(m);renderRecent();renderTransactions();renderMembers();renderFeeHistory();renderReport();renderArrears();renderImportHistory();$('#arrearsStartLabel').textContent=(state.arrearsStartMonth||'2026-08').replace('-','년 ')+'월부터 자동 계산';
 renderDataHealth();
 $('#fab').style.display=admin?'block':'none';$('#addMemberBtn').style.display=admin?'block':'none';$('#finalizeMonthly').style.display=admin?'block':'none';$('#newMeetingReport').style.display=admin?'block':'none';$('#closeMonthBtn').style.display=admin?'block':'none';
 fillSelects();
}


function renderRecent(){$('#recent').innerHTML=sorted().slice(-5).reverse().map(txHtml).join('')||'<div class="empty">거래가 없습니다.</div>'}

function fillSelects(){
 $('#fCategory').innerHTML=categories.filter(x=>x!=='전체').map(x=>`<option>${x}</option>`).join('');
 $('#fMember').innerHTML='<option value="">해당 없음</option>'+state.members.map(x=>`<option>${esc(x.name)}</option>`).join('');
}
