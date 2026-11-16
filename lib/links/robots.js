// Implemented from RFC 9309, not copied from a third-party parser.
// Source: https://www.rfc-editor.org/rfc/rfc9309.html
function octets(value) {
  return value.replace(/[^\x00-\x7F]/gu, char => encodeURIComponent(char))
    .replace(/%([a-f0-9]{2})/gi, (_, hex) => {
      const char = String.fromCharCode(parseInt(hex, 16));
      return /[A-Za-z0-9._~-]/.test(char) ? char : `%${hex.toUpperCase()}`;
    });
}

export function parseRobots(text, agent = 'ModelMementoLinks') {
  const groups = [];
  let group = null;
  let hasRules = false;
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const at = line.indexOf(':');
    if (at < 0) continue;
    const key = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();
    if (key === 'user-agent') {
      if (!group || hasRules) { group = { agents: [], rules: [], delayMs: 0 }; groups.push(group); hasRules = false; }
      group.agents.push(value.toLowerCase());
    } else if (group && ['allow', 'disallow', 'crawl-delay'].includes(key)) {
      hasRules = true;
      if (key === 'crawl-delay') {
        if (/^\d+(?:\.\d+)?$/.test(value)) group.delayMs = Math.max(group.delayMs, Number(value) * 1000);
      } else if (value.startsWith('/')) {
        const pattern = octets(value);
        const end = pattern.endsWith('$');
        const body = end ? pattern.slice(0, -1) : pattern;
        const regex = '^' + body.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (end ? '$' : '');
        group.rules.push({ allow: key === 'allow', regex: new RegExp(regex),
          length: Buffer.byteLength(body.replace(/\*/g, '').replace(/%[A-F0-9]{2}/g, 'x')) });
      }
    }
  }
  const matches = groups.map(item => ({ ...item, specificity: Math.max(-1, ...item.agents.map(token =>
    token === '*' ? 0 : token && agent.toLowerCase().includes(token) ? token.length : -1)) }));
  const specificity = Math.max(-1, ...matches.map(item => item.specificity));
  const selected = matches.filter(item => item.specificity === specificity && specificity >= 0);
  const rules = selected.flatMap(item => item.rules);
  return {
    delayMs: Math.max(0, ...selected.map(item => item.delayMs)),
    allowed(url) {
      const target = new URL(url);
      const pathname = octets(target.pathname + target.search);
      const matched = rules.filter(rule => rule.regex.test(pathname)).sort((a, b) => b.length - a.length || Number(b.allow) - Number(a.allow));
      return matched[0]?.allow ?? true;
    },
  };
}
