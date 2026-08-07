import { APIErrorResponse, ErrorCode } from '@/types/api';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: ErrorCode = 'INTERNAL_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatAPIError(error: unknown, requestId?: string): { status: number; response: APIErrorResponse } {
  const reqId = requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      response: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: reqId,
        },
      },
    };
  }

  // Generic internal server error
  console.error(`[Unhandled Server Error] [${reqId}]:`, error);

  return {
    status: 500,
    response: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Une erreur interne est survenue. Veuillez réessayer ultérieurement.',
        requestId: reqId,
      },
    },
  };
}
