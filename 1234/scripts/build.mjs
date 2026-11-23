import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const config = fs.readFileSync('wrangler.toml', 'utf8');
for (const [block, binding] of [['[assets]', 'ASSETS'], ['[[d1_databases]]', 'DB'], ['[[r2_buckets]]', 'R2']]) {
  const section = config.split(block)[1]?.split(/^\[/m)[0] || '';
  if (!section.includes('binding = "' + binding + '"')) throw new Error('Missing ' + binding);
}
if (!/^main = "src\/index\.js"$/m.test(config)) throw new Error('Unexpected Worker entrypoint');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'wordbridge-build-'));
try {
  execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run', '--outdir', output], {stdio:'inherit'});
} finally { fs.rmSync(output, {recursive:true, force:true}); }
