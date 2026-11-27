// Run after Expo web export. Pass a Chrome for Testing executable in CHROME_BIN.
// Set BASELINE=1 to measure the original behavior without passing the fix gate.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreview } from './preview-web.cjs';

assert.ok(process.env.CHROME_BIN, 'Set CHROME_BIN to a local Chrome executable.');
const baseline = process.env.BASELINE === '1';
const server = await createPreview(process.argv[2] ?? 'dist');
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'nativefly-browser-'));
const chrome = spawn(process.env.CHROME_BIN, [
    '--headless', '--no-sandbox', '--disable-dev-shm-usage',
    '--no-first-run', '--disable-background-networking',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let ws;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
    const address = await new Promise((resolve, reject) => {
        let output = '';
        const timer = setTimeout(() => reject(new Error('Chrome DevTools did not start.')), 15000);
        chrome.once('error', error => { clearTimeout(timer); reject(error); });
        chrome.once('exit', code => { clearTimeout(timer); reject(new Error('Chrome exited: ' + code + ' ' + output)); });
        chrome.stderr.on('data', chunk => {
            output += chunk;
            const match = output.match(/DevTools listening on ws:\/\/(127\.0\.0\.1:\d+)/);
            if (match) { clearTimeout(timer); resolve('http://' + match[1]); }
        });
    });
    const target = (await (await fetch(address + '/json/list')).json()).find(t => t.type === 'page');
    assert.ok(target);
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await once(ws, 'open');
    const pending = new Map();
    let id = 0;
    ws.addEventListener('message', ({ data }) => {
        const { id, result, error } = JSON.parse(data);
        const request = pending.get(id);
        if (!request) return;
        pending.delete(id);
        clearTimeout(request.timer);
        if (error) request.reject(new Error(error.message));
        else request.resolve(result);
    });
    const cdp = (method, params={}) => new Promise((resolve,reject) => {
        const request = ++id;
        const timer = setTimeout(() => {
            pending.delete(request);
            reject(new Error('DevTools timed out: ' + method));
        }, 10000);
        pending.set(request,{ resolve,reject,timer });
        ws.send(JSON.stringify({id:request,method,params}));
    });
    const evaluate = async expression => {
        const res = await cdp('Runtime.evaluate',{expression,returnByValue:true});
        if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
        return res.result.value;
    };
    const until = async (expression, expected=true) => {
        for (let i=0; i<100; i++) {
            try { if (await evaluate(expression) === expected) return; } catch {}
            await delay(100);
        }
        throw new Error('Timed out: ' + expression + ' ' + await evaluate('JSON.stringify({focus:document.activeElement?.outerHTML.slice(0,600),value:document.querySelector("input[aria-label]")?.value,copy:document.body?.innerText.slice(0,600)})'));
    };
    const key = async (key, code) => {
        const input={ key, code:key, windowsVirtualKeyCode:code, nativeVirtualKeyCode:code };
        await cdp('Input.dispatchKeyEvent',{type:'rawKeyDown',...input});
        await cdp('Input.dispatchKeyEvent',{type:'keyUp',...input});
    };
    const tabTo = async expression => {
        for (let i=0; i<30; i++) {
            if (await evaluate(expression)) return;
            await key('Tab',9);
        }
        throw new Error('Could not keyboard-focus: ' + expression);
    };
    const luminance = color => color.match(/\d+/g).slice(0,3).map(x=>Number(x)/255)
        .map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4)
        .reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
    async function measure(label, scheme) {
        const colors=await evaluate(`(() => {
            const anchor=[...document.querySelectorAll('a')].find(a=>a.textContent.trim()===${JSON.stringify(label)});
            if (!anchor) return null;
            const text=[...anchor.querySelectorAll('*')].find(el=>el.childElementCount===0&&el.textContent.trim()===${JSON.stringify(label)}) ?? anchor;
            const style=getComputedStyle(text);
            let background;
            for (let el=text; el; el=el.parentElement) {
                const bg=getComputedStyle(el).backgroundColor;
                if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {background=bg;break;}
            }
            return {foreground:style.color,background,decoration:style.textDecorationLine,size:style.fontSize};
        })()`);
        assert.ok(colors?.background,label);
        assert.equal(colors.background,scheme==='dark'?'rgb(21, 23, 24)':'rgb(255, 255, 255)');
        assert.equal(colors.size,'16px');
        const pair=[luminance(colors.foreground),luminance(colors.background)].sort((a,b)=>b-a);
        const ratio=(pair[0]+.05)/(pair[1]+.05);
        if (baseline && scheme==='dark') assert.ok(ratio<4.5, label);
        else assert.ok(ratio>=4.5,label+' at '+ratio);
        if (!baseline) assert.match(colors.decoration,/\bunderline\b/);
        console.log(scheme,label,colors.foreground,colors.background,ratio.toFixed(5)+':1');
    }
    const heading = text => `[...document.querySelectorAll('[role=heading],h1,h2')].some(el=>el.textContent.trim()===${JSON.stringify(text)})`;
    for (const scheme of ['light','dark']) {
        await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});
        await cdp('Page.navigate',{url:origin+'/'});
        await until(heading('nativeFly'));
        await until("document.readyState==='complete'");
        await until("([...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Browse all movies') && Object.keys([...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Browse all movies')).some(k=>k.startsWith('__reactProps')))");

        // Wait for the rendered theme, not just the light-mode static HTML.
        const background=scheme==='dark'?'rgb(21, 23, 24)':'rgb(255, 255, 255)';
        await until(`(() => {
            const a=[...document.querySelectorAll('a')].find(e=>e.textContent.trim()==='Browse all movies');
            for(let p=a;p;p=p.parentElement) if(getComputedStyle(p).backgroundColor===${JSON.stringify(background)}) return true;
            return false;
        })()`);
        await measure('Browse all movies',scheme);
        await tabTo("document.activeElement?.textContent.trim()==='Browse all movies'");
        await key('Enter',13);
        await until("location.pathname==='/explore'");
        await until("Object.keys(document.querySelector('input[aria-label]') ?? {}).some(k=>k.startsWith('__reactProps'))");

        await tabTo("document.activeElement?.getAttribute('aria-label')==='Search movies by title, genre or year'");
        await cdp('Input.insertText',{text:'Harbour'});
        await until("document.body.innerText.includes('1 movie found')");
        await measure('Details for Harbour Lights',scheme);
        await tabTo("document.activeElement?.textContent.trim()==='Details for Harbour Lights'");
        await key('Enter',13);
        await until("location.pathname==='/movie/harbour-lights'");
        await cdp('Page.reload',{ignoreCache:true});
        await until(heading('Harbour Lights'));
        await until(`(() => {
            const a=[...document.querySelectorAll('a')].find(e=>e.textContent.trim()==='Back to movie search');
            for(let p=a;p;p=p.parentElement) if(getComputedStyle(p).backgroundColor===${JSON.stringify(background)}) return true;
            return false;
        })()`);
        await measure('Back to movie search',scheme);
        await tabTo("document.activeElement?.textContent.trim()==='Back to movie search'");
        await key('Enter',13);
        await until("location.pathname==='/explore'");
    }
    assert.equal((await fetch(origin+'/movie/missing')).status,404);
    console.log('Keyboard browse/search/detail and return, hard reload, and missing movie 404 passed.');
} finally {
    ws?.close();
    chrome.kill();
    if (chrome.exitCode===null) await once(chrome,'exit').catch(()=>{});
    server.close();
    await rm(profile,{recursive:true,force:true});
}
