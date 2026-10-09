// Copy ONE Bitwarden login's password to the clipboard, never printing it.
//   node bw-copy-password.mjs "Item name" [expected-username]
// Drives the Bitwarden browser extension's popup page (open it as a tab first; the extension must be
// unlocked). Prints only whether the item was found and whether the username matched.
// BW_EXTENSION_ID overrides the Chrome Web Store id.
import { execSync } from 'node:child_process';
import { targets, connect } from './cdp.mjs';
const EXT = process.env.BW_EXTENSION_ID || 'nngceckbapebfimnlniiiahkandclblb';
const [name, expectUser] = process.argv.slice(2);
if (!name) { console.error('usage: node bw-copy-password.mjs "Item name" [expected-username]'); process.exit(2); }
const t = (await targets()).find((x) => x.type === 'page' && x.url.includes(EXT) && /popup|index\.html/.test(x.url));
if (!t) { console.log('no bitwarden tab'); process.exit(1); }
const { ws, send } = await connect(t);
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await ev(`location.href = location.href.split('#')[0] + '#/tabs/vault'; 1`); await sleep(2500);
const opened = await ev(`(()=>{const r=[...document.querySelectorAll('bit-item, li')].find(r=>r.innerText.split('\\n')[0].trim()===${JSON.stringify(name)}); if(!r) return 'no item'; (r.querySelector('button[aria-label^="View item"]')||r.querySelector('a,button')).click(); return 'ok'})()`);
if (opened !== 'ok') { console.log(opened); ws.close(); process.exit(1); }
await sleep(2000);
if (!/cipherId=/.test(await ev(`location.hash`))) { console.log('not on item view'); ws.close(); process.exit(1); }
await ev(`location.hash = location.hash.replace(/view-cipher/, 'edit-cipher'); 1`); await sleep(3000);
const v = JSON.parse(await ev(`JSON.stringify({u:(document.querySelector('[formcontrolname=username]')||{}).value||'', p:(document.querySelector('[formcontrolname=password]')||{}).value||''})`) || '{}');
await ev(`history.back(); 1`); ws.close();
if (!v.p) { console.log('found, but no password field'); process.exit(1); }
execSync('pbcopy', { input: v.p });
console.log('copied password to clipboard; username', expectUser ? (v.u === expectUser ? 'matches' : 'DOES NOT match') : 'not checked');
