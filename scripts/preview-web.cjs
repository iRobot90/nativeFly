#!/usr/bin/env node
'use strict';
// Development preview for Expo static output; deliberately binds only to localhost.
const {createServer} = require('node:http');
const {createReadStream} = require('node:fs');
const {realpath, stat} = require('node:fs/promises');
const {extname, resolve, sep} = require('node:path');

const types = new Map([
  ['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],
  ['.js','text/javascript; charset=utf-8'],['.json','application/json'],
  ['.svg','image/svg+xml'],['.png','image/png'],['.jpg','image/jpeg'],
  ['.jpeg','image/jpeg'],['.webp','image/webp'],['.ico','image/x-icon'],
  ['.ttf','font/ttf'],['.woff','font/woff'],['.woff2','font/woff2'],
  ['.map','application/json'],
]);
const host = '127.0.0.1';
const text = 'text/plain; charset=utf-8';

async function createPreview(directory) {
  const root = await realpath(resolve(directory));
  if (!(await stat(resolve(root,'index.html'))).isFile()) throw new Error('Expo export is missing index.html.');
  function inside(file) { return file.startsWith(root + sep); }
  async function locate(pathname) {
    const relative = pathname.replace(/^\/+/, '');
    if (relative.split('/').some(part => part.startsWith('.')) || relative.includes('\\')) return null;
    const clean = relative.replace(/\/+$/, '');
    const candidates = !clean ? ['index.html'] :
      pathname.endsWith('/') ? [clean + '/index.html', clean + '.html'] :
      extname(clean) ? [clean] : [clean, clean + '.html', clean + '/index.html'];
    for (const candidate of candidates) {
      try {
        const file = await realpath(resolve(root,candidate));
        if (!inside(file)) continue;
        const metadata = await stat(file);
        if (metadata.isFile()) return {file, bytes:metadata.size};
      } catch (err) {
        if (!['ENOENT','ENOTDIR','EACCES'].includes(err.code)) throw err;
      }
    }
    return null;
  }
  return createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-store');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405,{'Allow':'GET, HEAD','Content-Type':text}).end('Method not allowed');
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url,`http://${host}`).pathname); }
    catch { res.writeHead(400,{'Content-Type':text}).end('Bad request'); return; }
    try {
      const found = await locate(pathname);
      if (!found) { res.writeHead(404,{'Content-Type':text}).end('Not found'); return; }
      res.writeHead(200,{'Content-Type':types.get(extname(found.file)) || 'application/octet-stream',
                        'Content-Length':found.bytes});
      if (req.method === 'HEAD') { res.end(); return; }
      const stream = createReadStream(found.file);
      stream.once('error',()=>res.destroy());
      res.once('close',()=>stream.destroy());
      stream.pipe(res);
    } catch { res.writeHead(500,{'Content-Type':text}).end('Preview error'); }
  });
}

async function main() {
  const directory = process.argv[2] || 'dist';
  const port = Number(process.argv[3] ?? 4173);
  if (!Number.isSafeInteger(port) || port < 0 || port > 65535) throw new Error('Use a port from 0 to 65535.');
  const server = await createPreview(directory);
  await new Promise((ok,fail) => { server.once('error',fail); server.listen(port,host,ok); });
  console.log(`nativeFly static preview: http://${host}:${server.address().port}`);
}

module.exports = {createPreview};
if (require.main === module) main().catch(error => {
  console.error(`Could not start the preview: ${error.message} Run the Expo static export first.`);
  process.exitCode = 1;
});
