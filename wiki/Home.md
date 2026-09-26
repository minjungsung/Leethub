# LeetHub

> LeetCode 솔루션을 자동으로 GitHub에 동기화하는 Chrome Extension

## 프로젝트 개요

LeetHub는 LeetCode, GeeksforGeeks, 프로그래머스, 백준(BOJ), SWEA, 구름 등 여러 코딩 플랫폼에서 문제를 풀면 자동으로 GitHub 리포지토리에 솔루션 코드를 커밋해주는 Chrome 확장 프로그램입니다.

### 주요 기능

- **자동 GitHub 동기화**: 코딩 플랫폼에서 문제 풀이 후 자동으로 GitHub에 커밋
- **다중 플랫폼 지원**: LeetCode, GeeksforGeeks, 프로그래머스, 백준, SWEA, 구름
- **GitHub OAuth2 인증**: 안전한 토큰 기반 인증
- **풀이 통계 추적**: solved.ac API를 통한 문제 난이도 및 정보 조회
- **팝업 UI**: React 기반의 직관적인 확장 프로그램 팝업

### 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 | TypeScript |
| UI 프레임워크 | React 18, Semantic UI React |
| 빌드 도구 | Webpack, react-app-rewired |
| Extension API | Chrome Extension Manifest V3 |
| 외부 API | GitHub REST API v3, solved.ac API |
| 패키지 관리 | npm |

### 지원 플랫폼

| 플랫폼 | URL 패턴 |
|--------|----------|
| LeetCode | `https://leetcode.com/*` |
| GitHub | `https://github.com/*` |
| GeeksforGeeks | `https://practice.geeksforgeeks.org/*` |
| 백준 (BOJ) | `https://www.acmicpc.net/` |
| 프로그래머스 | `https://school.programmers.co.kr/` |
| SWEA | `https://swexpertacademy.com/` |
| 구름 | `https://level.goorm.io/` |
| solved.ac | `https://solved.ac/api/v3/*` |

### 프로젝트 구조

```
Leethub/
├── public/
│   ├── manifest.json          # Chrome Extension Manifest V3
│   ├── index.html             # Popup HTML
│   └── assets/                # 아이콘, 썸네일
├── src/
│   ├── scripts/               # 핵심 로직
│   │   ├── background.ts      # Service Worker
│   │   ├── github.ts          # GitHub API 클라이언트
│   │   ├── authorize.ts       # OAuth2 인증 흐름
│   │   ├── oauth2.ts          # OAuth2 토큰 관리
│   │   ├── storage.ts         # Chrome Storage 래퍼
│   │   ├── enable.ts          # 확장 활성화 로직
│   │   ├── toast.ts           # 알림 토스트 UI
│   │   ├── util.ts            # 유틸리티 함수
│   │   └── leetcode/          # 플랫폼별 파싱 로직
│   │       ├── variables.ts
│   │       ├── util.ts
│   │       ├── parsing.ts
│   │       ├── programmers.ts
│   │       └── uploadfunctions.ts
│   ├── components/            # React 컴포넌트
│   │   ├── Popup.tsx
│   │   └── Welcome.tsx
│   ├── popup/                 # 팝업 엔트리
│   ├── types/                 # TypeScript 타입 정의
│   ├── constants/             # 상수 정의
│   └── css/                   # 스타일시트
├── webpack.config.js          # Background script 번들링
├── config-overrides.js        # CRA 빌드 커스터마이징
└── package.json
```

## 관련 페이지

- [[Architecture]] — Chrome Extension 아키텍처 및 데이터 흐름
- [[Setup-Guide]] — 개발 환경 설정 및 빌드 가이드
