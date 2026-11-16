import { tr, pick } from '../i18n.js';
export const labels = Object.freeze({ running: tr('実行中', "Running"), cancelling: tr('中止しています', "Cancelling"), succeeded: tr('完了', "Completed"),
  partial: tr('一部を確認してください', "Partial · needs review"), unavailable: tr('未導入', "Unavailable"), review: tr('確認待ち', "Awaiting review"), failed: tr('失敗', "Failed"),
  cancelled: tr('中止', "Cancelled"), interrupted: tr('中断', "Interrupted") });
export const terminal = state => state in labels && !['running', 'cancelling'].includes(state);
export const localHostname = hostname => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);

export function createClient({ fetch: fetcher = globalThis.fetch, EventSource: Source = globalThis.EventSource } = {}) {
  let token = null;
  async function request(route, input) {
    const response = await fetcher(`/api/admin/${route}`, { method: input === undefined ? 'GET' : 'POST',
      cache: 'no-store', credentials: 'same-origin', headers: input === undefined ? {} : {
        'Content-Type': 'application/json', 'X-Memento-Admin': token ?? '',
      }, ...(input === undefined ? {} : { body: JSON.stringify(input) }) });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(tr('手元のアプリで開いてください。', "Open this in the local app."));
    const data = await response.json();
    if (!response.ok) throw new Error(pick(data, 'error') ?? tr('処理を完了できませんでした。', "Could not complete the task."));
    return data;
  }
  return {
    async connect() {
      const data = await request('status');
      if (data.localApp !== true || typeof data.token !== 'string' || !Array.isArray(data.jobs)) throw new Error(tr('管理画面は利用できません。', "Admin is unavailable."));
      token = data.token; return data;
    },
    list: () => request('jobs'), get: id => request(`jobs/${encodeURIComponent(id)}`),
    start: job => request('jobs', { job }), cancel: id => request(`jobs/${encodeURIComponent(id)}/cancel`, {}),
    merge: id => request(`jobs/${encodeURIComponent(id)}/merge`, {}),
    drafts: () => request('drafts'), draft: id => request(`drafts/${encodeURIComponent(id)}`),
    decide: (id, decision, hash) => request(`drafts/${encodeURIComponent(id)}/decision`, { decision, hash }),
    stream(id, onEvent, onError) {
      if (!Source) { onError?.(); return () => {}; }
      const source = new Source(`/api/admin/jobs/${encodeURIComponent(id)}/events`);
      for (const type of ['log', 'state']) source.addEventListener(type, event => {
        try {
          const data = JSON.parse(event.data); onEvent(data);
          if (type === 'state' && terminal(data.data?.state)) source.close();
        } catch { source.close(); onError?.(); }
      });
      source.addEventListener('gap', () => onEvent({ type: 'log', data: { text: tr('古い記録の一部は省略しています。', "Some older log entries have been omitted.") } }));
      source.onerror = () => onError?.();
      return () => source.close();
    },
  };
}
