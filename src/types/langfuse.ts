/**
 * Langfuse Prompts 관련 TypeScript 타입 정의
 */

/**
 * Langfuse 프롬프트 (마크다운 파일) 인터페이스
 */
export interface LangfusePrompt {
  /** 프롬프트 이름 (파일명 역할) */
  name: string;
  /** 마크다운 내용 */
  content: string;
  /** 프롬프트 버전 번호 */
  version: number;
  /** 라벨 (예: 'production', 'staging', 'latest') */
  labels?: string[];
  /** 추가 메타데이터 */
  config?: Record<string, any>;
  /** 생성 일시 */
  createdAt?: string;
  /** 마지막 수정 일시 */
  updatedAt?: string;
}

/**
 * 프롬프트 목록 아이템 (간단한 정보만 포함)
 */
export interface PromptListItem {
  /** 프롬프트 이름 */
  name: string;
  /** 현재 버전 */
  version: number;
  /** 마지막 업데이트 시간 */
  lastUpdated: string;
  /** 라벨 목록 */
  labels?: string[];
}

/**
 * 프롬프트 저장 요청 인터페이스
 */
export interface PromptSaveRequest {
  /** 저장할 마크다운 내용 */
  content: string;
  /** 커밋 메시지 (변경 설명) */
  commitMessage?: string;
  /** 라벨 목록 */
  labels?: string[];
}

/**
 * 프롬프트 저장 응답 인터페이스
 */
export interface PromptSaveResponse {
  /** 성공 여부 */
  success: boolean;
  /** 생성된 버전 번호 */
  version: number;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * LocalStorage 백업 인터페이스
 */
export interface PromptBackup {
  /** 백업된 마크다운 내용 */
  content: string;
  /** 백업 당시 버전 */
  version: number;
  /** 백업 타임스탬프 (ms) */
  timestamp: number;
}

/**
 * 버전 체크 결과 인터페이스
 */
export interface VersionCheckResult {
  /** 현재 버전이 최신인지 여부 */
  isLatest: boolean;
  /** 서버의 최신 버전 번호 */
  latestVersion: number;
  /** 현재 로컬 버전 번호 */
  currentVersion: number;
}

/**
 * API 응답 공통 인터페이스
 */
export interface ApiResponse<T = any> {
  /** 성공 여부 */
  success: boolean;
  /** 응답 데이터 */
  data?: T;
  /** 에러 메시지 */
  error?: string;
  /** 에러 코드 */
  errorCode?: string;
}

/**
 * 저장 상태
 */
export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

/**
 * Langfuse 설정 인터페이스
 */
export interface LangfuseConfig {
  /** Public Key */
  publicKey: string;
  /** Secret Key (서버에서만 사용) */
  secretKey: string;
  /** Langfuse 호스트 URL */
  baseUrl?: string;
}
