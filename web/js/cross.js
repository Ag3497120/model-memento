// Browser-native 6-arm symbolic fact ledger and compatibility solver (inspired by scpm).
const VALID_ARMS = new Set(['+x', '-x', '+y', '-y', '+z', '-z']);

function normalizeRule(rule) {
  if (Array.isArray(rule)) {
    const [core, arm, facet, source, weight = 1] = rule;
    return {
      core: String(core || '').trim(),
      arm: String(arm || '').trim(),
      facet: String(facet || '').trim(),
      sources: source ? [String(source)] : [],
      weight
    };
  }
  return {
    core: String(rule.core || '').trim(),
    arm: String(rule.arm || '').trim(),
    facet: String(rule.facet || '').trim(),
    sources: [...new Set([...(rule.sources || []), ...(rule.source ? [rule.source] : [])].filter(Boolean))],
    weight: rule.weight ?? 1
  };
}

export function createCross(initialRules = []) {
  const byCore = new Map();
  let seq = 0;

  function addRule(raw) {
    const rule = normalizeRule(raw);
    if (!rule.core || !VALID_ARMS.has(rule.arm) || !rule.facet) return null;
    let bucket = byCore.get(rule.core);
    if (!bucket) {
      bucket = [];
      byCore.set(rule.core, bucket);
    }
    const existing = bucket.find(r => r.arm === rule.arm && r.facet === rule.facet);
    if (existing) {
      for (const s of rule.sources) if (!existing.sources.includes(s)) existing.sources.push(s);
      existing.weight = Math.max(existing.weight, rule.weight);
      return existing;
    }
    const stored = { ...rule, id: `cross:${++seq}:${rule.core}:${rule.arm}:${rule.facet}` };
    bucket.push(stored);
    return stored;
  }

  function addRules(list = []) {
    for (const r of list) addRule(r);
  }

  // Breadth-first +z ancestor chain for inheritance (child -> parent -> ...).
  function lineage(core) {
    const result = [];
    const seen = new Set();
    const queue = [{ core, depth: 0 }];
    while (queue.length && result.length < 16) {
      const current = queue.shift();
      if (!current.core || seen.has(current.core)) continue;
      seen.add(current.core);
      result.push(current);
      const rules = byCore.get(current.core) || [];
      for (const r of rules) {
        if (r.arm === '+z' && r.facet.startsWith('parent:')) {
          const parentCore = r.facet.slice('parent:'.length).trim();
          if (parentCore && !seen.has(parentCore)) queue.push({ core: parentCore, depth: current.depth + 1 });
        }
      }
    }
    return result;
  }

  function query(core, arm = null) {
    const chain = lineage(core);
    const positive = new Map();
    const negative = new Map();
    const collected = [];

    for (const { core: nodeCore, depth } of chain) {
      const rules = byCore.get(nodeCore) || [];
      for (const r of rules) {
        if (depth > 0 && (r.arm === '+z' || r.arm === '-z')) continue;
        if (r.arm === '+x' && !positive.has(r.facet)) positive.set(r.facet, { rule: r, depth });
        else if (r.arm === '-x' && !negative.has(r.facet)) negative.set(r.facet, { rule: r, depth });
        if (!arm || r.arm === arm) collected.push({ ...r, inheritedFrom: depth > 0 ? nodeCore : null, depth });
      }
    }

    // Closer -x suppresses inherited +x for the same facet; closer +x suppresses ancestral -x.
    return collected.filter(item => {
      if (item.arm === '+x') {
        const neg = negative.get(item.facet);
        if (neg && neg.depth <= item.depth) return false;
      }
      if (item.arm === '-x') {
        const pos = positive.get(item.facet);
        if (pos && pos.depth < item.depth) return false;
      }
      return true;
    });
  }

  function verify(core, arm, facet) {
    const all = query(core);
    if (arm === '+x') {
      const neg = all.find(r => r.arm === '-x' && r.facet === facet);
      if (neg) return { status: 'REFUTED', facts: [neg] };
      const pos = all.find(r => r.arm === '+x' && r.facet === facet);
      if (pos) return { status: 'VERIFIED_TRUE', facts: [pos] };
      return { status: 'UNKNOWN', facts: [] };
    }
    if (arm === '-x') {
      const neg = all.find(r => r.arm === '-x' && r.facet === facet);
      if (neg) return { status: 'VERIFIED_TRUE', facts: [neg] };
      const pos = all.find(r => r.arm === '+x' && r.facet === facet);
      if (pos) return { status: 'REFUTED', facts: [pos] };
      return { status: 'UNKNOWN', facts: [] };
    }
    const hits = all.filter(r => r.arm === arm && r.facet === facet);
    return hits.length ? { status: 'VERIFIED_TRUE', facts: hits } : { status: 'UNKNOWN', facts: [] };
  }

  function checkCompatibility(modelCore, harnessCore) {
    const reqs = query(harnessCore, '+y').filter(r => r.facet.startsWith('requires:'));
    const conflicts = [];
    const facts = [];
    for (const req of reqs) {
      const cap = req.facet.slice('requires:'.length).trim();
      const check = verify(modelCore, '+x', cap);
      if (check.status === 'REFUTED') {
        conflicts.push({ capability: cap, requirement: req, denial: check.facts[0] });
        facts.push(req, ...check.facts);
      }
    }
    return {
      compatible: conflicts.length ? false : null,
      conflicts,
      facts
    };
  }

  addRules(initialRules);
  return { addRule, addRules, lineage, query, verify, checkCompatibility };
}
