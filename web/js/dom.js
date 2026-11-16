export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'value') node.value = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child != null && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}
export const button = (text, onclick, attrs = {}) => el('button', { type: 'button', onclick, ...attrs }, text);
export const link = (text, url) => {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return el('span', {}, text);
    return el('a', { href: parsed.href, target: '_blank', rel: 'noopener noreferrer' }, text);
  } catch { return el('span', {}, text); }
};
export function safeLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(`museum.${key}`)) ?? fallback; } catch { return fallback; }
}
export function safeSave(key, value) {
  try { localStorage.setItem(`museum.${key}`, JSON.stringify(value)); return true; } catch { return false; }
}
