/**
 * LocalStorage 기반 마크다운 백업 관리자
 * 3초마다 자동 백업, 7일 이상 된 백업 자동 삭제
 */

import type { PromptBackup } from '../types/langfuse';

/** 백업 키 접두사 */
const BACKUP_PREFIX = 'langfuse_backup_';

/** 백업 만료 기간 (7일, ms) */
const BACKUP_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * LocalStorage 백업 관리자
 */
export const BackupManager = {
  /**
   * 백업 저장
   * @param promptName 프롬프트 이름
   * @param content 마크다운 내용
   * @param version 버전 번호
   */
  save(promptName: string, content: string, version: number): void {
    try {
      const backup: PromptBackup = {
        content,
        version,
        timestamp: Date.now(),
      };

      const key = `${BACKUP_PREFIX}${promptName}`;
      localStorage.setItem(key, JSON.stringify(backup));

      // 오래된 백업 자동 정리
      this.cleanOld();
    } catch (error) {
      console.error('백업 저장 실패:', error);
      // LocalStorage가 가득 찬 경우 오래된 백업 정리 후 재시도
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanOld();
        try {
          const backup: PromptBackup = {
            content,
            version,
            timestamp: Date.now(),
          };
          localStorage.setItem(`${BACKUP_PREFIX}${promptName}`, JSON.stringify(backup));
        } catch (retryError) {
          console.error('백업 재시도 실패:', retryError);
        }
      }
    }
  },

  /**
   * 백업 불러오기
   * @param promptName 프롬프트 이름
   * @returns 백업 데이터 또는 null
   */
  get(promptName: string): PromptBackup | null {
    try {
      const key = `${BACKUP_PREFIX}${promptName}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const backup: PromptBackup = JSON.parse(data);

      // 만료된 백업인지 확인
      if (Date.now() - backup.timestamp > BACKUP_EXPIRY) {
        this.clear(promptName);
        return null;
      }

      return backup;
    } catch (error) {
      console.error('백업 불러오기 실패:', error);
      return null;
    }
  },

  /**
   * 백업 삭제
   * @param promptName 프롬프트 이름
   */
  clear(promptName: string): void {
    try {
      const key = `${BACKUP_PREFIX}${promptName}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('백업 삭제 실패:', error);
    }
  },

  /**
   * 모든 백업 목록
   * @returns 백업 목록
   */
  listAll(): Array<{ name: string; backup: PromptBackup }> {
    const backups: Array<{ name: string; backup: PromptBackup }> = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith(BACKUP_PREFIX)) {
          const name = key.replace(BACKUP_PREFIX, '');
          const backup = this.get(name);

          if (backup) {
            backups.push({ name, backup });
          }
        }
      }
    } catch (error) {
      console.error('백업 목록 조회 실패:', error);
    }

    // 최신 순으로 정렬
    return backups.sort((a, b) => b.backup.timestamp - a.backup.timestamp);
  },

  /**
   * 오래된 백업 자동 삭제 (7일 이상)
   */
  cleanOld(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith(BACKUP_PREFIX)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const backup: PromptBackup = JSON.parse(data);

              // 7일 이상 된 백업 삭제 대상에 추가
              if (now - backup.timestamp > BACKUP_EXPIRY) {
                keysToRemove.push(key);
              }
            }
          } catch (parseError) {
            // 파싱 실패한 항목도 삭제 대상에 추가
            keysToRemove.push(key);
          }
        }
      }

      // 삭제 실행
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      if (keysToRemove.length > 0) {
        console.log(`${keysToRemove.length}개의 오래된 백업 삭제됨`);
      }
    } catch (error) {
      console.error('오래된 백업 정리 실패:', error);
    }
  },

  /**
   * 특정 백업이 서버 버전보다 최신인지 확인
   * @param promptName 프롬프트 이름
   * @param serverVersion 서버의 버전 번호
   * @returns 백업이 더 최신이면 true
   */
  isNewerThanServer(promptName: string, serverVersion: number): boolean {
    const backup = this.get(promptName);
    return backup !== null && backup.version >= serverVersion;
  },

  /**
   * 모든 백업 삭제 (주의: 복구 불가능)
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`${keysToRemove.length}개의 백업 삭제됨`);
    } catch (error) {
      console.error('전체 백업 삭제 실패:', error);
    }
  },

  /**
   * 백업 통계
   * @returns 백업 개수, 총 크기(대략), 가장 오래된/최신 백업 시간
   */
  getStats(): {
    count: number;
    totalSize: number;
    oldestBackup: number | null;
    newestBackup: number | null;
  } {
    const backups = this.listAll();
    const totalSize = backups.reduce((sum, { backup }) => {
      return sum + new Blob([backup.content]).size;
    }, 0);

    const timestamps = backups.map(b => b.backup.timestamp);

    return {
      count: backups.length,
      totalSize,
      oldestBackup: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestBackup: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  },
};

/**
 * 자동 백업 타이머 설정 (React useEffect에서 사용)
 * @param promptName 프롬프트 이름
 * @param content 마크다운 내용
 * @param version 버전 번호
 * @param interval 백업 간격 (ms, 기본 3초)
 * @returns cleanup 함수
 */
export function setupAutoBackup(
  promptName: string,
  content: string,
  version: number,
  interval: number = 3000
): () => void {
  const timer = setInterval(() => {
    if (promptName && content) {
      BackupManager.save(promptName, content, version);
    }
  }, interval);

  return () => clearInterval(timer);
}
