// Shared bits: the DevTools endpoint (CDP_URL, default http://127.0.0.1:9222) and a tiny client.
export const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';

export async function targets() {
  return (await fetch(`${CDP_URL}/json/list`)).json();
}

export async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let n = 0;
  const send = (method, params = {}) => new Promise((r) => {
    const id = ++n;
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id === id) r(d); };
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { ws, send };
}
