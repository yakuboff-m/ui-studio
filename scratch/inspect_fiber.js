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

  // Extract props of motion.button and motion.path
  const details = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const svg = btn ? btn.querySelector('svg') : null;
      const path = btn ? btn.querySelector('path') : null;

      function getFiber(el) {
        if (!el) return null;
        const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
        return el[key];
      }

      const btnFiber = getFiber(btn);
      const pathFiber = getFiber(path);

      return {
        btnProps: btnFiber ? {
          whileHover: btnFiber.memoizedProps?.whileHover,
          whileTap: btnFiber.memoizedProps?.whileTap,
          animate: btnFiber.memoizedProps?.animate,
          transition: btnFiber.memoizedProps?.transition
        } : null,
        pathProps: pathFiber ? {
          initial: pathFiber.memoizedProps?.initial,
          animate: pathFiber.memoizedProps?.animate,
          variants: pathFiber.memoizedProps?.variants,
          transition: pathFiber.memoizedProps?.transition,
          d: pathFiber.memoizedProps?.d,
          style: pathFiber.memoizedProps?.style
        } : null,
        pathCurrentAttrs: path ? {
          d: path.getAttribute('d'),
          pathLength: path.getAttribute('pathLength'),
          stroke: path.getAttribute('stroke'),
          strokeWidth: path.getAttribute('stroke-width'),
          strokeDashoffset: path.getAttribute('stroke-dashoffset'),
          strokeDasharray: path.getAttribute('stroke-dasharray'),
          style: path.getAttribute('style')
        } : null,
        svgAttrs: svg ? {
          viewBox: svg.getAttribute('viewBox'),
          fill: svg.getAttribute('fill'),
          stroke: svg.getAttribute('stroke'),
          strokeWidth: svg.getAttribute('stroke-width')
        } : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Component details:', JSON.stringify(details.result.value, null, 2));

  // Now let's inspect the actual component function source if possible
  const compSource = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[role="checkbox"]');
      const key = Object.keys(btn).find(k => k.startsWith('__reactFiber$'));
      let f = btn[key];
      while (f) {
        if (f.type && typeof f.type === 'function') {
          // Check if this is the example component
          const src = f.type.toString();
          if (src.includes('Checkbox') || src.includes('svg') || src.includes('path')) {
            return {
              name: f.type.name,
              src: src.slice(0, 2000)
            };
          }
        }
        f = f.return;
      }
      return null;
    })()`,
    returnByValue: true
  });
  console.log('Comp source:', JSON.stringify(compSource.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
