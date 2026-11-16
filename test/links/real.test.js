import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildOllamaIdMap } from '../../lib/links/ollama.js';
import { findModelSpaces, hfModelId, realModelLinks, realUseLinks } from '../../lib/links/real.js';

const model = { r: 'hf', id: 'Qwen/Qwen2.5-7B-Instruct', url: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct' };

test('world and legacy model forms produce sourced files-page links and text-only commands', () => {
  const links = realUseLinks(model);
  assert.equal(links.find(row => row.kind === 'download').url, model.url + '/tree/main');
  assert.equal(links.find(row => row.kind === 'local-command').command, 'ollama run qwen2.5:7b-instruct');
  assert.ok(links.every(row => row.label && row.sources.length));
  assert.equal(links.find(row => row.kind === 'local-search').searchUrl, null);
  assert.equal(links.find(row => row.kind === 'local-search').searchText, model.url);
  assert.equal(hfModelId({ real_model: { id: model.id } }), model.id);
  assert.equal(hfModelId({ real_model: model.id }), model.id);
  assert.equal(hfModelId({ id: 'unrelated', url: model.url }), model.id);
  assert.equal(hfModelId({ r: 'hf', id: '../secret' }), null);
  assert.ok(!realUseLinks({ ...model, id: 'Qwen/Qwen2.5-7B', url: 'https://huggingface.co/Qwen/Qwen2.5-7B' }).some(row => row.command));
  assert.ok(!realUseLinks({ id: 'qwen2.5; rm -rf /', r: 'ollama' }).some(row => row.command));
  assert.equal(realUseLinks({ r: 'ollama', id: 'llama3.1', url: 'https://ollama.com/library/llama3.1' })
    .find(row => row.command).command, 'ollama run llama3.1');
});

test('Ollama map refuses unsourced, duplicate, and shell-like ids', () => {
  assert.throws(() => buildOllamaIdMap([{ hfId: model.id, ollamaId: 'guess', sources: [] }]));
  assert.throws(() => buildOllamaIdMap([{ hfId: model.id, ollamaId: 'qwen;whoami', sources: [] }]));
});

test('official API and optional playground come from exact provider metadata', () => {
  const providers = [{ id: 'example', name: '提供元', kind: 'openai-compatible', baseUrl: 'https://api.example.org/v1',
    sources: ['https://example.org/docs'], playgroundUrl: 'https://example.org/play', models: [{ id: 'model-1' }] }];
  const links = realUseLinks({ id: 'example:model-1' }, { providers });
  assert.equal(links.find(row => row.kind === 'official-api').url, providers[0].sources[0]);
  assert.equal(links.find(row => row.kind === 'playground').url, providers[0].playgroundUrl);
  assert.equal(links[0].modelAvailability, 'unverified');
  assert.deepEqual(realUseLinks({ id: 'example:retired' }, { providers }), []);
  assert.deepEqual(realUseLinks({ id: 'model-1', provider: 'different' }, { providers }), []);
  assert.equal(realUseLinks({ r: 'api', id: 'example/model-1', a: 'example' }, { providers })
    .find(row => row.kind === 'official-api').url, providers[0].sources[0]);
});

test('Spaces API filters exact model, running/sleeping, sorts likes, keeps SDK/hardware and facts only', async () => {
  const spaces = JSON.parse(await readFile(new URL('./fixtures/spaces.json', import.meta.url)));
  const calls = [];
  const result = await findModelSpaces(model.id, { fetch: async url => {
    calls.push(url);
    return new Response(JSON.stringify(spaces));
  } });
  assert.equal(new URL(calls[0]).searchParams.get('models'), model.id);
  assert.equal(new URL(calls[0]).searchParams.get('sort'), 'likes');
  assert.deepEqual(result.items.map(row => row.id), ['demo/sleeping', 'demo/running']);
  assert.equal(result.items[0].hardware, null);
  assert.equal(result.items[0].sdk, 'docker');
  assert.equal(result.items[1].hardware, 't4-small');
  assert.ok(result.items.every(row => row.sources.includes(calls[0])));
  assert.equal(result.complete, true);
});

test('Spaces paginate when high-liked results are stopped and never follow an arbitrary next URL', async () => {
  let calls = 0;
  const result = await findModelSpaces(model.id, { requestJson: async url => {
    calls++;
    if (calls === 1) return { data: [{ id: 'demo/stopped', models: [model.id], runtime: { stage: 'PAUSED' } }],
      next: url + '&cursor=second' };
    return { data: [{ id: 'demo/live', models: [model.id], likes: 2, sdk: 'gradio', runtime: { stage: 'RUNNING' } }],
      next: 'https://private.example.org/api/spaces?models=x' };
  } });
  assert.equal(calls, 2);
  assert.equal(result.items[0].id, 'demo/live');
});

test('failed or disabled Spaces discovery is explicit and preserves usable links', async () => {
  const result = await realModelLinks(model, { fetch: async () => { throw new Error('offline'); } });
  assert.equal(result.spacesStatus, 'unverified');
  assert.ok(result.links.some(row => row.kind === 'download'));
  assert.equal((await realModelLinks(model, { spaces: false })).spacesStatus, 'not-checked');
});
