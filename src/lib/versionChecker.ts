/**
 * 프롬프트 버전 충돌 체크 유틸리티
 */

import type { VersionCheckResult, LangfusePrompt, ApiResponse } from '../types/langfuse';

/**
 * API 기본 URL
 */
const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

/**
 * 서버의 최신 버전과 로컬 버전을 비교
 * @param promptName 프롬프트 이름
 * @param currentVersion 현재 로컬 버전
 * @param label 라벨 (선택)
 * @returns 버전 비교 결과
 */
export async function checkVersion(
  promptName: string,
  currentVersion: number,
  label?: string
): Promise<VersionCheckResult> {
  try {
    const apiUrl = getApiUrl();
    const url = new URL(`${apiUrl}/api/prompts/${encodeURIComponent(promptName)}`);

    if (label) {
      url.searchParams.append('label', label);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    const data: ApiResponse<LangfusePrompt> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '프롬프트를 가져올 수 없습니다.');
    }

    const latestVersion = data.data.version;
    const isLatest = currentVersion >= latestVersion;

    return {
      isLatest,
      latestVersion,
      currentVersion,
    };
  } catch (error) {
    console.error('버전 체크 실패:', error);
    // 에러가 발생하면 충돌이 없다고 가정 (서비스 계속 진행)
    return {
      isLatest: true,
      latestVersion: currentVersion,
      currentVersion,
    };
  }
}

/**
 * 저장 전 버전 충돌 체크 및 확인 대화상자
 * @param promptName 프롬프트 이름
 * @param currentVersion 현재 로컬 버전
 * @param label 라벨 (선택)
 * @returns 저장 진행 여부 (true: 진행, false: 취소)
 */
export async function checkAndConfirmSave(
  promptName: string,
  currentVersion: number,
  label?: string
): Promise<boolean> {
  const result = await checkVersion(promptName, currentVersion, label);

  // 최신 버전이면 바로 저장 진행
  if (result.isLatest) {
    return true;
  }

  // 버전 충돌 발생 - 사용자에게 확인
  const message = `
⚠️ 버전 충돌 감지

현재 로컬 버전: v${result.currentVersion}
서버 최신 버전: v${result.latestVersion}

다른 곳에서 이 파일이 수정되었습니다.
계속 저장하면 서버의 최신 내용을 덮어쓰게 됩니다.

저장을 계속하시겠습니까?
  `.trim();

  return window.confirm(message);
}

/**
 * 서버에서 최신 내용 가져오기
 * @param promptName 프롬프트 이름
 * @param label 라벨 (선택)
 * @returns 최신 프롬프트 데이터
 */
export async function fetchLatestPrompt(
  promptName: string,
  label?: string
): Promise<LangfusePrompt | null> {
  try {
    const apiUrl = getApiUrl();
    const url = new URL(`${apiUrl}/api/prompts/${encodeURIComponent(promptName)}`);

    if (label) {
      url.searchParams.append('label', label);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    const data: ApiResponse<LangfusePrompt> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '프롬프트를 가져올 수 없습니다.');
    }

    return data.data;
  } catch (error) {
    console.error('최신 프롬프트 가져오기 실패:', error);
    return null;
  }
}

/**
 * 버전 충돌 해결 옵션 표시 및 처리
 * @param promptName 프롬프트 이름
 * @param localContent 로컬 내용
 * @param localVersion 로컬 버전
 * @param label 라벨 (선택)
 * @returns 해결 방법 ('overwrite', 'refresh', 'cancel')
 */
export async function resolveVersionConflict(
  promptName: string,
  localContent: string,
  localVersion: number,
  label?: string
): Promise<'overwrite' | 'refresh' | 'cancel'> {
  const latestPrompt = await fetchLatestPrompt(promptName, label);

  if (!latestPrompt) {
    // 서버 데이터를 가져올 수 없으면 로컬 우선
    return 'overwrite';
  }

  const message = `
⚠️ 버전 충돌

로컬 버전: v${localVersion}
서버 버전: v${latestPrompt.version}

옵션:
1. 덮어쓰기 - 로컬 변경사항으로 서버를 업데이트 (새 버전 생성)
2. 새로고침 - 서버의 최신 내용으로 교체 (로컬 변경사항 손실)
3. 취소 - 아무 작업도 하지 않음

선택:
- 확인: 덮어쓰기
- 취소: 새로고침 옵션 표시
  `.trim();

  const overwrite = window.confirm(message);

  if (overwrite) {
    return 'overwrite';
  }

  const refresh = window.confirm('서버의 최신 내용으로 새로고침하시겠습니까?\n(로컬 변경사항이 손실됩니다)');

  return refresh ? 'refresh' : 'cancel';
}
