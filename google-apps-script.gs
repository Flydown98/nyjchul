/**
 * 남양주시장애인복지관 일정·출석·리뷰 웹앱용 Google Apps Script
 * 독립형 Apps Script + 특정 스프레드시트 ID 연결 버전
 */

const SPREADSHEET_ID = '1Sqj4r2NDXF76_XiFBcAYTcD5rHcu-nTsJSpXqt5_g-U';
const ADMIN_PIN = '2026';
const SHEET_PROGRAMS = 'Programs';
const SHEET_REVIEWS = 'Reviews';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setup() {
  const ss = getSpreadsheet();
  ensureSheet_(ss, SHEET_PROGRAMS, ['id','date','start','end','title','place','manager','target','memo','visible']);
  ensureSheet_(ss, SHEET_REVIEWS, ['timestamp','date','programId','programTitle','programTime','place','manager','personName','personCode','status','review','again','activities','memo','userAgent']);
  return 'Programs / Reviews 시트 설정 완료';
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
      if (String(p.pin || '') !== ADMIN_PIN) result = { ok: false, error: '관리자 PIN이 맞지 않습니다.' };
      else result = { ok: true, reviews: readReviews_() };
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
      if (String(p.pin || '') !== ADMIN_PIN) throw new Error('관리자 PIN이 맞지 않습니다.');
      addProgram_(p);
    } else {
      throw new Error('알 수 없는 action입니다: ' + p.action);
    }
    return HtmlService.createHtmlOutput('OK');
  } catch (err) {
    return HtmlService.createHtmlOutput('ERROR: ' + err.message);
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
    p.start || '',
    p.end || '',
    p.title || '',
    p.place || '',
    p.manager || '',
    p.target || '',
    p.memo || '',
    'Y'
  ]);
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
  headers.forEach((h, i) => obj[String(h).trim()] = row[i]);
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
