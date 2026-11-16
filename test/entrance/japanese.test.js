import test from 'node:test';
globalThis.__MEMENTO_LANG = 'ja';
const { entranceCases } = await import('./cases.js');
test('entrance, timeline, questions, persona hooks and background records in Japanese', t => entranceCases(t, false));
