import { MessageKey, MessageTranslations } from '../messages/message-keys';

export interface ApiResponse<T = unknown> {
  success: boolean;
  messageKey: MessageKey;
  message: { en: string; ar: string };
  data?: T;
  errors?: Record<string, string[]>;
}

export function buildResponse<T>(
  messageKey: MessageKey,
  data?: T,
  success = true,
): ApiResponse<T> {
  return {
    success,
    messageKey,
    message: MessageTranslations[messageKey],
    ...(data !== undefined ? { data } : {}),
  };
}

export function buildErrorResponse(
  messageKey: MessageKey,
  errors?: Record<string, string[]>,
): ApiResponse {
  return {
    success: false,
    messageKey,
    message: MessageTranslations[messageKey],
    ...(errors ? { errors } : {}),
  };
}
