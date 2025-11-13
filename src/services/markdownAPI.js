/**
 * Markdown API Client for GitHub Backend
 * 모든 API 호출을 처리하는 클라이언트 모듈
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * API 에러 핸들링을 위한 커스텀 에러 클래스
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API 요청을 처리하는 헬퍼 함수
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // 응답 데이터 파싱
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 에러 처리
    if (!response.ok) {
      throw new APIError(
        data.error || data.message || `API Error: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // 네트워크 에러 또는 기타 에러
    if (error.message === 'Failed to fetch') {
      throw new APIError(
        '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.',
        0,
        null
      );
    }

    throw new APIError(error.message, 0, null);
  }
}

/**
 * Markdown API 클라이언트
 */
export const markdownAPI = {
  /**
   * 파일 목록 가져오기
   * @param {string} path - 디렉토리 경로 (선택사항)
   * @returns {Promise<Array>} 파일 목록
   */
  async getFiles(path = '') {
    const endpoint = path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files';
    return fetchAPI(endpoint);
  },

  /**
   * 파일 내용 읽기
   * @param {string} path - 파일 경로
   * @returns {Promise<Object>} 파일 데이터 { content, sha, path }
   */
  async getFile(path) {
    if (!path) {
      throw new Error('파일 경로가 필요합니다.');
    }
    return fetchAPI(`/api/files/${encodeURIComponent(path)}`);
  },

  /**
   * 파일 저장 (생성 또는 수정)
   * @param {string} path - 파일 경로
   * @param {string} content - 파일 내용
   * @param {string} message - 커밋 메시지 (선택사항)
   * @returns {Promise<Object>} 저장 결과
   */
  async saveFile(path, content, message = '') {
    if (!path) {
      throw new Error('파일 경로가 필요합니다.');
    }
    if (content === undefined || content === null) {
      throw new Error('파일 내용이 필요합니다.');
    }

    const commitMessage = message || `Update ${path}`;

    return fetchAPI(`/api/files/${encodeURIComponent(path)}`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        message: commitMessage
      }),
    });
  },

  /**
   * 파일 삭제
   * @param {string} path - 파일 경로
   * @param {string} message - 커밋 메시지 (선택사항)
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteFile(path, message = '') {
    if (!path) {
      throw new Error('파일 경로가 필요합니다.');
    }

    const commitMessage = message || `Delete ${path}`;

    return fetchAPI(`/api/files/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      body: JSON.stringify({ message: commitMessage }),
    });
  },

  /**
   * 파일 히스토리 조회
   * @param {string} path - 파일 경로
   * @param {number} limit - 조회할 커밋 수 (기본값: 20)
   * @returns {Promise<Array>} 커밋 히스토리 목록
   */
  async getHistory(path, limit = 20) {
    if (!path) {
      throw new Error('파일 경로가 필요합니다.');
    }
    return fetchAPI(`/api/history/${encodeURIComponent(path)}?limit=${limit}`);
  },

  /**
   * 특정 버전의 파일 읽기
   * @param {string} path - 파일 경로
   * @param {string} sha - 커밋 SHA
   * @returns {Promise<Object>} 파일 데이터
   */
  async getFileVersion(path, sha) {
    if (!path || !sha) {
      throw new Error('파일 경로와 SHA가 필요합니다.');
    }
    return fetchAPI(`/api/files/${encodeURIComponent(path)}/version/${sha}`);
  },

  /**
   * 특정 버전으로 롤백
   * @param {string} path - 파일 경로
   * @param {string} sha - 복원할 커밋 SHA
   * @param {string} message - 커밋 메시지 (선택사항)
   * @returns {Promise<Object>} 롤백 결과
   */
  async rollback(path, sha, message = '') {
    if (!path || !sha) {
      throw new Error('파일 경로와 SHA가 필요합니다.');
    }

    const commitMessage = message || `Rollback ${path} to ${sha.substring(0, 7)}`;

    return fetchAPI(`/api/rollback/${encodeURIComponent(path)}`, {
      method: 'POST',
      body: JSON.stringify({
        sha,
        message: commitMessage
      }),
    });
  },
};

/**
 * API 상태 확인 (선택사항)
 * @returns {Promise<boolean>} 서버 연결 가능 여부
 */
export async function checkAPIHealth() {
  try {
    await fetchAPI('/api/files');
    return true;
  } catch (error) {
    console.error('API Health Check Failed:', error.message);
    return false;
  }
}

export default markdownAPI;
