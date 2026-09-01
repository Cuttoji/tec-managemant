// ─── Domain error classes ─────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'APP_ERROR',
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', 409);
  }
}

// ─── Server Action result type ────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true;  data?: T }
  | { success: false; error: string; issues?: FieldIssue[] };

export interface FieldIssue {
  field:   string;
  message: string;
}

// ─── Wrapper that converts thrown errors to ActionResult ─────────────────────

export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    const msg = (err as Error).message;

    if (msg === 'UNAUTHORIZED') return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
    if (msg === 'FORBIDDEN')    return { success: false, error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' };
    if (err instanceof AppError) return { success: false, error: err.message };

    console.error('[safeAction]', err);
    return { success: false, error: 'เกิดข้อผิดพลาดภายในระบบ' };
  }
}
