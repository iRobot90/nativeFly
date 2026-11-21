'use strict';
const {before,after,test} = require('node:test');
const assert = require('node:assert/strict');
const {mkdtemp,writeFile,mkdir,rm} = require('node:fs/promises');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const {createPreview} = require('./preview-web.cjs');

let temp, server, origin;
before(async () => {
  temp = await mkdtemp(join(tmpdir(),'nativefly-preview-fixture-'));
  await mkdir(join(temp,'assets'));
  for (const [name,body] of [
    ['index.html','Home'],['explore.html','Explore'],['modal.html','Modal'],
    ['assets/app.js','export {};'],['.local-test','synthetic'],
  ]) await writeFile(join(temp,name),body,'utf8');
  server = await createPreview(temp);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve,reject) => server.close(error=>error?reject(error):resolve()));
  if (temp) await rm(temp,{recursive:true,force:true});
});

test('serves the root export as HTML', async () => {
  const response=await fetch(origin+'/');
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/^text\/html/);
  assert.equal(await response.text(),'Home');
});
test('direct clean URLs and trailing slash read the correct output', async () => {
  for (const [path,text] of [['/explore','Explore'],['/modal/','Modal']]) {
    const response=await fetch(origin+path);
    assert.equal(response.status,200);
    assert.equal(await response.text(),text);
  }
});
test('existing assets work and unknown routes remain 404', async () => {
  const js = await fetch(origin+'/assets/app.js');
  assert.match(js.headers.get('content-type'),/^text\/javascript/);
  assert.equal(await js.text(),'export {};');
  assert.equal((await fetch(origin+'/no-route')).status,404);
});
test('serves HEAD and rejects non-read methods without mutation', async () => {
  const head=await fetch(origin+'/explore',{method:'HEAD'});
  assert.equal(head.status,200);
  assert.equal(await head.text(),'');
  const post=await fetch(origin+'/explore',{method:'POST'});
  assert.equal(post.status,405);
  assert.equal(post.headers.get('allow'),'GET, HEAD');
});
test('does not expose dotfiles or accept malformed URL text', async () => {
  assert.equal((await fetch(origin+'/.local-test')).status,404);
  assert.equal((await fetch(origin+'/%xy')).status,400);
});
