async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const list = await listRes.json();
  const target = list.find(t => t.id === '86FDAC6819013DD94E274978D217B83B') || list.find(t => t.type === 'page' && t.url.includes('motion.dev'));

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await new Promise(r => ws.addEventListener('open', r, { once: true }));

  // Check live page: trigger click with real mouse click dispatch
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      if (!btn) return 'no btn';
      // Simulate real click
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return 'clicked';
    })()`
  });
  console.log('Dispatch click:', res.result.value);

  // Poll for 400ms
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 50));
    const status = await send('Runtime.evaluate', {
      expression: `(() => {
        const path = document.querySelector('button[role="checkbox"] path');
        if (!path) return 'no path';
        return {
          t: ${i * 50},
          dasharray: path.getAttribute('stroke-dasharray'),
          dashoffset: path.getAttribute('stroke-dashoffset'),
          pathLength: path.getAttribute('pathLength'),
          style: path.getAttribute('style'),
          linecap: path.getAttribute('stroke-linecap')
        };
      })()`,
      returnByValue: true
    });
    console.log(status.result.value);
  }

  ws.close();
}

main().catch(console.error);
