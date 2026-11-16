import { urls } from './records.js';
import { tr } from '../i18n.js';

/** Render the existing answer shape using text nodes and clickable source links. */
export function renderPersonaAnswer(container, result) {
  const doc = container.ownerDocument;
  const body = doc.createElement('p');
  body.setAttribute('style', 'white-space: pre-wrap');
  body.textContent = String(result?.speech ?? result?.text ?? '').split(/\n\n(?:出典|Sources)(?=\n|$)/)[0];
  const sources = urls([...(result?.facts || []).flatMap(fact => fact.sources || []), ...(result?.voice?.sources || [])]).slice(0, 5);
  container.replaceChildren(body);
  if (result?.museumNote) {
    const aside = doc.createElement('aside');
    const note = doc.createElement('small');
    aside.setAttribute('aria-label', tr('資料館の注記（役の外）', 'Museum note (outside the role)'));
    note.textContent = tr('資料館の注記（役の外）: ', 'Museum note (outside the role): ') + result.museumNote.text;
    aside.append(note);
    container.append(aside);
  }
  if (!sources.length) return;
  const heading = doc.createElement('p');
  heading.textContent = tr('出典', 'Sources');
  const list = doc.createElement('ul');
  for (const [i, url] of sources.entries()) {
    const item = doc.createElement('li');
    const anchor = doc.createElement('a');
    anchor.textContent = tr(`出典 ${i + 1}`, `Source ${i + 1}`);
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    item.append(anchor);
    list.append(item);
  }
  container.append(heading, list);
}
