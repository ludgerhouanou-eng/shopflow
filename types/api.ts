export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'WEBHOOK_INVALID'
  | 'INTERNAL_ERROR';

export interface APISuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface APIErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    requestId: string;
  };
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;
