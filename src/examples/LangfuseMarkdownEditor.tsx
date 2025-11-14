/**
 * Langfuse Prompts 기반 마크다운 에디터 - 전체 통합 예제
 *
 * 이 컴포넌트는 Langfuse Prompts를 DB처럼 사용하여
 * 마크다운 파일을 관리하는 완전한 예제입니다.
 *
 * 기능:
 * - 프롬프트 목록 표시 및 선택
 * - 마크다운 에디터 (textarea 기본, SimpleMDE 등으로 대체 가능)
 * - 자동 백업 (3초마다 LocalStorage)
 * - 백업 복구 알림
 * - 저장 상태 표시
 * - 버전 관리
 */

import React, { useEffect, useState } from 'react';
import { useLangfusePrompt } from '../hooks/useLangfusePrompt';
import { PromptList } from '../components/PromptList';
import { SaveStatusIndicator, SaveStatusBadge, UnsavedChangesIndicator } from '../components/SaveStatus';
import { BackupNotification } from '../components/BackupNotification';

/**
 * Langfuse 마크다운 에디터 (전체 통합)
 */
export const LangfuseMarkdownEditor: React.FC = () => {
  // Langfuse Hook 사용
  const {
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
  } = useLangfusePrompt({
    autoBackup: true,
    backupInterval: 3000,
  });

  // 로컬 상태
  const [showBackupNotification, setShowBackupNotification] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // 컴포넌트 마운트 시 프롬프트 목록 로드
  useEffect(() => {
    loadPrompts();
  }, []);

  // 프롬프트 선택 시 백업 확인
  const handleSelectPrompt = async (name: string) => {
    await loadPrompt(name);

    // 백업 확인
    if (hasBackup(name)) {
      setShowBackupNotification(true);
    }
  };

  // 백업 복구
  const handleRestoreBackup = () => {
    if (currentPromptName) {
      restoreFromBackup(currentPromptName);
      setShowBackupNotification(false);
    }
  };

  // 백업 무시
  const handleIgnoreBackup = () => {
    setShowBackupNotification(false);
  };

  // 저장
  const handleSave = async () => {
    if (!currentPromptName) {
      alert('프롬프트를 선택하세요');
      return;
    }

    const success = await savePrompt(currentPromptName, commitMessage || undefined);

    if (success) {
      setCommitMessage('');
    }
  };

  // 키보드 단축키 (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPromptName, commitMessage]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 왼쪽: 프롬프트 목록 */}
      <div className="w-80 flex-shrink-0 bg-white shadow-lg">
        <PromptList
          prompts={prompts}
          loading={loading}
          error={error}
          selectedPrompt={currentPromptName}
          onSelect={handleSelectPrompt}
          onRefresh={loadPrompts}
        />
      </div>

      {/* 오른쪽: 에디터 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 바 */}
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 프롬프트 이름 */}
            {currentPromptName ? (
              <h1 className="text-xl font-bold text-gray-900">{currentPromptName}</h1>
            ) : (
              <h1 className="text-xl font-bold text-gray-400">프롬프트를 선택하세요</h1>
            )}

            {/* 버전 */}
            {version > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                v{version}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 저장 상태 배지 */}
            <SaveStatusBadge status={saveStatus} />

            {/* 저장되지 않은 변경사항 */}
            <UnsavedChangesIndicator hasUnsavedChanges={hasUnsavedChanges} />

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={!currentPromptName || !hasUnsavedChanges || saveStatus === 'saving'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="저장 (Cmd/Ctrl + S)"
            >
              <span>💾</span>
              <span>저장</span>
            </button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <p className="font-medium text-red-900">오류 발생</p>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* 커밋 메시지 입력 */}
        {currentPromptName && (
          <div className="bg-white border-b p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              변경 사항 설명 (선택)
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              placeholder="예: 헤더 섹션 수정, 오타 수정 등..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        )}

        {/* 에디터 영역 */}
        <div className="flex-1 p-4 overflow-hidden">
          {currentPromptName ? (
            <div className="h-full flex flex-col bg-white rounded-lg shadow-md">
              {/* 에디터 툴바 (선택) */}
              <div className="border-b p-2 flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">마크다운 에디터</span>
                <span className="text-gray-400">|</span>
                <span className="text-xs">자동 백업: 활성화 (3초마다)</span>
              </div>

              {/* 텍스트 영역 */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="마크다운 내용을 입력하세요..."
                className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />

              {/* 하단 상태바 */}
              <div className="border-t p-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50">
                <div className="flex items-center gap-4">
                  <span>줄: {content.split('\n').length}</span>
                  <span>문자: {content.length}</span>
                  <span>단어: {content.split(/\s+/).filter(Boolean).length}</span>
                </div>
                <div>
                  {hasUnsavedChanges && (
                    <span className="text-yellow-600">● 저장되지 않은 변경사항</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-md">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-lg font-medium mb-2">프롬프트를 선택하세요</p>
                <p className="text-sm">왼쪽 목록에서 편집할 프롬프트를 선택하거나</p>
                <p className="text-sm">새 프롬프트를 생성하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 저장 상태 알림 (토스트) */}
      <SaveStatusIndicator status={saveStatus} />

      {/* 백업 복구 알림 */}
      {showBackupNotification && currentPromptName && (
        <BackupNotification
          promptName={currentPromptName}
          currentVersion={version}
          onRestore={handleRestoreBackup}
          onIgnore={handleIgnoreBackup}
        />
      )}
    </div>
  );
};

export default LangfuseMarkdownEditor;
