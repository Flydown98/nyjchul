/**
 * 남양주시장애인복지관 일정·출석·리뷰 웹앱용 Google Apps Script
 * 전체 기능 버전: Programs / Reviews / RecurringPrograms / Notices
 */

const SPREADSHEET_ID = '1Sqj4r2NDXF76_XiFBcAYTcD5rHcu-nTsJSpXqt5_g-U';
const ADMIN_PIN = '2026';

const SHEET_PROGRAMS = 'Programs';
const SHEET_REVIEWS = 'Reviews';
const SHEET_RECURRING = 'RecurringPrograms';
const SHEET_NOTICES = 'Notices';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setup() {
  const ss = getSpreadsheet();

  ensureSheet_(ss, SHEET_PROGRAMS, [
    'id','date','start','end','title','place','manager','target','memo','visible'
  ]);

  ensureSheet_(ss, SHEET_REVIEWS, [
    'timestamp','date','programId','programTitle','programTime','place','manager',
    'personName','personCode','status','review','again','activities','memo','userAgent'
  ]);

  ensureSheet_(ss, SHEET_RECURRING, [
    'ruleId','createdAt','startDate','endDate','weekday','start','end','title',
    'place','manager','target','memo','generatedCount','active'
  ]);

  ensureSheet_(ss, SHEET_NOTICES, [
    'noticeId','createdAt','startDate','endDate','type','title','content','visible'
  ]);

  return 'Programs / Reviews / RecurringPrograms / Notices 시트 설정 완료';
}

function doGet(e) {
  setup();

  const p = e.parameter || {};
  const action = String(p.action || 'programs');
  let result;

  try {
    if (action === 'status') {
      result = { ok: true, message: 'Apps Script 연결 성공', time: new Date().toISOString() };
    } else if (action === 'programs') {
      result = { ok: true, programs: readPrograms_() };
    } else if (action === 'reviews') {
      checkAdmin_(p);
      result = { ok: true, reviews: readReviews_() };
    } else if (action === 'recurringRules') {
      checkAdmin_(p);
      result = { ok: true, rules: readRecurringRules_() };
    } else if (action === 'notices') {
      result = { ok: true, notices: readNotices_() };
    } else {
      result = { ok: false, error: '알 수 없는 action입니다.', action: action };
    }
  } catch (err) {
    result = { ok: false, error: err.message };
  }

  return output_(result, p.callback);
}

function doPost(e) {
  setup();

  const p = e.parameter || {};

  try {
    if (p.action === 'addReview') {
      addReview_(p);
    } else if (p.action === 'addProgram') {
      checkAdmin_(p);
      addProgram_(p);
    } else if (p.action === 'hideProgram') {
      checkAdmin_(p);
      hideProgram_(p.programId, p.reason || '');
    } else if (p.action === 'addRecurringRule') {
      checkAdmin_(p);
      addRecurringRule_(p);
    } else if (p.action === 'deleteRecurringRule') {
      checkAdmin_(p);
      deleteRecurringRule_(p.ruleId);
    } else if (p.action === 'addNotice') {
      checkAdmin_(p);
      addNotice_(p);
    } else if (p.action === 'hideNotice') {
      checkAdmin_(p);
      hideNotice_(p.noticeId);
    } else {
      throw new Error('알 수 없는 action입니다: ' + p.action);
    }

    return HtmlService.createHtmlOutput('OK');
  } catch (err) {
    return HtmlService.createHtmlOutput('ERROR: ' + err.message);
  }
}

function checkAdmin_(p) {
  if (String(p.pin || '') !== ADMIN_PIN) {
    throw new Error('관리자 PIN이 맞지 않습니다.');
  }
}

function readPrograms_() {
  const sh = getSpreadsheet().getSheetByName(SHEET_PROGRAMS);
  const values = sh.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];

  const headers = values[0];

  return values
    .slice(1)
    .map(row => objectFromRow_(headers, row))
    .filter(item => item.date && item.title && String(item.visible || 'Y').toUpperCase() !== 'N');
}

function readReviews_() {
  const sh = getSpreadsheet().getSheetByName(SHEET_REVIEWS);
  const values = sh.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];

  const headers = values[0];

  return values.slice(1).map(row => objectFromRow_(headers, row));
}

function readRecurringRules_() {
  const sh = getSpreadsheet().getSheetByName(SHEET_RECURRING);
  const values = sh.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];

  const headers = values[0];

  return values
    .slice(1)
    .map(row => objectFromRow_(headers, row))
    .filter(item => item.ruleId);
}

function readNotices_() {
  const sh = getSpreadsheet().getSheetByName(SHEET_NOTICES);
  const values = sh.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];

  const headers = values[0];

  return values
    .slice(1)
    .map(row => objectFromRow_(headers, row))
    .filter(item => item.noticeId && String(item.visible || 'Y').toUpperCase() !== 'N');
}

function addReview_(p) {
  const sh = getSpreadsheet().getSheetByName(SHEET_REVIEWS);

  sh.appendRow([
    new Date(),
    p.date || '',
    p.programId || '',
    p.programTitle || '',
    p.programTime || '',
    p.place || '',
    p.manager || '',
    p.personName || '',
    p.personCode || '',
    p.status || '',
    p.review || '',
    p.again || '',
    p.activities || '',
    p.memo || '',
    p.userAgent || ''
  ]);
}

function addProgram_(p) {
  const sh = getSpreadsheet().getSheetByName(SHEET_PROGRAMS);
  const id = p.id || Utilities.getUuid();

  sh.appendRow([
    id,
    p.date || '',
    normalizeTimeForSheet_(p.start || ''),
    normalizeTimeForSheet_(p.end || ''),
    p.title || '',
    p.place || '',
    p.manager || '',
    p.target || '',
    p.memo || '',
    'Y'
  ]);
}

function hideProgram_(programId, reason) {
  if (!programId) throw new Error('programId가 없습니다.');

  const sh = getSpreadsheet().getSheetByName(SHEET_PROGRAMS);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0].map(String);
  const idCol = headers.indexOf('id') + 1;
  const memoCol = headers.indexOf('memo') + 1;
  const visibleCol = headers.indexOf('visible') + 1;

  if (!idCol || !visibleCol) throw new Error('Programs 시트에 id 또는 visible 열이 없습니다.');

  for (let r = 2; r <= values.length; r++) {
    if (String(sh.getRange(r, idCol).getValue()) === String(programId)) {
      sh.getRange(r, visibleCol).setValue('N');

      if (memoCol) {
        const oldMemo = String(sh.getRange(r, memoCol).getValue() || '');
        const add = '[숨김:' + formatDateTimeForSheet_(new Date()) + '] ' + (reason || '사유 미입력');
        sh.getRange(r, memoCol).setValue((oldMemo + ' ' + add).trim());
      }

      return;
    }
  }

  throw new Error('해당 일정을 찾지 못했습니다.');
}

function addRecurringRule_(p) {
  const ss = getSpreadsheet();
  const programsSheet = ss.getSheetByName(SHEET_PROGRAMS);
  const recurringSheet = ss.getSheetByName(SHEET_RECURRING);

  const ruleId = 'R_' + Utilities.getUuid().slice(0, 8);
  const startDate = parseDate_(p.startDate);
  const endDate = parseDate_(p.endDate);
  const weekdayNumber = weekdayToNumber_(p.weekday);

  if (!startDate || !endDate) throw new Error('시작일/종료일이 올바르지 않습니다.');
  if (startDate > endDate) throw new Error('종료일은 시작일보다 뒤여야 합니다.');
  if (weekdayNumber === null) throw new Error('요일이 올바르지 않습니다.');
  if (!p.title) throw new Error('프로그램명을 입력해주세요.');

  const rowsToAppend = [];
  const existingKeys = getExistingProgramKeys_(programsSheet);

  let current = new Date(startDate);

  while (current <= endDate) {
    if (current.getDay() === weekdayNumber) {
      const dateText = formatDateForSheet_(current);
      const startText = normalizeTimeForSheet_(p.start || '');
      const endText = normalizeTimeForSheet_(p.end || '');
      const title = p.title || '';

      const id = ruleId + '_' + dateText;
      const scheduleKey = [dateText, startText, title].join('__');

      if (!existingKeys.has(scheduleKey)) {
        rowsToAppend.push([
          id,
          dateText,
          startText,
          endText,
          title,
          p.place || '',
          p.manager || '',
          p.target || '',
          makeRecurringMemo_(ruleId, p.memo || ''),
          'Y'
        ]);

        existingKeys.add(scheduleKey);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  if (rowsToAppend.length > 0) {
    programsSheet
      .getRange(programsSheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length)
      .setValues(rowsToAppend);
  }

  recurringSheet.appendRow([
    ruleId,
    new Date(),
    formatDateForSheet_(startDate),
    formatDateForSheet_(endDate),
    p.weekday || '',
    normalizeTimeForSheet_(p.start || ''),
    normalizeTimeForSheet_(p.end || ''),
    p.title || '',
    p.place || '',
    p.manager || '',
    p.target || '',
    p.memo || '',
    rowsToAppend.length,
    'Y'
  ]);

  return ruleId;
}

function deleteRecurringRule_(ruleId) {
  if (!ruleId) throw new Error('ruleId가 없습니다.');

  const ss = getSpreadsheet();
  const programsSheet = ss.getSheetByName(SHEET_PROGRAMS);
  const recurringSheet = ss.getSheetByName(SHEET_RECURRING);

  markRecurringRuleInactive_(recurringSheet, ruleId);
  hideProgramsByRuleId_(programsSheet, ruleId);
}

function addNotice_(p) {
  const sh = getSpreadsheet().getSheetByName(SHEET_NOTICES);
  const noticeId = p.noticeId || 'N_' + Utilities.getUuid().slice(0, 8);

  if (!p.title) throw new Error('공지 제목을 입력해주세요.');
  if (!p.content) throw new Error('공지 내용을 입력해주세요.');

  sh.appendRow([
    noticeId,
    new Date(),
    p.startDate || formatDateForSheet_(new Date()),
    p.endDate || p.startDate || formatDateForSheet_(new Date()),
    p.type || '안내',
    p.title || '',
    p.content || '',
    'Y'
  ]);
}

function hideNotice_(noticeId) {
  if (!noticeId) throw new Error('noticeId가 없습니다.');

  const sh = getSpreadsheet().getSheetByName(SHEET_NOTICES);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0].map(String);
  const idCol = headers.indexOf('noticeId') + 1;
  const visibleCol = headers.indexOf('visible') + 1;

  if (!idCol || !visibleCol) throw new Error('Notices 시트에 noticeId 또는 visible 열이 없습니다.');

  for (let r = 2; r <= values.length; r++) {
    if (String(sh.getRange(r, idCol).getValue()) === String(noticeId)) {
      sh.getRange(r, visibleCol).setValue('N');
      return;
    }
  }

  throw new Error('해당 공지를 찾지 못했습니다.');
}

function markRecurringRuleInactive_(sheet, ruleId) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0].map(String);
  const ruleIdCol = headers.indexOf('ruleId') + 1;
  const activeCol = headers.indexOf('active') + 1;

  if (!ruleIdCol || !activeCol) return;

  for (let r = 2; r <= values.length; r++) {
    if (String(sheet.getRange(r, ruleIdCol).getValue()) === String(ruleId)) {
      sheet.getRange(r, activeCol).setValue('N');
    }
  }
}

function hideProgramsByRuleId_(sheet, ruleId) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0].map(String);
  const idCol = headers.indexOf('id') + 1;
  const memoCol = headers.indexOf('memo') + 1;
  const visibleCol = headers.indexOf('visible') + 1;

  if (!visibleCol) return;

  for (let r = 2; r <= values.length; r++) {
    const id = idCol ? String(sheet.getRange(r, idCol).getValue()) : '';
    const memo = memoCol ? String(sheet.getRange(r, memoCol).getValue()) : '';

    if (id.indexOf(ruleId + '_') === 0 || memo.indexOf('[RULE:' + ruleId + ']') >= 0) {
      sheet.getRange(r, visibleCol).setValue('N');
    }
  }
}

function getExistingProgramKeys_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const keys = new Set();

  if (values.length <= 1) return keys;

  const headers = values[0];

  values.slice(1).forEach(row => {
    const item = objectFromRow_(headers, row);
    if (String(item.visible || 'Y').toUpperCase() === 'N') return;

    const key = [
      normalizeDateText_(item.date || ''),
      normalizeTimeForSheet_(item.start || ''),
      item.title || ''
    ].join('__');

    keys.add(key);
  });

  return keys;
}

function makeRecurringMemo_(ruleId, memo) {
  const text = memo ? String(memo) : '';
  return ('[RULE:' + ruleId + '] ' + text).trim();
}

function weekdayToNumber_(weekday) {
  const text = String(weekday || '').trim().toLowerCase();

  const map = {
    '일': 0, '일요일': 0, 'sun': 0, 'sunday': 0,
    '월': 1, '월요일': 1, 'mon': 1, 'monday': 1,
    '화': 2, '화요일': 2, 'tue': 2, 'tuesday': 2,
    '수': 3, '수요일': 3, 'wed': 3, 'wednesday': 3,
    '목': 4, '목요일': 4, 'thu': 4, 'thursday': 4,
    '금': 5, '금요일': 5, 'fri': 5, 'friday': 5,
    '토': 6, '토요일': 6, 'sat': 6, 'saturday': 6
  };

  return map[text] !== undefined ? map[text] : null;
}

function parseDate_(value) {
  const text = normalizeDateText_(value);
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!m) return null;

  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function normalizeDateText_(value) {
  const text = String(value || '').trim().replace(/\./g, '-').replace(/\//g, '-');
  const m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (!m) return text;

  return [
    m[1],
    String(m[2]).padStart(2, '0'),
    String(m[3]).padStart(2, '0')
  ].join('-');
}

function normalizeTimeForSheet_(value) {
  const text = String(value || '').trim();
  const m = text.match(/(\d{1,2}):?(\d{2})?/);

  if (!m) return text;

  return String(m[1]).padStart(2, '0') + ':' + String(m[2] || '00').padStart(2, '0');
}

function formatDateForSheet_(date) {
  return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd');
}

function formatDateTimeForSheet_(date) {
  return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  const first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeader = first.some(v => String(v).trim() !== '');

  if (!hasHeader) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sh.setFrozenRows(1);
}

function objectFromRow_(headers, row) {
  const obj = {};

  headers.forEach((h, i) => {
    obj[String(h).trim()] = row[i];
  });

  return obj;
}

function output_(obj, callback) {
  const json = JSON.stringify(obj);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function checkAccess() {
  const ss = getSpreadsheet();
  Logger.log('스프레드시트 이름: ' + ss.getName());
  return ss.getName();
}
