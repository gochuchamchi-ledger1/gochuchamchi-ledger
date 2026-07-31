function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function nowMonth(){return new Date().toISOString().slice(0,7)}

function sorted(){return [...state.transactions].sort((a,b)=>a.datetime.localeCompare(b.datetime))}

function beforeMonth(m){return sorted().filter(t=>ym(t.datetime)<m)}

function opening(m){const a=beforeMonth(m);let b=state.startBalance;for(const t of a)b+=t.type==='입금'?+t.amount:-t.amount;return b}

function monthTx(m){return sorted().filter(t=>ym(t.datetime)===m)}

function summary(m){
 const a=monthTx(m), dues=sum(a.filter(t=>t.type==='입금'&&t.category==='회비')),interest=sum(a.filter(t=>t.type==='입금'&&t.category==='입출금통장 이자'));
 const otherIn=sum(a.filter(t=>t.type==='입금'&&!['회비','입출금통장 이자'].includes(t.category))),out=sum(a.filter(t=>t.type==='출금'));
 const op=opening(m), review=a.filter(t=>!['자동확정','확인완료'].includes(t.status)).length;
 return {opening:op,dues,interest,otherIn,out,closing:op+dues+interest+otherIn-out,review};
}

function sum(a){return a.reduce((s,t)=>s+Number(t.amount||0),0)}

function totalBalance(){let b=state.startBalance;for(const t of sorted())b+=t.type==='입금'?+t.amount:-t.amount;return b}

function addMonths(m,n){const [y,mo]=m.split('-').map(Number),d=new Date(y,mo-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}

function monthsBetween(start,end){const [sy,sm]=start.split('-').map(Number),[ey,em]=end.split('-').map(Number);return Math.max(0,(ey-sy)*12+em-sm+1)}

function balanceAt(dateText){
 const cutoff=String(dateText||'9999-12-31').slice(0,10);
 let b=state.startBalance;
 for(const t of sorted()){if(String(t.datetime).slice(0,10)<=cutoff)b+=t.type==='입금'?Number(t.amount):-Number(t.amount)}
 return b
}

function reportDateText(){return new Date().toLocaleDateString('ko-KR')}

function r(a,b){return `<div class="row"><span>${a}</span><b>${b}</b></div>`}

function normDate(v){
 if(v instanceof Date)return new Date(v.getTime()-v.getTimezoneOffset()*60000).toISOString().slice(0,16);
 if(typeof v==='number'&&window.XLSX){const d=XLSX.SSF.parse_date_code(v);return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}T${String(d.H||0).padStart(2,'0')}:${String(d.M||0).padStart(2,'0')}`}
 const s=String(v||'').trim().replace(/[./]/g,'-');const m=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}T${(m[4]||'00').padStart(2,'0')}:${(m[5]||'00').padStart(2,'0')}`:new Date().toISOString().slice(0,16)
}

function findVal(row,keys){for(const k of Object.keys(row)){if(keys.some(x=>String(k).replace(/\s/g,'').includes(x)))return row[k]}return ''}



function normalizedText(v){return String(v??'').replace(/\s+/g,' ').trim()}

function normalizedAmount(v){
 const n=Number(String(v??'').replace(/[,\s원+]/g,''));
 return Number.isFinite(n)?n:0
}

function duplicateKey(t){
 return [String(t.datetime||'').slice(0,16),t.type,Math.abs(Number(t.amount)||0),normalizedText(t.description)].join('|')
}
