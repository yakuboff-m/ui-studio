const fs = require('fs');

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const list = await listRes.json();
  const target = list.find(t => t.id === '346B584B88E9125B1A05E98B90D0A583') || list.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!target) {
    console.error('Target tab not found');
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

  console.log('Navigating to http://localhost:3000/?c=checkbox&tab=preview');
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/?c=checkbox&tab=preview' });

  await new Promise(r => setTimeout(r, 2500));

  // Verify checkbox presence
  const status1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const path = btn ? btn.querySelector('path') : null;
      return {
        found: !!btn,
        state: btn ? btn.getAttribute('data-state') : null,
        ariaChecked: btn ? btn.getAttribute('aria-checked') : null,
        pathLength: path ? path.getAttribute('pathLength') : null,
        dasharray: path ? path.getAttribute('stroke-dasharray') : null,
        linecap: path ? path.getAttribute('stroke-linecap') : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Initial checkbox state:', status1.result.value);

  // Capture initial checked screenshot
  const ss1 = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/checkbox_initial_checked.png', Buffer.from(ss1.data, 'base64'));

  // Get button coordinates to click
  const box = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`,
    returnByValue: true
  });
  const { x, y } = box.result.value;

  console.log('Clicking to uncheck...');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await new Promise(r => setTimeout(r, 50));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 50));
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

  // Move mouse away so hover effect resets
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 10, y: 10 });

  await new Promise(r => setTimeout(r, 400));

  const statusUnchecked = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const path = btn ? btn.querySelector('path') : null;
      return {
        state: btn ? btn.getAttribute('data-state') : null,
        dasharray: path ? path.getAttribute('stroke-dasharray') : null,
        linecap: path ? path.getAttribute('stroke-linecap') : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Unchecked state:', statusUnchecked.result.value);

  const ssUnchecked = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/checkbox_unchecked.png', Buffer.from(ssUnchecked.data, 'base64'));

  // Click again to check and capture mid-animation
  console.log('Clicking to re-check...');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

  // Quick capture mid-tick draw
  await new Promise(r => setTimeout(r, 70));
  const ssMid = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/checkbox_drawing_tick.png', Buffer.from(ssMid.data, 'base64'));

  // Wait for settled animation
  await new Promise(r => setTimeout(r, 400));
  const ssRechecked = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/checkbox_rechecked.png', Buffer.from(ssRechecked.data, 'base64'));

  // Toggle light mode
  console.log('Switching to light mode...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Toggle light/dark theme' || b.innerHTML.includes('LightMode') || b.innerHTML.includes('DarkMode') || b.querySelector('svg[data-testid="LightModeIcon"]') || b.querySelector('svg[data-testid="DarkModeIcon"]'));
      if (themeBtn) themeBtn.click();
      return !!themeBtn;
    })()`
  });

  await new Promise(r => setTimeout(r, 500));
  const ssLight = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/checkbox_light_mode.png', Buffer.from(ssLight.data, 'base64'));

  // Toggle back to dark mode
  await send('Runtime.evaluate', {
    expression: `(() => {
      const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Toggle light/dark theme' || b.querySelector('svg[data-testid="LightModeIcon"]') || b.querySelector('svg[data-testid="DarkModeIcon"]'));
      if (themeBtn) themeBtn.click();
    })()`
  });

  // Switch to Code tab
  console.log('Inspecting Code tab...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const codeTab = tabs.find(t => t.textContent.trim() === 'Code');
      if (codeTab) codeTab.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 500));
  const ssCode = await send('Page.captureScreenshot');
  fs.writeFileSync('/Users/muhammadyusuf/.gemini/antigravity-ide/brain/6758782d-9707-41fe-ab42-cb8d79698ca4/checkbox_code_tab.png', Buffer.from(ssCode.data, 'base64'));

  console.log('Testing completed successfully!');
  ws.close();
}

main().catch(console.error);
