import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MarkdownTreeEditor from './MarkdownTreeEditor'
import GitHubMarkdownEditor from './GitHubMarkdownEditor'
import { Home, FolderOpen, GitBranch } from 'lucide-react'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/local-editor" element={<MarkdownTreeEditor />} />
        <Route path="/github-editor" element={<GitHubMarkdownEditor />} />
      </Routes>
    </Router>
  )
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Markdown Editor Suite
          </h1>
          <p className="text-xl text-gray-600">
            로컬 파일 시스템 또는 GitHub 저장소에서 마크다운 파일을 편집하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Local Editor Card */}
          <Link to="/local-editor">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
                <FolderOpen size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                로컬 파일 에디터
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                컴퓨터의 파일 시스템에서 직접 마크다운 파일을 편집하고 관리합니다
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  트리 구조 네비게이션
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  드래그 앤 드롭 재구성
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  YAML Frontmatter 지원
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  로컬 버전 관리
                </li>
              </ul>
              <div className="mt-8 text-center">
                <span className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg font-medium">
                  시작하기 →
                </span>
              </div>
            </div>
          </Link>

          {/* GitHub Editor Card */}
          <Link to="/github-editor">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
                <GitBranch size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                GitHub 에디터
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                GitHub 저장소에 저장된 마크다운 파일을 API를 통해 편집합니다
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  GitHub 저장소 연동
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  실시간 마크다운 프리뷰
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  커밋 히스토리 조회
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  버전 롤백 지원
                </li>
              </ul>
              <div className="mt-8 text-center">
                <span className="inline-block bg-green-500 text-white px-6 py-2 rounded-lg font-medium">
                  시작하기 →
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            ℹ️ GitHub 에디터를 사용하려면 백엔드 API 서버가 실행 중이어야 합니다
          </p>
          <p className="text-xs mt-2 text-gray-500">
            설정: .env 파일에서 VITE_API_BASE_URL 확인
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
