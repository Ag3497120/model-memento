import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateBuildInput } from './artifacts.js';

/** Accepted, deduplicated self-reports only. Partial runs remain in the denominator. */
export function aggregateRecipeStats(input) {
  const build = validateBuildInput(input), recipes = Object.create(null);
  for (const item of build.items) {
    if (item.kind !== 'recipe-run') continue;
    const row = recipes[item.recipeId] ||= { count: 0, ok: 0, partial: 0, failed: 0 };
    row.count++; row[item.outcome]++;
  }
  return { schema: 'memento.recipe-stats.v1', builtAt: build.builtAt, basis: '利用者の自己申告。成功は最後まで完了した報告です。', recipes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || process.argv.length !== 4) throw new Error('使い方: node lib/contrib/recipe-stats.js 検査済み入力.json 出力.json');
  const stats = aggregateRecipeStats(JSON.parse(await fs.readFile(input, 'utf8')));
  await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await fs.writeFile(output, JSON.stringify(stats) + '\n');
  console.log(`利用報告 ${Object.values(stats.recipes).reduce((sum, row) => sum + row.count, 0)} 件を集計しました。`);
}
