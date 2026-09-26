# Setup Guide

## 개발 환경 요구사항

| 구분 | 요구사항 |
|------|----------|
| Node.js | 16.x 이상 |
| npm | 8.x 이상 |
| Chrome | 최신 버전 (Manifest V3 지원) |
| 에디터 | VS Code 권장 (TypeScript 지원) |

## 프로젝트 클론 및 의존성 설치

```bash
# 리포지토리 클론
git clone https://github.com/minjungsung/Leethub.git
cd Leethub

# 의존성 설치
npm install
```

## 주요 의존성 목록

```
react 18 / react-dom 18     — Popup UI 프레임워크
react-router-dom 6          — Popup 내 라우팅
semantic-ui-react / css      — UI 컴포넌트
jquery                       — DOM 조작 (Content Script)
js-sha1                      — SHA1 해시 (blob 생성)
typescript 4.x               — 타입 시스템
webextension-polyfill         — 크로스 브라우저 호환
react-app-rewired            — CRA 빌드 커스터마이징
```

## 빌드 방법

### 개발 빌드

```bash
# React 앱 (Popup + Content Scripts) 빌드
npm run build:dev

# Background Script 빌드 (별도)
npx webpack --config webpack.config.js
```

### 프로덕션 빌드

```bash
# React 앱 프로덕션 빌드 (INLINE_RUNTIME_CHUNK=false)
npm run build

# Background Script 프로덕션 빌드
npx webpack --config webpack.config.js --mode production
```

> **참고**: `INLINE_RUNTIME_CHUNK=false`는 Chrome Extension에서 인라인 스크립트를 금지하는 CSP 정책 때문에 필요합니다.

## Chrome에 확장 프로그램 로드

1. Chrome 주소창에 `chrome://extensions/` 입력
2. 우측 상단 **"개발자 모드"** 활성화
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. `build/` 디렉토리 선택
5. LeetHub 아이콘이 도구 모음에 나타나는지 확인

```
chrome://extensions/
┌─────────────────────────────────────────┐
│  [✓] 개발자 모드                        │
│                                         │
│  [압축해제된 확장 프로그램을 로드합니다]  │
│         ↓                               │
│    build/ 디렉토리 선택                  │
└─────────────────────────────────────────┘
```

## 개발 중 핫 리로드

```bash
# 파일 변경 감지 → 자동 확장 프로그램 리로드
npm run watch
```

`chokidar`를 통해 파일 변경을 감지하고 `reload-extension.js` 스크립트로 Chrome Extension을 자동 리로드합니다.

## manifest.json 핵심 설정

```json
{
  "manifest_version": 3,
  "name": "LeetHub",
  "version": "1.0.4",
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["toast.js", "util.js", "github.js", ...],
    "run_at": "document_idle",
    "world": "ISOLATED"
  }],
  "permissions": ["unlimitedStorage", "storage"],
  "host_permissions": [
    "https://leetcode.com/*",
    "https://github.com/*",
    "https://practice.geeksforgeeks.org/*",
    "https://www.acmicpc.net/",
    "https://school.programmers.co.kr/",
    "https://swexpertacademy.com/",
    "https://solved.ac/api/v3/*",
    "https://level.goorm.io/"
  ]
}
```

## GitHub Actions CI/CD

`.github/workflows/release.yml`에서 릴리스 빌드 자동화가 설정되어 있습니다.

## 트러블슈팅

### Content Security Policy (CSP) 에러

```
Refused to execute inline script because it violates the following CSP directive
```

→ `INLINE_RUNTIME_CHUNK=false`로 빌드했는지 확인

### Chrome Storage 관련 에러

→ `chrome://extensions/`에서 확장 프로그램의 `permissions`에 `storage`와 `unlimitedStorage`가 포함되어 있는지 확인

### CORS 에러 (solved.ac API)

→ solved.ac API 호출은 반드시 Background Script (Service Worker)를 통해야 합니다. Content Script에서 직접 호출하면 CORS 에러 발생.

### OAuth2 인증 실패

→ GitHub OAuth App 설정에서 콜백 URL이 올바른지 확인. Chrome Extension의 경우 `https://github.com/` 패턴이 host_permissions에 포함되어야 합니다.
