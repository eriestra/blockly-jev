/**
 * Runs JavaScript generated from a Blockly workspace that uses Jev blocks.
 *
 * The code is the body of an async function and expects the names in
 * `scope` (usually `jev` and `print`). The fast path compiles it with the
 * AsyncFunction constructor. Pages served under a Content Security Policy
 * without `'unsafe-eval'` cannot do that, so the fallback injects the code as
 * an inline `<script>`, which such policies typically still allow
 * (`'unsafe-inline'`). Both paths run the same code with the same scope.
 */
export function runJevProgram(code: string, scope: Record<string, unknown>): Promise<void> {
  const names = Object.keys(scope);
  const values = names.map((n) => scope[n]);
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
      ...args: string[]
    ) => (...args: unknown[]) => Promise<void>;
    const fn = new AsyncFunction(...names, code);
    return fn(...values);
  } catch (err) {
    if (!isEvalBlocked(err)) return Promise.reject(err);
  }
  return runInline(code, scope);
}

function isEvalBlocked(err: unknown): boolean {
  if (err instanceof EvalError) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /Content Security Policy|unsafe-eval|EvalError/i.test(message);
}

function runInline(code: string, scope: Record<string, unknown>): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('runJevProgram: no document for the inline-script fallback'));
  }
  return new Promise((resolve, reject) => {
    const id = `__jevRun_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    const w = window as unknown as Record<string, unknown>;
    w[id] = { scope, resolve, reject };
    const names = Object.keys(scope).join(', ');
    const script = document.createElement('script');
    script.textContent =
      `(async () => {\n` +
      `  const __run = window[${JSON.stringify(id)}];\n` +
      `  __run.started = true;\n` +
      `  const { ${names} } = __run.scope;\n` +
      `  try {\n${code}\n    __run.resolve();\n  } catch (e) { __run.reject(e); }\n` +
      `  finally { delete window[${JSON.stringify(id)}]; }\n` +
      `})();`;
    script.addEventListener('error', () => {
      delete w[id];
      reject(new Error('runJevProgram: the page blocks inline scripts too'));
    });
    document.head.appendChild(script);
    script.remove();
    // Inline scripts execute synchronously on insertion. If the IIFE never
    // started, the generated code had a syntax error (reported on window,
    // not on the element), so fail instead of hanging.
    const state = w[id] as { started?: boolean } | undefined;
    if (state && !state.started) {
      delete w[id];
      reject(new SyntaxError('runJevProgram: generated code failed to parse (or inline scripts are blocked)'));
    }
  });
}
