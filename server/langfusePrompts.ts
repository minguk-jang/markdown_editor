/**
 * Langfuse Prompts API 유틸리티 함수 (서버용)
 * Langfuse를 마크다운 파일 저장소처럼 사용
 */

import { Langfuse } from 'langfuse';
import type {
  LangfusePrompt,
  PromptListItem,
  PromptSaveRequest,
  PromptSaveResponse,
} from '../src/types/langfuse';

/**
 * Langfuse 클라이언트 초기화
 */
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
  secretKey: process.env.LANGFUSE_SECRET_KEY || '',
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
});

/**
 * Langfuse가 정상적으로 설정되었는지 확인
 */
export function isConfigured(): boolean {
  return !!(
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY
  );
}

/**
 * 프롬프트(MD 파일) 가져오기
 * @param name 프롬프트 이름 (파일명)
 * @param label 라벨 (선택, 기본값: 'latest')
 * @param version 특정 버전 (선택)
 * @returns 프롬프트 데이터
 */
export async function getPrompt(
  name: string,
  label?: string,
  version?: number
): Promise<LangfusePrompt> {
  try {
    // Langfuse에서 프롬프트 가져오기
    const prompt = await langfuse.getPrompt(name, version, label);

    if (!prompt) {
      throw new Error(`프롬프트 '${name}'을 찾을 수 없습니다.`);
    }

    // Langfuse 프롬프트를 우리 형식으로 변환
    const result: LangfusePrompt = {
      name: prompt.name,
      content: typeof prompt.prompt === 'string' ? prompt.prompt : JSON.stringify(prompt.prompt),
      version: prompt.version || 1,
      labels: prompt.labels || [],
      config: prompt.config || {},
    };

    return result;
  } catch (error) {
    console.error('프롬프트 가져오기 실패:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : '프롬프트를 가져오는 중 오류가 발생했습니다.'
    );
  }
}

/**
 * 프롬프트(MD 파일) 저장/업데이트
 * 같은 이름의 프롬프트가 있으면 자동으로 새 버전 생성
 * @param name 프롬프트 이름
 * @param request 저장 요청 데이터
 * @returns 저장 결과 (버전 번호 포함)
 */
export async function savePrompt(
  name: string,
  request: PromptSaveRequest
): Promise<PromptSaveResponse> {
  try {
    // Langfuse에 프롬프트 생성/업데이트
    // 같은 이름이면 자동으로 새 버전이 생성됨
    const result = await langfuse.createPrompt({
      name,
      prompt: request.content,
      labels: request.labels || ['latest'],
      config: {
        commitMessage: request.commitMessage || '마크다운 파일 업데이트',
        timestamp: new Date().toISOString(),
      },
    });

    // Langfuse SDK가 버전 정보를 반환하지 않을 수 있으므로
    // 저장 후 다시 가져와서 버전 확인
    const savedPrompt = await getPrompt(name, request.labels?.[0] || 'latest');

    return {
      success: true,
      version: savedPrompt.version,
    };
  } catch (error) {
    console.error('프롬프트 저장 실패:', error);

    return {
      success: false,
      version: 0,
      error:
        error instanceof Error
          ? error.message
          : '프롬프트를 저장하는 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 전체 프롬프트 목록 가져오기
 * @returns 프롬프트 목록
 */
export async function listPrompts(): Promise<PromptListItem[]> {
  try {
    // Langfuse SDK에는 프롬프트 목록 API가 없을 수 있으므로
    // 대안: Langfuse REST API 직접 호출
    const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY || '';
    const secretKey = process.env.LANGFUSE_SECRET_KEY || '';

    // Basic Auth 인코딩
    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    const response = await fetch(`${baseUrl}/api/public/v2/prompts`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Langfuse API 응답을 우리 형식으로 변환
    const prompts: PromptListItem[] = (data.data || []).map((item: any) => ({
      name: item.name,
      version: item.version || 1,
      lastUpdated: item.updatedAt || item.createdAt || new Date().toISOString(),
      labels: item.labels || [],
    }));

    // 최신 순으로 정렬
    return prompts.sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  } catch (error) {
    console.error('프롬프트 목록 조회 실패:', error);
    // 에러가 발생해도 빈 배열 반환 (서비스 중단 방지)
    return [];
  }
}

/**
 * 프롬프트 삭제
 * 주의: Langfuse는 프롬프트 삭제를 지원하지 않을 수 있음
 * @param name 프롬프트 이름
 * @returns 성공 여부
 */
export async function deletePrompt(name: string): Promise<boolean> {
  try {
    // Langfuse SDK에는 삭제 기능이 없을 수 있음
    // 대안: 빈 내용으로 업데이트하거나, 'deleted' 라벨 추가
    await savePrompt(name, {
      content: '# [삭제됨]\n\n이 프롬프트는 삭제되었습니다.',
      commitMessage: '프롬프트 삭제',
      labels: ['deleted'],
    });

    return true;
  } catch (error) {
    console.error('프롬프트 삭제 실패:', error);
    return false;
  }
}

/**
 * 프롬프트 버전 히스토리 가져오기 (구현 가능하다면)
 * @param name 프롬프트 이름
 * @returns 버전 목록
 */
export async function getPromptVersions(
  name: string
): Promise<Array<{ version: number; timestamp: string; commitMessage?: string }>> {
  try {
    // Langfuse REST API를 사용하여 버전 히스토리 조회
    const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY || '';
    const secretKey = process.env.LANGFUSE_SECRET_KEY || '';

    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    const response = await fetch(`${baseUrl}/api/public/v2/prompts?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    const versions = (data.data || []).map((item: any) => ({
      version: item.version || 1,
      timestamp: item.updatedAt || item.createdAt || new Date().toISOString(),
      commitMessage: item.config?.commitMessage || '',
    }));

    // 버전 순으로 정렬 (최신 먼저)
    return versions.sort((a: any, b: any) => b.version - a.version);
  } catch (error) {
    console.error('버전 히스토리 조회 실패:', error);
    return [];
  }
}

/**
 * Langfuse 연결 테스트
 * @returns 연결 성공 여부
 */
export async function testConnection(): Promise<boolean> {
  try {
    if (!isConfigured()) {
      return false;
    }

    // 간단한 API 호출로 연결 테스트
    await listPrompts();
    return true;
  } catch (error) {
    console.error('Langfuse 연결 테스트 실패:', error);
    return false;
  }
}

/**
 * Langfuse 클라이언트 정리 (앱 종료 시 호출)
 */
export async function cleanup(): Promise<void> {
  try {
    await langfuse.shutdownAsync();
  } catch (error) {
    console.error('Langfuse 정리 실패:', error);
  }
}
