function memberAvatarHtml(m,small=false){
 const cls=small?'memberAvatar sm':'memberAvatar';
 return `<div class="${cls}">${m.photo?`<img src="${m.photo}" alt="${esc(m.name)}">`:esc(m.avatar||'🐱')}</div>`
}


function renderMembers(){
 const through=$('#homeMonth').value||nowMonth(),q=($('#memberSearch')?.value||'').trim().toLowerCase();
 const members=state.members.filter(m=>m.name.toLowerCase().includes(q));
 $('#memberList').innerHTML=members.length?members.map(m=>`<div class="member" data-id="${m.id}"><div class="memberTop"><div class="memberIdentity">${memberAvatarHtml(m)}<div><b>${esc(m.name)}</b><div class="small">${m.startMonth}부터 관리</div></div></div><div style="text-align:right"><b>${won(m.fee)}</b><div class="small">월 회비</div></div><div style="text-align:right"><b class="${arrears(m,through)>0?'red':'green'}">${won(arrears(m,through))}</b><div class="small">누적 미수</div></div></div></div>`).join(''):'<div class="empty">검색된 회원이 없습니다.</div>';
 $$('#memberList .member').forEach(el=>el.onclick=()=>admin?openMember(el.dataset.id):null)
}


function renderAvatarChooser(){
 const avatars=['🐱','😺','😸','😻','😽','🐯','🦁','🐻','🐶','🐰','🐼','🦊'];
 $('#avatarChooser').innerHTML=avatars.map(a=>`<button type="button" class="avatarChoice ${editingMemberAvatar===a?'active':''}" data-avatar="${a}">${a}</button>`).join('');
 $$('#avatarChooser [data-avatar]').forEach(b=>b.onclick=()=>{editingMemberAvatar=b.dataset.avatar;editingMemberPhoto='';renderMemberAvatarPreview();renderAvatarChooser()})
}

function renderMemberAvatarPreview(){
 $('#memberAvatarPreview').innerHTML=editingMemberPhoto?`<img src="${editingMemberPhoto}">`:editingMemberAvatar;
 $('#removeMemberPhoto').style.display=editingMemberPhoto?'block':'none'
}

function openMember(id=null){
 if(!requireAdmin())return;editingMember=id;const m=state.members.find(x=>x.id===id);
 $('#memberModalTitle').textContent=m?'회원 수정':'회원 추가';$('#mName').value=m?.name||'';$('#mFee').value=m?.fee||'';$('#mStart').value=m?.startMonth||state.startMonth;
 editingMemberPhoto=m?.photo||'';editingMemberAvatar=m?.avatar||'🐱';renderMemberAvatarPreview();renderAvatarChooser();
 $('#deleteMember').style.display=m?'block':'none';$('#memberModal').classList.add('show')
}

function saveMember(){
 const name=$('#mName').value.trim(),fee=Number($('#mFee').value),start=$('#mStart').value;if(!name||!fee||!start)return alert('회원 정보를 모두 입력하세요.');
 const old=state.members.find(x=>x.id===editingMember),obj={id:editingMember||'m'+Date.now(),name,fee,startMonth:start,avatar:editingMemberAvatar||'🐱',photo:editingMemberPhoto||''};
 if(old&&old.name!==name)state.transactions.forEach(t=>{if(t.member===old.name)t.member=name});
 const i=state.members.findIndex(x=>x.id===editingMember);if(i>=0)state.members[i]=obj;else state.members.push(obj);save();closeModal('memberModal');render()
}

function deleteMember(){if(confirm('회원을 삭제할까요? 기존 거래는 남아 있습니다.')){state.members=state.members.filter(x=>x.id!==editingMember);save();closeModal('memberModal');render()}}


async function loadMemberPhoto(file){
 try{editingMemberPhoto=await compressImage(file,500,500,.82);renderMemberAvatarPreview();renderAvatarChooser()}
 catch(e){alert('회원사진을 불러오지 못했습니다.')}
}
