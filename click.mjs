// Click at viewport coordinates over raw CDP. Works inside cross-origin iframes (sign-in forms,
// payment widgets) that DevTools-protocol element clicks can't reach.
//   node click.mjs TARGET_ID X Y
import { targets, connect } from './cdp.mjs';
const [id, x, y] = process.argv.slice(2);
if (!id || x === undefined || y === undefined) { console.error('usage: node click.mjs TARGET_ID X Y'); process.exit(2); }
const t = (await targets()).find((p) => p.id === id);
if (!t) { console.error('no target', id); process.exit(1); }
const { ws, send } = await connect(t);
for (const type of ['mousePressed', 'mouseReleased']) {
  await send('Input.dispatchMouseEvent', { type, x: Number(x), y: Number(y), button: 'left', clickCount: 1 });
}
console.log('clicked', x, y);
ws.close();
