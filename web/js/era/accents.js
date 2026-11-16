import { tr, pick, num } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { activeAccents, sourceUrls } from './data.js';

export function usageThreshold(accent) {
  if (Number.isSafeInteger(accent.after_messages) && accent.after_messages > 0) return { count: accent.after_messages, verified: true };
  const text = `${accent.text} ${accent.where || ''}`;
  const match = /(?:1会話|１会話)\s*(\d+)\s*往復|(?:利用回数が|回数が)\s*(\d+)\s*以上/.exec(text);
  if (match) return { count: Number(match[1] || match[2]), verified: true };
  // The demo trigger is explicitly identified; it is not a historical quota.
  return { count: 5, verified: false };
}

export function accentSlotNames(accent) {
  const place = String(accent.where || '');
  // Publication-only evidence must stay in the frame's record notes.
  if (/unverified|未確認|告知|公式案内|README|リポジトリ|説明ページ|料金案内|証拠ではない/i.test(place)) return [];
  if (/入力欄|入力行/.test(place)) return ['input-left', 'input-right'];
  if (/左.*(?:欄|側|履歴)|sidebar/i.test(place)) return ['sidebar'];
  if (/上部|ヘッダー|header|モデル名の横/i.test(place)) return ['top'];
  if (/右.*欄|側面|side.panel/i.test(place)) return ['panel'];
  return [];
}

export function createAccentSession(storage) {
  const seen = new Set();
  return {
    has(key) { try { return seen.has(key) || storage?.getItem(`memento.era.${key}`) === '1'; } catch { return seen.has(key); } },
    mark(key) { seen.add(key); try { storage?.setItem(`memento.era.${key}`, '1'); } catch { /* Private browsing still has in-memory session state. */ } }
  };
}

export function accentCard(accent, { demo = false, threshold } = {}) {
  const card = el('aside', { class: `era-accent era-accent-${accent.kind}`, 'data-era-accent': accent.kind },
    el('span', { class: 'era-accent-text' }, pick(accent, 'text')),
    el('span', { class: 'era-accent-sources' }, sourceUrls(accent.sources).map(url => link(tr('出典', "Sources"), url))));
  if (demo) card.append(el('small', {}, tr('当時の案内の再現です。現在の混雑や利用量を示しません。', "Recreated historical notice. Current capacity and usage are unverified.")));
  if (threshold && !threshold.verified) card.append(el('small', {}, tr(`${threshold.count}回で案内するのは演出です。当時の回数・条件は未確認です。`, `Showing this after ${num(threshold.count)} messages is a visual effect. Historical counts and conditions are unverified.`)));
  if (accent.where) card.append(el('details', {}, el('summary', {}, tr('表示の記録', "Display records")), el('p', {}, pick(accent, 'where'))));
  return card;
}

export function mountAccents(root, { era, host, session, messageCount = 0, random = Math.random }) {
  const accents = activeAccents(era);
  const nodes = [];
  let count = messageCount;
  let gate = null;
  const key = accent => `${era.id}:${accent.kind}:${accent.text}`;
  const remember = (node, target = host) => { target.append(node); nodes.push(node); return node; };
  const dismissible = (accent, target = host, extra = {}) => {
    const card = accentCard(accent, { demo: true, ...extra });
    card.append(button(tr('閉じる', "Close"), () => card.remove(), { 'aria-label': tr('時代の案内を閉じる', "Close historical notice") }));
    return remember(card, target);
  };
  const admission = accents.filter(accent => accent.kind === 'waitlist' || (accent.kind === 'capacity' && !/\/tokens|会話の使用量/.test(accent.text)));
  const unseen = admission.filter(accent => !session.has(key(accent)));
  if (unseen.length) {
    gate = el('dialog', { class: 'era-interstitial', 'aria-label': tr('利用開始前の案内の再現', "Recreated pre-access notice") },
      el('h2', {}, tr('利用開始前の案内', "Before you start")), unseen.map(accent => accentCard(accent, { demo: true })),
      button(tr('案内を閉じて画面を開く', "Close notice and open screen"), () => { gate.close(); root.querySelector('[data-era-input]')?.focus(); }));
    for (const accent of unseen) session.mark(key(accent));
    remember(gate);
    gate.showModal();
  }
  const passive = accents.filter(accent => !admission.includes(accent) && !['usage-cap', 'error-message', 'update-notice', "what's-new"].includes(accent.kind));
  const badges = passive.filter(accent => ['beta-badge', 'deprecation-notice'].includes(accent.kind));
  for (const accent of badges) {
    const slot = accentSlotNames(accent).map(name => root.querySelector(`[data-era-slot="${name}"]`)).find(Boolean);
    const target = slot && !['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(slot.tagName) ? slot : host;
    remember(accentCard(accent), target);
  }
  const rest = passive.filter(accent => !badges.includes(accent));
  if (rest.length) remember(el('details', { class: 'era-accent-notes' }, el('summary', {}, tr('この時代の案内', "Notices from this era")), rest.map(accent => accentCard(accent))));
  return {
    beforeSend() {
      if (gate?.open) return true;
      count++;
      for (const accent of accents.filter(item => item.kind === 'usage-cap')) {
        const threshold = usageThreshold(accent);
        if (count < threshold.count || session.has(key(accent))) continue;
        session.mark(key(accent));
        const target = /設定画面|モデル選択一覧/.test(accent.where || '') ? host : root.querySelector('.thread') || host;
        dismissible(accent, target, { threshold });
      }
      // Errors are occasional, sourced annotations. They never consume a send.
      const errors = accents.filter(item => item.kind === 'error-message');
      if (count >= 3 && errors.length && random() < 1 / 40 && !session.has('send-error-shown')) {
        session.mark('send-error-shown');
        dismissible(errors[0], root.querySelector('.thread') || host);
      }
      return false;
    },
    dispose() { if (gate?.open) gate.close(); for (const node of nodes) node.remove(); }
  };
}
