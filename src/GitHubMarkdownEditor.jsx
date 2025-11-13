import React, { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Toaster, toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FileText,
  Folder,
  FolderOpen,
  Save,
  Trash2,
  Clock,
  RotateCcw,
  Plus,
  Search,
  X,
  AlertCircle,
  Loader,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Eye,
} from 'lucide-react';
import { markdownAPI } from './services/markdownAPI';

const GitHubMarkdownEditor = () => {
  // 상태 관리
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 히스토리 패널
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 새 파일 모달
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // 커밋 메시지 모달
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // 확인 다이얼로그
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 폴더 확장 상태
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // 초기 파일 목록 로드
  useEffect(() => {
    loadFiles();
  }, []);

  // 변경사항 감지
  useEffect(() => {
    setHasUnsavedChanges(content !== originalContent);
  }, [content, originalContent]);

  // 페이지 이탈 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 키보드 단축키 (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedFile && hasUnsavedChanges) {
          handleSaveClick();
        }
      }

      if (e.key === 'Escape') {
        setShowNewFileModal(false);
        setShowCommitModal(false);
        setShowDeleteConfirm(false);
        setShowHistory(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, hasUnsavedChanges]);

  /**
   * 파일 목록 로드
   */
  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await markdownAPI.getFiles();
      setFiles(data);
    } catch (error) {
      toast.error(`파일 목록 로드 실패: ${error.message}`);
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 파일 선택 및 로드
   */
  const handleFileSelect = async (file) => {
    // 저장되지 않은 변경사항 확인
    if (hasUnsavedChanges) {
      if (!window.confirm('저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?')) {
        return;
      }
    }

    setLoading(true);
    try {
      const data = await markdownAPI.getFile(file.path);
      setSelectedFile({ ...file, sha: data.sha });
      setContent(data.content);
      setOriginalContent(data.content);
      setShowHistory(false);
    } catch (error) {
      toast.error(`파일 로드 실패: ${error.message}`);
      console.error('Failed to load file:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 저장 버튼 클릭 핸들러
   */
  const handleSaveClick = () => {
    setShowCommitModal(true);
  };

  /**
   * 파일 저장
   */
  const handleSave = async () => {
    if (!selectedFile) return;

    setSaving(true);
    setShowCommitModal(false);

    try {
      const message = commitMessage || `Update ${selectedFile.name}`;
      await markdownAPI.saveFile(selectedFile.path, content, message);

      setOriginalContent(content);
      setHasUnsavedChanges(false);
      setCommitMessage('');

      toast.success('파일이 저장되었습니다');

      // 파일 목록 새로고침
      await loadFiles();
    } catch (error) {
      toast.error(`저장 실패: ${error.message}`);
      console.error('Failed to save file:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * 파일 삭제
   */
  const handleDelete = async () => {
    if (!selectedFile) return;

    setShowDeleteConfirm(false);
    setLoading(true);

    try {
      await markdownAPI.deleteFile(selectedFile.path, `Delete ${selectedFile.name}`);

      toast.success('파일이 삭제되었습니다');

      // 상태 초기화
      setSelectedFile(null);
      setContent('');
      setOriginalContent('');
      setHasUnsavedChanges(false);

      // 파일 목록 새로고침
      await loadFiles();
    } catch (error) {
      toast.error(`삭제 실패: ${error.message}`);
      console.error('Failed to delete file:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새 파일 생성
   */
  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      toast.error('파일 이름을 입력하세요');
      return;
    }

    let fileName = newFileName.trim();
    if (!fileName.endsWith('.md')) {
      fileName += '.md';
    }

    setShowNewFileModal(false);
    setLoading(true);

    try {
      await markdownAPI.saveFile(fileName, '# 새 문서\n\n내용을 입력하세요...', `Create ${fileName}`);

      toast.success('파일이 생성되었습니다');
      setNewFileName('');

      // 파일 목록 새로고침
      await loadFiles();

      // 새 파일 자동 선택
      handleFileSelect({ name: fileName, path: fileName, type: 'file' });
    } catch (error) {
      toast.error(`파일 생성 실패: ${error.message}`);
      console.error('Failed to create file:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 히스토리 로드
   */
  const loadHistory = async () => {
    if (!selectedFile) return;

    setLoadingHistory(true);
    setShowHistory(true);

    try {
      const data = await markdownAPI.getHistory(selectedFile.path, 20);
      setHistory(data);
    } catch (error) {
      toast.error(`히스토리 로드 실패: ${error.message}`);
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  /**
   * 특정 버전 미리보기
   */
  const handlePreviewVersion = async (sha) => {
    try {
      const data = await markdownAPI.getFileVersion(selectedFile.path, sha);

      // 새 창에서 미리보기 표시
      const preview = window.open('', '_blank');
      preview.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Version Preview - ${selectedFile.name}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 2rem;
                max-width: 900px;
                margin: 0 auto;
                line-height: 1.6;
              }
              pre {
                background: #f5f5f5;
                padding: 1rem;
                border-radius: 4px;
                overflow-x: auto;
              }
              code {
                background: #f5f5f5;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
              }
              h1, h2, h3 { color: #333; }
            </style>
          </head>
          <body>
            <h1>Version: ${sha.substring(0, 7)}</h1>
            <pre>${data.content}</pre>
          </body>
        </html>
      `);
    } catch (error) {
      toast.error(`버전 미리보기 실패: ${error.message}`);
      console.error('Failed to preview version:', error);
    }
  };

  /**
   * 버전 롤백
   */
  const handleRollback = async (sha) => {
    if (!window.confirm('이 버전으로 복원하시겠습니까?')) {
      return;
    }

    setLoading(true);

    try {
      await markdownAPI.rollback(selectedFile.path, sha, `Rollback to ${sha.substring(0, 7)}`);

      toast.success('버전이 복원되었습니다');

      // 파일 다시 로드
      await handleFileSelect(selectedFile);

      // 히스토리 새로고침
      await loadHistory();
    } catch (error) {
      toast.error(`롤백 실패: ${error.message}`);
      console.error('Failed to rollback:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 파일 트리 렌더링 (폴더 구조 지원)
   */
  const buildFileTree = (files) => {
    const tree = {};

    files.forEach(file => {
      if (file.type === 'file' && !file.name.endsWith('.md')) {
        return; // .md 파일만 표시
      }

      const parts = file.path.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? file.type : 'dir',
            children: {}
          };
        }
        current = current[part].children;
      });
    });

    return tree;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (tree, level = 0) => {
    return Object.values(tree).map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const hasChildren = Object.keys(node.children).length > 0;
      const isSelected = selectedFile?.path === node.path;

      // 검색 필터
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        if (!hasChildren) return null;
      }

      if (node.type === 'dir') {
        return (
          <div key={node.path}>
            <div
              className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 rounded transition-colors ${
                level > 0 ? 'ml-' + (level * 4) : ''
              }`}
              onClick={() => toggleFolder(node.path)}
            >
              {isExpanded ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />}
              {isExpanded ? <FolderOpen size={16} className="mr-2 text-blue-500" /> : <Folder size={16} className="mr-2 text-gray-500" />}
              <span className="text-sm font-medium">{node.name}</span>
            </div>
            {isExpanded && hasChildren && (
              <div className="ml-2">
                {renderFileTree(node.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          className={`flex items-center py-2 px-3 cursor-pointer rounded transition-colors ${
            level > 0 ? 'ml-' + (level * 4) : ''
          } ${
            isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'
          }`}
          onClick={() => handleFileSelect(node)}
        >
          <div className="w-4 mr-1" />
          <FileText size={16} className={`mr-2 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="text-sm truncate flex-1">{node.name}</span>
          {isSelected && hasUnsavedChanges && (
            <div className="w-2 h-2 bg-orange-500 rounded-full ml-2" title="저장되지 않은 변경사항" />
          )}
        </div>
      );
    });
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <GitBranch size={24} className="mr-2 text-blue-600" />
              GitHub Markdown Editor
            </h1>
            {selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText size={14} />
                <span>{selectedFile.name}</span>
                {hasUnsavedChanges && (
                  <span className="text-orange-600 font-medium">● 수정됨</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {selectedFile && (
              <>
                <button
                  onClick={loadHistory}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                  disabled={loading}
                >
                  <Clock size={16} />
                  <span>히스토리</span>
                </button>

                <button
                  onClick={handleSaveClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!hasUnsavedChanges || saving}
                >
                  {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{saving ? '저장 중...' : '저장 (Ctrl+S)'}</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  <span>삭제</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                파일 목록
              </h2>
              <button
                onClick={() => setShowNewFileModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                <Plus size={14} />
                <span>새 파일</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="파일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader size={24} className="animate-spin mr-2" />
                <span>로딩 중...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <AlertCircle size={32} className="mb-2" />
                <p className="text-sm">파일이 없습니다</p>
                <button
                  onClick={() => setShowNewFileModal(true)}
                  className="mt-4 text-blue-600 text-sm hover:underline"
                >
                  새 파일 만들기
                </button>
              </div>
            ) : (
              renderFileTree(fileTree)
            )}
          </div>
        </div>

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedFile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader size={48} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden" data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={setContent}
                    height="100%"
                    preview="live"
                    hideToolbar={false}
                    enableScroll={true}
                    visibleDragbar={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl mb-2">파일을 선택하세요</p>
                <p className="text-sm">왼쪽 사이드바에서 파일을 클릭하여 편집을 시작하세요</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - History (if open) */}
        {showHistory && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center">
                <Clock size={16} className="mr-2" />
                버전 히스토리
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size={24} className="animate-spin text-blue-500" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <AlertCircle size={32} className="mx-auto mb-2" />
                  <p className="text-sm">히스토리가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((commit, index) => (
                    <div
                      key={commit.sha}
                      className="p-3 border border-gray-200 rounded hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {commit.sha.substring(0, 7)}
                            </code>
                            {index === 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                최신
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 font-medium mb-1">
                            {commit.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commit.author} · {formatDistanceToNow(new Date(commit.date), { addSuffix: true, locale: ko })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => handlePreviewVersion(commit.sha)}
                          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                        >
                          <Eye size={12} />
                          <span>미리보기</span>
                        </button>
                        {index !== 0 && (
                          <button
                            onClick={() => handleRollback(commit.sha)}
                            className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            <RotateCcw size={12} />
                            <span>복원</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-bold mb-4">새 파일 만들기</h3>
            <input
              type="text"
              placeholder="파일 이름 (예: my-document.md)"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewFileModal(false);
                  setNewFileName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commit Message Modal */}
      {showCommitModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-bold mb-4">커밋 메시지</h3>
            <input
              type="text"
              placeholder={`Update ${selectedFile?.name || 'file'}`}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-4">
              선택사항: 비워두면 기본 메시지가 사용됩니다
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCommitModal(false);
                  setCommitMessage('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center text-red-600">
              <AlertCircle size={24} className="mr-2" />
              파일 삭제
            </h3>
            <p className="text-gray-700 mb-6">
              <strong>{selectedFile?.name}</strong> 파일을 삭제하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubMarkdownEditor;
