let deferredPrompt = null;
const installButton = document.getElementById('installButton');
const installStatus = document.getElementById('installStatus');
const installUrl = document.getElementById('installUrl');
const copyUrl = document.getElementById('copyUrl');

installUrl.value = window.location.href;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

if (isStandalone()) {
  installButton.disabled = true;
  installStatus.textContent = '이미 앱처럼 설치되어 실행 중입니다.';
} else if (isIOS()) {
  installButton.disabled = true;
  installStatus.textContent = '아이폰은 설치 버튼 대신 Safari 공유 버튼 → 홈 화면에 추가로 설치해주세요.';
} else {
  installStatus.textContent = '설치 조건을 확인 중입니다. 버튼이 활성화되지 않으면 브라우저 메뉴에서 홈 화면에 추가를 선택해주세요.';
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installButton.disabled = false;
  installStatus.textContent = '설치 준비가 완료되었습니다. 앱 설치하기 버튼을 눌러주세요.';
});

installButton.addEventListener('click', async () => {
  if (!deferredPrompt) {
    installStatus.textContent = isIOS()
      ? '아이폰은 Safari 공유 버튼 → 홈 화면에 추가로 설치해주세요.'
      : '브라우저 메뉴에서 홈 화면에 추가 또는 앱 설치를 선택해주세요.';
    return;
  }
  installButton.disabled = true;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (choice.outcome === 'accepted') {
    installStatus.textContent = '설치가 시작되었습니다. 홈 화면 아이콘을 확인해주세요.';
  } else {
    installStatus.textContent = '설치가 취소되었습니다. 필요할 때 다시 시도해주세요.';
    installButton.disabled = false;
  }
});

window.addEventListener('appinstalled', () => {
  installStatus.textContent = '앱 설치가 완료되었습니다. 홈 화면 아이콘으로 실행할 수 있습니다.';
  installButton.disabled = true;
});

copyUrl.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(installUrl.value);
    copyUrl.textContent = '복사됨';
  } catch {
    installUrl.select();
    document.execCommand('copy');
    copyUrl.textContent = '복사됨';
  }
  setTimeout(() => copyUrl.textContent = '복사', 1500);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
