# SPICA Skill Collector

<div align="center">

**Langfuse 기반 AI 스킬 관리 시스템**

Langfuse를 활용하여 AI 스킬을 트리 구조로 편집하고 버전 관리하는 웹 애플리케이션

[주요 기능](#주요-기능) • [시작하기](#시작하기) • [사용 방법](#사용-방법) • [트러블슈팅](#트러블슈팅)

</div>

---

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
  - [Docker Compose 사용 (권장)](#방법-1-docker-compose-사용-권장)
  - [로컬 환경에서 실행](#방법-2-로컬-환경에서-실행)
- [환경 변수 설정](#환경-변수-설정)
- [사용 방법](#사용-방법)
- [네트워크 접속](#외부-네트워크에서-접속)
- [API 문서](#api-문서)
- [트러블슈팅](#트러블슈팅)
- [브라우저 호환성](#브라우저-호환성)
- [라이선스](#라이선스)

---

## 개요

SPICA Skill Collector는 AI 프롬프트를 스킬 단위로 관리하고 버전 관리하는 웹 애플리케이션입니다. Langfuse와 통합되어 프롬프트의 이력 관리, 편집, 배포를 효율적으로 수행할 수 있습니다.

### 핵심 특징

- 🌲 **트리 구조 편집**: 마크다운 기반 계층 구조로 스킬 관리
- 🔄 **버전 관리**: Langfuse 통합으로 자동 버전 관리 및 이력 추적
- 🎨 **실시간 미리보기**: 마크다운 렌더링 및 편집 모드 전환
- 🖱️ **드래그 앤 드롭**: 직관적인 구조 재편성
- 🌐 **네트워크 접속**: 외부 기기에서도 접속 가능
- 🐳 **Docker 지원**: Docker Compose로 간편한 배포

---

## 주요 기능

### 1. 스킬 관리

- **새 스킬 생성**: 템플릿 기반으로 새로운 스킬 생성
- **Skill 불러오기**: Langfuse에 저장된 스킬 로드
- **Skill 저장**: 자동 버전 관리와 함께 Langfuse에 저장
- **버전 선택**: 드롭다운에서 이전 버전 선택 및 복원

### 2. 트리 구조 편집

- **계층 구조**: Heading 레벨(H2, H3 등) 기반 트리 뷰
- **접기/펼치기**: 섹션별 접기/펼치기 지원
- **드래그 앤 드롭**: 노드를 드래그하여 구조 변경
- **자동 레벨 조정**: 이동 시 Heading 레벨 자동 조정
- **시각적 피드백**: 선택, 호버, 드래그 상태 표시

### 3. 편집 및 미리보기

- **분할 편집**: 상위 섹션 편집 + 하위 섹션 읽기 전용
- **실시간 미리보기**: 마크다운 렌더링
- **Frontmatter 지원**: YAML 메타데이터 편집
- **구문 강조**: 코드 블록 구문 강조
- **모던 폰트**: Pretendard 폰트 적용

### 4. 파일 관리

- **로컬 파일 시스템**: File System Access API 사용
- **마크다운 가져오기/내보내기**: .md 파일 업로드/다운로드
- **버전별 저장**: 로컬 파일 시스템에 버전별 저장

---

## 기술 스택

### 프론트엔드
- **React 18**: UI 라이브러리
- **Vite**: 빌드 도구 및 개발 서버
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Lucide React**: 아이콘
- **Pretendard**: 한글 웹 폰트

### 백엔드
- **Express**: Node.js 웹 프레임워크
- **TypeScript**: 타입 안전성
- **Langfuse SDK**: Langfuse API 통합
- **CORS**: 외부 접속 지원

### DevOps
- **Docker & Docker Compose**: 컨테이너화
- **Environment Variables**: 환경별 설정 관리

---

## 프로젝트 구조

```
markdown_editor/
├── src/                          # 프론트엔드 소스
│   ├── MarkdownTreeEditor.jsx   # 메인 컴포넌트
│   ├── main.jsx                 # 엔트리 포인트
│   ├── index.css                # 전역 스타일
│   └── types/
│       └── langfuse.ts          # TypeScript 타입 정의
│
├── server/                       # 백엔드 소스
│   ├── index.ts                 # API 서버 진입점
│   └── langfusePrompts.ts       # Langfuse API 로직
│
├── index.html                    # HTML 템플릿
├── vite.config.js               # Vite 설정
├── tailwind.config.js           # Tailwind 설정
│
├── Dockerfile.frontend          # 프론트엔드 Docker 이미지
├── Dockerfile.backend           # 백엔드 Docker 이미지
├── docker-compose.yml           # Docker Compose 설정
├── .dockerignore                # Docker 빌드 제외 파일
│
├── .env.example                 # 환경 변수 템플릿
├── .env                         # 환경 변수 (생성 필요)
│
├── package.json                 # 의존성 및 스크립트
└── README.md                    # 이 문서
```

---

## 시작하기

### 사전 요구사항

- **Node.js 18+** (로컬 실행 시)
- **Docker & Docker Compose** (Docker 실행 시)
- **Langfuse 계정**: [https://cloud.langfuse.com](https://cloud.langfuse.com)

---

### 방법 1: Docker Compose 사용 (권장)

Docker Compose를 사용하면 환경 설정 없이 빠르게 시작할 수 있습니다.

#### 1단계: 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열어 **Langfuse API 키**를 설정하세요:

```bash
# Langfuse 설정 (필수)
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
LANGFUSE_HOST=https://cloud.langfuse.com

# 포트 설정 (선택사항)
VITE_PORT=3000
API_PORT=3001
VITE_API_PORT=3001
```

#### 2단계: Docker Compose 실행

```bash
# 컨테이너 빌드 및 시작
docker-compose up -d

# 또는 빌드 강제 재빌드
docker-compose up -d --build
```

#### 3단계: 접속

브라우저에서 접속:
- **프론트엔드**: http://localhost:3000
- **API 서버**: http://localhost:3001/api/health

#### Docker 명령어

```bash
# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f frontend
docker-compose logs -f backend

# 컨테이너 중지
docker-compose down

# 컨테이너 중지 및 볼륨 삭제
docker-compose down -v

# 컨테이너 재시작
docker-compose restart
```

---

### 방법 2: 로컬 환경에서 실행

Node.js가 설치된 환경에서 직접 실행할 수 있습니다.

#### 1단계: 의존성 설치

```bash
npm install
```

#### 2단계: 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 설정:

```bash
# Langfuse 설정 (필수)
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
LANGFUSE_HOST=https://cloud.langfuse.com

# 포트 설정
VITE_PORT=3000
API_PORT=3001
VITE_API_PORT=3001
```

#### 3단계: 개발 서버 실행

**옵션 1: 동시 실행 (권장)**
```bash
npm run dev:all
```

**옵션 2: 개별 실행**
```bash
# 터미널 1: 프론트엔드
npm run dev

# 터미널 2: 백엔드
npm run server:dev
```

#### 4단계: 접속

- **프론트엔드**: http://localhost:3000
- **API 서버**: http://localhost:3001/api/health

---

## 환경 변수 설정

### 필수 환경 변수

| 변수 | 설명 | 기본값 | 필수 |
|------|------|--------|------|
| `LANGFUSE_PUBLIC_KEY` | Langfuse Public API Key | - | ✅ |
| `LANGFUSE_SECRET_KEY` | Langfuse Secret API Key | - | ✅ |
| `LANGFUSE_HOST` | Langfuse 서버 주소 | `https://cloud.langfuse.com` | ✅ |

### 선택 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_PORT` | 프론트엔드 포트 | `3000` |
| `API_PORT` | 백엔드 포트 | `3001` |
| `VITE_API_PORT` | 클라이언트가 사용할 API 포트 | `3001` |
| `VITE_API_URL` | API URL 오버라이드 (선택) | 자동 감지 |
| `ALLOWED_ORIGINS` | CORS 허용 Origin (쉼표 구분) | 로컬 네트워크 자동 허용 |

### CORS 보안 설정

- **개발 환경**: `ALLOWED_ORIGINS`를 비워두면 localhost와 로컬 네트워크(192.168.x.x, 10.x.x.x) 자동 허용
- **프로덕션 환경**: 명시적으로 허용할 도메인 설정
  ```bash
  ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
  ```

---

## 사용 방법

### 1. 새 스킬 생성

1. 상단 **"새 skill 생성"** 버튼 클릭
2. 자동으로 `spica-skills/untitled_YYYYMMDD.md` 생성
3. 트리 구조에서 편집

### 2. 기존 스킬 불러오기

1. 상단 **"Skill 불러오기"** 버튼 클릭
2. Langfuse에 저장된 스킬 목록 확인
3. 원하는 스킬 선택하여 로드

### 3. 스킬 편집

1. 왼쪽 트리에서 노드 선택
2. 오른쪽 편집기에서 내용 수정
3. 드래그 앤 드롭으로 구조 변경
4. `+` 버튼으로 하위 섹션 추가
5. 휴지통 버튼으로 섹션 삭제

### 4. 스킬 저장

1. 상단 **"Skill 저장"** 버튼 클릭
2. 커밋 메시지 입력 (선택)
3. Langfuse에 새 버전으로 저장

### 5. 버전 관리

1. 우측 상단 **버전 드롭다운** 클릭
2. 이전 버전 목록 확인
3. 원하는 버전 선택하여 복원

---

## 외부 네트워크에서 접속

다른 컴퓨터나 모바일 기기에서 접속하려면:

### 1. 서버 IP 주소 확인

```bash
# Linux/Mac
ifconfig | grep inet

# Windows
ipconfig
```

### 2. 외부 기기에서 접속

서버 IP가 `192.168.0.100`인 경우:
- **프론트엔드**: http://192.168.0.100:3000
- **API 서버**: http://192.168.0.100:3001

### 3. 자동 연결

API URL은 자동으로 현재 호스트를 감지합니다.
- 예: `http://192.168.0.100:3000`으로 접속 → 자동으로 `http://192.168.0.100:3001`을 API 서버로 사용

### 4. 방화벽 설정

**Linux (Ubuntu/Debian)**
```bash
sudo ufw allow 3000
sudo ufw allow 3001
```

**Linux (CentOS/RHEL)**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

**Windows (PowerShell 관리자 권한)**
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "API Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**macOS**
- 시스템 환경설정 > 보안 및 개인 정보 보호 > 방화벽에서 Node.js/Docker 허용

---

## API 문서

백엔드 API 서버는 다음 엔드포인트를 제공합니다:

### 헬스 체크
```
GET /api/health
```

### 프롬프트 목록 조회
```
GET /api/prompts
```

### 특정 프롬프트 조회
```
GET /api/prompts/:name
Query: ?label=production&version=5
```

### 프롬프트 저장
```
POST /api/prompts/:name
Body: {
  content: string,
  type?: "text" | "chat",
  commitMessage?: string,
  labels?: string[],
  config?: object
}
```

### 버전 히스토리 조회
```
GET /api/prompts/:name/versions
```

### 프롬프트 삭제
```
DELETE /api/prompts/:name
```

---

## 트러블슈팅

### Docker 관련 문제

**문제: 컨테이너가 시작되지 않음**
```bash
# 로그 확인
docker-compose logs

# 컨테이너 재빌드
docker-compose down
docker-compose up -d --build
```

**문제: 포트 충돌**
```bash
# .env 파일에서 포트 변경
VITE_PORT=4000
API_PORT=4001
VITE_API_PORT=4001

# 재시작
docker-compose down
docker-compose up -d
```

### 네트워크 접속 문제

**문제: ERR_CONNECTION_REFUSED**

1. **서버 실행 확인**
   ```bash
   # Docker
   docker-compose ps

   # 로컬
   npm run dev:all
   ```

2. **포트 리스닝 확인**
   ```bash
   # Linux/Mac
   lsof -i :3001

   # Windows
   netstat -an | findstr 3001
   ```

   결과에 `0.0.0.0:3001` 또는 `:::3001`이 표시되어야 합니다.

3. **방화벽 설정 확인**
   - 위 [방화벽 설정](#4-방화벽-설정) 섹션 참조

4. **네트워크 연결 테스트**
   ```bash
   curl http://<서버-IP>:3001/api/health
   ```

**문제: Langfuse 연결 실패**

1. **.env 파일 확인**
   - `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` 올바른지 확인
   - API 키에 공백이 없는지 확인

2. **API 키 재발급**
   - https://cloud.langfuse.com 에서 API 키 재발급

3. **서버 재시작**
   ```bash
   # Docker
   docker-compose restart backend

   # 로컬
   # API 서버 재시작
   ```

### 개발 환경 문제

**문제: 환경 변수가 적용되지 않음**

- `.env` 파일 수정 후 **서버 재시작** 필수
- Docker: `docker-compose restart`
- 로컬: 서버 프로세스 종료 후 재시작

**문제: 핫 리로드가 작동하지 않음**

- Docker 볼륨 마운트 확인
- 로컬 환경에서는 파일 감시 제한 증가:
  ```bash
  # Linux
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
  sudo sysctl -p
  ```

---

## 브라우저 호환성

File System Access API를 사용하므로 다음 브라우저에서만 동작합니다:

- ✅ **Chrome/Edge 86+**
- ⚠️ **Safari 15.2+** (제한적 지원)
- ❌ **Firefox** (현재 미지원)

---

## 프로덕션 배포

### 빌드

```bash
# 로컬
npm run build

# Docker (프로덕션 이미지는 별도 Dockerfile 필요)
```

### 미리보기

```bash
npm run preview
```

---

## 개발

### 프로젝트 클론

```bash
git clone <repository-url>
cd markdown_editor
```

### 코드 스타일

- **Prettier**: 코드 포매팅
- **ESLint**: 코드 린팅

### 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 라이선스

MIT License

---

## 문의 및 지원

- **Issues**: GitHub Issues
- **문서**: 이 README 파일

---

<div align="center">

Made with ❤️ for AI Skill Management

</div>
