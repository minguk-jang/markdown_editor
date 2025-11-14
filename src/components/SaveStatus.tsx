/**
 * 저장 상태 표시 컴포넌트
 * 토스트 알림 스타일
 */

import React from 'react';
import type { SaveStatus } from '../types/langfuse';

interface SaveStatusProps {
  /** 저장 상태 */
  status: SaveStatus;
  /** 추가 메시지 (선택) */
  message?: string;
}

/**
 * 저장 상태 표시 컴포넌트
 */
export const SaveStatusIndicator: React.FC<SaveStatusProps> = ({ status, message }) => {
  // idle 상태면 아무것도 표시하지 않음
  if (status === 'idle') {
    return null;
  }

  // 상태별 스타일 및 텍스트
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          bg: 'bg-blue-500',
          text: '저장 중...',
          icon: '💾',
        };
      case 'success':
        return {
          bg: 'bg-green-500',
          text: message || '저장 완료!',
          icon: '✅',
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          text: message || '저장 실패',
          icon: '❌',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: '',
          icon: '',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`fixed top-4 right-4 ${config.bg} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in`}
      role="alert"
    >
      <span className="text-lg">{config.icon}</span>
      <span className="font-medium">{config.text}</span>
    </div>
  );
};

/**
 * 인라인 저장 상태 배지
 * 에디터 상단 등에 표시
 */
export const SaveStatusBadge: React.FC<SaveStatusProps> = ({ status, message }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          bg: 'bg-blue-100 text-blue-800',
          text: '저장 중...',
          icon: '💾',
        };
      case 'success':
        return {
          bg: 'bg-green-100 text-green-800',
          text: message || '저장됨',
          icon: '✅',
        };
      case 'error':
        return {
          bg: 'bg-red-100 text-red-800',
          text: message || '저장 실패',
          icon: '❌',
        };
      case 'idle':
      default:
        return {
          bg: 'bg-gray-100 text-gray-600',
          text: '수정 안함',
          icon: '📄',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg}`}
    >
      <span className="text-base">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

/**
 * 저장되지 않은 변경사항 표시
 */
interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
}

export const UnsavedChangesIndicator: React.FC<UnsavedChangesIndicatorProps> = ({
  hasUnsavedChanges,
}) => {
  if (!hasUnsavedChanges) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
      <span className="text-base">⚠️</span>
      <span>저장되지 않은 변경사항</span>
    </div>
  );
};
