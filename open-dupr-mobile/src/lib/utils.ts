export function extractApiErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { data?: unknown; status?: number }; message?: string };
    if (anyErr.response?.data && typeof anyErr.response.data === "object") {
      const data = anyErr.response.data as { message?: string; error?: string };
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
    if (anyErr.message) return anyErr.message;
  }
  return fallback;
}

