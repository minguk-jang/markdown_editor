/**
 * 백업 복구 알림 컴포넌트
 * 페이지 로드 시 LocalStorage 백업 확인 및 복구 옵션 제공
 */

import React, { useEffect, useState } from 'react';
import { BackupManager } from '../lib/backupManager';
import type { PromptBackup } from '../types/langfuse';

interface BackupNotificationProps {
  /** 프롬프트 이름 */
  promptName: string;
  /** 현재 서버 버전 */
  currentVersion: number;
  /** 복구 콜백 */
  onRestore: () => void;
  /** 무시 콜백 */
  onIgnore: () => void;
}

/**
 * 백업 복구 알림 모달
 */
export const BackupNotification: React.FC<BackupNotificationProps> = ({
  promptName,
  currentVersion,
  onRestore,
  onIgnore,
}) => {
  const [backup, setBackup] = useState<PromptBackup | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 백업 확인
    const foundBackup = BackupManager.get(promptName);

    if (foundBackup) {
      // 백업이 서버 버전보다 최신이거나 같은 경우에만 표시
      if (foundBackup.version >= currentVersion) {
        setBackup(foundBackup);
        setShow(true);
      } else {
        // 오래된 백업은 자동 삭제
        BackupManager.clear(promptName);
      }
    }
  }, [promptName, currentVersion]);

  if (!show || !backup) {
    return null;
  }

  const handleRestore = () => {
    onRestore();
    setShow(false);
  };

  const handleIgnore = () => {
    BackupManager.clear(promptName);
    onIgnore();
    setShow(false);
  };

  // 백업 시간 포맷
  const backupTime = new Date(backup.timestamp).toLocaleString('ko-KR');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* 아이콘 */}
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
          <span className="text-2xl">💾</span>
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          저장되지 않은 변경사항 발견
        </h3>

        {/* 설명 */}
        <div className="text-sm text-gray-600 mb-4 space-y-2">
          <p>
            <strong>{promptName}</strong> 파일의 자동 백업이 있습니다.
          </p>
          <p className="text-xs text-gray-500">백업 시간: {backupTime}</p>
          <p className="text-xs text-gray-500">백업 버전: v{backup.version}</p>
        </div>

        {/* 내용 미리보기 */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">백업 내용 미리보기:</div>
          <div className="bg-gray-50 rounded p-2 text-xs text-gray-700 max-h-32 overflow-y-auto font-mono">
            {backup.content.slice(0, 200)}
            {backup.content.length > 200 && '...'}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleRestore}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            복구하기
          </button>
          <button
            onClick={handleIgnore}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            무시하기
          </button>
        </div>

        {/* 경고 */}
        <p className="text-xs text-gray-500 text-center mt-3">
          ⚠️ "무시하기"를 선택하면 백업이 삭제됩니다
        </p>
      </div>
    </div>
  );
};

/**
 * 백업 자동 확인 Hook
 * 컴포넌트 마운트 시 백업 확인 및 알림 표시
 */
interface UseBackupCheckOptions {
  promptName: string | null;
  currentVersion: number;
  onRestore: () => void;
}

export function useBackupCheck({ promptName, currentVersion, onRestore }: UseBackupCheckOptions) {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!promptName) return;

    const backup = BackupManager.get(promptName);

    if (backup && backup.version >= currentVersion) {
      setShowNotification(true);
    }
  }, [promptName, currentVersion]);

  const handleRestore = () => {
    onRestore();
    setShowNotification(false);
  };

  const handleIgnore = () => {
    if (promptName) {
      BackupManager.clear(promptName);
    }
    setShowNotification(false);
  };

  return {
    showNotification,
    handleRestore,
    handleIgnore,
  };
}
