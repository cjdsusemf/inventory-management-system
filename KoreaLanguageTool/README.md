# 재고관리 시스템 (Inventory Management System)

한국어 기반의 웹 기반 재고관리 시스템입니다.

## 주요 기능

- **품목 관리**: 품목 등록, 수정, 삭제
- **거래처 관리**: 거래처 등록, 엑셀 일괄등록, 수정, 삭제
- **매입/매출 관리**: 매입/매출 등록, 수정, 삭제
- **재고현황**: 실시간 재고 현황 및 분석
- **월별 조회**: 월별 매입/매출 통계
- **대시보드**: 매출/매입 추이, 재고 경고, 활동 피드
- **사용자 관리**: 회원가입, 로그인, 관리자 승인 시스템

## 기술 스택

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.0
- Chart.js (차트 라이브러리)
- XLSX.js (엑셀 파일 처리)
- Boxicons (아이콘)
- LocalStorage (데이터 저장)

## 설치 및 실행

1. 프로젝트를 다운로드하거나 클론합니다.
2. `index.html` 파일을 웹 브라우저에서 열거나 로컬 서버를 실행합니다.

```bash
# Python 3를 사용한 간단한 로컬 서버
python -m http.server 8000

# Node.js를 사용한 경우
npx http-server
```

3. 브라우저에서 `http://localhost:8000`으로 접속합니다.

## 배포 방법

### GitHub Pages (무료)

1. GitHub에 새 저장소를 생성합니다.
2. 프로젝트 파일들을 업로드합니다.
3. 저장소 설정에서 Pages를 활성화합니다:
   - Settings → Pages
   - Source를 "Deploy from a branch"로 설정
   - Branch를 "main"으로 선택
   - Save 클릭

### Netlify (무료)

1. [Netlify](https://netlify.com)에 가입합니다.
2. "New site from Git" 클릭
3. GitHub 저장소를 연결합니다.
4. 자동으로 배포됩니다.

### Vercel (무료)

1. [Vercel](https://vercel.com)에 가입합니다.
2. "New Project" 클릭
3. GitHub 저장소를 import합니다.
4. 자동으로 배포됩니다.

## 사용법

### 초기 설정

1. **관리자 로그인**: 
   - 아이디: `wapeople`
   - 비밀번호: `rudckfcjd1!`

2. **회원가입 승인**: 관리자 패널에서 사용자 가입을 승인합니다.

3. **기업 선택**: 관리자는 관리할 기업을 선택할 수 있습니다.

### 기본 사용법

1. **품목 등록**: 먼저 품목을 등록합니다.
2. **거래처 등록**: 거래처 정보를 등록합니다.
3. **매입/매출 등록**: 거래 내역을 등록합니다.
4. **재고 확인**: 재고현황에서 실시간 재고를 확인합니다.

## 파일 구조

```
KoreaLanguageTool/
├── index.html          # 메인 HTML 파일
├── css/
│   └── style.css       # 스타일시트
├── js/
│   └── main.js         # 메인 JavaScript 파일
└── README.md           # 프로젝트 설명서
```

## 주의사항

- 이 시스템은 LocalStorage를 사용하므로 브라우저 데이터가 삭제되면 데이터가 손실됩니다.
- 프로덕션 환경에서는 데이터베이스 연동을 권장합니다.
- 관리자 계정 정보는 배포 전에 변경하시기 바랍니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 