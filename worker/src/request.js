// Bound bytes while reading, before decoding or parsing attacker-controlled JSON.
export async function readJsonBody(request, maxBytes, requiredKeys, optionalKeys = []) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return { status: 415, error: 'unsupported_media_type' };
  const declared = request.headers.get('Content-Length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    if (request.body) void request.body.cancel().catch(() => {});
    return { status: 413, error: 'request_too_large' };
  }
  const reader = request.body?.getReader();
  if (!reader) return { status: 400, error: 'invalid_json' };
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        // Cancellation must not delay rejecting an over-budget stream.
        void reader.cancel().catch(() => {});
        return { status: 413, error: 'request_too_large' };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    const allowed = [...requiredKeys, ...optionalKeys];
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        !requiredKeys.every(key => Object.hasOwn(body, key)) ||
        Object.keys(body).some(key => !allowed.includes(key))) {
      return { status: 400, error: 'invalid_request' };
    }
    return { body };
  } catch {
    return { status: 400, error: 'invalid_json' };
  } finally {
    reader.releaseLock();
  }
}
