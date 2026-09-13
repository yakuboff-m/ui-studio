const fs = require('fs');

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

  // Get button coordinates
  const box = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`,
    returnByValue: true
  });
  console.log('Button pos:', box.result.value);

  // Send real mouse events
  const { x, y } = box.result.value;
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

  // Poll for 500ms
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

  const ss = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/motion_checkbox_real_click.png', Buffer.from(ss.data, 'base64'));

  ws.close();
}

main().catch(console.error);
