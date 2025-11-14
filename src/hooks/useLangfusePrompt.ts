/**
 * Langfuse Prompts 관리 React Hook
 * 마크다운 파일 로드, 저장, 자동 백업 기능 제공
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BackupManager, setupAutoBackup } from '../lib/backupManager';
import { checkAndConfirmSave } from '../lib/versionChecker';
import type {
  LangfusePrompt,
  PromptListItem,
  SaveStatus,
  ApiResponse,
  PromptSaveRequest,
} from '../types/langfuse';

/**
 * API 기본 URL
 */
const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

/**
 * Hook 옵션
 */
interface UseLangfusePromptOptions {
  /** 초기 프롬프트 이름 */
  initialPromptName?: string;
  /** 라벨 (기본값: 'latest') */
  label?: string;
  /** 자동 백업 활성화 (기본값: true) */
  autoBackup?: boolean;
  /** 자동 백업 간격 (ms, 기본값: 3000) */
  backupInterval?: number;
}

/**
 * Hook 반환 값
 */
interface UseLangfusePromptReturn {
  /** 현재 프롬프트 내용 */
  content: string;
  /** 내용 변경 */
  setContent: (content: string) => void;
  /** 현재 버전 */
  version: number;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 */
  error: Error | null;
  /** 저장되지 않은 변경사항 여부 */
  hasUnsavedChanges: boolean;
  /** 저장 상태 */
  saveStatus: SaveStatus;
  /** 전체 프롬프트 목록 */
  prompts: PromptListItem[];
  /** 현재 프롬프트 이름 */
  currentPromptName: string | null;
  /** 프롬프트 로드 */
  loadPrompt: (name: string, label?: string) => Promise<void>;
  /** 프롬프트 저장 */
  savePrompt: (name?: string, commitMessage?: string) => Promise<boolean>;
  /** 전체 프롬프트 목록 로드 */
  loadPrompts: () => Promise<void>;
  /** 백업에서 복구 */
  restoreFromBackup: (name: string) => boolean;
  /** 백업 확인 */
  hasBackup: (name: string) => boolean;
  /** 백업 삭제 */
  clearBackup: (name: string) => void;
}

/**
 * Langfuse Prompts 관리 Hook
 */
export function useLangfusePrompt(
  options: UseLangfusePromptOptions = {}
): UseLangfusePromptReturn {
  const {
    initialPromptName,
    label = 'latest',
    autoBackup = true,
    backupInterval = 3000,
  } = options;

  // 상태
  const [content, setContentState] = useState<string>('');
  const [version, setVersion] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [prompts, setPrompts] = useState<PromptListItem[]>([]);
  const [currentPromptName, setCurrentPromptName] = useState<string | null>(
    initialPromptName || null
  );

  // Ref (리렌더링 방지)
  const originalContentRef = useRef<string>('');

  /**
   * 내용 변경 (변경사항 추적 포함)
   */
  const setContent = useCallback((newContent: string) => {
    setContentState(newContent);
    setHasUnsavedChanges(newContent !== originalContentRef.current);
  }, []);

  /**
   * 프롬프트 로드
   */
  const loadPrompt = useCallback(
    async (name: string, loadLabel?: string) => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = getApiUrl();
        const url = new URL(`${apiUrl}/api/prompts/${encodeURIComponent(name)}`);
        url.searchParams.append('label', loadLabel || label);

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`프롬프트 로드 실패: ${response.status}`);
        }

        const data: ApiResponse<LangfusePrompt> = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.error || '프롬프트를 가져올 수 없습니다.');
        }

        const prompt = data.data;

        setContentState(prompt.content);
        setVersion(prompt.version);
        setCurrentPromptName(name);
        setHasUnsavedChanges(false);
        originalContentRef.current = prompt.content;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('알 수 없는 오류');
        setError(error);
        console.error('프롬프트 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    },
    [label]
  );

  /**
   * 프롬프트 저장
   */
  const savePrompt = useCallback(
    async (name?: string, commitMessage?: string): Promise<boolean> => {
      const promptName = name || currentPromptName;

      if (!promptName) {
        setError(new Error('프롬프트 이름이 필요합니다.'));
        return false;
      }

      setSaveStatus('saving');
      setError(null);

      try {
        // 버전 충돌 체크 (옵션)
        if (version > 0) {
          const canSave = await checkAndConfirmSave(promptName, version, label);
          if (!canSave) {
            setSaveStatus('idle');
            return false;
          }
        }

        // LocalStorage에 백업 (저장 전)
        if (autoBackup) {
          BackupManager.save(promptName, content, version);
        }

        // API 호출
        const apiUrl = getApiUrl();
        const request: PromptSaveRequest = {
          content,
          commitMessage: commitMessage || `Update ${promptName}`,
          labels: [label],
        };

        const response = await fetch(`${apiUrl}/api/prompts/${encodeURIComponent(promptName)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`저장 실패: ${response.status}`);
        }

        const data: ApiResponse<{ success: boolean; version: number }> = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.error || '저장에 실패했습니다.');
        }

        // 성공
        setVersion(data.data.version);
        setHasUnsavedChanges(false);
        originalContentRef.current = content;
        setSaveStatus('success');

        // 백업 삭제 (저장 성공 후)
        BackupManager.clear(promptName);

        // 상태 초기화 (2초 후)
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('알 수 없는 오류');
        setError(error);
        setSaveStatus('error');
        console.error('프롬프트 저장 오류:', error);

        // 상태 초기화 (3초 후)
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);

        return false;
      }
    },
    [currentPromptName, content, version, label, autoBackup]
  );

  /**
   * 전체 프롬프트 목록 로드
   */
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/prompts`);

      if (!response.ok) {
        throw new Error(`목록 로드 실패: ${response.status}`);
      }

      const data: ApiResponse<PromptListItem[]> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || '목록을 가져올 수 없습니다.');
      }

      setPrompts(data.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('알 수 없는 오류');
      setError(error);
      console.error('프롬프트 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 백업에서 복구
   */
  const restoreFromBackup = useCallback((name: string): boolean => {
    try {
      const backup = BackupManager.get(name);

      if (!backup) {
        return false;
      }

      setContentState(backup.content);
      setVersion(backup.version);
      setCurrentPromptName(name);
      setHasUnsavedChanges(true);
      originalContentRef.current = ''; // 백업은 저장되지 않은 것으로 표시

      return true;
    } catch (error) {
      console.error('백업 복구 실패:', error);
      return false;
    }
  }, []);

  /**
   * 백업 존재 여부 확인
   */
  const hasBackup = useCallback((name: string): boolean => {
    return BackupManager.get(name) !== null;
  }, []);

  /**
   * 백업 삭제
   */
  const clearBackup = useCallback((name: string): void => {
    BackupManager.clear(name);
  }, []);

  /**
   * 자동 백업 설정
   */
  useEffect(() => {
    if (!autoBackup || !currentPromptName || !content) {
      return;
    }

    const cleanup = setupAutoBackup(currentPromptName, content, version, backupInterval);

    return cleanup;
  }, [autoBackup, currentPromptName, content, version, backupInterval]);

  /**
   * 초기 프롬프트 로드
   */
  useEffect(() => {
    if (initialPromptName) {
      loadPrompt(initialPromptName);
    }
  }, []); // 초기에 한 번만 실행

  return {
    content,
    setContent,
    version,
    loading,
    error,
    hasUnsavedChanges,
    saveStatus,
    prompts,
    currentPromptName,
    loadPrompt,
    savePrompt,
    loadPrompts,
    restoreFromBackup,
    hasBackup,
    clearBackup,
  };
}
