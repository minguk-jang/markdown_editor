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
    // Langfuse REST API 직접 호출 (SDK 대신)
    const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY || '';
    const secretKey = process.env.LANGFUSE_SECRET_KEY || '';

    // Basic Auth 인코딩
    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    // URL 생성 (path parameter로 name 전달)
    // 기본 label은 'production' 사용
    const effectiveLabel = label || 'production';
    const url = new URL(`${baseUrl}/api/public/v2/prompts/${encodeURIComponent(name)}`);

    if (version) {
      url.searchParams.append('version', version.toString());
    } else {
      // version이 없으면 label로 조회
      url.searchParams.append('label', effectiveLabel);
    }

    console.log(`📥 프롬프트 가져오기: ${name} (label: ${effectiveLabel}, version: ${version || 'latest'})`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const prompt = await response.json();

    if (!prompt) {
      throw new Error(`프롬프트 '${name}'을 찾을 수 없습니다.`);
    }

    console.log(`✅ 프롬프트 로드 성공: ${name} (v${prompt.version})`);

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
    // Langfuse REST API 직접 호출 (SDK 대신)
    const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY || '';
    const secretKey = process.env.LANGFUSE_SECRET_KEY || '';

    // Basic Auth 인코딩
    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    console.log(`💾 프롬프트 저장 시작: ${name}`);

    // POST 요청으로 프롬프트 생성/업데이트 (v2 API 사용)
    const url = new URL(`${baseUrl}/api/public/v2/prompts`);

    const requestBody = {
      name,
      prompt: request.content,
      type: request.type || 'text', // 기본값: text (마크다운)
      isActive: true,
      labels: request.labels || ['production', 'latest'],
      ...(request.config && { config: request.config }), // config가 있으면 추가
    };

    console.log('📤 저장 요청 body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 저장 실패 (${response.status}):`, errorText);
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ 프롬프트 저장 성공: ${name} (v${result.version || '?'})`);

    // 저장 후 다시 가져와서 버전 확인
    const savedPrompt = await getPrompt(name, request.labels?.[0] || 'production');

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
 * 전체 프롬프트 목록 가져오기 (spica-skills/ 필터링)
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

    // 모든 프롬프트를 가져오기 위한 페이지네이션 처리
    let allPrompts: any[] = [];
    let page = 1;
    const limit = 50; // 한 번에 50개씩 가져오기
    let hasMore = true;

    console.log('📋 Langfuse 프롬프트 목록 로딩 중...');

    while (hasMore) {
      const url = new URL(`${baseUrl}/api/public/v2/prompts`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString(), {
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
      const pageData = data.data || [];

      console.log(`  페이지 ${page}: ${pageData.length}개 프롬프트 로드`);

      allPrompts = allPrompts.concat(pageData);

      // 더 이상 데이터가 없으면 종료
      if (pageData.length < limit) {
        hasMore = false;
      } else {
        page++;
      }

      // 무한 루프 방지 (최대 20페이지 = 1000개)
      if (page > 20) {
        console.warn('⚠️  최대 페이지 수 도달 (20페이지)');
        break;
      }
    }

    console.log(`✅ 총 ${allPrompts.length}개 프롬프트 로드 완료`);

    // spica-skills/ 필터링 및 형식 변환
    const prompts: PromptListItem[] = allPrompts
      .filter((item: any) => {
        const name = item.name || '';
        return name.startsWith('spica-skills/');
      })
      .map((item: any) => ({
        name: item.name,
        version: item.version || 1,
        lastUpdated: item.updatedAt || item.createdAt || new Date().toISOString(),
        labels: item.labels || [],
      }));

    console.log(`🔍 spica-skills/ 필터링 결과: ${prompts.length}개`);

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
 * 프롬프트 버전 히스토리 가져오기
 * Langfuse에서 같은 이름의 모든 프롬프트 버전을 가져옵니다
 * @param name 프롬프트 이름
 * @returns 버전 목록
 */
export async function getPromptVersions(
  name: string
): Promise<Array<{ version: number; timestamp: string; commitMessage?: string }>> {
  try {
    const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY || '';
    const secretKey = process.env.LANGFUSE_SECRET_KEY || '';

    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    console.log(`📋 버전 목록 가져오기: ${name}`);

    // Langfuse API에서 모든 프롬프트 목록을 가져온 다음 필터링
    let allPrompts: any[] = [];
    let page = 1;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(`${baseUrl}/api/public/v2/prompts`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString(), {
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
      const pageData = data.data || [];

      allPrompts = allPrompts.concat(pageData);

      // 더 이상 데이터가 없거나 원하는 프롬프트를 찾았으면 종료
      if (pageData.length < limit) {
        hasMore = false;
      } else {
        page++;
      }

      // 무한 루프 방지 (최대 10페이지)
      if (page > 10) {
        break;
      }
    }

    // 같은 이름의 프롬프트만 필터링
    const matchingPrompts = allPrompts.filter((item: any) => item.name === name);

    console.log(`✅ ${name}의 버전 ${matchingPrompts.length}개 찾음`);

    // 버전 정보 추출 및 정렬
    const versions = matchingPrompts.map((item: any) => ({
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
