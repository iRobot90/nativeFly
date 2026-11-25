// Run after `npx expo export --platform web`.
const assert = require('node:assert/strict');
const { createPreview } = require('./preview-web.cjs');

const titles = [
  ['harbour-lights', 'Harbour Lights'],
  ['midnight-matatu', 'Midnight Matatu'],
  ['paper-satellites', 'Paper Satellites'],
  ['one-more-trail', 'One More Trail'],
  ['the-blue-reel', 'The Blue Reel'],
];

async function check() {
  const server = await createPreview('dist');
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    async function read(path) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 200, path);
      return response.text();
    }
    const home = await read('/');
    assert.match(home, /Browse all movies/);
    assert.match(home, /href="\/movie\/harbour-lights"/);
    assert.doesNotMatch(home, /Step 1: Try it/);
    const explore = await read('/explore');
    for (const [id, title] of titles) {
      assert.ok(explore.includes('href="/movie/' + id + '"'));
      const html = await read('/movie/' + id);
      assert.ok(html.includes(title));
      assert.match(html, /Back to movie search/);
    }
    assert.equal((await fetch(origin + '/movie/missing')).status, 404);
    console.log('Verified Home, Explore, five direct movie details, and unavailable detail with the Expo localhost export.');
  } finally {
    server.close();
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
