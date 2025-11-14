# 🚀 Langfuse Prompts 연동 빠른 시작 가이드

Langfuse Prompts를 사용한 마크다운 파일 관리 시스템이 성공적으로 추가되었습니다!

## 📦 추가된 파일

### 핵심 파일
```
src/
├── types/langfuse.ts                    # TypeScript 타입 정의
├── lib/
│   ├── backupManager.ts                 # LocalStorage 백업 관리
│   └── versionChecker.ts                # 버전 충돌 체크
├── hooks/
│   └── useLangfusePrompt.ts             # React Hook (핵심!)
├── components/
│   ├── SaveStatus.tsx                   # 저장 상태 UI
│   ├── BackupNotification.tsx           # 백업 복구 알림
│   └── PromptList.tsx                   # 프롬프트 목록
└── examples/
    └── LangfuseMarkdownEditor.tsx       # 완전한 통합 예제

server/
├── index.ts                             # Express API 서버
└── langfusePrompts.ts                   # Langfuse 유틸리티

설정 파일:
├── .env.example                         # 환경 변수 템플릿
├── tsconfig.json                        # TypeScript 설정
├── tsconfig.node.json                   # Node.js TypeScript 설정
└── docs/LANGFUSE_INTEGRATION.md         # 상세 문서
```

---

## ⚡ 5분 안에 시작하기

### 1단계: 의존성 설치

```bash
npm install
```

새로 추가된 패키지:
- `langfuse` & `langfuse-node` - Langfuse SDK
- `express` - API 서버
- `cors` - CORS 처리
- `dotenv` - 환경 변수
- `typescript`, `tsx` - TypeScript 실행
- `concurrently` - 동시 실행

---

### 2단계: 환경 변수 설정

1. **Langfuse API 키 발급**
   - https://cloud.langfuse.com 접속
   - 프로젝트 생성/선택
   - Settings → API Keys
   - Public Key와 Secret Key 복사

2. **`.env.local` 파일 생성**

```bash
cp .env.example .env.local
```

3. **API 키 입력**

```env
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key-here
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key-here
LANGFUSE_HOST=https://cloud.langfuse.com
API_PORT=3001
VITE_API_URL=http://localhost:3001
```

---

### 3단계: 서버 실행

**옵션 A: 모두 동시 실행 (추천)**

```bash
npm run dev:all
```

**옵션 B: 각각 실행**

터미널 1:
```bash
npm run server:dev
```

터미널 2:
```bash
npm run dev
```

---

### 4단계: 테스트

1. **서버 헬스 체크**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **브라우저에서 확인**
   - http://localhost:5173 접속

---

## 🎯 기본 사용법

### 기존 프로젝트에 통합하기

#### 방법 1: Hook만 사용 (간단)

```tsx
import { useLangfusePrompt } from './hooks/useLangfusePrompt';

function MyComponent() {
  const {
    content,
    setContent,
    savePrompt,
    loadPrompt,
    prompts,
    loadPrompts
  } = useLangfusePrompt();

  useEffect(() => {
    loadPrompts(); // 목록 로드
  }, []);

  return (
    <div>
      <select onChange={(e) => loadPrompt(e.target.value)}>
        {prompts.map(p => (
          <option key={p.name} value={p.name}>{p.name}</option>
        ))}
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={() => savePrompt()}>저장</button>
    </div>
  );
}
```

#### 방법 2: 전체 통합 예제 사용 (권장)

```tsx
import LangfuseMarkdownEditor from './examples/LangfuseMarkdownEditor';

function App() {
  return <LangfuseMarkdownEditor />;
}
```

---

## 📚 주요 기능

### ✅ 자동 백업
- 3초마다 LocalStorage에 자동 저장
- 페이지 새로고침 시 복구 알림
- 7일 이상 된 백업 자동 삭제

### ✅ 버전 관리
- 저장 시 자동으로 새 버전 생성
- 버전 충돌 감지 및 해결
- Langfuse UI에서 전체 히스토리 확인 가능

### ✅ UI 컴포넌트
- **SaveStatusIndicator**: 토스트 알림
- **SaveStatusBadge**: 인라인 배지
- **BackupNotification**: 백업 복구 모달
- **PromptList**: 프롬프트 목록 (검색, 필터링)

---

## 🔧 API 엔드포인트

```
GET    /api/health                      # 헬스 체크
GET    /api/prompts                     # 전체 프롬프트 목록
GET    /api/prompts/:name               # 특정 프롬프트 조회
POST   /api/prompts/:name               # 프롬프트 저장
DELETE /api/prompts/:name               # 프롬프트 삭제
GET    /api/prompts/:name/versions      # 버전 히스토리
```

---

## 🎨 예제 사용 시나리오

### 시나리오 1: 블로그 포스트 관리

```tsx
// 블로그 포스트를 Langfuse에 저장
const BlogEditor = () => {
  const { content, setContent, savePrompt } = useLangfusePrompt({
    initialPromptName: 'blog-post-2024-01',
  });

  return (
    <div>
      <h1>블로그 포스트 편집기</h1>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={() => savePrompt(undefined, '블로그 포스트 업데이트')}>
        발행
      </button>
    </div>
  );
};
```

### 시나리오 2: 다국어 컨텐츠 관리

```tsx
const MultilingualContent = () => {
  const korean = useLangfusePrompt({ label: 'ko' });
  const english = useLangfusePrompt({ label: 'en' });

  return (
    <div>
      <div>
        <h2>한국어</h2>
        <textarea value={korean.content} onChange={(e) => korean.setContent(e.target.value)} />
      </div>
      <div>
        <h2>English</h2>
        <textarea value={english.content} onChange={(e) => english.setContent(e.target.value)} />
      </div>
    </div>
  );
};
```

---

## 🐛 문제 해결

### "Langfuse가 설정되지 않았습니다" 오류
→ `.env.local` 파일 확인 및 서버 재시작

### CORS 오류
→ API 서버가 실행 중인지 확인 (`npm run server:dev`)

### 백업이 복구되지 않음
→ 브라우저 개발자 도구 → Application → Local Storage 확인

### 프롬프트가 저장되지 않음
→ Langfuse API 키가 유효한지 확인

---

## 📖 더 알아보기

- 상세 문서: `docs/LANGFUSE_INTEGRATION.md`
- Langfuse 공식 문서: https://langfuse.com/docs
- Langfuse Prompts 가이드: https://langfuse.com/docs/prompts/get-started

---

## 🎉 완료!

이제 Langfuse Prompts를 사용하여 마크다운 파일을 관리할 수 있습니다.

질문이나 문제가 있으면 GitHub Issues에 제보해주세요!

---

**다음 단계:**
1. Langfuse 대시보드에서 프롬프트 확인
2. 버전 히스토리 탐색
3. 라벨을 사용하여 환경별 관리 (dev, staging, production)
4. 팀원과 협업!
