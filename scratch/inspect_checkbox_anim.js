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

  // Check state before click
  console.log('--- Initial State ---');
  let info = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const path = btn ? btn.querySelector('path') : null;
      return {
        btn: btn ? {
          dataState: btn.getAttribute('data-state'),
          ariaChecked: btn.getAttribute('aria-checked'),
          className: btn.className
        } : null,
        path: path ? {
          d: path.getAttribute('d'),
          pathLength: path.getAttribute('pathLength'),
          strokeDashoffset: path.getAttribute('stroke-dashoffset'),
          strokeDasharray: path.getAttribute('stroke-dasharray'),
          style: path.getAttribute('style')
        } : null
      };
    })()`,
    returnByValue: true
  });
  console.log(info.result.value);

  // Click checkbox to check
  console.log('--- Clicking checkbox (to checked) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      if (btn) btn.click();
    })()`
  });

  // Track path attributes over 500ms
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 60));
    const step = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[role="checkbox"]');
        const path = btn ? btn.querySelector('path') : null;
        return {
          t: ${i * 60},
          state: btn ? btn.getAttribute('data-state') : null,
          strokeDashoffset: path ? (path.style.strokeDashoffset || path.getAttribute('stroke-dashoffset')) : null,
          strokeDasharray: path ? (path.style.strokeDasharray || path.getAttribute('stroke-dasharray')) : null,
          opacity: path ? path.style.opacity : null,
          style: path ? path.getAttribute('style') : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Tick step:', step.result.value);
  }

  await new Promise(r => setTimeout(r, 400));
  const ssChecked = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/motion_checkbox_checked.png', Buffer.from(ssChecked.data, 'base64'));

  // Click checkbox to uncheck
  console.log('--- Clicking checkbox (to unchecked) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      if (btn) btn.click();
    })()`
  });

  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 60));
    const step = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[role="checkbox"]');
        const path = btn ? btn.querySelector('path') : null;
        return {
          t: ${i * 60},
          state: btn ? btn.getAttribute('data-state') : null,
          strokeDashoffset: path ? (path.style.strokeDashoffset || path.getAttribute('stroke-dashoffset')) : null,
          strokeDasharray: path ? (path.style.strokeDasharray || path.getAttribute('stroke-dasharray')) : null,
          opacity: path ? path.style.opacity : null,
          style: path ? path.getAttribute('style') : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Untick step:', step.result.value);
  }

  // Also extract React component fiber / props
  const fiberInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      if (!btn) return 'no btn';
      const key = Object.keys(btn).find(k => k.startsWith('__reactFiber$'));
      if (!key) return 'no fiber';
      let fiber = btn[key];
      const res = [];
      while (fiber && res.length < 10) {
        if (fiber.type && (typeof fiber.type === 'function' || typeof fiber.type === 'object')) {
          res.push({
            name: fiber.type.displayName || fiber.type.name || (fiber.type.render && (fiber.type.render.displayName || fiber.type.render.name)) || 'anon',
            memoizedProps: Object.keys(fiber.memoizedProps || {})
          });
        }
        fiber = fiber.return;
      }
      return res;
    })()`,
    returnByValue: true
  });
  console.log('Fiber info:', JSON.stringify(fiberInfo.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
