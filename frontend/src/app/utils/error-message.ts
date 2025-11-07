export const getErrorMessage = (error: unknown, fallback = 'Ismeretlen hiba történt'): string => {
  if (error && typeof error === 'object' && 'error' in error) {
    const payload = (error as { error?: unknown }).error;
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const nested = (payload as { error?: unknown }).error;
      if (nested && typeof nested === 'object' && 'message' in nested) {
        const message = (nested as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
      if (payload && typeof payload === 'object' && 'message' in payload) {
        const message = (payload as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};
