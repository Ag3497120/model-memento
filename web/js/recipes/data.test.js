import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiUnavailable, clone, createPlanGate, draftErrors, helperHandoff, httpUrl, normalizeCatalog,
  recipeList, requestJson, screenToolId, suggestExamples
} from './data.js';

const recipe = {
  schema: 'memento.recipe.v1', id: 'demo', title: '試す組み合わせ', purpose: '計画して確認する',
  conductor: { harness: 'demo-app', model: 'demo-provider:model:9b' }, helpers: [], tools: ['files'],
  instructions: { style: 'guide', files: ['agents-md'] }, frontend: 'terminal'
};
const payload = {
  catalog: {
    harnesses: [{ id: 'demo-app', name: '試すアプリ' }],
    providers: [{ id: 'demo-provider', name: '試す提供元', models: [{ id: 'model:9b', label: '試すモデル' }], sources: ['https://example.com/models'] }],
    mcp: [{ id: 'files', name: 'ファイル' }], styles: [{ id: 'guide', name: '計画する' }]
  }, examples: [recipe]
};

test('static summaries and keyed server metadata preserve model ids and source URLs', () => {
  const catalog = normalizeCatalog(payload);
  assert.equal(catalog.models[0].id, 'demo-provider:model:9b');
  assert.deepEqual(catalog.models[0].sources, ['https://example.com/models']);
  assert.deepEqual(draftErrors(recipe, catalog), []);
  const server = normalizeCatalog({
    harnesses: { 'demo-app': { meta: payload.catalog.harnesses[0] } },
    providers: { 'demo-provider': { meta: payload.catalog.providers[0] } },
    mcp: { files: payload.catalog.mcp[0] }, styles: { guide: payload.catalog.styles[0] }
  }, [recipe]);
  assert.deepEqual(draftErrors(recipe, server), []);
});

test('missing or invented ids cannot pass the draft checks', () => {
  const catalog = normalizeCatalog(payload);
  for (const change of [
    value => { value.conductor.harness = 'invented-app'; },
    value => { value.conductor.model = 'demo-provider:invented-model'; },
    value => { value.tools = ['invented-tool']; },
    value => { value.instructions.style = 'invented-style'; },
    value => { value.instructions.files = ['invented-file']; },
    value => { value.frontend = 'skin:invented-app'; },
    value => { value.helpers = [{ role: 'invented-role', ...recipe.conductor }]; },
    value => { value.helpers = [{ role: 'reviewer', harness: 'unknown', model: recipe.conductor.model }]; }
  ]) {
    const changed = clone(recipe); change(changed);
    assert.ok(draftErrors(changed, catalog).length > 0);
  }
  assert.ok(draftErrors(recipe, normalizeCatalog({ ...payload.catalog, styles: [] }, [recipe])).some(error => error.includes('書き方')));
});

test('mixed helper handoffs use each role from the plan, retaining the tool and manual reason', () => {
  const reviewer = { ...recipe.conductor, role: 'reviewer' };
  const researcher = { ...recipe.conductor, role: 'researcher' };
  const coder = { ...recipe.conductor, role: 'coder' };
  const reason = 'この進行役では接続を使えません。https://example.com/connection';
  const plan = { harnesses: [
    { ...recipe.conductor, role: 'conductor' },
    { ...researcher, role: 'helper', helperRole: 'researcher', mcpServer: null, manualReason: reason },
    { ...reviewer, role: 'helper', helperRole: 'reviewer', mcpServer: { bridge: true, tool: 'ask_reviewer' } },
    { ...coder, role: 'helper', helperRole: 'coder', mcpServer: { delegates: true, id: 'helper-coder' } }
  ] };
  const bridge = helperHandoff(reviewer, plan);
  assert.equal(bridge.mode, 'bridge');
  assert.match(bridge.text, /中継/);
  assert.equal(bridge.tool, 'ask_reviewer');
  assert.equal(bridge.reason, null);
  const manual = helperHandoff(researcher, plan);
  assert.equal(manual.mode, 'manual');
  assert.match(manual.text, /手動/);
  assert.equal(manual.reason, reason);
  assert.equal(manual.tool, null);
  assert.equal(helperHandoff(coder, plan).mode, 'mcp');
});

test('static, old, missing and mismatched plans keep helper handoffs neutral', () => {
  const helper = { ...recipe.conductor, role: 'reviewer' };
  const actor = { ...helper, role: 'helper', helperRole: helper.role, mcpServer: { bridge: true, tool: 'ask_reviewer' } };
  for (const plan of [undefined, {}, { argv: [] }, { harnesses: [] }, { harnesses: [null] },
    { harnesses: [{ ...actor, mcpServer: undefined }] },
    { harnesses: [{ ...actor, role: 'conductor' }] },
    { harnesses: [{ ...actor, helperRole: 'researcher' }] },
    { harnesses: [{ ...actor, harness: 'different-app' }] },
    { harnesses: [{ ...actor, model: 'demo-provider:different-model' }] }
  ]) {
    const handoff = helperHandoff(helper, plan);
    assert.equal(handoff.mode, 'unknown');
    assert.match(handoff.text, /計画で手伝い役ごとに確認/);
    assert.doesNotMatch(handoff.text, /手動|未確認/);
    assert.equal(handoff.tool, null);
    assert.equal(handoff.reason, null);
  }
});

test('a write needs a preview and a separate confirmation and can be consumed only once', () => {
  const gate = createPlanGate();
  assert.throws(() => gate.consume(recipe));
  assert.equal(gate.ask(recipe), false);
  gate.preview(recipe);
  assert.throws(() => gate.consume(recipe));
  assert.equal(gate.ask(recipe), true);
  const body = gate.consume(recipe);
  assert.deepEqual(body, { recipe, confirm: true });
  assert.notEqual(body.recipe, recipe);
  assert.throws(() => gate.consume(recipe));
  assert.equal(gate.ask(recipe), false);
});

test('editing, cancelling, or invalidating a plan prevents a stale confirmation', () => {
  const gate = createPlanGate();
  const changed = clone(recipe); changed.tools = [];
  gate.preview(recipe);
  assert.equal(gate.ask(changed), false);
  assert.equal(gate.ask(recipe), true);
  assert.throws(() => gate.consume(changed));
  gate.cancel();
  assert.throws(() => gate.consume(recipe));
  assert.equal(gate.ask(recipe), true);
  gate.invalidate();
  assert.throws(() => gate.consume(recipe));
  assert.equal(gate.stage, 'empty');
});

test('static suggestions are three distinct, editable copies ranked by the wish', () => {
  const examples = [recipe, { ...recipe, id: 'local', title: '端末で動くモデル' },
    { ...recipe, id: 'review', title: '確認役に確認する' }, { ...recipe, id: 'research', title: '調査役が調べる' }];
  const suggestions = suggestExamples([...examples, recipe], '端末で動くモデル');
  assert.equal(suggestions.length, 3);
  assert.equal(new Set(suggestions.map(item => item.id)).size, 3);
  assert.equal(suggestions[0].id, 'local');
  suggestions[0].conductor.harness = 'edited';
  assert.equal(recipe.conductor.harness, 'demo-app');
  assert.deepEqual(recipeList({ recommendations: [{ recipe }] }), [recipe]);
  assert.deepEqual(recipeList({ recipes: [null, {}, recipe] }), [recipe]);
  assert.deepEqual(recipeList({ recipes: [{ ...recipe, instructions: {} }, { ...recipe, helpers: [null] }] }), []);
});

test('screen links resolve catalog ids, known local aliases and exact repositories only', () => {
  const tools = [{ id: 'openai-codex-cli' }, { id: 'repo-screen', repo: 'Owner/Project' }];
  assert.equal(screenToolId({ id: 'codex' }, tools), 'openai-codex-cli');
  assert.equal(screenToolId({ id: 'demo', repo: 'owner/project' }, tools), 'repo-screen');
  assert.equal(screenToolId({ id: 'unknown', repo: 'owner/different' }, tools), null);
  assert.equal(httpUrl('javascript:alert(1)'), null);
  assert.equal(httpUrl('data:image/png;base64,abc'), null);
  assert.equal(httpUrl('https://user:secret@example.com'), null);
  assert.equal(httpUrl(null), null);
  assert.equal(httpUrl('https://example.com/docs'), 'https://example.com/docs');
});

test('requests use same-origin JSON; missing routes and HTML are recognized as static hosting', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ plan: { files: [] } }), { headers: { 'content-type': 'application/json' } });
  };
  await requestJson('/api/recipes/plan', { body: { recipe }, fetcher });
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(calls[0].options.body), { recipe });
  assert.equal(Object.hasOwn(JSON.parse(calls[0].options.body), 'confirm'), false);
  await requestJson('/api/recipes/catalog', { fetcher });
  assert.equal(calls[1].options.method, 'GET');
  assert.equal(calls[1].options.body, undefined);
  for (const response of [new Response('', { status: 404 }), new Response('<html></html>', { headers: { 'content-type': 'text/html' } })]) {
    await assert.rejects(requestJson('/missing', { fetcher: async () => response }), ApiUnavailable);
  }
});

test('server, network, malformed JSON and timeout failures stay failures with Japanese messages', async () => {
  await assert.rejects(requestJson('/error', { fetcher: async () => new Response('', { status: 500 }) }), /処理できません/);
  await assert.rejects(requestJson('/error', { fetcher: async () => new Response('{"ok":false}') }), /処理できません/);
  await assert.rejects(requestJson('/error', { fetcher: async () => new Response('not-json') }), /読み取れません/);
  await assert.rejects(requestJson('/error', { fetcher: async () => { throw new TypeError('fetch failed'); } }), /接続できません/);
  const fetcher = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  await assert.rejects(requestJson('/slow', { fetcher, timeout: 5 }), /時間内/);
});
