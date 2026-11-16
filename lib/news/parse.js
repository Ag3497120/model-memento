import { cleanText, canonicalUrl, newsId } from './schema.js';

const localName = name => name.toLowerCase().split(':').at(-1);
function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, key) => {
    if (key[0] !== '#') return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[key.toLowerCase()];
    const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : '';
  });
}
export const plainText = (value, max = 300) => cleanText(decode(String(value ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')), max);

/** Small bounded XML reader, not an HTML scraper. No DTDs, external entities or entity expansion. */
function xmlTree(xml) {
  const definitions = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, '');
  if (/<!\s*(DOCTYPE|ENTITY)\b/i.test(definitions)) throw new Error('XML の外部定義は読み込めません。');
  const root = { name: '#document', children: [], attrs: {}, text: '' };
  const stack = [root];
  const tokens = xml.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[\w:.-]+(?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+/g) || [];
  if (tokens.length > 150_000) throw new Error('項目が多すぎます。');
  for (const token of tokens) {
    if (token.startsWith('<!--') || token.startsWith('<?')) continue;
    if (token.startsWith('<![CDATA[')) { stack.at(-1).text += token.slice(9, -3); continue; }
    if (token.startsWith('</')) {
      const name = token.slice(2, -1).trim();
      if (stack.length < 2 || stack.at(-1).fullName !== name) throw new Error('XML の閉じ方が正しくありません。');
      stack.pop(); continue;
    }
    if (token.startsWith('<')) {
      const name = /^<([\w:.-]+)/.exec(token)?.[1];
      if (!name) throw new Error('XML を読み取れません。');
      const attrs = {};
      for (const m of token.slice(name.length + 1).matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[m[1]] = decode(m[2] ?? m[3]);
      const node = { name: localName(name), fullName: name, attrs, children: [], text: '', base: attrs['xml:base'] || stack.at(-1).base };
      if (attrs['xml:base'] && stack.at(-1).base) node.base = canonicalUrl(attrs['xml:base'], stack.at(-1).base) || attrs['xml:base'];
      stack.at(-1).children.push(node);
      if (!token.endsWith('/>')) stack.push(node);
      if (stack.length > 64) throw new Error('XML の入れ子が深すぎます。');
    } else { stack.at(-1).text += decode(token); }
  }
  if (stack.length !== 1 || root.children.length !== 1) throw new Error('XML が途中で終わっています。');
  return root.children[0];
}
const child = (node, names) => node.children.find(n => names.includes(n.name));
const nodeText = node => node ? node.text + node.children.map(nodeText).join(' ') : '';
const field = (node, names) => nodeText(child(node, names));
function isoDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  // Do not let Date.parse guess dates from bare version numbers or random words.
  if (!/\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(raw)) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
export function classify(title, fallback) {
  title = title.toLowerCase();
  if (/\b(policy|regulation|copyright|safety policy|terms of service)\b|規制|著作権/u.test(title)) return 'policy';
  if (/\b(prompt(?:ing)?|context engineering|instruction tuning|in-context|chain.of.thought|few.shot)\b|プロンプト|頼み方/u.test(title.toLowerCase())) return 'prompting';
  return fallback;
}
function normalize(raw, source) {
  const url = canonicalUrl(raw.url, raw.base || source.feedUrl || source.url);
  let title = plainText(raw.title);
  if (title && source.tags.includes('release') && source.entityNames[0] && !title.includes(source.entityNames[0])) title = cleanText(`${source.entityNames[0]} ${title}`);
  if (!url || !title) return null;
  if (source.filter?.titleIncludes?.length && !source.filter.titleIncludes.some(word => title.toLowerCase().includes(word.toLowerCase()))) return null;
  const date = isoDate(raw.date);
  const tags = [...new Set([...source.tags, ...(raw.tags || []).map(t => plainText(t).slice(0, 60)).filter(Boolean)])].slice(0, 16);
  return { schema: 'memento.news.v1', id: newsId(url), title, url,
    source: { id: source.id, name: source.name, url: source.url }, date,
    dateBasis: date ? raw.dateBasis || 'published' : 'unknown',
    kind: classify(title, source.kind), tags, lang: source.language };
}

export function parseFeed(text, source, { limit = 100 } = {}) {
  let raw;
  if (source.format === 'github-releases') {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('公開版の一覧が配列ではありません。');
    raw = data.filter(r => !r.draft && !r.prerelease).map(r => ({
      title: `${source.entityNames[0] || source.name} ${r.name || r.tag_name || ''}`,
      url: r.html_url, date: r.published_at, tags: ['release'],
    }));
  } else if (source.format === 'json-feed') {
    const data = JSON.parse(text);
    if (!/^https:\/\/jsonfeed.org\/version\//.test(data.version) || !Array.isArray(data.items)) throw new Error('JSON の配信形式が違います。');
    raw = data.items.map(r => ({ title: r.title, url: r.url || r.external_url, date: r.date_published, tags: Array.isArray(r.tags) ? r.tags : [] }));
  } else {
    const root = xmlTree(text);
    if (!['rss', 'rdf', 'feed'].includes(root.name)) throw new Error('RSS または Atom の配信ではありません。');
    const channel = root.name === 'rss' ? child(root, ['channel']) : root;
    if (!channel) throw new Error('RSS の一覧がありません。');
    const entries = channel.children.filter(n => n.name === 'item' || n.name === 'entry');
    const channelDate = field(channel, ['pubdate', 'date']);
    raw = entries.map(node => {
      const links = node.children.filter(n => n.name === 'link');
      const link = links.find(n => (!n.attrs.rel || n.attrs.rel === 'alternate') && (!n.attrs.type || /html/.test(n.attrs.type))) || links.find(n => !n.attrs.rel || n.attrs.rel === 'alternate');
      const ownDate = field(node, ['published', 'pubdate', 'date']) || field(node, ['updated']);
      return { title: field(node, ['title']), url: link?.attrs.href || nodeText(link) || field(node, ['guid']),
        base: link?.base || node.base || root.base,
        date: ownDate || channelDate, dateBasis: ownDate ? 'published' : 'feed',
        tags: node.children.filter(n => n.name === 'category').map(n => n.attrs.term || nodeText(n)) };
    });
  }
  return raw.map(r => normalize(r, source)).filter(Boolean).slice(0, limit);
}

/** Store only the digest; navigation/script changes are excluded when a main/article region exists. */
export function pageFingerprint(html) {
  if (!/<(?:html|main|article|body)\b/i.test(html) || /<title[^>]*>\s*(?:access denied|just a moment|sign in|error)/i.test(html)) throw new Error('公開ページを確認できません。');
  const region = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1]
    || /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1] || html;
  return plainText(region.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, ''), 4_000_000).trim();
}
