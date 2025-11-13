/**
 * Langfuse Prompts API 서버
 * Express 기반 REST API
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  getPrompt,
  savePrompt,
  listPrompts,
  deletePrompt,
  getPromptVersions,
  isConfigured,
  testConnection,
  cleanup,
} from './langfusePrompts';
import type { PromptSaveRequest, ApiResponse } from '../src/types/langfuse';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// 미들웨어
app.use(cors()); // CORS 활성화
app.use(express.json()); // JSON 파싱

/**
 * 헬스 체크 엔드포인트
 * GET /api/health
 */
app.get('/api/health', async (req: Request, res: Response) => {
  const configured = isConfigured();
  const connected = configured ? await testConnection() : false;

  res.json({
    success: true,
    data: {
      status: 'ok',
      configured,
      connected,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * 전체 프롬프트 목록 조회
 * GET /api/prompts
 */
app.get('/api/prompts', async (req: Request, res: Response) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Langfuse가 설정되지 않았습니다. 환경 변수를 확인하세요.',
        errorCode: 'NOT_CONFIGURED',
      } as ApiResponse);
    }

    const prompts = await listPrompts();

    res.json({
      success: true,
      data: prompts,
    } as ApiResponse);
  } catch (error) {
    console.error('프롬프트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '프롬프트 목록을 가져오는데 실패했습니다.',
      errorCode: 'LIST_FAILED',
    } as ApiResponse);
  }
});

/**
 * 특정 프롬프트 조회
 * GET /api/prompts/:name
 * Query params:
 * - label: 라벨 (선택, 기본값: 'latest')
 * - version: 버전 번호 (선택)
 */
app.get('/api/prompts/:name', async (req: Request, res: Response) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Langfuse가 설정되지 않았습니다.',
        errorCode: 'NOT_CONFIGURED',
      } as ApiResponse);
    }

    const { name } = req.params;
    const label = req.query.label as string | undefined;
    const version = req.query.version ? parseInt(req.query.version as string) : undefined;

    const prompt = await getPrompt(name, label, version);

    res.json({
      success: true,
      data: prompt,
    } as ApiResponse);
  } catch (error) {
    console.error('프롬프트 조회 오류:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : '프롬프트를 찾을 수 없습니다.',
      errorCode: 'NOT_FOUND',
    } as ApiResponse);
  }
});

/**
 * 프롬프트 저장/업데이트
 * POST /api/prompts/:name
 * Body: { content: string, commitMessage?: string, labels?: string[] }
 */
app.post('/api/prompts/:name', async (req: Request, res: Response) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Langfuse가 설정되지 않았습니다.',
        errorCode: 'NOT_CONFIGURED',
      } as ApiResponse);
    }

    const { name } = req.params;
    const request: PromptSaveRequest = req.body;

    // 유효성 검사
    if (!request.content) {
      return res.status(400).json({
        success: false,
        error: 'content 필드가 필요합니다.',
        errorCode: 'INVALID_REQUEST',
      } as ApiResponse);
    }

    const result = await savePrompt(name, request);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        errorCode: 'SAVE_FAILED',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('프롬프트 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '프롬프트 저장에 실패했습니다.',
      errorCode: 'SAVE_FAILED',
    } as ApiResponse);
  }
});

/**
 * 프롬프트 삭제
 * DELETE /api/prompts/:name
 */
app.delete('/api/prompts/:name', async (req: Request, res: Response) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Langfuse가 설정되지 않았습니다.',
        errorCode: 'NOT_CONFIGURED',
      } as ApiResponse);
    }

    const { name } = req.params;
    const success = await deletePrompt(name);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: '프롬프트 삭제에 실패했습니다.',
        errorCode: 'DELETE_FAILED',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { message: '프롬프트가 삭제되었습니다.' },
    } as ApiResponse);
  } catch (error) {
    console.error('프롬프트 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '프롬프트 삭제에 실패했습니다.',
      errorCode: 'DELETE_FAILED',
    } as ApiResponse);
  }
});

/**
 * 프롬프트 버전 히스토리 조회
 * GET /api/prompts/:name/versions
 */
app.get('/api/prompts/:name/versions', async (req: Request, res: Response) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Langfuse가 설정되지 않았습니다.',
        errorCode: 'NOT_CONFIGURED',
      } as ApiResponse);
    }

    const { name } = req.params;
    const versions = await getPromptVersions(name);

    res.json({
      success: true,
      data: versions,
    } as ApiResponse);
  } catch (error) {
    console.error('버전 히스토리 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '버전 히스토리 조회에 실패했습니다.',
      errorCode: 'VERSIONS_FAILED',
    } as ApiResponse);
  }
});

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
    errorCode: 'NOT_FOUND',
  } as ApiResponse);
});

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('서버 오류:', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
    errorCode: 'INTERNAL_ERROR',
  } as ApiResponse);
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Langfuse Prompts API 서버 실행 중`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`✅ Langfuse 설정: ${isConfigured() ? '완료' : '필요'}`);
  console.log(`\n사용 가능한 엔드포인트:`);
  console.log(`  GET    /api/health - 헬스 체크`);
  console.log(`  GET    /api/prompts - 전체 프롬프트 목록`);
  console.log(`  GET    /api/prompts/:name - 특정 프롬프트 조회`);
  console.log(`  POST   /api/prompts/:name - 프롬프트 저장`);
  console.log(`  DELETE /api/prompts/:name - 프롬프트 삭제`);
  console.log(`  GET    /api/prompts/:name/versions - 버전 히스토리\n`);
});

// 종료 시 정리
process.on('SIGINT', async () => {
  console.log('\n서버 종료 중...');
  await cleanup();
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n서버 종료 중...');
  await cleanup();
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});
