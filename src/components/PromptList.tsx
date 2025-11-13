/**
 * 프롬프트 목록 컴포넌트
 * Langfuse Prompts 목록 표시 및 선택
 */

import React, { useEffect, useState } from 'react';
import type { PromptListItem } from '../types/langfuse';

interface PromptListProps {
  /** 프롬프트 목록 */
  prompts: PromptListItem[];
  /** 로딩 상태 */
  loading?: boolean;
  /** 에러 */
  error?: Error | null;
  /** 현재 선택된 프롬프트 이름 */
  selectedPrompt?: string | null;
  /** 프롬프트 선택 콜백 */
  onSelect: (name: string) => void;
  /** 새 프롬프트 생성 콜백 (선택) */
  onCreateNew?: () => void;
  /** 목록 새로고침 콜백 */
  onRefresh: () => void;
}

/**
 * 프롬프트 목록 컴포넌트
 */
export const PromptList: React.FC<PromptListProps> = ({
  prompts,
  loading = false,
  error = null,
  selectedPrompt = null,
  onSelect,
  onCreateNew,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredPrompts = prompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">프롬프트 목록</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <span className={`text-lg ${loading ? 'animate-spin inline-block' : ''}`}>🔄</span>
        </button>
      </div>

      {/* 검색 */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="프롬프트 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* 새 프롬프트 생성 버튼 */}
      {onCreateNew && (
        <div className="p-4 border-b">
          <button
            onClick={onCreateNew}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>새 프롬프트 생성</span>
          </button>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">
          <p className="font-medium">오류 발생</p>
          <p>{error.message}</p>
        </div>
      )}

      {/* 로딩 표시 */}
      {loading && prompts.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2 animate-pulse">📂</div>
            <p>프롬프트 목록 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 빈 목록 */}
      {!loading && prompts.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">프롬프트가 없습니다</p>
          </div>
        </div>
      )}

      {/* 프롬프트 목록 */}
      {filteredPrompts.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.map(prompt => {
            const isSelected = selectedPrompt === prompt.name;
            const lastUpdated = new Date(prompt.lastUpdated).toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <button
                key={prompt.name}
                onClick={() => onSelect(prompt.name)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                {/* 이름 */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {prompt.name}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    v{prompt.version}
                  </span>
                </div>

                {/* 라벨 */}
                {prompt.labels && prompt.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {prompt.labels.map(label => (
                      <span
                        key={label}
                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                {/* 마지막 수정 시간 */}
                <p className="text-xs text-gray-500">{lastUpdated}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {searchQuery && filteredPrompts.length === 0 && prompts.length > 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        </div>
      )}

      {/* 푸터 (통계) */}
      {prompts.length > 0 && (
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-600 text-center">
          전체 {prompts.length}개 프롬프트
          {searchQuery && ` · 검색 결과 ${filteredPrompts.length}개`}
        </div>
      )}
    </div>
  );
};

/**
 * 간단한 프롬프트 셀렉터 (드롭다운 방식)
 */
interface PromptSelectorProps {
  prompts: PromptListItem[];
  selectedPrompt: string | null;
  onSelect: (name: string) => void;
  loading?: boolean;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({
  prompts,
  selectedPrompt,
  onSelect,
  loading = false,
}) => {
  return (
    <select
      value={selectedPrompt || ''}
      onChange={e => onSelect(e.target.value)}
      disabled={loading}
      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
    >
      <option value="">프롬프트 선택...</option>
      {prompts.map(prompt => (
        <option key={prompt.name} value={prompt.name}>
          {prompt.name} (v{prompt.version})
        </option>
      ))}
    </select>
  );
};
