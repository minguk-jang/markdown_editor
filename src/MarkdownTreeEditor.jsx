import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, Download, Upload, Plus, Trash2, Clock, RotateCcw, Eye, Edit3, FolderOpen, Save, BookOpen, ChevronUp, FileCode, Cloud } from 'lucide-react';

// ====== 설정 (쉽게 변경 가능) ======
const HEADING_START_LEVEL = 2; // 마크다운 헤딩 시작 레벨 (1 = H1(#), 2 = H2(##))
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// =====================================

const MarkdownTreeEditor = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root', 'frontmatter', '1', '2', '3']));
  const [versions, setVersions] = useState([
    {
      id: 1,
      timestamp: new Date().toISOString(),
      description: '초기 버전',
      filePath: null
    }
  ]);
  const [showVersions, setShowVersions] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOverNode, setDragOverNode] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [currentDocument, setCurrentDocument] = useState('README');
  const [showGuide, setShowGuide] = useState(true);
  const [guideContent, setGuideContent] = useState('');
  const fileInputRef = useRef(null);

  // Langfuse 관련 상태
  const [showLangfuseModal, setShowLangfuseModal] = useState(false);
  const [langfusePrompts, setLangfusePrompts] = useState([]);
  const [langfuseLoading, setLangfuseLoading] = useState(false);
  const [currentPromptName, setCurrentPromptName] = useState(null);

  // example.md 로드
  useEffect(() => {
    fetch('/example.md')
      .then(response => response.text())
      .then(text => setGuideContent(text))
      .catch(err => console.error('가이드 파일 로드 실패:', err));
  }, []);

  // 예시 마크다운 데이터 구조
  const [data, setData] = useState({
    id: 'root',
    title: 'README.md',
    level: 0,
    content: '프로젝트 전체 개요입니다.',
    children: [
      {
        id: 'frontmatter',
        title: 'Frontmatter',
        level: 0,
        type: 'frontmatter',
        content: 'title: README\nauthor: Your Name\ndate: 2024-01-01\ntags: [markdown, editor, react]',
        children: []
      },
      {
        id: '1',
        title: '프로젝트 소개',
        level: 1,
        content: '이 프로젝트는 **마크다운 파일**을 트리 구조로 보여주고 편집할 수 있는 웹 애플리케이션입니다.\n\n주요 특징:\n- 직관적인 네비게이션\n- 쉬운 편집\n- 구조화된 문서 관리\n- 버전 관리',
        children: [
          {
            id: '1-1',
            title: '주요 기능',
            level: 2,
            content: '핵심 기능:\n\n1. 트리 뷰로 문서 구조 파악\n2. 드래그앤드롭으로 재구성\n3. 실시간 마크다운 렌더링\n4. 버전 히스토리 및 복구\n\n**강조**: 모든 기능이 직관적입니다!',
            children: []
          },
          {
            id: '1-2',
            title: '기술 스택',
            level: 2,
            content: '- React\n- Tailwind CSS\n- Lucide Icons\n\n> 최신 웹 기술을 사용합니다.',
            children: []
          }
        ]
      },
      {
        id: '2',
        title: '설치 방법',
        level: 1,
        content: '설치:\n\n```bash\nnpm install\nnpm start\n```\n\n프로젝트를 클론한 후 위 명령어를 실행하세요.',
        children: []
      },
      {
        id: '3',
        title: '사용 가이드',
        level: 1,
        content: '왼쪽 트리에서 원하는 섹션을 클릭하면 오른쪽에 내용이 표시됩니다.\n\n드래그앤드롭으로 노드를 드래그하여 순서를 변경하거나 다른 부모 아래로 이동할 수 있습니다.',
        children: [
          {
            id: '3-1',
            title: '트리 네비게이션',
            level: 2,
            content: '화살표를 클릭하여 하위 섹션을 펼치거나 접을 수 있습니다.\n\n- 클릭: 노드 선택\n- 드래그: 위치 이동',
            children: []
          }
        ]
      }
    ]
  });

  // ========== Langfuse 연동 함수 ==========

  // Langfuse 프롬프트 목록 가져오기
  const loadLangfusePrompts = async () => {
    setLangfuseLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/prompts`);
      if (!response.ok) {
        throw new Error('Langfuse 연결 실패');
      }
      const result = await response.json();
      if (result.success) {
        setLangfusePrompts(result.data);
        setShowLangfuseModal(true);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('Langfuse 프롬프트 로드 실패:', error);
      alert('Langfuse 서버에 연결할 수 없습니다.\nAPI 서버가 실행 중인지 확인하세요. (npm run server:dev)');
    } finally {
      setLangfuseLoading(false);
    }
  };

  // Langfuse에서 프롬프트 로드
  const loadFromLangfuse = async (promptName) => {
    try {
      const response = await fetch(`${API_URL}/api/prompts/${encodeURIComponent(promptName)}`);
      if (!response.ok) {
        throw new Error('프롬프트 로드 실패');
      }
      const result = await response.json();
      if (result.success && result.data) {
        const prompt = result.data;
        // 마크다운 파싱
        parseMarkdown(prompt.content, `${promptName}.md`);
        setCurrentPromptName(promptName);
        setShowLangfuseModal(false);
        alert(`✅ "${promptName}" 로드 완료! (버전 ${prompt.version})`);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('프롬프트 로드 실패:', error);
      alert('프롬프트를 로드할 수 없습니다.');
    }
  };

  // Langfuse에 저장
  const saveToLangfuse = async () => {
    const promptName = currentPromptName || prompt('저장할 프롬프트 이름을 입력하세요:', data.title.replace('.md', ''));
    if (!promptName) return;

    const commitMessage = prompt('변경 사항을 설명하세요 (선택):', '마크다운 파일 업데이트');

    try {
      const markdown = convertToMarkdown(data);

      const response = await fetch(`${API_URL}/api/prompts/${encodeURIComponent(promptName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: markdown,
          commitMessage: commitMessage || '마크다운 파일 업데이트',
          labels: ['latest']
        })
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setCurrentPromptName(promptName);
        alert(`✅ Langfuse에 저장 완료!\n프롬프트: ${promptName}\n버전: ${result.data.version}`);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('Langfuse 저장 실패:', error);
      alert('Langfuse에 저장할 수 없습니다.\nAPI 서버가 실행 중인지 확인하세요.');
    }
  };

  // ========== 기존 함수들 ==========

  // 폴더 선택
  const selectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      setDirectoryHandle(handle);

      // 기존 metadata.json 로드 시도
      try {
        const dataDir = await handle.getDirectoryHandle('data');
        const metaFile = await dataDir.getFileHandle('metadata.json');
        const file = await metaFile.getFile();
        const text = await file.text();
        const metadata = JSON.parse(text);

        setCurrentDocument(metadata.documentName);
        setVersions(metadata.versions);

        // 최신 버전 로드
        if (metadata.versions.length > 0) {
          const latestVersion = metadata.versions[metadata.versions.length - 1];
          await loadVersion(latestVersion, dataDir);
        }
      } catch (e) {
        // metadata.json이 없으면 새로 시작
        console.log('새 문서 시작');
      }
    } catch (err) {
      console.error('폴더 선택 취소 또는 에러:', err);
    }
  };

  // 버전 로드
  const loadVersion = async (version, dataDir) => {
    try {
      if (!dataDir && directoryHandle) {
        dataDir = await directoryHandle.getDirectoryHandle('data');
      }

      const fileName = version.filePath.split('/').pop();
      const fileHandle = await dataDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const markdown = await file.text();

      parseMarkdown(markdown, currentDocument + '.md');
    } catch (err) {
      console.error('버전 로드 실패:', err);
    }
  };

  // 파일 시스템에 저장
  const saveToFileSystem = async (description) => {
    if (!directoryHandle) {
      alert('먼저 폴더를 선택해주세요!');
      return;
    }

    try {
      // data 폴더 생성/가져오기
      const dataDir = await directoryHandle.getDirectoryHandle('data', { create: true });

      // 마크다운 변환
      const markdown = convertToMarkdown(data);

      // 새 버전 ID
      const newVersionId = versions.length + 1;
      const fileName = `${currentDocument}-v${newVersionId}.md`;

      // 마크다운 파일 저장
      const fileHandle = await dataDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdown);
      await writable.close();

      // 버전 정보 업데이트
      const newVersion = {
        id: newVersionId,
        timestamp: new Date().toISOString(),
        description: description || '버전 ' + newVersionId,
        filePath: `data/${fileName}`
      };

      const newVersions = [...versions, newVersion];
      setVersions(newVersions);

      // metadata.json 저장
      const metadata = {
        documentName: currentDocument,
        currentVersion: newVersionId,
        versions: newVersions
      };

      const metaHandle = await dataDir.getFileHandle('metadata.json', { create: true });
      const metaWritable = await metaHandle.createWritable();
      await metaWritable.write(JSON.stringify(metadata, null, 2));
      await metaWritable.close();

      alert(`버전 ${newVersionId} 저장 완료!`);
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장 실패: ' + err.message);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const findNodeAndParent = (tree, nodeId, parent = null) => {
    if (tree.id === nodeId) return { node: tree, parent };
    if (tree.children) {
      for (let child of tree.children) {
        const result = findNodeAndParent(child, nodeId, tree);
        if (result) return result;
      }
    }
    return null;
  };

  const updateNodeContent = (nodeId, newContent) => {
    const updateNode = (node) => {
      if (node.id === nodeId) {
        return { ...node, content: newContent };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };

    const newData = updateNode(data);
    setData(newData);
  };

  const updateNodeTitle = (nodeId, newTitle) => {
    const updateNode = (node) => {
      if (node.id === nodeId) {
        return { ...node, title: newTitle };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };

    const newData = updateNode(data);
    setData(newData);
  };

  const addNode = (parentId) => {
    const newId = Date.now().toString();
    const result = findNodeAndParent(data, parentId);
    if (!result) return;

    const newNode = {
      id: newId,
      title: '새 섹션',
      level: result.node.level + 1,
      content: '내용을 입력하세요...',
      children: []
    };

    const updateNode = (node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newNode]
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };

    const newData = updateNode(data);
    setData(newData);
    setExpandedNodes(new Set([...expandedNodes, parentId]));
  };

  const deleteNode = (nodeId) => {
    if (nodeId === 'root' || nodeId === 'frontmatter') return;

    const deleteFromNode = (node) => {
      if (node.children) {
        return {
          ...node,
          children: node.children
            .filter(child => child.id !== nodeId)
            .map(deleteFromNode)
        };
      }
      return node;
    };

    const newData = deleteFromNode(data);
    setData(newData);
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  // 드래그앤드롭 핸들러
  const handleDragStart = (e, node) => {
    if (node.id === 'root' || node.type === 'frontmatter') {
      e.preventDefault();
      return;
    }
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetNode) => {
    e.preventDefault();
    if (draggedNode && draggedNode.id !== targetNode.id) {
      setDragOverNode(targetNode);
    }
  };

  const handleDragLeave = () => {
    setDragOverNode(null);
  };

  const handleDrop = (e, targetNode) => {
    e.preventDefault();
    if (!draggedNode || draggedNode.id === targetNode.id) return;

    // frontmatter에는 드롭 불가
    if (targetNode.type === 'frontmatter') return;

    // 자식 노드를 부모로 드롭하는 것 방지
    const isDescendant = (parent, childId) => {
      if (parent.id === childId) return true;
      if (parent.children) {
        return parent.children.some(child => isDescendant(child, childId));
      }
      return false;
    };

    if (isDescendant(draggedNode, targetNode.id)) {
      setDraggedNode(null);
      setDragOverNode(null);
      return;
    }

    // 노드를 삭제하고 새 위치에 추가
    const removeNode = (node) => {
      if (node.children) {
        return {
          ...node,
          children: node.children
            .filter(child => child.id !== draggedNode.id)
            .map(removeNode)
        };
      }
      return node;
    };

    const addNodeToTarget = (node) => {
      if (node.id === targetNode.id) {
        // 레벨 업데이트
        const updateLevels = (n, newLevel) => ({
          ...n,
          level: newLevel,
          children: n.children ? n.children.map(c => updateLevels(c, newLevel + 1)) : []
        });

        const updatedDraggedNode = updateLevels(draggedNode, node.level + 1);

        return {
          ...node,
          children: [...(node.children || []), updatedDraggedNode]
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(addNodeToTarget) };
      }
      return node;
    };

    let newData = removeNode(data);
    newData = addNodeToTarget(newData);

    setData(newData);
    setDraggedNode(null);
    setDragOverNode(null);
    setExpandedNodes(new Set([...expandedNodes, targetNode.id]));
  };

  const restoreVersion = async (version) => {
    if (!directoryHandle) {
      alert('폴더가 선택되지 않았습니다!');
      return;
    }

    try {
      const dataDir = await directoryHandle.getDirectoryHandle('data');
      await loadVersion(version, dataDir);
      setShowVersions(false);
      alert(`버전 ${version.id} 복구 완료!`);
    } catch (err) {
      console.error('버전 복구 실패:', err);
      alert('버전 복구 실패: ' + err.message);
    }
  };

  // 마크다운으로 변환
  const convertToMarkdown = (node, depth = 0) => {
    let md = '';

    // Frontmatter 처리
    if (node.type === 'frontmatter') {
      md += '---\n';
      md += node.content;
      md += '\n---\n\n';
      return md;
    }

    // Root 노드
    if (node.id === 'root') {
      // Root content가 있으면 추가
      if (node.content && node.content.trim()) {
        md += `${node.content}\n\n`;
      }

      // Children 처리
      if (node.children) {
        node.children.forEach(child => {
          md += convertToMarkdown(child, depth + 1);
        });
      }
      return md;
    }

    // 일반 노드: HEADING_START_LEVEL을 고려하여 헤딩 레벨 조정
    const actualLevel = node.level + HEADING_START_LEVEL - 1;
    const heading = '#'.repeat(actualLevel);
    md += `${heading} ${node.title}\n\n${node.content}\n\n`;

    if (node.children) {
      node.children.forEach(child => {
        md += convertToMarkdown(child, depth + 1);
      });
    }

    return md;
  };

  // 파일 다운로드
  const downloadFile = () => {
    const markdown = convertToMarkdown(data);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 파일 업로드
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        parseMarkdown(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const parseMarkdown = (markdown, filename) => {
    const lines = markdown.split('\n');
    const root = {
      id: 'root',
      title: filename,
      level: 0,
      content: '',
      children: []
    };

    // Frontmatter 파싱
    let lineIndex = 0;
    let frontmatterContent = '';
    if (lines[0] === '---') {
      lineIndex = 1;
      while (lineIndex < lines.length && lines[lineIndex] !== '---') {
        frontmatterContent += lines[lineIndex] + '\n';
        lineIndex++;
      }
      if (lineIndex < lines.length) {
        lineIndex++; // '---' 건너뛰기
        // Frontmatter 노드 추가
        root.children.push({
          id: 'frontmatter',
          title: 'Frontmatter',
          level: 0,
          type: 'frontmatter',
          content: frontmatterContent.trim(),
          children: []
        });
      }
    }

    let currentParent = root;
    let parentStack = [root];
    let currentContent = [];
    let nodeCounter = 0;

    // 나머지 라인 파싱
    for (let i = lineIndex; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // 이전 노드의 content 저장
        if (currentContent.length > 0 && parentStack.length > 1) {
          const lastNode = parentStack[parentStack.length - 1];
          lastNode.content = currentContent.join('\n').trim();
          currentContent = [];
        }

        const actualLevel = headingMatch[1].length;
        const title = headingMatch[2];

        // HEADING_START_LEVEL을 고려하여 트리 레벨 계산
        const treeLevel = actualLevel - HEADING_START_LEVEL + 1;

        // 적절한 부모 찾기
        while (parentStack.length > treeLevel) {
          parentStack.pop();
        }

        const newNode = {
          id: `node-${++nodeCounter}`,
          title,
          level: treeLevel,
          content: '',
          children: []
        };

        currentParent = parentStack[parentStack.length - 1];
        currentParent.children.push(newNode);
        parentStack.push(newNode);
      } else {
        // 컨텐츠 라인
        if (parentStack.length === 1) {
          // root content
          root.content += line + '\n';
        } else {
          currentContent.push(line);
        }
      }
    }

    // 마지막 노드의 content 저장
    if (currentContent.length > 0 && parentStack.length > 1) {
      const lastNode = parentStack[parentStack.length - 1];
      lastNode.content = currentContent.join('\n').trim();
    }

    root.content = root.content.trim();
    setData(root);
    setSelectedNode(null);

    // 모든 노드 확장
    const getAllIds = (node) => {
      let ids = [node.id];
      if (node.children) {
        node.children.forEach(child => {
          ids = [...ids, ...getAllIds(child)];
        });
      }
      return ids;
    };
    setExpandedNodes(new Set(getAllIds(root)));
  };

  // 마크다운 렌더링
  const renderMarkdown = (text) => {
    if (!text) return null;

    // 코드 블록
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || '', content: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <pre key={idx} className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto">
            <code className="text-sm font-mono">{part.content}</code>
          </pre>
        );
      }

      // 일반 텍스트 처리
      let content = part.content;

      // 헤딩
      content = content.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
      content = content.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
      content = content.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

      // 볼드
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

      // 이탤릭
      content = content.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

      // 인라인 코드
      content = content.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600">$1</code>');

      // 리스트
      content = content.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>');
      content = content.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>');

      // 블록쿼트
      content = content.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>');

      // 링크
      content = content.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank">$1</a>');

      // 줄바꿈
      content = content.replace(/\n\n/g, '<br/><br/>');
      content = content.replace(/\n/g, '<br/>');

      return (
        <div
          key={idx}
          dangerouslySetInnerHTML={{ __html: content }}
          className="prose prose-sm max-w-none"
        />
      );
    });
  };

  const renderTree = (node) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const isDragOver = dragOverNode?.id === node.id;
    const isFrontmatter = node.type === 'frontmatter';

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center group"
          draggable={node.id !== 'root' && !isFrontmatter}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          <div
            className={`flex-1 flex items-center py-2 px-3 cursor-pointer rounded transition-all ${
              isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'
            } ${isDragOver ? 'border-2 border-blue-500 border-dashed' : ''} ${
              isFrontmatter ? 'bg-purple-50 border border-purple-200' : ''
            }`}
            onClick={() => setSelectedNode(node)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            {isFrontmatter ? (
              <FileCode size={14} className="mr-2 text-purple-600" />
            ) : (
              <FileText size={14} className="mr-2 text-gray-500" />
            )}
            <span className="text-sm truncate">{node.title}</span>
            {node.level > 0 && !isFrontmatter && (
              <span className="ml-2 text-xs text-gray-400">H{node.level + HEADING_START_LEVEL - 1}</span>
            )}
          </div>

          {node.id !== 'root' && !isFrontmatter && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 ml-2 transition-opacity">
              <button
                onClick={() => addNode(node.id)}
                className="p-1 hover:bg-green-100 text-green-600 rounded"
                title="자식 노드 추가"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => deleteNode(node.id)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
                title="삭제"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {node.children.map(child => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Markdown Tree Editor</h1>

            <div className="flex items-center space-x-2">
              {/* Langfuse 버튼 추가 */}
              <button
                onClick={loadLangfusePrompts}
                disabled={langfuseLoading}
                className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm"
                title="Langfuse에서 불러오기"
              >
                <Cloud size={16} />
                <span>{langfuseLoading ? '로딩...' : 'Langfuse 불러오기'}</span>
              </button>

              <button
                onClick={saveToLangfuse}
                className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                title="Langfuse에 저장"
              >
                <Cloud size={16} />
                <span>Langfuse 저장</span>
              </button>

              <div className="border-l border-gray-300 h-6 mx-1"></div>

              <button
                onClick={selectFolder}
                className="flex items-center space-x-2 px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
                title="작업 폴더 선택"
              >
                <FolderOpen size={16} />
                <span>폴더 선택</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".md,.markdown"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                <Upload size={16} />
                <span>가져오기</span>
              </button>

              <button
                onClick={() => saveToFileSystem('수동 저장')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                disabled={!directoryHandle}
                title={!directoryHandle ? '먼저 폴더를 선택하세요' : ''}
              >
                <Save size={16} />
                <span>저장</span>
              </button>

              <button
                onClick={downloadFile}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                <Download size={16} />
                <span>내보내기</span>
              </button>

              <button
                onClick={() => setShowVersions(!showVersions)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                <Clock size={16} />
                <span>버전 ({versions.length})</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {currentPromptName ? `☁️ Langfuse: ${currentPromptName}` : directoryHandle ? `📁 ${directoryHandle.name}` : '파일을 불러오세요'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tree */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                문서 구조
              </div>
              <button
                onClick={() => addNode('root')}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                <Plus size={12} />
                <span>추가</span>
              </button>
            </div>
            {renderTree(data)}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Main Editor Area */}
          <div className={`flex flex-col ${showGuide ? 'h-3/5' : 'flex-1'} transition-all duration-300`}>
            {selectedNode ? (
              <>
                {/* Content Header */}
                <div className="border-b border-gray-200 px-8 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">
                      {selectedNode.type === 'frontmatter' ? (
                        <span className="flex items-center space-x-1">
                          <FileCode size={14} className="text-purple-600" />
                          <span className="text-purple-600 font-semibold">YAML Frontmatter</span>
                        </span>
                      ) : selectedNode.level > 0 ? (
                        `${'#'.repeat(selectedNode.level + HEADING_START_LEVEL - 1)} Heading ${selectedNode.level + HEADING_START_LEVEL - 1}`
                      ) : (
                        '루트 문서'
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-colors text-sm ${
                          isPreviewMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isPreviewMode ? <Eye size={14} /> : <Edit3 size={14} />}
                        <span>{isPreviewMode ? '미리보기' : '편집'}</span>
                      </button>
                      {selectedNode.id !== 'root' && selectedNode.type !== 'frontmatter' && (
                        <>
                          <button
                            onClick={() => addNode(selectedNode.id)}
                            className="px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            하위 추가
                          </button>
                          <button
                            onClick={() => deleteNode(selectedNode.id)}
                            className="px-2 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedNode.type !== 'frontmatter' && (
                    <input
                      type="text"
                      value={selectedNode.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setSelectedNode({ ...selectedNode, title: newTitle });
                        updateNodeTitle(selectedNode.id, newTitle);
                      }}
                      className="text-2xl font-bold text-gray-800 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      placeholder="제목을 입력하세요"
                    />
                  )}
                  {selectedNode.type === 'frontmatter' && (
                    <div className="text-xl font-bold text-purple-700 px-2 py-1">
                      문서 메타데이터 (YAML)
                    </div>
                  )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {isPreviewMode ? (
                    selectedNode.type === 'frontmatter' ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center space-x-2 mb-4 text-purple-700">
                          <FileCode size={18} />
                          <span className="font-semibold">YAML Frontmatter</span>
                        </div>
                        <pre className="bg-white p-4 rounded border border-purple-200 text-sm font-mono text-gray-800 overflow-x-auto">
{selectedNode.content}
                        </pre>
                        <div className="mt-4 text-xs text-purple-600">
                          💡 이 메타데이터는 마크다운 파일의 맨 앞에 위치하며, 문서의 속성을 정의합니다.
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {renderMarkdown(selectedNode.content)}
                      </div>
                    )
                  ) : (
                    <textarea
                      className={`w-full h-full p-4 border rounded text-sm resize-none focus:outline-none focus:ring-2 font-mono ${
                        selectedNode.type === 'frontmatter'
                          ? 'border-purple-300 focus:ring-purple-500 bg-purple-50'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      value={selectedNode.content}
                      onChange={(e) => {
                        const newContent = e.target.value;
                        setSelectedNode({ ...selectedNode, content: newContent });
                        updateNodeContent(selectedNode.id, newContent);
                      }}
                      placeholder={
                        selectedNode.type === 'frontmatter'
                          ? 'YAML 형식으로 메타데이터를 입력하세요...\n예:\ntitle: 문서 제목\nauthor: 작성자\ndate: 2024-01-01'
                          : '마크다운 내용을 입력하세요...'
                      }
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">왼쪽 트리에서 섹션을 선택하세요</p>
                  <p className="text-sm">드래그앤드롭으로 노드를 재배치할 수 있습니다</p>
                </div>
              </div>
            )}
          </div>

          {/* Guide Section */}
          <div className={`border-t-2 border-gray-300 bg-gradient-to-b from-blue-50 to-gray-50 flex flex-col ${showGuide ? 'h-2/5' : 'h-auto'} transition-all duration-300`}>
            {/* Guide Header */}
            <div
              className="flex items-center justify-between px-6 py-3 bg-blue-100 border-b border-blue-200 cursor-pointer hover:bg-blue-150"
              onClick={() => setShowGuide(!showGuide)}
            >
              <div className="flex items-center space-x-2">
                <BookOpen size={18} className="text-blue-600" />
                <h3 className="font-semibold text-blue-900">📖 마크다운 사용 가이드</h3>
                <span className="text-xs text-blue-600 bg-blue-200 px-2 py-0.5 rounded">참고용</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 transition-colors">
                {showGuide ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>

            {/* Guide Content */}
            {showGuide && (
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg shadow-sm">
                  {guideContent ? renderMarkdown(guideContent) : (
                    <div className="text-center text-gray-400">
                      <p>가이드 파일을 로드하는 중...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersions && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-2/3 max-h-2/3 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold">버전 히스토리</h3>
              <button
                onClick={() => setShowVersions(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {versions.slice().reverse().map((version, index) => {
                const isLatest = index === 0;
                return (
                  <div key={version.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold text-gray-800">버전 {version.id}</div>
                          {isLatest && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              현재
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(version.timestamp).toLocaleString('ko-KR')}
                        </div>
                        {version.filePath && (
                          <div className="text-xs text-gray-400 mt-1">
                            📁 {version.filePath}
                          </div>
                        )}
                      </div>
                      {!isLatest && version.filePath && (
                        <button
                          onClick={() => restoreVersion(version)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          <RotateCcw size={14} />
                          <span>복구</span>
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{version.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Langfuse Prompts Modal */}
      {showLangfuseModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-2/3 max-h-2/3 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cloud size={20} className="text-indigo-600" />
                <h3 className="text-lg font-bold">Langfuse 프롬프트 불러오기</h3>
              </div>
              <button
                onClick={() => setShowLangfuseModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {langfusePrompts.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Cloud size={48} className="mx-auto mb-4 opacity-50" />
                  <p>프롬프트가 없습니다.</p>
                  <p className="text-sm mt-2">Langfuse에 프롬프트를 먼저 저장하세요.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {langfusePrompts.map((prompt) => (
                    <button
                      key={prompt.name}
                      onClick={() => loadFromLangfuse(prompt.name)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-800">{prompt.name}</div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          v{prompt.version}
                        </span>
                      </div>
                      {prompt.labels && prompt.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {prompt.labels.map((label) => (
                            <span
                              key={label}
                              className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(prompt.lastUpdated).toLocaleString('ko-KR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownTreeEditor;
