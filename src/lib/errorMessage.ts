// FastAPI returns `detail` as a string for most errors, but as an array of
// Pydantic validation-error objects ({type, loc, msg, input, ctx}) on a 422.
// Every form in this app used to do `err?.response?.data?.detail || fallback`
// and render the result directly as JSX - a validation-error array is
// truthy, so it got passed to React as `error` and crashed with "Objects are
// not valid as a React child". This normalizes both shapes to a string.
interface PydanticValidationError {
  msg?: string;
  loc?: (string | number)[];
}

function isPydanticValidationErrors(value: unknown): value is PydanticValidationError[] {
  return Array.isArray(value) && value.length > 0 && value.every((v) => v && typeof v === 'object' && 'msg' in v);
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as {
    code?: string;
    response?: { data?: { detail?: unknown; message?: string } };
    message?: string;
  };

  // Axios sets code: 'ECONNABORTED' on a client-side timeout - most often
  // the backend (Render-hosted, see docs/AUTHENTICATION.md) cold-starting
  // after idling.
  if (anyErr?.code === 'ECONNABORTED') {
    return 'The server is taking longer than usual to respond (it may be waking up). Please try again in a moment.';
  }

  const detail = anyErr?.response?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (isPydanticValidationErrors(detail)) {
    const messages = detail.map((d) => d.msg).filter((m): m is string => Boolean(m));
    if (messages.length) return messages.join('; ');
  }

  if (anyErr?.response?.data?.message) return anyErr.response.data.message;

  // Axios's own `.message` is a generic "Request failed with status code 500"
  // whenever the server responded with no structured `detail`/`message` body
  // (the common case for an unhandled backend exception) - that's a raw status
  // code, not something a user should see. Only trust `.message` for errors
  // that didn't get an HTTP response at all (network failure, CORS, etc.);
  // otherwise prefer the caller's fallback.
  if (!anyErr?.response && anyErr?.message) return anyErr.message;

  return fallback;
}
