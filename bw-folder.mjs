// Move a Bitwarden item into a folder through the extension popup tab, printing nothing secret:
//   node bw-folder.mjs TARGET_ID CIPHER_ID FOLDER   (FOLDER as the vault shows it, e.g. Work)
// TARGET_ID is the unlocked popup tab (chrome-extension://<id>/popup/index.html) from $CDP_URL/json/list.
// CIPHER_ID is in the popup's URL when the item is open: #/view-cipher?cipherId=<id>.
import { targets, connect } from './cdp.mjs';

const [targetId, cipher, folder] = process.argv.slice(2);
if (!folder) { console.error('usage: node bw-folder.mjs TARGET_ID CIPHER_ID FOLDER'); process.exit(2); }
const target = (await targets()).find((t) => t.id === targetId);
if (!target) { console.error(`no target ${targetId}`); process.exit(1); }
const { ws, send } = await connect(target);
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await ev(`location.hash = '#/tabs/vault'; 1`); await sleep(1500);
await ev(`location.hash = '#/edit-cipher?cipherId=${encodeURIComponent(cipher)}&type=1'; 1`); await sleep(3000);
// ng-select opens on mousedown, not click, and appends its options to body.
console.log('open', await ev(`(()=>{const c=document.querySelector('bit-select[formcontrolname=folderId] .ng-select-container'); if(!c) return 'missing folder select';
  c.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); return 'ok'})()`));
await sleep(800);
console.log('pick', await ev(`(()=>{const o=[...document.querySelectorAll('.ng-option')].find(o=>o.innerText.trim()===${JSON.stringify(folder)}); if(!o) return 'no folder named ' + ${JSON.stringify(folder)}; o.click(); return 'ok'})()`));
await sleep(500);
console.log('save', await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Save'); if(!b) return 'no Save button'; b.click(); return 'clicked'})()`));
await sleep(3000);
// Re-read the item: an edit right after an add can land on the wrong one, so check the name and folder.
await ev(`location.hash = '#/view-cipher?cipherId=${encodeURIComponent(cipher)}'; 1`); await sleep(2500);
console.log(await ev(`document.body.innerText.split('\\n').slice(0,4).join(' | ')`));
ws.close();
