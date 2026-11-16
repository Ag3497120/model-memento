const ID = /^(\d{2})\.([1-9]\d*)$/;

export function parsePatchId(id) {
  const match = typeof id === 'string' && ID.exec(id);
  const number = match && Number(match[2]);
  if (!match || !Number.isSafeInteger(number)) throw new Error('更新番号は 26.47 の形で指定してください。');
  return { year: Number(match[1]), number };
}

export function comparePatchIds(left, right) {
  const a = parsePatchId(left);
  const b = parsePatchId(right);
  return a.year - b.year || a.number - b.number;
}

export function nextPatchId({ at = new Date(), previous = null, history = [] } = {}) {
  const date = new Date(at);
  const year = date.getUTCFullYear();
  if (!Number.isFinite(date.getTime()) || year < 2000 || year > 2099) throw new Error('更新日時は2000年から2099年の間で指定してください。');
  let highest = 0;
  for (const id of [...history, ...(previous ? [previous] : [])]) {
    const entry = parsePatchId(id);
    if (entry.year > year % 100) throw new Error('過去の年に戻って更新番号を付けることはできません。');
    if (entry.year === year % 100) highest = Math.max(highest, entry.number);
  }
  if (!Number.isSafeInteger(highest + 1)) throw new Error('今年の更新番号が上限に達しました。');
  return `${String(year % 100).padStart(2, '0')}.${highest + 1}`;
}

// history includes reserved/failed builds so a rollback never reuses a newer ID.
export function createPatch({ at = new Date(), previous = null, history = [], id, counts = {}, changes = {} } = {}) {
  const minimum = nextPatchId({ at, previous, history });
  const assigned = id ?? minimum;
  if (parsePatchId(assigned).year !== parsePatchId(minimum).year || comparePatchIds(assigned, minimum) < 0) {
    throw new Error('更新番号は今年の未使用の番号を指定してください。');
  }
  return { id: assigned, at: new Date(at).toISOString(), previous, counts, changes };
}
