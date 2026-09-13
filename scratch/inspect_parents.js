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

  const parents = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const key = Object.keys(btn).find(k => k.startsWith('__reactFiber$'));
      let f = btn[key];
      const res = [];
      while (f) {
        if (f.type && typeof f.type === 'function') {
          res.push({
            name: f.type.displayName || f.type.name || 'anon',
            code: f.type.toString().slice(0, 1500)
          });
        }
        f = f.return;
      }
      return res;
    })()`,
    returnByValue: true
  });

  console.log('All parent components:', JSON.stringify(parents.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
