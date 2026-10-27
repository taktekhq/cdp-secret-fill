// Replace one Bitwarden login password from a file, printing nothing secret:
//   node bw-setpw.mjs BW_TARGET CIPHER_ID FILE   (then prints the saved length only)
import { readFileSync } from "node:fs";
const [bw, id, file] = process.argv.slice(2);
const pw = readFileSync(file, "utf8").replace(/\n$/, "");
const t = (await (await fetch("http://127.0.0.1:9222/json/list")).json()).find((x) => x.id === bw);
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let i = 0; const ev = (e) => new Promise((r) => { const n = ++i; ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id === n) r(d.result?.result?.value); }; ws.send(JSON.stringify({ id: n, method: "Runtime.evaluate", params: { expression: e, awaitPromise: true, returnByValue: true, userGesture: true } })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const edit = async () => { await ev(`location.hash = "#/tabs/vault"; 1`); await sleep(1500); await ev(`location.hash = "#/edit-cipher?cipherId=${id}&type=1"; 1`); await sleep(3000); };
await edit();
console.log("fill", await ev(`(()=>{const el=document.querySelector("[formcontrolname=password]"); if(!el) return "missing";
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el, ${JSON.stringify(pw)});
  el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); return "ok"})()`));
await sleep(500);
console.log("save", await ev(`(()=>{const b=[...document.querySelectorAll("button")].find(b=>b.innerText.trim()==="Save"); if(!b) return "no save"; b.click(); return "clicked"})()`));
await sleep(3000);
await edit();
const len = await ev(`(document.querySelector("[formcontrolname=password]")||{value:""}).value.length`);
const name = await ev(`(document.querySelector("[formcontrolname=name]")||{value:""}).value`);
console.log("saved", name, "length", len, len === pw.length ? "matches" : "DIFFERS");
await ev(`location.hash = "#/tabs/vault"; 1`);
ws.close();
