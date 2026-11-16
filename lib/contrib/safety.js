// Conservative screening complements strict fields and the contributor's declarations.
// It cannot establish ownership or detect every personal fact; prose is never auto-published.
const PRIVATE = [
  /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+/iu,
  /(?:\+?\d[\s().-]*){10,}/u,
  /(?:^|[\s"'(])(?:~[\\/]|\.{1,2}[\\/]|[A-Z]:[\\/]|\\\\|\/[a-z0-9._-]+(?:[\\/]|$|[\s"'),]))/iu,
  /(?:file|data|javascript|vbscript):/iu,
  /(?:\b(?:sk|ghp|gho|ghu|ghs|github_pat)[_-][A-Za-z0-9_-]{8,}|\bAKIA[A-Z0-9]{16}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----)/u,
  /(?:api[_ -]?key|access[_ -]?token|password|秘密鍵|パスワード)\s*[:=]\s*\S+/iu,
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/u,
  /(?:〒\s*\d{3}[-ー]?\d{4}|\b\d{3}-\d{2}-\d{4}\b|(?:東京都|北海道|(?:京都|大阪)府|.{2,3}県).{1,30}(?:丁目|番地|号室))/u,
  /(?:本名|住所|電話番号|生年月日|メールアドレス)\s*[:：]/u,
];
const UNSAFE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f]|<[^>]*>|!\[|```|\$\(|\$\{|\x60|(?:^|\s)@[\w-]+/u;
const RESTRICTED = /(?:\b(?:screenshot|wordmark|brandmark|mascot|favicon|logo)\b|スクリーンショット|画面写真|ロゴ|マスコット|ワードマーク)/iu;
const COPIED = /(?:\b(?:GPL|LGPL|AGPL)(?:[- ]?\d|\b)|GNU (?:Affero |Lesser )?General Public License|(?:copyright|all rights reserved)\b|転載|全文引用)/iu;

export function safetyErrors(item) {
  const errors = [];
  const visit = (value, path) => {
    if (typeof value === 'string') {
      const normalized = value.normalize('NFKC');
      let inspected = normalized;
      try { inspected = decodeURIComponent(normalized); } catch { /* Literal prose may contain %. */ }
      // A URL contains a public web path by design; never treat it as a local path.
      const isReference = path === 'url' || /^sources\.\d+$/u.test(path) || (path === 'value' && item.field === 'website');
      const check = isReference ? inspected.replace(/^https:\/\//u, '') : inspected;
      const relativePath = !isReference && path !== 'target.id' && /(?:^|[\s"'(])[\p{L}\p{N}._-]+(?:[\\/][\p{L}\p{N}._-]+)+(?:$|[\s"'),])/u.test(inspected);
      if (PRIVATE.some(pattern => pattern.test(check)) || UNSAFE.test(check) || relativePath) errors.push({ path, code: 'privacy', reason: '個人情報・秘密情報・実行用の記述や端末内の場所は送れません。' });
      const licenseFact = item.kind === 'fact' && item.field === 'license' && path === 'value' && /^(?:A?GPL|LGPL)(?:-[0-9.]+)?(?:-only|-or-later)?$/u.test(inspected);
      if (!isReference && (RESTRICTED.test(inspected) || (!licenseFact && COPIED.test(inspected)))) errors.push({ path, code: 'rights', reason: '画像・ロゴ・転載文・利用が制限されたコードは送れません。配置や色を自分の言葉で説明してください。' });
      if (!isReference && /https?:\/\//iu.test(inspected)) errors.push({ path, code: 'reference', reason: 'URLは出典欄に記入してください。' });
    } else if (Array.isArray(value)) value.forEach((v, i) => visit(v, `${path}.${i}`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(v, path ? `${path}.${k}` : k));
  };
  visit(item, '');
  return errors;
}

export function plainText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
