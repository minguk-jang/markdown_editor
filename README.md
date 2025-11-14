# SPICA Skill Collector

Langfuse를 활용하여 AI 스킬을 트리 구조로 편집하고 관리하는 웹 애플리케이션입니다.

## 주요 기능

### 1. 트리 구조 편집
- 왼쪽 사이드바에서 접기/펼치기 가능한 트리 뷰
- 각 노드에 파일 아이콘과 Heading 레벨(H1, H2 등) 표시
- 노드 클릭 시 선택 상태 표시 (파란색 배경)
- 마우스 오버 시 추가/삭제 버튼 표시

### 2. 드래그 앤 드롭
- 노드를 드래그하여 다른 부모 아래로 이동 가능
- 드래그 중 파란색 점선 테두리로 시각적 피드백
- 이동 시 Heading 레벨 자동 조정 (부모 레벨 + 1)
- 순환 참조 방지 (자식을 부모로 드래그 불가)
- Root 노드는 드래그 불가

### 3. 편집 기능
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

### 4. 노드 관리
- 노드 추가: 상단 "추가" 버튼 또는 각 노드의 + 버튼
- 노드 삭제: 각 노드의 휴지통 버튼
- 새 노드는 부모 레벨 + 1로 생성

### 5. 파일 관리 (File System Access API)
- **폴더 선택**: 로컬 폴더 선택 후 작업
- **저장**: 현재 문서를 `data/` 폴더에 버전별로 저장
  - 예: `README-v1.md`, `README-v2.md`, `README-v3.md`
  - `metadata.json`에 버전 정보 기록
- **가져오기**: .md 파일 업로드하여 헤딩 기반 트리 구조 생성
- **내보내기**: 현재 트리를 .md 파일로 다운로드

### 6. 버전 관리
- 수정 후 "저장" 버튼 클릭 시 새로운 버전 생성
- "버전" 버튼 클릭 시 모달로 히스토리 표시 (역순)
- 각 버전에 타임스탬프, 설명, 파일 경로, 복구 버튼 표시
- 복구 버튼 클릭 시 해당 버전의 파일 로드
- 모든 버전은 실제 로컬 파일 시스템에 저장

## 로컬 파일 구조

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

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Lucide React** - 아이콘
- **File System Access API** - 로컬 파일 시스템 접근

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
```

그런 다음 `.env` 파일을 열어 필요한 값을 설정하세요:

```bash
# ====== 서버 포트 설정 ======
# Vite 개발 서버 포트 (기본값: 3000)
VITE_PORT=3000

# API 서버 포트 (기본값: 3001)
API_PORT=3001

# 클라이언트에서 접근할 API URL
VITE_API_URL=http://localhost:3001

# ====== Langfuse Configuration ======
# Langfuse 대시보드(https://cloud.langfuse.com)에서 API 키를 발급받으세요
LANGFUSE_PUBLIC_KEY=your-public-key-here
LANGFUSE_SECRET_KEY=your-secret-key-here
LANGFUSE_HOST=https://cloud.langfuse.com
```

**포트 변경하기:**
- `VITE_PORT`: 프론트엔드 개발 서버 포트를 변경하려면 이 값을 수정하세요
- `API_PORT`: 백엔드 API 서버 포트를 변경하려면 이 값을 수정하세요
- `VITE_API_URL`: API 포트를 변경했다면 이 URL도 함께 업데이트하세요

### 3. 개발 서버 실행

프론트엔드와 백엔드를 동시에 실행:

```bash
npm run dev:all
```

또는 개별적으로 실행:

```bash
# 프론트엔드만 실행 (Vite)
npm run dev

# 백엔드만 실행 (API 서버)
npm run server:dev
```

브라우저에서 `http://localhost:3000` 접속 (또는 설정한 VITE_PORT)

### 4. 외부 네트워크에서 접속하기

다른 컴퓨터나 기기에서 접속하려면:

1. **서버의 IP 주소 확인**:
   ```bash
   # Linux/Mac
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. **같은 네트워크의 다른 기기에서 접속**:
   - 프론트엔드: `http://<서버-IP>:3000`
   - API 서버: `http://<서버-IP>:3001`

   예시: 서버 IP가 192.168.0.100인 경우
   - `http://192.168.0.100:3000`

3. **자동 연결**:
   - API URL은 자동으로 현재 호스트를 감지하므로 별도 설정이 필요 없습니다
   - 예: `http://192.168.0.100:3000`으로 접속하면 자동으로 `http://192.168.0.100:3001`을 API 서버로 사용

4. **방화벽 설정**:
   - 사용 중인 포트(3000, 3001)가 방화벽에서 허용되어 있는지 확인하세요

### 5. 프로덕션 빌드

```bash
npm run build
```

### 6. 빌드 미리보기

```bash
npm run preview
```

## 사용 방법

1. **폴더 선택**: 상단의 "폴더 선택" 버튼을 클릭하여 작업할 로컬 폴더 선택
2. **편집**: 왼쪽 트리에서 노드 선택 후 오른쪽에서 제목/내용 편집
3. **저장**: "저장" 버튼을 클릭하여 현재 문서를 새 버전으로 저장
4. **버전 확인**: "버전" 버튼을 클릭하여 히스토리 확인
5. **복구**: 이전 버전의 "복구" 버튼을 클릭하여 되돌리기

## 브라우저 호환성

File System Access API를 사용하므로 다음 브라우저에서만 동작합니다:
- Chrome/Edge 86+
- Safari 15.2+ (제한적)

Firefox는 현재 지원하지 않습니다.

## 라이선스

MIT
