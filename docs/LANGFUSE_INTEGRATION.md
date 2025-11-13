# Langfuse Prompts 연동 가이드

Langfuse Prompts를 데이터베이스처럼 사용하여 마크다운 파일을 관리하는 완전한 시스템입니다.

## 📋 목차

1. [개요](#개요)
2. [기능](#기능)
3. [설치](#설치)
4. [환경 설정](#환경-설정)
5. [사용 방법](#사용-방법)
6. [API 문서](#api-문서)
7. [컴포넌트 사용법](#컴포넌트-사용법)
8. [문제 해결](#문제-해결)

---

## 개요

이 프로젝트는 **Langfuse Prompts**를 마크다운 파일 저장소로 활용합니다.

### 핵심 개념

- **Langfuse Prompts = 마크다운 파일**
- 각 프롬프트의 `prompt` 필드에 마크다운 내용 저장
- 자동 버전 관리 (같은 이름 저장 시 새 버전 생성)
- LocalStorage를 통한 자동 백업 (3초마다)
- 버전 충돌 감지 및 해결

---

## 기능

### ✅ 구현된 기능

1. **마크다운 파일 관리**
   - 프롬프트 목록 조회
   - 특정 프롬프트 로드
   - 프롬프트 저장/업데이트
   - 프롬프트 삭제

2. **자동 백업**
   - 3초마다 LocalStorage에 자동 백업
   - 페이지 새로고침 시 백업 복구 알림
   - 7일 이상 된 백업 자동 삭제

3. **버전 관리**
   - 자동 버전 증가
   - 버전 히스토리 조회
   - 버전 충돌 감지
   - 충돌 해결 (덮어쓰기/새로고침/취소)

4. **UI 컴포넌트**
   - 프롬프트 목록 (검색, 필터링)
   - 저장 상태 표시 (토스트, 배지)
   - 백업 복구 알림 모달
   - 저장되지 않은 변경사항 표시

5. **React Hook**
   - `useLangfusePrompt` - 모든 기능을 포함한 커스텀 Hook

---

## 설치

### 1. 의존성 설치

```bash
npm install langfuse langfuse-node express cors dotenv
npm install -D @types/express @types/cors @types/node typescript tsx
```

### 2. 파일 구조 확인

설치 후 다음과 같은 구조가 생성됩니다:

```
project/
├── src/
│   ├── types/
│   │   └── langfuse.ts              # TypeScript 타입 정의
│   ├── lib/
│   │   ├── backupManager.ts         # LocalStorage 백업 관리
│   │   └── versionChecker.ts        # 버전 충돌 체크
│   ├── hooks/
│   │   └── useLangfusePrompt.ts     # React Hook
│   ├── components/
│   │   ├── SaveStatus.tsx           # 저장 상태 표시
│   │   ├── BackupNotification.tsx   # 백업 복구 알림
│   │   └── PromptList.tsx           # 프롬프트 목록
│   └── examples/
│       └── LangfuseMarkdownEditor.tsx # 전체 통합 예제
├── server/
│   ├── index.ts                     # Express 서버
│   └── langfusePrompts.ts           # Langfuse 유틸리티
├── .env.example                     # 환경 변수 예제
└── docs/
    └── LANGFUSE_INTEGRATION.md      # 이 문서
```

---

## 환경 설정

### 1. Langfuse API 키 발급

1. [Langfuse 대시보드](https://cloud.langfuse.com)에 접속
2. 프로젝트 생성 또는 선택
3. **Settings** → **API Keys**로 이동
4. **Public Key**와 **Secret Key** 복사

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```bash
# Langfuse Configuration
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key-here
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key-here
LANGFUSE_HOST=https://cloud.langfuse.com

# API 서버 포트
API_PORT=3001

# 클라이언트 API URL
VITE_API_URL=http://localhost:3001
```

**⚠️ 중요:** `.env.local`은 절대 Git에 커밋하지 마세요!

### 3. 서버 실행

#### 개발 모드

두 개의 터미널 필요:

**터미널 1: API 서버**
```bash
npm run server:dev
```

**터미널 2: Vite 개발 서버**
```bash
npm run dev
```

#### 프로덕션 빌드

```bash
npm run build
npm run server:start
```

---

## 사용 방법

### 기본 사용 예제

```tsx
import { useLangfusePrompt } from './hooks/useLangfusePrompt';
import { SaveStatusIndicator } from './components/SaveStatus';
import { PromptList } from './components/PromptList';

function MyEditor() {
  const {
    content,
    setContent,
    version,
    saveStatus,
    prompts,
    currentPromptName,
    loadPrompt,
    savePrompt,
    loadPrompts,
  } = useLangfusePrompt({
    autoBackup: true,
    backupInterval: 3000,
  });

  useEffect(() => {
    loadPrompts(); // 프롬프트 목록 로드
  }, []);

  return (
    <div>
      {/* 프롬프트 목록 */}
      <PromptList
        prompts={prompts}
        selectedPrompt={currentPromptName}
        onSelect={loadPrompt}
        onRefresh={loadPrompts}
      />

      {/* 에디터 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* 저장 버튼 */}
      <button onClick={() => savePrompt()}>
        저장
      </button>

      {/* 저장 상태 */}
      <SaveStatusIndicator status={saveStatus} />
    </div>
  );
}
```

### Hook 옵션

```tsx
useLangfusePrompt({
  initialPromptName: 'my-prompt',  // 초기 로드할 프롬프트
  label: 'production',              // 라벨 (기본: 'latest')
  autoBackup: true,                 // 자동 백업 활성화
  backupInterval: 3000,             // 백업 간격 (ms)
})
```

### Hook 반환 값

```tsx
const {
  // 상태
  content,                  // 현재 마크다운 내용
  version,                  // 현재 버전
  loading,                  // 로딩 상태
  error,                    // 에러 객체
  hasUnsavedChanges,        // 저장되지 않은 변경사항 여부
  saveStatus,               // 저장 상태 ('idle' | 'saving' | 'success' | 'error')
  prompts,                  // 전체 프롬프트 목록
  currentPromptName,        // 현재 프롬프트 이름

  // 메서드
  setContent,               // 내용 변경
  loadPrompt,               // 프롬프트 로드
  savePrompt,               // 프롬프트 저장
  loadPrompts,              // 목록 로드
  restoreFromBackup,        // 백업 복구
  hasBackup,                // 백업 존재 여부
  clearBackup,              // 백업 삭제
} = useLangfusePrompt();
```

---

## API 문서

### 엔드포인트

#### `GET /api/health`

서버 헬스 체크 및 Langfuse 연결 상태 확인

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "configured": true,
    "connected": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### `GET /api/prompts`

전체 프롬프트 목록 조회

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "name": "homepage",
      "version": 3,
      "lastUpdated": "2024-01-15T10:30:00.000Z",
      "labels": ["production", "latest"]
    }
  ]
}
```

---

#### `GET /api/prompts/:name`

특정 프롬프트 조회

**Query Parameters:**
- `label` (선택): 라벨 (기본값: 'latest')
- `version` (선택): 특정 버전 번호

**응답:**
```json
{
  "success": true,
  "data": {
    "name": "homepage",
    "content": "# Welcome\n\nThis is markdown content...",
    "version": 3,
    "labels": ["production"],
    "config": {
      "commitMessage": "Update header"
    }
  }
}
```

---

#### `POST /api/prompts/:name`

프롬프트 저장/업데이트

**Body:**
```json
{
  "content": "# My Markdown\n\nContent here...",
  "commitMessage": "Update header section",
  "labels": ["production", "latest"]
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "version": 4
  }
}
```

---

#### `DELETE /api/prompts/:name`

프롬프트 삭제 (실제로는 'deleted' 라벨로 표시)

**응답:**
```json
{
  "success": true,
  "data": {
    "message": "프롬프트가 삭제되었습니다."
  }
}
```

---

#### `GET /api/prompts/:name/versions`

프롬프트 버전 히스토리 조회

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "version": 3,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "commitMessage": "Update header"
    },
    {
      "version": 2,
      "timestamp": "2024-01-14T15:20:00.000Z",
      "commitMessage": "Fix typo"
    }
  ]
}
```

---

## 컴포넌트 사용법

### SaveStatusIndicator

토스트 알림 스타일의 저장 상태 표시

```tsx
<SaveStatusIndicator
  status={saveStatus}
  message="커스텀 메시지"
/>
```

### SaveStatusBadge

인라인 배지 스타일

```tsx
<SaveStatusBadge status={saveStatus} />
```

### UnsavedChangesIndicator

저장되지 않은 변경사항 경고

```tsx
<UnsavedChangesIndicator hasUnsavedChanges={hasUnsavedChanges} />
```

### BackupNotification

백업 복구 모달

```tsx
<BackupNotification
  promptName={currentPromptName}
  currentVersion={version}
  onRestore={handleRestore}
  onIgnore={handleIgnore}
/>
```

### PromptList

프롬프트 목록 (사이드바)

```tsx
<PromptList
  prompts={prompts}
  loading={loading}
  error={error}
  selectedPrompt={currentPromptName}
  onSelect={handleSelect}
  onRefresh={loadPrompts}
/>
```

---

## 문제 해결

### Q: "Langfuse가 설정되지 않았습니다" 오류

**A:** `.env.local` 파일에 API 키가 제대로 설정되었는지 확인하세요.

```bash
# 서버 재시작 필요
npm run server:dev
```

---

### Q: CORS 오류 발생

**A:** API 서버가 실행 중인지 확인하고, `VITE_API_URL`이 올바른지 확인하세요.

```bash
# .env.local
VITE_API_URL=http://localhost:3001
```

---

### Q: 백업이 복구되지 않음

**A:** LocalStorage를 확인하세요:

```javascript
// 브라우저 콘솔에서
Object.keys(localStorage).filter(k => k.startsWith('langfuse_backup_'))
```

백업 수동 삭제:
```javascript
localStorage.clear() // 모든 백업 삭제 (주의!)
```

---

### Q: 프롬프트가 저장되지 않음

**A:** 다음을 확인하세요:

1. API 서버가 실행 중인지
2. Langfuse API 키가 유효한지
3. 네트워크 연결 상태
4. 브라우저 콘솔의 에러 메시지

---

### Q: 버전 충돌 발생

**A:** 정상입니다! 다른 곳에서 같은 프롬프트를 수정했을 때 발생합니다.

옵션:
- **덮어쓰기**: 로컬 변경사항으로 서버 업데이트
- **새로고침**: 서버의 최신 내용으로 교체
- **취소**: 아무 작업도 하지 않음

---

## 고급 기능

### 커스텀 저장 로직

```tsx
const handleCustomSave = async () => {
  // 저장 전 유효성 검사
  if (!content.trim()) {
    alert('내용이 비어있습니다');
    return;
  }

  // 커밋 메시지 입력 받기
  const message = prompt('변경 사항을 설명하세요:');

  // 저장
  const success = await savePrompt(undefined, message || undefined);

  if (success) {
    console.log('저장 완료!');
  }
};
```

### 프로그래밍 방식으로 백업 관리

```tsx
import { BackupManager } from './lib/backupManager';

// 백업 저장
BackupManager.save('my-prompt', content, version);

// 백업 불러오기
const backup = BackupManager.get('my-prompt');

// 백업 삭제
BackupManager.clear('my-prompt');

// 모든 백업 목록
const allBackups = BackupManager.listAll();

// 통계
const stats = BackupManager.getStats();
console.log(`백업 ${stats.count}개, 총 크기 ${stats.totalSize} bytes`);
```

---

## 라이선스

MIT

---

## 지원

문제가 발생하면 GitHub Issues에 제보해주세요!
