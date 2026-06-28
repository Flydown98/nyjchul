let programs = [];
let loadedReviews = [];
let currentMonth = new Date();
let selectedDate = today();
let adminPinValue = "";
const $ = (id) => document.getElementById(id);
const SAMPLE_PROGRAMS = [
  {id:'sample-1',date:today(),start:'10:00',end:'11:00',title:'음악활동',place:'프로그램실1',manager:'김OO',target:'성인',memo:'샘플 일정'},
  {id:'sample-2',date:today(),start:'14:00',end:'15:00',title:'미술활동',place:'프로그램실2',manager:'이OO',target:'청소년',memo:''}
];

document.addEventListener('DOMContentLoaded', async () => {
  initDates(); bindNav(); bindEvents(); await loadPrograms(); renderAll(); openAdminFromUrl(); registerSW();
});
function initDates(){ $('reviewDate').value=today(); selectedDate=today(); }
function bindNav(){ document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page))); }
function openAdminFromUrl(){
  const params = new URLSearchParams(window.location.search);
  const hash = String(window.location.hash || '').replace('#','').toLowerCase();
  if (params.get('admin') === '1' || hash === 'admin') {
    showPage('admin');
  }
}
window.addEventListener('hashchange', openAdminFromUrl);
function showPage(page){
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));
  if(page==='calendar') renderCalendar();
  if(page==='review') renderReviewPrograms();
  if(page==='admin') {
    document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));
  }
}
function bindEvents(){
  $('refreshHome').addEventListener('click', async()=>{await loadPrograms(); renderAll();});
  $('prevMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1,1);renderCalendar();});
  $('nextMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,1);renderCalendar();});
  $('reviewDate').addEventListener('change',renderReviewPrograms);
  document.querySelectorAll('.choice').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.name;document.querySelectorAll(`.choice[data-name="${name}"]`).forEach(b=>b.classList.remove('active'));btn.classList.add('active');$(`${name}Input`).value=btn.dataset.value;}));
  $('reviewForm').addEventListener('submit',submitReview);
  $('adminLoginBtn').addEventListener('click',adminLogin);
  $('adminLogout').addEventListener('click',()=>{adminPinValue='';$('adminPanel').classList.add('hidden');$('adminLogin').classList.remove('hidden');});
  $('adminReload').addEventListener('click',async()=>{await loadPrograms();renderAll();});
  $('programForm').addEventListener('submit',submitProgram);
  $('loadReviews').addEventListener('click',loadReviews);
  $('downloadLoadedReviews').addEventListener('click',()=>downloadCsv('제출리뷰.csv', loadedReviews));
}
async function loadPrograms(){
  const url = getScriptUrl();
  if(!url){ programs = APP_CONFIG.LOCAL_SAMPLE_WHEN_EMPTY ? SAMPLE_PROGRAMS : []; setSync('스프레드시트 URL 미설정 · 샘플 일정 표시 중'); return; }
  try{ const data=await jsonp(url,{action:'programs'}); if(data.ok){ programs=data.programs.map(normalizeProgram); setSync(`스프레드시트 연동 중 · 일정 ${programs.length}개 불러옴`); } else throw new Error(data.error||'불러오기 실패'); }
  catch(e){ programs = APP_CONFIG.LOCAL_SAMPLE_WHEN_EMPTY ? SAMPLE_PROGRAMS : []; setSync('스프레드시트 불러오기 실패 · 샘플 또는 기존 자료 표시'); }
}
function setSync(text){ $('syncStatus').textContent=text; const admin=$('adminSyncText'); if(admin) admin.textContent=text; }
function renderAll(){ renderHome(); renderCalendar(); renderReviewPrograms(); }
function renderHome(){ const todayPrograms=programsForDate(today()); $('todaySummary').innerHTML=`<div class="summary-card"><strong>${todayPrograms.length}</strong><span>오늘 일정</span></div><div class="summary-card"><strong>${programs.length}</strong><span>전체 일정</span></div>`; $('todayPrograms').innerHTML=programCards(todayPrograms,'오늘 등록된 일정이 없습니다.'); }
function renderCalendar(){ const y=currentMonth.getFullYear(), m=currentMonth.getMonth(); $('monthLabel').textContent=`${y}년 ${m+1}월`; const first=new Date(y,m,1); const startDay=first.getDay(); const lastDate=new Date(y,m+1,0).getDate(); const prevLast=new Date(y,m,0).getDate(); const cells=[]; for(let i=startDay-1;i>=0;i--)cells.push({day:prevLast-i,muted:true,date:null}); for(let d=1;d<=lastDate;d++){const date=ymd(y,m+1,d);cells.push({day:d,muted:false,date});} while(cells.length%7!==0)cells.push({day:cells.length,muted:true,date:null}); $('calendarGrid').innerHTML=cells.map(c=>{const count=c.date?programsForDate(c.date).length:0; const cls=['day',c.muted?'muted':'',c.date===today()?'today':'',c.date===selectedDate?'selected':''].join(' '); return `<button class="${cls}" ${c.date?`onclick="selectDate('${c.date}')"`:''}><span class="day-num">${c.day}</span><span class="dots">${Array.from({length:Math.min(count,3)}).map(()=>'<i class="dot"></i>').join('')}</span></button>`;}).join(''); renderSelectedDate(); }
function selectDate(date){ selectedDate=date; renderCalendar(); }
function renderSelectedDate(){ $('selectedDateTitle').textContent=selectedDate; const list=programsForDate(selectedDate); $('selectedDatePrograms').innerHTML=programCards(list,'선택한 날짜에 일정이 없습니다.'); }
function programCards(list, emptyMsg){ if(!list.length)return `<div class="empty">${emptyMsg}</div>`; return list.map(p=>`<button class="program-card" onclick="goReview('${escapeAttr(p.date)}','${escapeAttr(p.id)}')"><span class="badge">${escapeHtml(p.target||'프로그램')}</span><h3>${escapeHtml(p.title)}</h3><div class="program-meta"><div>⏰ ${escapeHtml(p.start)}~${escapeHtml(p.end)}</div><div>📍 ${escapeHtml(p.place||'장소 미입력')}</div><div>👤 ${escapeHtml(p.manager||'담당자 미입력')}</div>${p.memo?`<div>📝 ${escapeHtml(p.memo)}</div>`:''}</div></button>`).join(''); }
function goReview(date,id){ showPage('review'); $('reviewDate').value=date; renderReviewPrograms(); $('reviewProgram').value=id; }
function renderReviewPrograms(){ const list=programsForDate($('reviewDate').value); $('reviewProgram').innerHTML=list.length?list.map(p=>`<option value="${escapeAttr(p.id)}">${escapeHtml(p.start)} ${escapeHtml(p.title)} (${escapeHtml(p.place||'장소 미입력')})</option>`).join(''):`<option value="">해당 날짜 일정 없음</option>`; }
async function submitReview(e){ e.preventDefault(); const p=programs.find(x=>x.id===$('reviewProgram').value); if(!p){alert('프로그램을 선택해주세요.');return;} const data={action:'addReview',date:$('reviewDate').value,programId:p.id,programTitle:p.title,programTime:`${p.start}~${p.end}`,place:p.place||'',manager:p.manager||'',personName:$('personName').value.trim(),personCode:$('personCode').value.trim(),status:$('statusInput').value,review:$('reviewInput').value,again:$('again').value,activities:Array.from(document.querySelectorAll('#activityChoices input:checked')).map(x=>x.value).join('|'),memo:$('memo').value.trim()}; if(!data.personName){alert('이름을 입력해주세요.');return;} await postToScript(data); $('submitNotice').textContent='저장 요청을 보냈습니다. 관리자 스프레드시트에서 확인해주세요.'; $('reviewForm').reset(); $('reviewDate').value=today(); $('statusInput').value='출석'; $('reviewInput').value='좋았어요'; renderReviewPrograms(); }
function adminLogin(){ const pin=$('adminPin').value.trim(); if(!pin){alert('관리자 PIN을 입력해주세요.');return;} adminPinValue=pin; $('adminLogin').classList.add('hidden'); $('adminPanel').classList.remove('hidden'); setSync(getScriptUrl()?`스프레드시트 URL 설정됨 · 관리자 기능 사용 가능`:'스프레드시트 URL 미설정'); }
async function submitProgram(e){ e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); data.pin=adminPinValue; await postToScript(data); $('programNotice').textContent='일정 추가 요청을 보냈습니다. 잠시 후 새로고침하면 반영됩니다.'; e.target.reset(); setTimeout(async()=>{await loadPrograms(); renderAll();},1200); }
async function loadReviews(){ if(!adminPinValue){alert('관리자 PIN이 필요합니다.');return;} const url=getScriptUrl(); if(!url){alert('스프레드시트 URL이 설정되지 않았습니다.');return;} try{ const data=await jsonp(url,{action:'reviews',pin:adminPinValue}); if(!data.ok) throw new Error(data.error||'불러오기 실패'); loadedReviews=data.reviews||[]; $('reviewList').innerHTML=loadedReviews.length?loadedReviews.slice().reverse().map(r=>`<div class="review-item"><strong>${escapeHtml(r.personName||'이름 없음')} · ${escapeHtml(r.programTitle||'프로그램')}</strong><p>${escapeHtml(r.date||'')} / ${escapeHtml(r.status||'')} / ${escapeHtml(r.review||'')}</p>${r.memo?`<p>${escapeHtml(r.memo)}</p>`:''}</div>`).join(''):`<div class="empty">제출된 리뷰가 없습니다.</div>`; }catch(e){alert('리뷰를 불러오지 못했습니다: '+e.message);} }
function programsForDate(date){ return programs.filter(p=>p.date===date).sort((a,b)=>String(a.start).localeCompare(String(b.start))); }
function normalizeProgram(p){ return {id:p.id||stableId([p.date,p.start,p.title]),date:normalizeDate(p.date),start:normalizeTime(p.start||''),end:normalizeTime(p.end||''),title:p.title||'',place:p.place||'',manager:p.manager||'',target:p.target||'',memo:p.memo||'',visible:p.visible}; }
function getScriptUrl(){ return (window.APP_CONFIG&&APP_CONFIG.GOOGLE_SCRIPT_URL||'').trim(); }
function jsonp(url,params={}){ return new Promise((resolve,reject)=>{ const cb='cb_'+Date.now()+'_'+Math.random().toString(36).slice(2); params.callback=cb; const qs=new URLSearchParams(params).toString(); const script=document.createElement('script'); const timer=setTimeout(()=>{cleanup();reject(new Error('응답 시간 초과'));},10000); function cleanup(){clearTimeout(timer);delete window[cb];script.remove();} window[cb]=(data)=>{cleanup();resolve(data);}; script.onerror=()=>{cleanup();reject(new Error('스크립트 로드 실패'));}; script.src=url+(url.includes('?')?'&':'?')+qs; document.body.appendChild(script); }); }
async function postToScript(data){ const url=getScriptUrl(); if(!url){ alert('config.js에 Google Apps Script URL이 설정되지 않았습니다. 지금은 실제 스프레드시트 저장이 되지 않습니다.'); return; } const form=document.createElement('form'); form.method='POST'; form.action=url; form.target='hiddenSubmitFrame'; form.style.display='none'; Object.entries(data).forEach(([k,v])=>{const input=document.createElement('input');input.name=k;input.value=v??'';form.appendChild(input);}); document.body.appendChild(form); form.submit(); setTimeout(()=>form.remove(),1000); }
function downloadCsv(name,rows){ if(!rows||!rows.length){alert('다운로드할 자료가 없습니다.');return;} const headers=Object.keys(rows[0]); const csv='\uFEFF'+[headers.join(','),...rows.map(r=>headers.map(h=>csvEscape(r[h]??'')).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
function csvEscape(v){ const s=String(v); return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function ymd(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;} function today(){const d=new Date();return ymd(d.getFullYear(),d.getMonth()+1,d.getDate());}
function normalizeDate(v){const s=String(v||'').trim().replace(/\./g,'-').replace(/\//g,'-');const m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);return m?ymd(m[1],m[2],m[3]):s;} function normalizeTime(v){const s=String(v||'').trim();const m=s.match(/(\d{1,2}):?(\d{2})?/);return m?`${m[1].padStart(2,'0')}:${(m[2]||'00').padStart(2,'0')}`:s;} function stableId(parts){let h=0;const str=parts.join('__');for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return 'id_'+Math.abs(h).toString(36);} function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));} function escapeAttr(v){return escapeHtml(v).replace(/`/g,'&#096;');}
function registerSW(){ if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
