/**
 * 验证辅助工具
 * 提供通用的验证错误和警告创建函数
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type { ValidationError, ValidationWarning } from '@/types/user-identity'
import { VALIDATION_ERROR_CODES, ERROR_MESSAGES_DE } from '@/types/user-identity'

/**
 * 创建验证错误
 */
export function createValidationError(
  field: string,
  code: keyof typeof VALIDATION_ERROR_CODES,
  details?: Record<string, any>
): ValidationError {
  return {
    field,
    code: VALIDATION_ERROR_CODES[code],
    message: ERROR_MESSAGES_DE[VALIDATION_ERROR_CODES[code]] || `Validierungsfehler: ${code}`,
    details
  }
}

/**
 * 创建验证警告
 */
export function createValidationWarning(
  field: string,
  code: string,
  message: string,
  details?: string
): ValidationWarning {
  return {
    field,
    code,
    message,
    details
  }
}
