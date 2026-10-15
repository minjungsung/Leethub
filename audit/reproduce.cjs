/* Offline behavioral probes for the audited source; no real tokens or API writes. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const results = [];
const quiet = { log() {}, info() {}, warn() {}, error() {} };
const pause = () => new Promise(resolve => setTimeout(resolve, 25));

function load(relative, mocks = {}, globals = {}) {
  const filename = path.join(root, relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  const localRequire = id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.ts')), mocks, globals);
    return require(id);
  };
  vm.runInNewContext(source, { module, exports: module.exports, require: localRequire,
    console: quiet, URL, Blob, btoa, setTimeout, clearTimeout, ...globals }, { filename: relative });
  return module.exports;
}

async function probe(name, fn) {
  try { await fn(); results.push({ name, reproduced: true }); }
  catch (error) { results.push({ name, reproduced: false, error: error.message }); }
}

const freshStats = () => ({ version: '1.0.4', branches: { 'example/solutions': 'main' }, submission: {}, problems: {} });
const sample = { title: 'Two Sum', description: 'Find two numbers.', constraints: [],
  codeSnippet: 'return [0, 1];', language: 'javascript', link: 'https://leetcode.com/problems/two-sum/' };

async function main() {
  await probe('Parser uploads statement code instead of the editor solution', async () => {
    const dom = new JSDOM('<title>Two Sum - LeetCode</title><pre><code>nums = [2,7,11,15]</code></pre><div class="monaco-editor"><div class="view-lines">return [0, 1];</div></div>');
    const { parseData } = load('src/scripts/leetcode/parsing.ts', {}, { document: dom.window.document });
    const data = await parseData();
    assert.equal(data.codeSnippet, 'nums = [2,7,11,15]');
    assert.equal(data.language, '');
    dom.window.close();
  });

  await probe('Missing code produces an empty solution without validation', async () => {
    const dom = new JSDOM('<title>Two Sum - LeetCode</title><div class="monaco-editor">solution</div>');
    const { parseData } = load('src/scripts/leetcode/parsing.ts', {}, { document: dom.window.document });
    assert.equal((await parseData()).codeSnippet, '');
    dom.window.close();
  });

  async function uploadScenario(language, failPatch = false) {
    const stats = freshStats();
    const calls = [];
    const fetch = async (url, init = {}) => {
      calls.push({ url, ...init });
      let data = { sha: 'blob-sha' };
      if (url.includes('/git/refs/heads/')) data = { object: { sha: 'parent-sha' }, ref: 'refs/heads/main' };
      if (init.method === 'PATCH') data = failPatch ? { message: 'Bad credentials' } : { object: { sha: 'commit-sha' } };
      return { ok: !(failPatch && init.method === 'PATCH'), status: failPatch && init.method === 'PATCH' ? 401 : 200, json: async () => data };
    };
    let saved = false, callback = false;
    const storage = { getToken: async () => 'fixture-token', getHook: async () => 'example/solutions',
      getStats: async () => stats, saveStats: async () => { saved = true; },
      updateObjectDatafromPath: (obj, key, value) => { obj[key] = value; } };
    const uploader = load('src/scripts/leetcode/uploadfunctions.ts', { '../storage': storage }, { fetch });
    await uploader.uploadOneSolveProblemOnGit({ ...sample, language }, () => { callback = true; });
    return { calls, stats, saved, callback };
  }

  await probe('GitHub 401 on branch update still saves stats and signals success', async () => {
    const result = await uploadScenario('javascript', true);
    assert.equal(result.saved, true);
    assert.equal(result.callback, true);
  });
  await probe('Branch update requests force=true', async () => {
    const result = await uploadScenario('javascript');
    assert.equal(JSON.parse(result.calls.find(x => x.method === 'PATCH').body).force, true);
  });
  await probe('Successful upload does not update problem statistics', async () => {
    const result = await uploadScenario('javascript');
    assert.deepEqual(result.stats.problems, {});
    assert.equal(result.callback, true);
  });
  await probe('C++ display language maps to Solution.txt', async () => {
    const result = await uploadScenario('C++');
    const tree = JSON.parse(result.calls.find(x => x.url.endsWith('/git/trees')).body).tree;
    assert.equal(tree[0].path, 'LeetCode/Two-Sum/Solution.txt');
  });

  async function observerScenario(enabled, changedText = false) {
    const dom = new JSDOM('<body><div data-e2e-locator="submission-result">Pending</div></body>', { url: sample.link });
    let observer, config, uploaded = 0, parsed = 0;
    let currentEnabled = enabled;
    const requestedPaths = [];
    const storage = { getIsEnabled: async () => currentEnabled, getHook: async () => 'example/solutions',
      getStats: async () => freshStats(), getStatsSHAfromPath: async key => { requestedPaths.push(key); return null; },
      updateLocalStorageStats: async () => freshStats(), saveStats: async () => {} };
    class Observer { constructor(fn) { observer = fn; } observe(node, options) { config = options; } disconnect() {} }
    load('src/scripts/leetcode/programmers.ts', {
      '../storage': storage, '../util': { getVersion: () => '1.0.4' },
      './parsing': { parseData: async () => { parsed++; return sample; } },
      './uploadfunctions': { uploadOneSolveProblemOnGit: async () => { uploaded++; } },
      './util': { isNotEmpty: () => true, startUpload() {}, markUploadedCSS() {} }
    }, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
      MutationObserver: Observer, chrome: { runtime: { id: 'fixture-extension' } } });
    await pause();
    currentEnabled = false;
    if (observer) {
      if (changedText) {
        observer([{ type: 'childList', addedNodes: [dom.window.document.createTextNode('Accepted')] }], {});
      } else {
        const node = dom.window.document.createElement('div');
        node.className = 'text-success'; node.textContent = 'Accepted';
        observer([{ type: 'childList', addedNodes: [node] }], {});
        await pause();
        observer([{ type: 'childList', addedNodes: [node] }], {});
      }
      await pause();
    }
    dom.window.close();
    return { config, uploaded, parsed, requestedPaths };
  }

  await probe('Turning off auto upload does not stop an existing page observer', async () => {
    const result = await observerScenario(true);
    assert.equal(result.uploaded, 2);
  });
  await probe('Accepted text-node replacement is missed by the observer', async () => {
    const result = await observerScenario(true, true);
    assert.equal(result.uploaded, 0);
    assert.equal(result.config.characterData, undefined);
  });
  await probe('Deduplication queries a different path than the upload writes', async () => {
    const result = await observerScenario(true);
    assert.ok(result.requestedPaths.includes('example/solutions/Two Sum.javascript'));
    assert.equal(result.uploaded, 2);
  });
  await probe('Enabling auto upload does not create an observer on an already open page', async () => {
    const result = await observerScenario(false);
    assert.equal(result.config, undefined);
  });

  await probe('Existing local authentication is overwritten during legacy sync migration', async () => {
    const data = { leethub_token: 'existing-fixture-token', leethub_hook: 'example/solutions', stats: freshStats() };
    const chrome = { runtime: { id: 'fixture-extension', getManifest: () => ({ version: '1.0.4' }) }, storage: {
      local: { get: (key, callback) => callback({ [key]: data[key] }), set: (values, callback) => { Object.assign(data, values); callback?.(); } },
      sync: { get: (key, callback) => setTimeout(() => callback({}), 5) }
    } };
    load('src/scripts/storage.ts', {}, { chrome });
    await pause();
    assert.equal(data.leethub_token, undefined);
    assert.equal(data.leethub_hook, undefined);
    assert.equal(data.isSync, true);
  });

  await probe('Manifest omits GitHub API host access', async () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.json')));
    assert.equal(manifest.host_permissions.some(x => x.includes('api.github.com') || x.includes('*.github.com') || x === '<all_urls>'), false);
  });

  await probe('Repository creation response handler throws because jQuery is not imported', async () => {
    const { StatusCode } = load('src/constants/StatusCode.ts', {}, {
      chrome: { storage: { local: { set: (data, callback) => callback?.() } } }
    });
    assert.throws(() => StatusCode({ html_url: 'https://github.com/example/solutions', full_name: 'example/solutions' }, 201, 'solutions'), /\$ is not defined/);
  });

  await probe('Popup repository URL resolves inside the extension instead of GitHub', async () => {
    const source = fs.readFileSync(path.join(root, 'src/components/Popup.tsx'), 'utf8');
    assert.ok(source.includes('setLeethubHook(leethub_hook)'));
    assert.ok(source.includes("href={leethubHook || '#'}"));
    const resolved = new URL('example/solutions', 'chrome-extension://fixture-extension/index.html').href;
    assert.equal(resolved, 'chrome-extension://fixture-extension/example/solutions');
  });

  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ source: '500882ea00bc532e52f282308003d88552754082',
    environment: { node: process.version, mode: 'Offline mocks and synthetic DOM; not live browser E2E' }, results }, null, 2) + '\n');
  for (const result of results) process.stdout.write(`${result.reproduced ? 'REPRODUCED' : 'UNCONFIRMED'}: ${result.name}\n`);
  if (results.some(x => !x.reproduced)) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
