#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = await fs.mkdtemp(path.join(root, 'test/app/.pack-'));
try {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, npm_config_cache: cache, npm_config_update_notifier: 'false' },
  });
  if (result.status !== 0) throw new Error('配布サイズを調べられませんでした。' + result.stderr);
  const [pack] = JSON.parse(result.stdout);
  const forbidden = pack.files.filter(file => /^(?:web\/data|web\/world|world|data|site|\.work|test|tests|recipes\/catalog|recipes\/examples)(?:\/|$)/.test(file.path)
    || /(?:^|\/)(?:node_modules|\.aws|\.codex|\.agents)(?:\/|$)/.test(file.path));
  if (forbidden.length) throw new Error('配布物にデータや作業用ファイルがあります: ' + forbidden.map(file => file.path).join(', '));
  const max = 5_000_000;
  console.log(`package: ${pack.size} bytes packed; ${pack.unpackedSize} bytes unpacked; ${pack.files.length} files; limit ${max} bytes`);
  if (pack.size > max || pack.unpackedSize > max) throw new Error('配布サイズが 5 MB を超えています。');
} finally { await fs.rm(cache, { recursive: true, force: true }); }
