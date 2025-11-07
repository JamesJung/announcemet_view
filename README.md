# 공고 조회 시스템

공고 사전처리 데이터를 조회하고 제외 키워드를 관리하는 웹 애플리케이션입니다.

## 주요 기능

- **공고 목록 조회**: `processing_status='성공'`인 공고 데이터를 테이블 형태로 표시
- **상세 정보 표시**: 사이트 유형, 사이트 코드, 제목, 내용 요약(100자), 원본 URL, 등록 상태
- **등록 상태 구분**: `sbvt_id`가 NULL이 아닌 경우 "등록됨" 배지 표시
- **제외 키워드 관리**: 특정 제목을 선택하여 제외 키워드 등록
- **미등록 공고 조회**: 모달 팝업에서 등록되지 않은 다른 공고 목록 확인
- **페이지네이션**: 대량의 데이터를 페이지 단위로 효율적으로 탐색

## 기술 스택

- **백엔드**: Node.js, Express.js
- **데이터베이스**: MySQL (mysql2 라이브러리)
- **프론트엔드**: 순수 HTML, CSS, JavaScript
- **스타일링**: 반응형 디자인, 모던 UI

## 프로젝트 구조

```
announcement-viewer/
├── package.json
├── server.js              # Express 서버 및 MySQL 연결
├── routes/
│   └── api.js            # API 라우트
└── public/
    ├── index.html        # 메인 페이지
    ├── css/
    │   └── style.css     # 스타일시트
    └── js/
        └── script.js     # 프론트엔드 로직
```

## 설치 및 실행

### 1. 의존성 설치

```bash
cd announcement-viewer
npm install
```

### 2. 데이터베이스 연결 확인

`server.js` 파일에서 MySQL 연결 정보를 확인합니다:

```javascript
const pool = mysql.createPool({
  host: '192.168.0.95',
  port: 3309,
  user: 'root',
  password: 'b3UvSDS232GbdZ42',
  database: 'subvention',
  // ...
});
```

필요한 경우 연결 정보를 수정하세요.

### 3. 서버 실행

**프로덕션 모드:**
```bash
npm start
```

**개발 모드 (nodemon 사용):**
```bash
npm run dev
```

### 4. 브라우저에서 접속

```
http://localhost:3000
```

기본 포트는 3000이며, 환경 변수로 변경 가능합니다:

```bash
PORT=8080 npm start
```

## API 엔드포인트

### 1. 공고 목록 조회
- **URL**: `GET /api/announcements`
- **Query Parameters**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 50)
- **응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "site_type": "정부지원",
      "site_code": "K_STARTUP",
      "content_summary": "스타트업 지원사업...",
      "title": "2024 청년창업사관학교",
      "origin_url": "https://...",
      "sbvt_id": 456,
      "announcement_date": "2024-01-15",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

### 2. 다른 공고 목록 조회
- **URL**: `GET /api/announcements/others`
- **Query Parameters**:
  - `excludeTitle`: 제외할 제목 (필수)
  - `limit`: 최대 항목 수 (기본값: 100)
- **설명**: 특정 제목을 제외하고, `sbvt_id`가 NULL인 공고들을 조회

### 3. 제외 키워드 등록
- **URL**: `POST /api/exclusion-keywords`
- **Body**:
```json
{
  "keyword": "테스트 키워드",
  "description": "테스트용 제외 키워드입니다"
}
```
- **응답 예시**:
```json
{
  "success": true,
  "message": "제외 키워드가 성공적으로 등록되었습니다.",
  "data": {
    "exclusionId": 1,
    "keyword": "테스트 키워드"
  }
}
```

### 4. 제외 키워드 목록 조회
- **URL**: `GET /api/exclusion-keywords`
- **설명**: 활성화된 제외 키워드 목록 조회

## 사용 방법

### 공고 목록 보기
1. 페이지 접속 시 자동으로 공고 목록이 로드됩니다
2. 테이블에서 각 공고의 상세 정보를 확인할 수 있습니다
3. "등록됨" 배지가 있는 항목은 이미 SUBVENTION_MASTER에 등록된 공고입니다

### 제외 키워드 등록
1. **방법 1**: 제목을 클릭하여 모달 팝업 열기
2. **방법 2**: "제외 키워드 등록" 버튼 클릭 (미등록 공고만 표시)
3. 모달에서 등록되지 않은 다른 공고 목록 확인
4. 제외할 키워드 입력 및 설명 작성
5. "등록" 버튼 클릭하여 EXCLUSION_KEYWORDS 테이블에 저장

### 페이지 탐색
- 처음/이전/다음/마지막 버튼으로 페이지 이동
- 페이지 번호 버튼을 클릭하여 특정 페이지로 이동
- "새로고침" 버튼으로 현재 페이지 데이터 갱신

## 데이터베이스 테이블

### announcement_pre_processing
공고 사전처리 데이터를 저장하는 메인 테이블입니다.

**주요 컬럼**:
- `processing_status`: 처리 상태 ('성공'인 항목만 조회)
- `sbvt_id`: SUBVENTION_MASTER 등록 ID (NULL이면 미등록)
- `title`: 공고 제목
- `content_md`: 공고 내용 (Markdown)
- `origin_url`: 원본 공고 URL

### EXCLUSION_KEYWORDS
제외 키워드를 관리하는 테이블입니다.

**주요 컬럼**:
- `KEYWORD`: 제외 키워드 (UNIQUE)
- `DESCRIPTION`: 키워드 설명
- `IS_ACTIVE`: 활성화 여부
- `EXCLUSION_COUNT`: 제외된 총 횟수

## 주의사항

1. **데이터베이스 연결**: 서버 실행 전 MySQL 데이터베이스 연결 정보가 정확한지 확인하세요
2. **포트 충돌**: 3000 포트가 이미 사용 중인 경우 환경 변수로 포트를 변경하세요
3. **네트워크**: 데이터베이스 서버(192.168.0.95:3309)에 네트워크 접근이 가능한지 확인하세요
4. **중복 키워드**: 이미 등록된 키워드를 다시 등록하려고 하면 오류가 발생합니다

## 개발 환경

- Node.js >= 14.x
- MySQL 5.7 이상
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 라이선스

MIT License

## 문의사항

프로젝트 관련 문의사항이 있으시면 개발팀에 연락주세요.
