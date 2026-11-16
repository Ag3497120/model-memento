import test from 'node:test';
globalThis.__MEMENTO_LANG = 'en';
const { entranceCases } = await import('./cases.js');
test('entrance, timeline, questions, persona hooks and background records in English', t => entranceCases(t, true));
