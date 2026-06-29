let programs = [];
let loadedReviews = [];
let filteredReviews = [];
let notices = [];
let activeManagerFilter = '';
let currentMonth = new Date();
let selectedDate = today();
let myMonth = new Date();
let mySelectedDate = today();
let myEvents = [];
let adminPinValue = "";
const $ = (id) => document.getElementById(id);
const SAMPLE_PROGRAMS = [
  {id:'sample-1',date:today(),start:'10:00',end:'11:00',title:'음악활동',place:'프로그램실1',manager:'김OO',target:'성인',memo:'샘플 일정'},
  {id:'sample-2',date:today(),start:'14:00',end:'15:00',title:'미술활동',place:'프로그램실2',manager:'이OO',target:'청소년',memo:''}
];

document.addEventListener('DOMContentLoaded', async () => {
  initDates(); initAccessibility(); bindNav(); bindEvents(); await Promise.all([loadPrograms(), loadNotices()]); renderAll(); openAdminFromUrl(); registerSW();
});
function initDates(){ $('reviewDate').value=today(); selectedDate=today(); mySelectedDate=today(); myEvents=loadMyEvents(); if($('myEventDate')) $('myEventDate').value=today(); }
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
  if(page==='my') renderMyCalendar();
  if(page==='review') renderReviewPrograms();
  if(page==='admin') {
    document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));
  }
}
function bindEvents(){
  $('refreshHome').addEventListener('click', async()=>{await Promise.all([loadPrograms(), loadNotices()]); renderAll();});
  if($('bigTextToggle')) $('bigTextToggle').addEventListener('click',toggleBigText);
  if($('managerFilter')) $('managerFilter').addEventListener('change',()=>{activeManagerFilter=$('managerFilter').value; renderAll();});
  if($('clearManagerFilter')) $('clearManagerFilter').addEventListener('click',()=>{activeManagerFilter=''; $('managerFilter').value=''; renderAll();});
  $('prevMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1,1);renderCalendar();});
  $('nextMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,1);renderCalendar();});
  if($('prevMyMonth')) $('prevMyMonth').addEventListener('click',()=>{myMonth=new Date(myMonth.getFullYear(),myMonth.getMonth()-1,1);renderMyCalendar();});
  if($('nextMyMonth')) $('nextMyMonth').addEventListener('click',()=>{myMonth=new Date(myMonth.getFullYear(),myMonth.getMonth()+1,1);renderMyCalendar();});
  $('reviewDate').addEventListener('change',renderReviewPrograms);
  document.querySelectorAll('.choice').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.name;document.querySelectorAll(`.choice[data-name="${name}"]`).forEach(b=>b.classList.remove('active'));btn.classList.add('active');$(`${name}Input`).value=btn.dataset.value;}));
  if($('myEventForm')) $('myEventForm').addEventListener('submit',saveMyEvent);
  if($('resetMyEvent')) $('resetMyEvent').addEventListener('click',resetMyEventForm);
  if($('exportMyEvents')) $('exportMyEvents').addEventListener('click',exportMyEvents);
  if($('importMyEvents')) $('importMyEvents').addEventListener('change',importMyEvents);
  if($('myEventDate')) $('myEventDate').addEventListener('change',()=>{mySelectedDate=$('myEventDate').value||today(); myMonth=new Date(mySelectedDate); renderMyCalendar();});
  $('reviewForm').addEventListener('submit',submitReview);
  $('adminLoginBtn').addEventListener('click',adminLogin);
  $('adminLogout').addEventListener('click',()=>{adminPinValue='';$('adminPanel').classList.add('hidden');$('adminLogin').classList.remove('hidden');});
  $('adminReload').addEventListener('click',async()=>{await Promise.all([loadPrograms(), loadNotices()]);renderAll();renderProgramManageList();renderNoticeManageList();renderAdminStats();});
  if($('refreshStats')) $('refreshStats').addEventListener('click',renderAdminStats);
  if($('refreshProgramManage')) $('refreshProgramManage').addEventListener('click',async()=>{await loadPrograms();renderProgramManageList();});
  if($('programManageDate')) $('programManageDate').addEventListener('change',renderProgramManageList);
  if($('programManageManager')) $('programManageManager').addEventListener('change',renderProgramManageList);
  if($('programManageKeyword')) $('programManageKeyword').addEventListener('input',renderProgramManageList);
  if($('noticeForm')) $('noticeForm').addEventListener('submit',submitNotice);
  if($('loadNoticesAdmin')) $('loadNoticesAdmin').addEventListener('click',async()=>{await loadNotices();renderNoticeManageList();});
  $('programForm').addEventListener('submit',submitProgram);
  if($('recurringForm')) $('recurringForm').addEventListener('submit',submitRecurringRule);
  if($('loadRecurringRules')) $('loadRecurringRules').addEventListener('click',loadRecurringRules);
  $('loadReviews').addEventListener('click',loadReviews);
  if($('reviewProgramFilter')) $('reviewProgramFilter').addEventListener('change',renderReviews);
  if($('reviewKeyword')) $('reviewKeyword').addEventListener('input',renderReviews);
  $('downloadLoadedReviews').addEventListener('click',()=>downloadCsv('제출리뷰_전체.csv', loadedReviews));
  if($('downloadFilteredReviews')) $('downloadFilteredReviews').addEventListener('click',()=>downloadCsv('제출리뷰_현재목록.csv', filteredReviews));
}
async function loadPrograms(){
  const cfg = window.APP_CONFIG || {};

  if (cfg.USE_PUBLIC_SHEET_FOR_PROGRAMS && cfg.PROGRAMS_SHEET_ID) {
    try {
      const rows = await loadProgramsFromPublicSheet(cfg.PROGRAMS_SHEET_ID, cfg.PROGRAMS_SHEET_NAME || 'Programs');
      programs = rows.map(normalizeProgram).filter(p => String(p.visible || 'Y').toUpperCase() !== 'N');
      setSync(`오늘 프로그램 ${programs.length}개를 준비했어요.`, 'ok');
      return;
    } catch (e) {
      console.warn('공개 스프레드시트 일정 불러오기 실패:', e);
      setSync('일정을 다시 불러오는 중이에요.', 'warn');
    }
  }

  const url = getScriptUrl();
  if(!url){ programs = (cfg.LOCAL_SAMPLE_WHEN_EMPTY ? SAMPLE_PROGRAMS : []); setSync('일시적으로 안내 화면을 준비 중이에요.', 'warn'); return; }

  try{
    const data=await jsonp(url,{action:'programs'});
    if(data.ok){
      programs=data.programs.map(normalizeProgram).filter(p => String(p.visible || 'Y').toUpperCase() !== 'N');
      setSync(`오늘 프로그램 ${programs.length}개를 확인했어요.`, 'ok');
    } else {
      throw new Error(data.error||'불러오기 실패');
    }
  }
  catch(e){
    programs = (cfg.LOCAL_SAMPLE_WHEN_EMPTY ? SAMPLE_PROGRAMS : []);
    setSync('일정을 불러오는 데 시간이 조금 걸리고 있어요.', 'error');
  }
}

function loadProgramsFromPublicSheet(sheetId, sheetName){
  const encodedSheet = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?sheet=${encodedSheet}`;
  return new Promise((resolve, reject) => {
    const cb = 'sheet_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const timer = setTimeout(() => { cleanup(); reject(new Error('공개 스프레드시트 응답 시간 초과')); }, 10000);

    function cleanup(){
      clearTimeout(timer);
      delete window[cb];
      script.remove();
    }

    window[cb] = (response) => {
      cleanup();
      try {
        if (!response || response.status === 'error') {
          const msg = response && response.errors && response.errors[0] && response.errors[0].detailed_message;
          throw new Error(msg || '공개 스프레드시트를 읽을 수 없습니다.');
        }
        resolve(gvizResponseToObjects(response));
      } catch (err) {
        reject(err);
      }
    };

    script.onerror = () => { cleanup(); reject(new Error('공개 스프레드시트 스크립트 로드 실패')); };
    script.src = url + `&tqx=responseHandler:${cb};out:json&v=` + Date.now();
    document.body.appendChild(script);
  });
}

function gvizResponseToObjects(response){
  const table = response.table || {};
  const cols = table.cols || [];
  const rows = table.rows || [];

  const headers = cols.map((col, idx) => String(col.label || col.id || '').trim() || ('col' + idx));

  return rows.map(row => {
    const cells = row.c || [];
    const obj = {};
    headers.forEach((header, idx) => {
      const cell = cells[idx];
      obj[header] = cell ? (cell.f || cell.v || '') : '';
    });
    return obj;
  }).filter(obj => Object.values(obj).some(v => String(v).trim() !== ''));
}

function setSync(text, tone='ok'){
  const el=$('syncStatus');
  if(!el) return;
  el.textContent=text;
  el.classList.remove('ok','warn','error');
  el.classList.add(tone);
}
function renderAll(){ populateManagerFilters(); renderHome(); renderCalendar(); renderMyCalendar(); renderReviewPrograms(); renderAdminStats(); }
function renderHome(){ renderNotices(); const todayPrograms=programsForDate(today()); const totalVisible=filteredProgramsByManager(programs).length; $('todaySummary').innerHTML=`<div class="summary-card"><strong>${todayPrograms.length}</strong><span>오늘 일정</span></div><div class="summary-card"><strong>${totalVisible}</strong><span>${activeManagerFilter ? '담당자 일정' : '전체 일정'}</span></div>`; $('todayPrograms').innerHTML=programCards(todayPrograms,'오늘 등록된 일정이 없습니다.'); }
function renderCalendar(){ const y=currentMonth.getFullYear(), m=currentMonth.getMonth(); $('monthLabel').textContent=`${y}년 ${m+1}월`; const first=new Date(y,m,1); const startDay=first.getDay(); const lastDate=new Date(y,m+1,0).getDate(); const prevLast=new Date(y,m,0).getDate(); const cells=[]; for(let i=startDay-1;i>=0;i--)cells.push({day:prevLast-i,muted:true,date:null}); for(let d=1;d<=lastDate;d++){const date=ymd(y,m+1,d);cells.push({day:d,muted:false,date});} while(cells.length%7!==0)cells.push({day:cells.length,muted:true,date:null}); $('calendarGrid').innerHTML=cells.map(c=>{const count=c.date?programsForDate(c.date).length:0; const cls=['day',c.muted?'muted':'',c.date===today()?'today':'',c.date===selectedDate?'selected':''].join(' '); return `<button class="${cls}" ${c.date?`onclick="selectDate('${c.date}')"`:''}><span class="day-num">${c.day}</span><span class="dots">${Array.from({length:Math.min(count,3)}).map(()=>'<i class="dot"></i>').join('')}</span></button>`;}).join(''); renderSelectedDate(); }
function selectDate(date){ selectedDate=date; renderCalendar(); }
function renderSelectedDate(){ $('selectedDateTitle').textContent=selectedDate; const list=programsForDate(selectedDate); $('selectedDatePrograms').innerHTML=programCards(list,'선택한 날짜에 일정이 없습니다.'); }
function programCards(list, emptyMsg){ if(!list.length)return `<div class="empty">${emptyMsg}</div>`; return list.map(p=>`<button class="program-card" onclick="goReview('${escapeAttr(p.date)}','${escapeAttr(p.id)}')"><span class="badge">${escapeHtml(p.target||'프로그램')}</span><h3>${escapeHtml(p.title)}</h3><div class="program-meta"><div>⏰ ${escapeHtml(p.start)}~${escapeHtml(p.end)}</div><div>📍 ${escapeHtml(p.place||'장소 미입력')}</div><div>👤 ${escapeHtml(p.manager||'담당자 미입력')}</div>${p.memo?`<div>📝 ${escapeHtml(p.memo)}</div>`:''}</div></button>`).join(''); }
function goReview(date,id){ showPage('review'); $('reviewDate').value=date; renderReviewPrograms(); $('reviewProgram').value=id; }
function renderReviewPrograms(){ const list=programsForDateRaw($('reviewDate').value); $('reviewProgram').innerHTML=list.length?list.map(p=>`<option value="${escapeAttr(p.id)}">${escapeHtml(p.start)} ${escapeHtml(p.title)} (${escapeHtml(p.place||'장소 미입력')})</option>`).join(''):`<option value="">해당 날짜 일정 없음</option>`; }
async function submitReview(e){ e.preventDefault(); const p=programs.find(x=>x.id===$('reviewProgram').value); if(!p){alert('참여한 프로그램을 선택해주세요.');return;} const data={action:'addReview',date:$('reviewDate').value,programId:p.id,programTitle:p.title,programTime:`${p.start}~${p.end}`,place:p.place||'',manager:p.manager||'',personName:$('personName').value.trim(),personCode:$('personCode').value.trim(),status:$('statusInput').value,review:$('reviewInput').value,again:$('again').value,activities:Array.from(document.querySelectorAll('#activityChoices input:checked')).map(x=>x.value).join('|'),memo:$('memo').value.trim(),userAgent:navigator.userAgent||''}; if(!data.personName){alert('이름을 입력해주세요.');return;} await postToScript(data); $('submitNotice').textContent='저장 요청을 보냈습니다. 관리자 스프레드시트에서 확인해주세요.'; $('reviewForm').reset(); $('reviewDate').value=today(); $('statusInput').value='출석'; $('reviewInput').value='좋았어요'; renderReviewPrograms(); }

function renderMyCalendar(){
  if(!$('myCalendarGrid')) return;
  const y=myMonth.getFullYear(), m=myMonth.getMonth();
  $('myMonthLabel').textContent=`${y}년 ${m+1}월`;
  const first=new Date(y,m,1);
  const startDay=first.getDay();
  const lastDate=new Date(y,m+1,0).getDate();
  const prevLast=new Date(y,m,0).getDate();
  const cells=[];
  for(let i=startDay-1;i>=0;i--) cells.push({day:prevLast-i,muted:true,date:null});
  for(let d=1;d<=lastDate;d++){ const date=ymd(y,m+1,d); cells.push({day:d,muted:false,date}); }
  while(cells.length%7!==0) cells.push({day:'',muted:true,date:null});
  $('myCalendarGrid').innerHTML=cells.map(c=>{
    const count=c.date?myEventsForDate(c.date).length:0;
    const cls=['day',c.muted?'muted':'',c.date===today()?'today':'',c.date===mySelectedDate?'selected':''].join(' ');
    return `<button class="${cls}" ${c.date?`onclick="selectMyDate('${c.date}')"`:''}><span class="day-num">${c.day}</span><span class="dots">${Array.from({length:Math.min(count,3)}).map(()=>'<i class="personal-dot"></i>').join('')}</span></button>`;
  }).join('');
  renderMySelectedDate();
}
function selectMyDate(date){
  mySelectedDate=date;
  $('myEventDate').value=date;
  myMonth=new Date(date);
  renderMyCalendar();
}
function renderMySelectedDate(){
  if(!$('mySelectedDateTitle')) return;
  $('mySelectedDateTitle').textContent=mySelectedDate;
  const list=myEventsForDate(mySelectedDate);
  if(!list.length){
    $('myEventList').innerHTML='<div class="empty">이 날짜에 내가 등록한 일정이 없습니다.</div>';
    return;
  }
  $('myEventList').innerHTML=list.map(e=>`<div class="my-event-card">
    <h3>${escapeHtml(e.title)}</h3>
    <p>⏰ ${escapeHtml(e.start||'시간 미입력')}${e.end?`~${escapeHtml(e.end)}`:''}</p>
    ${e.memo?`<p>📝 ${escapeHtml(e.memo).replace(/\n/g,'<br>')}</p>`:''}
    <p class="personal-note">내 기기에만 저장된 개인 일정입니다.</p>
    <div class="my-event-actions">
      <button class="soft-btn" onclick="editMyEvent('${escapeAttr(e.id)}')">수정</button>
      <button class="danger-btn" onclick="deleteMyEvent('${escapeAttr(e.id)}')">삭제</button>
    </div>
  </div>`).join('');
}
function myEventsForDate(date){
  return myEvents.filter(e=>e.date===date).sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));
}
function saveMyEvent(e){
  e.preventDefault();
  const id=$('myEventId').value || 'my_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const eventData={
    id,
    date:$('myEventDate').value || mySelectedDate || today(),
    title:$('myEventTitle').value.trim(),
    start:$('myEventStart').value || '',
    end:$('myEventEnd').value || '',
    memo:$('myEventMemo').value.trim(),
    savedAt:new Date().toISOString()
  };
  if(!eventData.title){ alert('일정 제목을 입력해주세요.'); return; }
  const idx=myEvents.findIndex(x=>x.id===id);
  if(idx>=0) myEvents[idx]=eventData; else myEvents.push(eventData);
  saveMyEvents();
  mySelectedDate=eventData.date;
  myMonth=new Date(eventData.date);
  resetMyEventForm(false);
  renderMyCalendar();
  alert('내 일정이 저장되었어요. 이 내용은 나만 볼 수 있어요.');
}
function editMyEvent(id){
  const e=myEvents.find(x=>x.id===id);
  if(!e) return;
  $('myEventId').value=e.id;
  $('myEventDate').value=e.date;
  $('myEventTitle').value=e.title;
  $('myEventStart').value=e.start||'';
  $('myEventEnd').value=e.end||'';
  $('myEventMemo').value=e.memo||'';
  window.scrollTo({top:0,behavior:'smooth'});
}
function deleteMyEvent(id){
  if(!confirm('이 개인 일정을 삭제할까요?')) return;
  myEvents=myEvents.filter(e=>e.id!==id);
  saveMyEvents();
  renderMyCalendar();
}
function resetMyEventForm(resetDate=true){
  $('myEventId').value='';
  if(resetDate) $('myEventDate').value=mySelectedDate || today();
  $('myEventTitle').value='';
  $('myEventStart').value='';
  $('myEventEnd').value='';
  $('myEventMemo').value='';
}
function loadMyEvents(){
  try { return JSON.parse(localStorage.getItem('nyj_my_private_calendar_v1')||'[]'); }
  catch { return []; }
}
function saveMyEvents(){
  localStorage.setItem('nyj_my_private_calendar_v1', JSON.stringify(myEvents));
}
function exportMyEvents(){
  if(!myEvents.length){ alert('백업할 개인 일정이 없습니다.'); return; }
  const blob=new Blob([JSON.stringify(myEvents,null,2)],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='나의개인일정_백업.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function importMyEvents(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error('백업 파일 형식이 아닙니다.');
      const merged=new Map(myEvents.map(e=>[e.id,e]));
      data.forEach(e=>{ if(e.id && e.date && e.title) merged.set(e.id,e); });
      myEvents=Array.from(merged.values());
      saveMyEvents();
      renderMyCalendar();
      alert('개인 일정 백업을 불러왔습니다.');
    }catch(err){ alert('백업 파일을 불러오지 못했습니다: '+err.message); }
  };
  reader.readAsText(file,'utf-8');
}

function adminLogin(){
  const pin=$('adminPin').value.trim();
  if(!pin){alert('운영자 번호를 입력해주세요.');return;}
  adminPinValue=pin;
  $('adminLogin').classList.add('hidden');
  $('adminPanel').classList.remove('hidden');
  setSync(getScriptUrl()?`운영 연결이 준비되어 있어요.`:'운영 연결을 확인하고 있어요.', 'ok');
  if($('loadRecurringRules')) loadRecurringRules();
  renderProgramManageList();
  renderNoticeManageList();
  renderAdminStats();
}
async function submitProgram(e){ e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); data.pin=adminPinValue; await postToScript(data); $('programNotice').textContent='일정 추가 요청을 보냈습니다. 잠시 후 새로고침하면 반영됩니다.'; e.target.reset(); setTimeout(async()=>{await loadPrograms(); renderAll();},1200); }

async function submitRecurringRule(e){
  e.preventDefault();

  if(!adminPinValue){
    alert('운영자 번호가 필요합니다.');
    return;
  }

  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  data.pin = adminPinValue;

  const startDate = data.startDate;
  const endDate = data.endDate;
  if(startDate && endDate && startDate > endDate){
    alert('종료일은 시작일보다 뒤여야 합니다.');
    return;
  }

  await postToScript(data);
  $('recurringNotice').textContent = '정기 프로그램을 만들었어요. 잠시 후 다시 확인해주세요.';
  e.target.reset();

  setTimeout(async()=>{
    await loadPrograms();
    renderAll();
    loadRecurringRules();
  }, 1500);
}

async function loadRecurringRules(){
  if(!$('recurringRuleList')) return;
  if(!adminPinValue){
    $('recurringRuleList').innerHTML='<div class="empty">관리자 PIN 입력 후 확인할 수 있습니다.</div>';
    return;
  }

  const url=getScriptUrl();
  if(!url){
    $('recurringRuleList').innerHTML='<div class="empty">Apps Script URL이 설정되지 않았습니다.</div>';
    return;
  }

  try{
    const data=await jsonp(url,{action:'recurringRules',pin:adminPinValue});
    if(!data.ok) throw new Error(data.error||'불러오기 실패');

    const rules=data.rules||[];
    if(!rules.length){
      $('recurringRuleList').innerHTML='<div class="empty">등록된 정기 일정 규칙이 없습니다.</div>';
      return;
    }

    $('recurringRuleList').innerHTML=rules.slice().reverse().map(r=>`
      <div class="rule-item">
        <h4>${escapeHtml(r.title||'제목 없음')}</h4>
        <p>📅 ${escapeHtml(r.startDate||'')} ~ ${escapeHtml(r.endDate||'')} / 매주 ${escapeHtml(r.weekday||'')}</p>
        <p>⏰ ${escapeHtml(r.start||'')}~${escapeHtml(r.end||'')} / 📍 ${escapeHtml(r.place||'장소 미입력')}</p>
        <p>👤 ${escapeHtml(r.manager||'담당자 미입력')} / 대상: ${escapeHtml(r.target||'미입력')}</p>
        ${r.memo?`<p>📝 ${escapeHtml(r.memo)}</p>`:''}
        <p>생성 일정 수: ${escapeHtml(r.generatedCount||'0')}개 / 상태: ${escapeHtml(r.active||'Y')}</p>
        <div class="rule-actions">
          <button class="danger-btn" onclick="deleteRecurringRule('${escapeAttr(r.ruleId||'')}')">정기 일정 삭제</button>
        </div>
      </div>
    `).join('');
  }catch(e){
    $('recurringRuleList').innerHTML='<div class="empty">정기 일정 목록을 불러오지 못했습니다: '+escapeHtml(e.message)+'</div>';
  }
}

async function deleteRecurringRule(ruleId){
  if(!ruleId) return;
  if(!confirm('이 정기 일정 규칙을 삭제하고, 이 규칙으로 생성된 일정도 숨김 처리할까요?')) return;

  await postToScript({
    action:'deleteRecurringRule',
    pin:adminPinValue,
    ruleId:ruleId
  });

  alert('삭제 요청을 보냈습니다. 잠시 후 목록과 일정을 다시 불러옵니다.');
  setTimeout(async()=>{
    await loadPrograms();
    renderAll();
    loadRecurringRules();
  }, 1500);
}


async function loadReviews(){
  if(!adminPinValue){alert('운영자 번호가 필요합니다.');return;}
  const url=getScriptUrl();
  if(!url){alert('운영 연결 주소가 설정되지 않았습니다.');return;}

  try{
    const data=await jsonp(url,{action:'reviews',pin:adminPinValue});
    if(!data.ok) throw new Error(data.error||'불러오기 실패');
    loadedReviews=data.reviews||[];
    populateReviewProgramFilter();
    renderReviews();
    renderAdminStats();
  }catch(e){
    alert('기록을 불러오지 못했습니다: '+e.message);
  }
}

function populateReviewProgramFilter(){
  if(!$('reviewProgramFilter')) return;

  const current=$('reviewProgramFilter').value;
  const titles=Array.from(new Set(loadedReviews.map(r=>r.programTitle).filter(Boolean))).sort();

  $('reviewProgramFilter').innerHTML='<option value="">전체 프로그램</option>' + titles.map(t=>`<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join('');
  $('reviewProgramFilter').value=current;
}

function renderReviews(){
  if(!$('reviewList')) return;

  const program=$('reviewProgramFilter') ? $('reviewProgramFilter').value : '';
  const keyword=$('reviewKeyword') ? $('reviewKeyword').value.trim().toLowerCase() : '';

  filteredReviews=loadedReviews.filter(r=>{
    const matchProgram=!program || r.programTitle===program;
    const text=[r.personName,r.personCode,r.programTitle,r.status,r.review,r.activities,r.memo,r.date].join(' ').toLowerCase();
    const matchKeyword=!keyword || text.includes(keyword);
    return matchProgram && matchKeyword;
  });

  const label = program ? `${program} 기록 ${filteredReviews.length}건` : `전체 기록 ${filteredReviews.length}건`;
  if($('programReviewSummary')) $('programReviewSummary').textContent = loadedReviews.length ? label : '기록 불러오기를 눌러 제출된 내용을 확인하세요.';

  $('reviewList').innerHTML=filteredReviews.length
    ? filteredReviews.slice().reverse().map(r=>`<div class="review-item"><strong>${escapeHtml(r.personName||'이름 없음')} · ${escapeHtml(r.programTitle||'프로그램')}</strong><p>${escapeHtml(r.date||'')} / ${escapeHtml(r.status||'')} / ${escapeHtml(r.review||'')}</p><p>활동: ${escapeHtml(r.activities||'')}</p>${r.memo?`<p>${escapeHtml(r.memo)}</p>`:''}</div>`).join('')
    : `<div class="empty">${loadedReviews.length ? '조건에 맞는 기록이 없습니다.' : '제출된 기록이 없습니다.'}</div>`;
}


function programsForDateRaw(date){ return programs.filter(p=>p.date===date).sort((a,b)=>String(a.start).localeCompare(String(b.start))); }
function filteredProgramsByManager(list){ return activeManagerFilter ? list.filter(p=>p.manager===activeManagerFilter) : list; }
function programsForDate(date){ return filteredProgramsByManager(programsForDateRaw(date)); }

async function loadNotices(){
  const cfg=window.APP_CONFIG||{};
  if(!(cfg.USE_PUBLIC_SHEET_FOR_PROGRAMS && cfg.PROGRAMS_SHEET_ID)){
    notices=[];
    return;
  }

  try{
    const rows=await loadProgramsFromPublicSheet(cfg.PROGRAMS_SHEET_ID, 'Notices');
    notices=rows.map(normalizeNotice).filter(n=>String(n.visible||'Y').toUpperCase()!=='N');
  }catch(e){
    console.warn('공지 불러오기 실패:', e);
    notices=[];
  }
}

function normalizeNotice(n){
  return {
    noticeId:n.noticeId||n.id||stableId([n.startDate,n.title,n.content]),
    createdAt:n.createdAt||'',
    startDate:normalizeDate(n.startDate||n.date||today()),
    endDate:normalizeDate(n.endDate||n.startDate||today()),
    type:n.type||'안내',
    title:n.title||'',
    content:n.content||'',
    visible:n.visible||'Y'
  };
}

function activeNotices(){
  const t=today();
  return notices.filter(n=>n.title && n.startDate<=t && n.endDate>=t).sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
}

function renderNotices(){
  if(!$('noticeArea')) return;
  const list=activeNotices();
  if(!list.length){ $('noticeArea').innerHTML=''; return; }

  $('noticeArea').innerHTML=list.map(n=>`<div class="notice-box">
    <span class="notice-tag ${n.type==='긴급'?'emergency':''}">${escapeHtml(n.type||'안내')}</span>
    <h3>${escapeHtml(n.title)}</h3>
    <p>${escapeHtml(n.content).replace(/\n/g,'<br>')}</p>
    <p class="desc small">게시기간: ${escapeHtml(n.startDate)} ~ ${escapeHtml(n.endDate)}</p>
  </div>`).join('');
}

function populateManagerFilters(){
  const managers=Array.from(new Set(programs.map(p=>p.manager).filter(Boolean))).sort();

  const selects=[
    $('managerFilter'),
    $('programManageManager')
  ].filter(Boolean);

  selects.forEach(sel=>{
    const current=sel.value;
    sel.innerHTML='<option value="">전체 담당자</option>' + managers.map(m=>`<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('');
    sel.value=current;
  });
}

function renderProgramManageList(){
  if(!$('programManageList')) return;

  const date=$('programManageDate') ? $('programManageDate').value : '';
  const manager=$('programManageManager') ? $('programManageManager').value : '';
  const keyword=$('programManageKeyword') ? $('programManageKeyword').value.trim().toLowerCase() : '';

  let list=programs.slice();

  if(date) list=list.filter(p=>p.date===date);
  if(manager) list=list.filter(p=>p.manager===manager);
  if(keyword) list=list.filter(p=>[p.title,p.place,p.manager,p.target,p.memo].join(' ').toLowerCase().includes(keyword));

  list=list.sort((a,b)=>String(a.date+a.start).localeCompare(String(b.date+b.start))).slice(0,80);

  $('programManageList').innerHTML=list.length
    ? list.map(p=>`<div class="manage-item">
      <h4>${escapeHtml(p.title)}</h4>
      <p>📅 ${escapeHtml(p.date)} / ⏰ ${escapeHtml(p.start)}~${escapeHtml(p.end)}</p>
      <p>📍 ${escapeHtml(p.place||'장소 미입력')} / 👤 ${escapeHtml(p.manager||'담당자 미입력')} / 대상: ${escapeHtml(p.target||'미입력')}</p>
      ${p.memo?`<p>📝 ${escapeHtml(p.memo)}</p>`:''}
      <div class="item-actions">
        <button class="danger-btn" onclick="hideProgram('${escapeAttr(p.id)}')">휴강/숨김 처리</button>
      </div>
    </div>`).join('')
    : '<div class="empty">조건에 맞는 일정이 없습니다.</div>';
}

async function hideProgram(programId){
  if(!adminPinValue){ alert('운영자 번호가 필요합니다.'); return; }
  const reason=prompt('휴강/숨김 사유를 입력해주세요. 예: 담당자 출장, 장소 변경, 공휴일');
  if(reason===null) return;

  await postToScript({
    action:'hideProgram',
    pin:adminPinValue,
    programId:programId,
    reason:reason
  });

  alert('선택한 프로그램을 잠시 숨겼어요. 화면 반영까지 조금 기다려주세요.');
  setTimeout(async()=>{
    await loadPrograms();
    renderAll();
    renderProgramManageList();
  },1500);
}

async function submitNotice(e){
  e.preventDefault();
  if(!adminPinValue){ alert('운영자 번호가 필요합니다.'); return; }

  const fd=new FormData(e.target);
  const data=Object.fromEntries(fd.entries());
  data.pin=adminPinValue;

  if(data.startDate && data.endDate && data.startDate>data.endDate){
    alert('게시 종료일은 시작일보다 뒤여야 합니다.');
    return;
  }

  await postToScript(data);
  $('noticeNotice').textContent='공지 등록 요청을 보냈습니다. 잠시 후 공지를 다시 불러옵니다.';
  e.target.reset();

  setTimeout(async()=>{
    await loadNotices();
    renderNotices();
    renderNoticeManageList();
  },1500);
}

function renderNoticeManageList(){
  if(!$('noticeManageList')) return;

  if(!notices.length){
    $('noticeManageList').innerHTML='<div class="empty">등록된 공지가 없거나 Notices 시트가 아직 공개되지 않았습니다.</div>';
    return;
  }

  $('noticeManageList').innerHTML=notices.slice().reverse().map(n=>`<div class="manage-item">
    <h4>${escapeHtml(n.title)}</h4>
    <p>${escapeHtml(n.type)} / ${escapeHtml(n.startDate)} ~ ${escapeHtml(n.endDate)}</p>
    <p>${escapeHtml(n.content)}</p>
    <div class="item-actions"><button class="danger-btn" onclick="hideNotice('${escapeAttr(n.noticeId)}')">공지 숨김</button></div>
  </div>`).join('');
}

async function hideNotice(noticeId){
  if(!adminPinValue){ alert('운영자 번호가 필요합니다.'); return; }
  if(!confirm('이 공지를 숨김 처리할까요?')) return;

  await postToScript({action:'hideNotice',pin:adminPinValue,noticeId});
  alert('공지 숨김 요청을 보냈습니다.');

  setTimeout(async()=>{
    await loadNotices();
    renderNotices();
    renderNoticeManageList();
  },1500);
}

function renderAdminStats(){
  if(!$('adminStats')) return;

  const now=new Date();
  const ym=ymd(now.getFullYear(), now.getMonth()+1, 1).slice(0,7);
  const monthPrograms=programs.filter(p=>String(p.date||'').startsWith(ym)).length;
  const todayCount=programsForDateRaw(today()).length;
  const monthReviews=loadedReviews.filter(r=>String(r.date||'').startsWith(ym)).length;
  const managers=new Set(programs.map(p=>p.manager).filter(Boolean)).size;

  const reviewsByProgram={};
  loadedReviews.forEach(r=>{
    const key=r.programTitle||'프로그램 미입력';
    reviewsByProgram[key]=(reviewsByProgram[key]||0)+1;
  });
  const topReview=Object.entries(reviewsByProgram).sort((a,b)=>b[1]-a[1])[0];

  $('adminStats').innerHTML=`
    <div class="stat-card"><strong>${programs.length}</strong><span>전체 공개 일정</span></div>
    <div class="stat-card"><strong>${monthPrograms}</strong><span>${ym} 일정 수</span></div>
    <div class="stat-card"><strong>${todayCount}</strong><span>오늘 일정 수</span></div>
    <div class="stat-card"><strong>${loadedReviews.length}</strong><span>불러온 기록 수</span></div>
    <div class="stat-card"><strong>${monthReviews}</strong><span>${ym} 참여 기록 수</span></div>
    <div class="stat-card"><strong>${managers}</strong><span>등록 담당자 수</span></div>
    <div class="stat-card"><strong>${topReview ? escapeHtml(topReview[1]) : '-'}</strong><span>${topReview ? escapeHtml(topReview[0]) : '기록이 많은 프로그램'}</span></div>
  `;
}

function initAccessibility(){
  const saved=localStorage.getItem('nyj_big_text')==='Y';
  document.body.classList.toggle('large-text', saved);
}

function toggleBigText(){
  const next=!document.body.classList.contains('large-text');
  document.body.classList.toggle('large-text', next);
  localStorage.setItem('nyj_big_text', next?'Y':'N');
}


function normalizeProgram(p){ return {id:p.id||stableId([p.date,p.start,p.title]),date:normalizeDate(p.date),start:normalizeTime(p.start||''),end:normalizeTime(p.end||''),title:p.title||'',place:p.place||'',manager:p.manager||'',target:p.target||'',memo:p.memo||'',visible:p.visible}; }
function getScriptUrl(){
  const cfg = window.APP_CONFIG || {};
  return String(cfg.GOOGLE_SCRIPT_URL || '').trim();
}
function jsonp(url,params={}){ return new Promise((resolve,reject)=>{ const cb='cb_'+Date.now()+'_'+Math.random().toString(36).slice(2); params.callback=cb; const qs=new URLSearchParams(params).toString(); const script=document.createElement('script'); const timer=setTimeout(()=>{cleanup();reject(new Error('응답 시간 초과'));},10000); function cleanup(){clearTimeout(timer);delete window[cb];script.remove();} window[cb]=(data)=>{cleanup();resolve(data);}; script.onerror=()=>{cleanup();reject(new Error('스크립트 로드 실패'));}; script.src=url+(url.includes('?')?'&':'?')+qs; document.body.appendChild(script); }); }
async function postToScript(data){ const url=getScriptUrl(); if(!url){ alert('운영 연결 주소가 설정되지 않아 지금은 내용을 저장할 수 없습니다.'); return; } const form=document.createElement('form'); form.method='POST'; form.action=url; form.target='hiddenSubmitFrame'; form.style.display='none'; Object.entries(data).forEach(([k,v])=>{const input=document.createElement('input');input.name=k;input.value=v??'';form.appendChild(input);}); document.body.appendChild(form); form.submit(); setTimeout(()=>form.remove(),1000); }
function downloadCsv(name,rows){ if(!rows||!rows.length){alert('다운로드할 자료가 없습니다.');return;} const headers=Object.keys(rows[0]); const csv='\uFEFF'+[headers.join(','),...rows.map(r=>headers.map(h=>csvEscape(r[h]??'')).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
function csvEscape(v){ const s=String(v); return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function ymd(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;} function today(){const d=new Date();return ymd(d.getFullYear(),d.getMonth()+1,d.getDate());}
function normalizeDate(v){const s=String(v||'').trim().replace(/\./g,'-').replace(/\//g,'-');const m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);return m?ymd(m[1],m[2],m[3]):s;} function normalizeTime(v){const s=String(v||'').trim();const m=s.match(/(\d{1,2}):?(\d{2})?/);return m?`${m[1].padStart(2,'0')}:${(m[2]||'00').padStart(2,'0')}`:s;} function stableId(parts){let h=0;const str=parts.join('__');for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return 'id_'+Math.abs(h).toString(36);} function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));} function escapeAttr(v){return escapeHtml(v).replace(/`/g,'&#096;');}
function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then(reg => reg.update && reg.update())
    .catch(()=>{});
}
