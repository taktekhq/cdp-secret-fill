// Type the clipboard into the focused field of a page, then clear the clipboard. Never prints it.
//   node paste.mjs TARGET_ID
import { execSync } from 'node:child_process';
import { targets, connect } from './cdp.mjs';
const [id] = process.argv.slice(2);
if (!id) { console.error('usage: node paste.mjs TARGET_ID'); process.exit(2); }
const t = (await targets()).find((x) => x.id === id);
if (!t) { console.error('no target', id); process.exit(1); }
const { ws, send } = await connect(t);
const text = execSync('pbpaste').toString();
await send('Input.insertText', { text });
execSync("printf '' | pbcopy");
console.log('typed', text.length, 'chars; clipboard cleared');
ws.close();
