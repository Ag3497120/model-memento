// A deliberately small parser for the YAML subset used by these workflows; no external dependency.
// Supports mappings, mapping sequences, quoted scalars, flow scalar lists, and literal/folded blocks.
// Rejects duplicate keys, tabs, anchors, tags, and unsupported flow syntax rather than guessing.
export function parseWorkflowYaml(input) {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  if (lines.some(l => /^\s*\t/.test(l))) throw new Error('tabs');
  let i = 0;
  const indentation = l => l.match(/^ */)[0].length;
  const ignored = l => /^\s*(?:#.*)?$/.test(l);
  const skip = () => { while (i < lines.length && ignored(lines[i])) i++; };
  function scalar(s) {
    s = s.trim().replace(/\s+#.*$/, '');
    if (s === '{}') return {};
    if (s === '[]') return [];
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^\d+$/.test(s)) return Number(s);
    if (s.startsWith('"')) return JSON.parse(s);
    if (s.startsWith("'")) { if (!s.endsWith("'")) throw new Error('quote'); return s.slice(1, -1).replace(/''/g, "'"); }
    if (s.startsWith('[')) {
      if (!s.endsWith(']')) throw new Error('flow sequence');
      return s.slice(1, -1).split(',').map(scalar);
    }
    if (/^[!&*{}]/.test(s)) throw new Error('unsupported scalar');
    return s;
  }
  function mapping(text, object, indent) {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*):(?:\s+(.*))?$/.exec(text);
    if (!m || Object.hasOwn(object, m[1])) throw new Error(`mapping: ${text}`);
    const [, key, raw = ''] = m;
    if (/^[|>][-+]?$/.test(raw)) {
      const block = [];
      while (i < lines.length && (ignored(lines[i]) || indentation(lines[i]) > indent)) block.push(lines[i++]);
      const nonempty = block.filter(l => !ignored(l));
      const n = nonempty.length ? Math.min(...nonempty.map(indentation)) : indent + 2;
      object[key] = block.map(l => l.slice(n)).join(raw[0] === '>' ? ' ' : '\n');
    } else if (raw) object[key] = scalar(raw);
    else { skip(); object[key] = i < lines.length && indentation(lines[i]) > indent ? node(indentation(lines[i])) : null; }
  }
  function node(indent) {
    skip(); const sequence = lines[i]?.slice(indent).startsWith('- '); const result = sequence ? [] : {};
    while (i < lines.length) {
      skip(); if (i >= lines.length || indentation(lines[i]) < indent) break;
      if (indentation(lines[i]) !== indent) throw new Error(`indentation at ${i + 1}`);
      const value = lines[i++].slice(indent);
      if (sequence) {
        if (!value.startsWith('- ')) throw new Error('sequence');
        const entry = value.slice(2), map = {};
        if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(entry)) {
          mapping(entry, map, indent + 2);
          while (true) { skip(); if (i >= lines.length || indentation(lines[i]) <= indent) break;
            if (indentation(lines[i]) !== indent + 2) throw new Error('sequence mapping indent');
            mapping(lines[i++].slice(indent + 2), map, indent + 2);
          }
          result.push(map);
        } else result.push(scalar(entry));
      } else mapping(value, result, indent);
    }
    return result;
  }
  return node(0);
}
