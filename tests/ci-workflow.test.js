const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/pages.yml'), 'utf8');
// Inspect only the job's own indented block, not commands in sibling jobs.
function job(name) {
  return workflow.match(new RegExp('^  ' + name + ':\\n((?: {4}.*\\n|[ \\t]*\\n)*)', 'm'))?.[1] || '';
}

test('SEC-011 pull requests and main pushes run both suites in an unprivileged job', () => {
  assert.match(workflow, /^  pull_request:/m);
  assert.match(workflow, /^  push:\n    branches: \[main\]/m);
  const checks = job('test');
  assert.ok(checks);
  assert.match(checks, /uses: actions\/setup-node@/);
  const major = Number(checks.match(/node-version: ['"]?(\d+)/)?.[1]);
  assert.ok(major >= 22, 'node:sqlite is required by the Worker regressions');
  assert.equal([...checks.matchAll(/run: npm test/g)].length, 2);
  assert.match(checks, /working-directory: worker/);
  assert.match(checks, /uses: actions\/setup-python@/);
  assert.match(checks, /run: python3 -m pip install .* -r tests\/requirements-shacl\.txt/);
  assert.match(checks, /run: npm run test:shacl/);
  const prefix = workflow.slice(0, workflow.indexOf('jobs:'));
  assert.match(prefix, /permissions:\n  contents: read/);
  assert.doesNotMatch(prefix + checks, /pages: write|id-token: write|secrets\./);
});

test('SEC-011 deployment requires successful tests and is restricted to main outside pull requests', () => {
  const deploy = job('deploy');
  assert.match(deploy, /needs: test/);
  assert.match(deploy, /if: .*github\.ref == 'refs\/heads\/main'/);
  assert.match(deploy, /if: .*github\.event_name != 'pull_request'/);
  assert.match(deploy, /pages: write/);
  assert.match(deploy, /id-token: write/);
  assert.doesNotMatch(deploy, /always\(\)|continue-on-error/);
});
