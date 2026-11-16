import assert from 'node:assert/strict';
import { mountNavigation, tick } from '../app/navigation-fixture.js';

export async function entranceCases(t, english) {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const ui = await mountNavigation(t, { restGate: gate, prepare(records) {
    const original = records['catalog-core'].tools[0];
    const chatgpt = { ...original, id: 'chatgpt', name: 'ChatGPT', versions: original.versions.map((version, i) => ({ ...version,
      id: i ? 'chatgpt-2023-03' : 'chatgpt-2022-11', defaultModel: i ? 'fixture-model' : null })) };
    const claude = { ...original, id: 'claude.ai', name: 'Claude', versions: [{ ...original.versions[0], id: 'claude.ai-2023-07', from: '2023-07-11' }] };
    const code = { ...original, id: 'claude-code', name: 'Claude Code', versions: [{ ...original.versions[0], id: 'claude-code-2025-02', from: '2025-02-24' }] };
    const exhibits = [chatgpt, claude, code];
    const era = records.era['fixture-2022'];
    records.era = Object.fromEntries(exhibits.flatMap(tool => tool.versions.map(version => [version.id,
      { ...era, tool_id: tool.id, id: version.id, desktop: { ...era.desktop, date_shown: version.from } }])));
    records.models[0].successor = 'fixture-next';
    records.models.push({ ...records.models[0], id: 'fixture-next', name: 'Next model', release: '2025-01-01', successor: null });
    records.featured = { schema: 'memento.featured.v1', catalog: { tools: exhibits }, models: records.models,
      closed: [], era: records.era, manifest: records.manifest };
    records['catalog-core'] = { tools: [...exhibits, { ...original, id: 'other', name: 'Other tool' }] };
  } });
  t.after(async () => { release(); await ui.museum.loadAll(); await ui.museum.finishStream(); });
  const { doc, museum, panel } = ui;
  const timeline = () => doc.querySelector('#memento-timeline');
  const control = name => timeline().querySelector(`[data-entrance-control="${name}"]`);

  assert.equal(museum.state.tool.id, 'chatgpt');
  assert.equal(museum.state.version.id, 'chatgpt-2022-11');
  assert.equal(museum.state.model, null, 'do not substitute a March 2023 API snapshot for the preview');
  assert.equal(doc.querySelectorAll('dialog[open]').length, 0);
  assert.ok(doc.querySelector('#memento-entrance-note button'));
  assert.equal(ui.requests.includes('catalog-core'), false);
  assert.deepEqual(timeline().querySelectorAll('[data-featured-tool]').map(node => node.dataset.featuredTool), ['chatgpt', 'claude.ai', 'claude-code']);
  assert.equal(control('previous').disabled, true);
  assert.match(timeline().textContent, /2022/);
  assert.equal(timeline().closest('.surface'), null);
  const releaseAnswer = museum.answer(english ? 'When were you released?' : 'いつ公開されましたか？');
  assert.equal(releaseAnswer.kind, 'self_release');
  assert.match(releaseAnswer.text, /2022-11-30/);
  assert.ok(releaseAnswer.facts.some(fact => fact.sources.includes('https://openai.com/index/chatgpt/')));

  // Keep the large responses pending; the featured controls and answers still work.
  ui.idle(); await tick();
  assert.ok(ui.requests.includes('catalog-core'));
  control('next').click(); await tick();
  assert.equal(museum.state.version.id, 'chatgpt-2023-03');
  assert.equal(doc.activeElement, control('range'), 'timeline navigation keeps focus outside the historical composer');
  assert.equal(control('next').disabled, true);
  // 版を移っても挨拶は出さない（その時代の空の画面を見せる。2026-11-16 監査）
  assert.equal(museum.state.messages.length, 0);
  ui.key('ArrowLeft', { target: doc.activeElement }); await tick();
  assert.equal(museum.state.version.id, 'chatgpt-2022-11');
  const input = doc.querySelector('#app textarea');
  ui.key('ArrowRight', { target: input });
  ui.key('ArrowRight', { isComposing: true });
  ui.key('ArrowRight', { metaKey: true });
  await tick(); assert.equal(museum.state.version.id, 'chatgpt-2022-11');
  const range = control('range'); range.value = '1'; range.dispatch('input');
  assert.equal(museum.state.version.id, 'chatgpt-2022-11', 'drag preview does not interrupt pointer capture with a transition');
  assert.match(timeline().querySelector('time').textContent, /2023/);
  range.dispatch('change'); await tick();
  assert.equal(museum.state.version.id, 'chatgpt-2023-03');
  control('year-2022').click(); await tick();
  control('range').dispatch('keydown', { key: 'End' }); await tick();
  assert.equal(museum.state.version.id, 'chatgpt-2023-03');
  control('range').dispatch('keydown', { key: 'Home' }); await tick();
  assert.equal(museum.state.version.id, 'chatgpt-2022-11');
  timeline().querySelector('[data-featured-tool="claude.ai"]').click(); await tick();
  assert.equal(museum.state.tool.id, 'claude.ai');
  timeline().querySelector('[data-featured-tool="claude-code"]').click(); await tick();
  assert.equal(museum.state.tool.id, 'claude-code');

  const questions = doc.querySelector('.memento-questions');
  const composer = doc.querySelector('.composer');
  assert.equal(questions.parentNode, composer.parentNode);
  assert.equal(questions.parentNode.children.indexOf(questions) + 1, composer.parentNode.children.indexOf(composer));
  assert.match(questions.textContent, english ? /Ask this model about its own history/ : /このモデルに、自分の歴史を聞く/);
  assert.equal(questions.querySelectorAll('button').length, 3);
  const kinds = ['self_release', 'self_successor', 'self_prompt'];
  for (const [index, chip] of questions.querySelectorAll('button').entries()) {
    chip.click(); await tick();
    await museum.finishStream();
    assert.equal(museum.state.messages.at(-2).content, chip.textContent);
    assert.equal(museum.state.messages.at(-1).kind, kinds[index]);
  }
  await museum.send(english ? 'What is your successor?' : '後継モデルは何ですか？');
  await museum.finishStream();
  assert.ok(doc.querySelector('.answer-text aside small'), 'museum notes render outside role speech');
  assert.ok(doc.querySelector('.answer-text a'));
  await museum.send(english ? 'What is my secret password?' : '私の秘密のパスワードは？');
  await museum.finishStream();
  assert.equal(ui.requests.includes('relay'), false, 'relayAllowed:false is honored');

  doc.querySelector('#memento-entrance-note button').click();
  assert.equal(ui.saved.get('museum.entrance-notice-v1'), 'true');
  control('more').click();
  assert.equal(panel.open, true);
  assert.equal(panel.querySelector('.chrome-more-menu').open, true);
  for (const id of ['world', 'news', 'guides', 'combine', 'tools']) assert.ok(panel.querySelector(`[data-nav-id="${id}"]`).closest('.chrome-more-menu'));
  await museum.open('memento-about');
  const correction = panel.querySelectorAll('a').find(node => node.getAttribute('href')?.includes('template=correction.yml'));
  assert.ok(correction);
  release(); await museum.loadAll();
  assert.ok(museum.tools.some(tool => tool.id === 'other'));
  assert.equal(museum.state.tool.id, 'claude-code', 'background load preserves the user’s selection');
}
