// Node 24 native WebSocket
const fs = require('fs');

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const list = await listRes.json();
  const target = list.find(t => t.id === '86FDAC6819013DD94E274978D217B83B') || list.find(t => t.type === 'page' && t.url.includes('motion.dev'));
  if (!target) {
    console.error('Target not found', list);
    process.exit(1);
  }

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

  console.log('Navigating to https://examples.motion.dev/react/radix-checkbox');
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'https://examples.motion.dev/react/radix-checkbox' });

  // Wait for load
  await new Promise(r => setTimeout(r, 4000));

  // Screenshot initial state
  const ss1 = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/motion_checkbox_initial.png', Buffer.from(ss1.data, 'base64'));

  // Get DOM info of sandbox
  const domInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const sandbox = document.getElementById('sandbox');
      return {
        html: sandbox ? sandbox.innerHTML : 'no sandbox',
        outer: sandbox ? sandbox.outerHTML : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Sandbox DOM:', JSON.stringify(domInfo.result.value, null, 2));

  // Click "View source"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View source'));
      if (btn) btn.click();
      return !!btn;
    })()`
  });

  await new Promise(r => setTimeout(r, 1500));

  // Capture screenshot of source modal
  const ss2 = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/motion_checkbox_source_modal.png', Buffer.from(ss2.data, 'base64'));

  // Get source code text
  const sourceCode = await send('Runtime.evaluate', {
    expression: `(() => {
      const pre = document.querySelector('pre') || document.querySelector('.monaco-editor') || document.querySelector('code');
      const dialog = document.querySelector('[role="dialog"]');
      return {
        code: pre ? pre.textContent : null,
        dialog: dialog ? dialog.innerText : null,
        allText: document.body.innerText
      };
    })()`,
    returnByValue: true
  });
  console.log('Source Code:', JSON.stringify(sourceCode.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
