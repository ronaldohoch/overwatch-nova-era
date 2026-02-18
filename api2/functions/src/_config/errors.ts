const FIRESTORE_NOT_FOUND_PATTERN = /\b5\s*NOT_FOUND\b/i;

function readErrorCode(error: unknown): string | number | null {
  if (!error || typeof error !== 'object') return null;

  const value = (error as { code?: unknown }).code;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

function readErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;

  const value = (error as { message?: unknown }).message;
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function isFirestoreNotFoundError(error: unknown): boolean {
  const code = readErrorCode(error);
  if (code === 5 || code === '5' || code === 'NOT_FOUND' || code === 'not-found') {
    return true;
  }

  const message = readErrorMessage(error);
  return !!message && FIRESTORE_NOT_FOUND_PATTERN.test(message);
}

export function resolveErrorStatus(error: unknown, fallbackStatus: number): number {
  if (isFirestoreNotFoundError(error)) {
    return 500;
  }

  return fallbackStatus;
}

export function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isFirestoreNotFoundError(error)) {
    return 'Firestore nao encontrado no ambiente atual. Verifique projeto e FIRESTORE_DATABASE_ID.';
  }

  const message = readErrorMessage(error);
  return message ?? fallbackMessage;
}
