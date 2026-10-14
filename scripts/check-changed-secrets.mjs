import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tracked = execFileSync('git', ['diff', '--name-only', '-z', 'HEAD'], { cwd: root });
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root });
const files = [...new Set(Buffer.concat([tracked, untracked]).toString().split('\0').filter(Boolean))];
const rules = [
  ['private key', /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['OpenAI API credential', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/],
  ['database connection credential', /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:'"/]+:[^\s'"@]+@/i],
  ['literal signing vault key', /DIGITAL_CERTIFICATE_KEY\s*[:=]\s*["'][A-Za-z0-9+/]{43}=["']/],
];
let scanned = 0;
let findings = 0;
for (const file of files) {
  const fullPath = resolve(root, file);
  if (!statSync(fullPath).isFile()) continue;
  if (/\.(?:pfx|p12)$/i.test(file) || /(?:^|\/)\.env(?:\.|$)/.test(file)) {
    console.error(`Sensitive artifact in change: ${file}`);
    findings++;
    continue;
  }
  if (!/\.(?:[cm]?js|jsx|tsx?|py|json|md|txt|yml|yaml|sql|pem|ps1)$/i.test(extname(file)) && !/Dockerfile|gitignore|dockerignore/.test(file)) continue;
  const contents = readFileSync(fullPath, 'utf8');
  scanned++;
  for (const [name, pattern] of rules) {
    if (!pattern.test(contents)) continue;
    console.error(`Possible ${name}: ${file}`);
    findings++;
  }
}
console.log(`Secret scan: ${scanned} changed text files checked; ${findings} findings. Values were not printed.`);
process.exitCode = findings ? 1 : 0;
