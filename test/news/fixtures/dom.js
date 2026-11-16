// Minimal offline document fixture. It does not simulate layout or claim browser coverage.
export class TestNode {
  constructor(tag, text = '') { this.tagName = tag; this.children = []; this.attrs = {}; this.events = {}; this._text = text; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(key, value) { this.events[key] = value; }
  append(...children) { for (const child of children) { this.children.push(child); child.parent = this; } }
  replaceChildren(...children) { this.children = []; this._text = ''; this.append(...children); }
  set textContent(value) { this._text = value; this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); }
  dispatch(type, value) { if (value !== undefined) this.value = value; return this.events[type]?.({ target: this }); }
}
export function documentFixture() {
  const head = new TestNode('head');
  return { head, createElement: tag => new TestNode(tag), createTextNode: text => new TestNode('#text', text),
    querySelectorAll: () => head.children.filter(n => n.tagName === 'link') };
}
export function findAll(root, predicate) { return [root, ...root.children.flatMap(c => findAll(c, () => true))].filter(predicate); }
