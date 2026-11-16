// A small DOM fixture for event/state tests only. It does not measure browser layout.
export class Element {
  constructor(tag = '', text = '') {
    this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.events = new Map(); this._text = text;
    this.className = ''; this.value = '';
    const properties = new Map();
    this.style = { setProperty(key, value) { properties.set(key, value); }, removeProperty(key) { properties.delete(key); }, getPropertyValue(key) { return properties.get(key) || ''; } };
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      toggle: (name, force) => {
        const enabled = force ?? !this.classList.contains(name);
        this.className = this.className.split(/\s+/).filter(value => value && value !== name).concat(enabled ? [name] : []).join(' ');
        return enabled;
      }
    };
    this.dataset = new Proxy({}, {
      set: (_, key, value) => { this.setAttribute('data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value); return true; },
      get: (_, key) => this.getAttribute('data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()))
    });
  }
  setAttribute(key, value) { this.attrs[key] = String(value); if (['hidden', 'open', 'disabled', 'checked'].includes(key)) this[key] = true; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  hasAttribute(key) { return this.getAttribute(key) !== null; }
  append(...nodes) { for (const value of nodes) { const node = value instanceof Element ? value : new Element('', String(value)); node.remove(); node.parentNode = this; this.children.push(node); } }
  prepend(...nodes) { for (const node of [...nodes].reverse()) { node.remove(); node.parentNode = this; this.children.unshift(node); } }
  before(node) { if (!this.parentNode) return; this.parentNode.insertBefore(node, this); }
  insertBefore(node, reference) { node.remove(); node.parentNode = this; this.children.splice(this.children.indexOf(reference), 0, node); }
  after(node) { if (!this.parentNode) return; node.remove(); node.parentNode = this.parentNode; this.parentNode.children.splice(this.parentNode.children.indexOf(this) + 1, 0, node); }
  replaceChildren(...nodes) { for (const node of this.children) node.parentNode = null; this.children = []; this._text = ''; this.append(...nodes); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(node => node !== this); this.parentNode = null; }
  addEventListener(type, handler, capture) { const list = this.events.get(type) || []; list.push({ handler, capture }); this.events.set(type, list); }
  removeEventListener(type, handler) { this.events.set(type, (this.events.get(type) || []).filter(item => item.handler !== handler)); }
  dispatch(type, props = {}) {
    const event = { target: this, preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...props };
    const path = [];
    for (let node = this; node; node = node.parentNode) path.push(node);
    for (const capture of [true, false]) {
      for (const node of capture ? [...path].reverse() : path) {
        event.currentTarget = node;
        for (const entry of node.events.get(type) || []) {
          if (Boolean(entry.capture) !== capture) continue;
          entry.handler(event);
          if (event.stopped) return event;
        }
      }
    }
    return event;
  }
  matches(selector) {
    for (const attr of selector.matchAll(/\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]/g)) {
      if (!this.hasAttribute(attr[1]) || attr[2] !== undefined && this.getAttribute(attr[1]) !== attr[2]) return false;
    }
    const clean = selector.replace(/\[[^\]]+\]/g, '');
    const tag = /^[a-zA-Z]+/.exec(clean);
    return (!tag || this.tagName === tag[0].toUpperCase()) && [...clean.matchAll(/\.([\w-]+)/g)].every(match => this.classList.contains(match[1]));
  }
  querySelectorAll(selector) {
    const choices = selector.split(',').map(part => part.trim().split(/\s+/));
    return this.children.flatMap(node => [node, ...node.querySelectorAll('*')]).filter(node => choices.some(parts => {
      if (!node.matches(parts.at(-1))) return false;
      let parent = node.parentNode;
      for (let i = parts.length - 2; i >= 0; i--) {
        while (parent && !parent.matches(parts[i])) parent = parent.parentNode;
        if (!parent) return false;
        parent = parent.parentNode;
      }
      return true;
    }));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { for (let node = this; node; node = node.parentNode) if (node.matches(selector)) return node; return null; }
  focus() { document.activeElement = this; }
  click() { return this.dispatch('click'); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  set textContent(value) { this._text = String(value); this.replaceChildren(); this._text = String(value); }
  get textContent() { return this._text + this.children.map(node => node.textContent).join(''); }
}
export function installDOM(t) {
  const previous = { Node: globalThis.Node, document: globalThis.document };
  globalThis.Node = Element;
  globalThis.document = { createElement: tag => new Element(tag), createTextNode: text => new Element('', String(text)), activeElement: null };
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });
  return tag => document.createElement(tag);
}
export const testEra = (where = 'top-dropdown') => ({
  id: 'example-2023', tool_id: 'example', desktop: { os: 'browser', app_shell: 'browser', date_shown: '2023-03-14', sources: [{ url: 'https://example.com/desktop' }] },
  model_switch: { where, label: where === 'cli-flag' ? '--model' : 'モデル', options: ['Model A', 'Model B'], default: 'Model A', steps: ['モデルを選ぶ。'], sources: [{ url: 'https://example.com/models' }] },
  accents: [], trend: '会話欄を中心にする（https://example.com/trend）。'
});
