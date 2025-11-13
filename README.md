# Markdown Editor Suite

마크다운 문서를 편집하고 관리하는 웹 애플리케이션 모음입니다. 로컬 파일 시스템 또는 GitHub 저장소에서 마크다운 파일을 편집할 수 있습니다.

## 두 가지 에디터 제공

### 1. 로컬 파일 에디터 (`/local-editor`)
로컬 파일 시스템에서 직접 마크다운 파일을 편집하는 트리 기반 에디터입니다.

### 2. GitHub 에디터 (`/github-editor`) ⭐ NEW
GitHub 저장소에 저장된 마크다운 파일을 API를 통해 편집하는 에디터입니다.

---

## 로컬 파일 에디터 주요 기능

### 트리 구조 편집
- 왼쪽 사이드바에서 접기/펼치기 가능한 트리 뷰
- 각 노드에 파일 아이콘과 Heading 레벨(H1, H2 등) 표시
- 노드 클릭 시 선택 상태 표시 (파란색 배경)
- 마우스 오버 시 추가/삭제 버튼 표시

### 드래그 앤 드롭
- 노드를 드래그하여 다른 부모 아래로 이동 가능
- 드래그 중 파란색 점선 테두리로 시각적 피드백
- 이동 시 Heading 레벨 자동 조정 (부모 레벨 + 1)
- 순환 참조 방지 (자식을 부모로 드래그 불가)
- Root 노드는 드래그 불가

### 편집 기능
- 우측 영역에서 선택된 노드의 제목과 내용 편집
- 제목은 input 필드, 내용은 textarea
- 미리보기/편집 모드 토글 버튼 (Eye/Edit3 아이콘)
- 미리보기 모드에서 마크다운 렌더링:
  - 헤딩 (#, ##, ###)
  - 볼드 (**텍스트**)
  - 이탤릭 (*텍스트*)
  - 인라인 코드 (`코드`)
  - 코드 블록 (```)
  - 리스트 (-, 1.)
  - 인용구 (>)
  - 링크 ([텍스트](url))

### 노드 관리
- 노드 추가: 상단 "추가" 버튼 또는 각 노드의 + 버튼
- 노드 삭제: 각 노드의 휴지통 버튼
- 새 노드는 부모 레벨 + 1로 생성

### 파일 관리 (File System Access API)
- **폴더 선택**: 로컬 폴더 선택 후 작업
- **저장**: 현재 문서를 `data/` 폴더에 버전별로 저장
  - 예: `README-v1.md`, `README-v2.md`, `README-v3.md`
  - `metadata.json`에 버전 정보 기록
- **가져오기**: .md 파일 업로드하여 헤딩 기반 트리 구조 생성
- **내보내기**: 현재 트리를 .md 파일로 다운로드

### 버전 관리
- 수정 후 "저장" 버튼 클릭 시 새로운 버전 생성
- "버전" 버튼 클릭 시 모달로 히스토리 표시 (역순)
- 각 버전에 타임스탬프, 설명, 파일 경로, 복구 버튼 표시
- 복구 버튼 클릭 시 해당 버전의 파일 로드
- 모든 버전은 실제 로컬 파일 시스템에 저장

---

## GitHub 에디터 주요 기능

### GitHub 저장소 연동
- 백엔드 API 서버를 통해 GitHub 저장소의 마크다운 파일 관리
- 실시간 파일 목록 동기화
- 폴더 구조 지원 (트리 뷰)

### 실시간 마크다운 편집
- 좌우 분할 뷰 (편집 / 미리보기)
- 실시간 마크다운 렌더링
- 풍부한 에디터 툴바 (제목, 굵게, 기울임, 링크, 이미지, 코드 블록 등)
- 자동 저장 감지 및 경고

### 파일 관리
- 새 파일 생성 (`.md` 자동 추가)
- 파일 읽기/수정/삭제
- 파일 검색 (이름 기반)
- 변경사항 자동 감지 (저장 안 된 변경사항 표시)

### Git 버전 관리
- 커밋 히스토리 조회 (최근 20개)
- 각 커밋의 SHA, 메시지, 작성자, 날짜 표시
- 특정 버전 미리보기 (새 창)
- 이전 버전으로 롤백
- 커밋 메시지 작성 지원

### UX 기능
- 토스트 알림 (성공/실패 메시지)
- 로딩 상태 표시
- 키보드 단축키 (Ctrl+S: 저장, Esc: 모달 닫기)
- 페이지 이탈 시 변경사항 경고
- 확인 다이얼로그 (파일 삭제 시)

## 로컬 파일 구조 (로컬 에디터)

```
선택한 폴더/
└── data/
    ├── README-v1.md
    ├── README-v2.md
    ├── README-v3.md
    └── metadata.json
```

### metadata.json 예시
```json
{
  "documentName": "README",
  "currentVersion": 3,
  "versions": [
    {
      "id": 1,
      "timestamp": "2025-11-12T10:00:00Z",
      "description": "초기 버전",
      "filePath": "data/README-v1.md"
    },
    {
      "id": 2,
      "timestamp": "2025-11-12T10:05:00Z",
      "description": "내용 수정",
      "filePath": "data/README-v2.md"
    },
    {
      "id": 3,
      "timestamp": "2025-11-12T10:10:00Z",
      "description": "수동 저장",
      "filePath": "data/README-v3.md"
    }
  ]
}
```

## 기술 스택

### 프론트엔드
- **React 18** - UI 라이브러리
- **React Router DOM** - 라우팅
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Lucide React** - 아이콘

### 에디터
- **@uiw/react-md-editor** - GitHub 에디터용 마크다운 에디터
- **react-hot-toast** - 토스트 알림
- **date-fns** - 날짜 포맷팅

### API
- **File System Access API** - 로컬 파일 시스템 접근 (로컬 에디터)
- **REST API** - GitHub 백엔드 API 통신 (GitHub 에디터)

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_BASE_URL=http://localhost:3001
```

**주의**: GitHub 에디터를 사용하려면 백엔드 API 서버가 `http://localhost:3001`에서 실행 중이어야 합니다.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속 (Vite 기본 포트)

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

## 사용 방법

### 로컬 파일 에디터
1. 홈페이지에서 "로컬 파일 에디터" 선택
2. **폴더 선택**: 상단의 "폴더 선택" 버튼을 클릭하여 작업할 로컬 폴더 선택
3. **편집**: 왼쪽 트리에서 노드 선택 후 오른쪽에서 제목/내용 편집
4. **저장**: "저장" 버튼을 클릭하여 현재 문서를 새 버전으로 저장
5. **버전 확인**: "버전" 버튼을 클릭하여 히스토리 확인
6. **복구**: 이전 버전의 "복구" 버튼을 클릭하여 되돌리기

### GitHub 에디터
1. 백엔드 API 서버가 실행 중인지 확인
2. 홈페이지에서 "GitHub 에디터" 선택
3. **파일 선택**: 왼쪽 사이드바에서 편집할 파일 클릭
4. **편집**: 중앙 에디터에서 마크다운 편집 (실시간 미리보기)
5. **저장**: Ctrl+S 또는 "저장" 버튼 클릭 → 커밋 메시지 입력 (선택사항)
6. **히스토리**: "히스토리" 버튼을 클릭하여 커밋 히스토리 확인
7. **롤백**: 히스토리에서 원하는 버전의 "복원" 버튼 클릭
8. **새 파일**: 왼쪽 상단의 "새 파일" 버튼으로 파일 생성
9. **삭제**: 파일을 선택하고 "삭제" 버튼 클릭

## 백엔드 API 서버 (GitHub 에디터용)

GitHub 에디터를 사용하려면 별도의 백엔드 API 서버가 필요합니다.

### 필수 API 엔드포인트

```
Base URL: http://localhost:3001

GET    /api/files           - 파일 목록 조회
GET    /api/files/:path     - 파일 읽기
POST   /api/files/:path     - 파일 생성/수정
DELETE /api/files/:path     - 파일 삭제
GET    /api/history/:path   - 커밋 히스토리 조회
GET    /api/files/:path/version/:sha - 특정 버전 읽기
POST   /api/rollback/:path  - 롤백
```

### API 응답 형식 예시

**GET /api/files**
```json
[
  {
    "name": "README.md",
    "path": "README.md",
    "type": "file"
  },
  {
    "name": "docs",
    "path": "docs",
    "type": "dir"
  }
]
```

**GET /api/files/:path**
```json
{
  "content": "# 제목\n\n내용...",
  "sha": "abc123...",
  "path": "README.md"
}
```

**GET /api/history/:path**
```json
[
  {
    "sha": "abc123...",
    "message": "Update README",
    "author": "작성자",
    "date": "2025-11-13T10:00:00Z"
  }
]
```

## 브라우저 호환성

### 로컬 파일 에디터
File System Access API를 사용하므로 다음 브라우저에서만 동작합니다:
- Chrome/Edge 86+
- Safari 15.2+ (제한적)

Firefox는 현재 지원하지 않습니다.

### GitHub 에디터
모든 모던 브라우저에서 동작합니다:
- Chrome/Edge
- Firefox
- Safari
- Opera

## 라이선스

MIT
