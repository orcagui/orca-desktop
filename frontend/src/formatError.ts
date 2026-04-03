export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint') {
    return `${error}`;
  }

  if (typeof error === 'symbol') {
    return error.description ? `Symbol(${error.description})` : 'Symbol';
  }

  if (typeof error === 'function') {
    return error.name ? `[function ${error.name}]` : '[function anonymous]';
  }

  if (error === null) {
    return 'null';
  }

  if (error === undefined) {
    return 'undefined';
  }

  return 'Unknown error';
}