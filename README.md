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
