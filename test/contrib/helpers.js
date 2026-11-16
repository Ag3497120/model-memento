export const now = new Date('2026-11-15T12:00:00Z');
export const secret = 'synthetic-secret-used-only-by-offline-tests';
export const declarations = { noPersonalData: true, ownWords: true, noRestrictedAssets: true };
export const sources = ['https://one.example.org/facts', 'https://two.example.net/facts'];
export const link = (patch = {}) => ({ schema: 'memento.contribution.v1', kind: 'link-status',
  url: 'https://one.example.org/page', state: 'ok', checkedAt: '2026-11-15T10:00:00Z', declarations, ...patch });
export const fact = (patch = {}) => ({ schema: 'memento.contribution.v1', kind: 'fact',
  target: { type: 'model', id: 'synthetic-model' }, field: 'contextTokens', value: 8192, sources, declarations, ...patch });
export const draft = (patch = {}) => ({ schema: 'memento.contribution.v1', kind: 'persona-draft',
  target: { type: 'model', id: 'synthetic-model' }, summary: '架空のモデルについてのテスト用の下書きです。',
  traits: ['短い文で説明する'], sources, declarations, ...patch });
export function event(item, { user = 1, number = 1, type = 'issue', action, ...patch } = {}) {
  return { action: action ?? (type === 'issue' ? 'opened' : 'created'),
    repository: { full_name: 'synthetic/memento', private: false },
    sender: { id: user, type: 'User', login: 'not-persisted' },
    [type]: { number, updated_at: '2026-11-15T10:00:00Z', user: { id: user, type: 'User', email: 'never-persisted@example.org' },
      body: typeof item === 'string' ? item : JSON.stringify(item) }, ...patch };
}
export const response = (body = '', status = 200, headers = {}) => new Response(body, { status,
  headers: { 'content-type': 'text/plain', ...headers } });
export const unavailable = async () => { throw new Error('offline fixture'); };
export const options = { now, contributorKey: secret, repository: 'synthetic/memento' };
