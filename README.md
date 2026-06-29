# 남양주시장애인복지관 일정·출석·리뷰 웹앱


## 현재 입력된 연결 정보

- Apps Script URL: `https://script.google.com/macros/s/AKfycbwJjTCX56cZtCrKBgtaMS11PwPeYs4MJQiK8DAKqLoi_sbnI4qtaGXXgdk_TR4L625H/exec`
- Google Spreadsheet URL: `https://docs.google.com/spreadsheets/d/1Sqj4r2NDXF76_XiFBcAYTcD5rHcu-nTsJSpXqt5_g-U/edit?gid=1707161705#gid=1707161705`
- Spreadsheet ID: `1Sqj4r2NDXF76_XiFBcAYTcD5rHcu-nTsJSpXqt5_g-U`

`config.js`에는 위 Apps Script URL이 이미 입력되어 있습니다.  
GitHub Pages에 업로드한 뒤 바로 연결 테스트를 진행하면 됩니다.


이 버전은 **GitHub Pages + Google Sheets + Google Apps Script**만으로 작동하도록 만든 샘플입니다.

## 가능한 구조
- 이용인/직원 화면: 오늘의 일정, 월간 달력, 리뷰 제출
- 관리자 화면: PIN 입력 후 자료관리, 일정 추가, 제출 리뷰 확인
- 일정 데이터: Google Sheets의 `Programs` 시트에서 불러옴
- 리뷰 데이터: Google Sheets의 `Reviews` 시트에 저장됨

## 1. 구글 스프레드시트 만들기
1. 새 구글 스프레드시트를 만듭니다.
2. 이름 예시: `복지관_프로그램_일정_리뷰_DB`
3. 메뉴에서 `확장 프로그램 > Apps Script`를 클릭합니다.
4. `google-apps-script.gs` 파일 내용을 전부 복사해서 붙여넣습니다.
5. 코드 상단의 `ADMIN_PIN = '2026'` 부분을 원하는 관리자 번호로 바꿉니다.
6. 저장 후 `setup` 함수를 한 번 실행합니다.
7. 권한 승인 화면이 나오면 승인합니다.

## 2. Apps Script 웹앱 배포
1. Apps Script 오른쪽 위 `배포 > 새 배포`를 누릅니다.
2. 유형 선택에서 `웹 앱`을 선택합니다.
3. 실행 사용자: `나`
4. 액세스 권한: `모든 사용자`
5. 배포 후 나오는 `/exec`로 끝나는 URL을 복사합니다.

## 3. config.js 수정
`config.js` 파일을 열고 아래 부분에 복사한 URL을 붙여넣습니다.

```js
const APP_CONFIG = {
  GOOGLE_SCRIPT_URL: "여기에 Apps Script Web App URL 붙여넣기",
  LOCAL_SAMPLE_WHEN_EMPTY: true
};
```

## 4. 스프레드시트에 일정 입력
`Programs` 시트에 아래 열이 생성됩니다.

| id | date | start | end | title | place | manager | target | memo | visible |
|---|---|---|---|---|---|---|---|---|---|
| 비워도 됨 | 2026-07-01 | 10:00 | 11:00 | 음악활동 | 프로그램실1 | 김OO | 성인 | 비고 | Y |

주의:
- `date`는 `2026-07-01` 형식 권장
- `visible`이 `N`이면 앱에 표시되지 않습니다.
- `id`는 비워도 관리자 페이지에서 추가할 때 자동 생성됩니다. 직접 입력할 경우 중복되지 않게 입력하세요.

## 5. GitHub Pages 업로드
1. GitHub에 새 Repository를 만듭니다.
2. 이 폴더 안 파일 전체를 업로드합니다.
3. Repository `Settings > Pages`로 이동합니다.
4. `Deploy from a branch` 선택
5. Branch `main`, Folder `/root` 선택 후 저장합니다.
6. 생성된 GitHub Pages 주소로 접속합니다.

## 6. 휴대폰 앱처럼 쓰기
- 안드로이드 크롬: 메뉴 > 홈 화면에 추가 또는 앱 설치
- 아이폰 사파리: 공유 > 홈 화면에 추가

## 7. 중요한 한계
이 방식은 진짜 로그인/권한관리 시스템이 아닙니다.
관리자 PIN은 관리자 화면을 숨기는 용도이며, 높은 수준의 보안 기능은 아닙니다.

개인정보가 들어가는 정식 운영 시스템이라면 추후 Supabase, Firebase, 기관 서버 등 별도 인증/DB 시스템을 검토하는 것이 안전합니다.


## 관리자 화면 접속 방법

이번 버전은 이용인 화면에서 `자료 관리` 또는 `관리` 메뉴가 보이지 않습니다.

관리자 화면은 아래 방식으로 접속합니다.

- GitHub Pages 주소 뒤에 `?admin=1` 붙이기
- 또는 주소 뒤에 `#admin` 붙이기

예시:
`https://아이디.github.io/저장소이름/?admin=1`

관리자 화면에 들어가면 PIN을 입력해야 자료관리 화면이 표시됩니다.
기본 PIN은 Apps Script 코드의 `ADMIN_PIN` 값이며, 현재 기본값은 `2026`입니다.

## 이전 화면이 계속 보일 때

예전 화면이 계속 보이면 브라우저 캐시 또는 서비스워커 캐시 때문일 수 있습니다.

1. GitHub 저장소에 새 파일이 제대로 올라갔는지 확인
2. `index.html`, `styles.css`, `app.js`, `config.js`, `sw.js`가 모두 새 파일인지 확인
3. 휴대폰/PC 브라우저에서 강력 새로고침 또는 시크릿창으로 접속
4. 기존 홈화면 아이콘을 삭제 후 다시 추가

## PWA 설치 안내 페이지

이번 버전에는 `install.html` 파일이 추가되어 있습니다.

GitHub Pages 배포 후 설치 안내 주소는 아래처럼 됩니다.

`https://아이디.github.io/저장소이름/install.html`

이 주소를 이용인이나 직원에게 문자/카카오톡으로 보내면 됩니다.

- 안드로이드 Chrome/Edge: `앱 설치하기` 버튼이 활성화될 수 있습니다.
- 아이폰 Safari: 공유 버튼 > 홈 화면에 추가 방식으로 설치합니다.
- 관리자 화면은 기존처럼 `?admin=1` 주소로 접속합니다.


## 최종 연결 정보

Apps Script URL:
`https://script.google.com/macros/s/AKfycbzAVaUmkWsWSR_R0GmL_ijyLsie0bw7fIuyR8wuo_cZsDQVxeF7PrwXbXkgaUmt4g0u/exec`

Google Spreadsheet URL:
`https://docs.google.com/spreadsheets/d/1Sqj4r2NDXF76_XiFBcAYTcD5rHcu-nTsJSpXqt5_g-U/edit?gid=1707161705#gid=1707161705`

이 ZIP 파일의 `config.js`에는 위 Apps Script URL이 이미 반영되어 있습니다.


## 개인 일정 기능

이번 버전에는 이용인 개인용 `나의 일정` 탭이 추가되어 있습니다.

- 개인 일정은 Google Sheets로 전송되지 않습니다.
- 개인 일정은 현재 휴대폰/브라우저의 localStorage에만 저장됩니다.
- 관리자는 개인 일정을 볼 수 없습니다.
- 브라우저 데이터 삭제, 기기 변경, 홈화면 앱 삭제 시 개인 일정이 사라질 수 있으므로 백업 다운로드 기능을 함께 제공합니다.


## 캐시 초기화 안내

일반 크롬에서는 안 되고 시크릿 모드에서만 정상 작동하는 경우, 기존 PWA 서비스워커 캐시가 예전 파일을 붙잡고 있는 상태일 가능성이 큽니다.

업로드 후 아래 주소를 한 번 열어 캐시를 초기화하세요.

https://flydown98.github.io/nyjchul/clear-cache.html?v=cachefix20260629

이 페이지는 개인 일정 localStorage는 삭제하지 않고, 서비스워커와 CacheStorage만 삭제합니다.


## 일정 불러오기 안정화 버전

이번 버전은 기본 프로그램 일정 읽기를 Apps Script가 아니라 Google Sheets 공개 읽기(gviz) 방식으로 우선 처리합니다.

필수 설정:
1. 스프레드시트 열기
2. 파일 > 공유 > 웹에 게시
3. 시트 선택: Programs
4. 형식: 웹페이지 또는 CSV 아무거나 가능
5. 게시

테스트:
https://flydown98.github.io/nyjchul/sheet-test.html?v=publicsheet20260629

앱:
https://flydown98.github.io/nyjchul/?v=publicsheet20260629

주의:
- Programs 시트에는 개인정보를 넣지 마세요.
- 리뷰 저장과 관리자 기능은 Apps Script를 계속 사용합니다.
- 일정 읽기는 로그인 계정 문제를 피하기 위해 공개 스프레드시트 읽기 방식으로 바꿨습니다.


## 정기 일정 관리자 기능

이번 버전에는 관리자 페이지에 `정기 프로그램 일정 생성`과 `정기 일정 관리`가 추가되었습니다.

관리자 URL:
https://flydown98.github.io/nyjchul/?admin=1&v=recurring20260629

필수:
1. Apps Script 편집기에서 `google-apps-script.gs` 내용을 전체 교체합니다.
2. `setup` 함수를 1회 실행합니다.
3. 새 배포 또는 기존 배포 업데이트를 진행합니다.
4. config.js의 GOOGLE_SCRIPT_URL이 현재 배포 URL과 맞는지 확인합니다.

정기 일정 기능:
- 시작일~종료일
- 반복 요일
- 시작/종료 시간
- 프로그램명/장소/담당자/대상/비고 입력
- 해당 기간 안의 매주 반복 일정을 Programs 시트에 자동 생성
- RecurringPrograms 시트에 규칙 저장
- 정기 일정 삭제 시 해당 규칙으로 생성한 Programs 일정은 visible=N으로 숨김 처리

주의:
- Programs 시트가 공개 읽기 방식이므로 개인정보를 넣지 마세요.
- 삭제는 물리 삭제가 아니라 숨김 처리입니다. 이력 보존 목적입니다.


## 전체 기능 추가 버전

버전: fulladmin20260629

추가/포함 기능:
- 정기 일정 생성/삭제
- 개별 일정 휴강/숨김 처리
- 담당자별 일정 보기
- 리뷰 CSV 다운로드
- 프로그램별 리뷰 모아보기
- 오늘의 안내문/긴급공지
- 월별 프로그램 수, 리뷰 수 통계
- 큰 글씨 모드
- 스프레드시트 백업 안내

필수 작업:
1. ZIP 압축을 풀어 GitHub 저장소에 전체 덮어쓰기
2. Apps Script 편집기에서 `google-apps-script.gs` 내용을 전체 교체
3. Apps Script에서 `setup` 함수 1회 실행
4. 새 배포 또는 배포 업데이트
5. config.js의 GOOGLE_SCRIPT_URL이 현재 배포 URL과 맞는지 확인
6. 스프레드시트에서 Programs, Notices 시트를 웹에 게시
   - 파일 > 공유 > 웹에 게시
   - Programs 시트 게시
   - Notices 시트도 게시 또는 전체 문서 게시

접속:
- 이용인/직원: https://flydown98.github.io/nyjchul/?v=fulladmin20260629
- 설치 안내: https://flydown98.github.io/nyjchul/install.html?v=fulladmin20260629
- 총관리자: https://flydown98.github.io/nyjchul/?admin=1&v=fulladmin20260629

주의:
- Programs, Notices 시트는 공개 읽기 방식이므로 개인정보를 넣지 마세요.
- Reviews 시트는 Apps Script를 통해 관리자만 확인하는 구조입니다.
- 삭제 기능은 물리 삭제가 아니라 visible=N 숨김 처리입니다.


## 공개용 디자인 개선 버전

버전: friendly20260629

변경 사항:
- 이용인이 보기 쉬운 공개용 화면 디자인으로 조정
- 첫 화면 문구를 친근한 표현으로 변경
- 화면에서 `스프레드시트`, `출석부` 같은 기술적인 표현 최소화
- 참여 기록 화면을 더 부드러운 문구로 변경
- 큰 글씨 모드 버튼 문구 개선
- 운영자 기능은 그대로 유지
