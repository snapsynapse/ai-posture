const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const plan = fs.readFileSync(path.join(__dirname, '../audits/2026-10-27-privacy-and-rollout-plan.md'), 'utf8');
const blocks = [...plan.matchAll(/```\n([\s\S]*?)\n```/g)]
  .map(match => match[1]).filter(block => block.includes('node_modules/.bin/wrangler'));
const shells = ['/bin/sh', '/bin/bash', '/bin/zsh'].filter(shell => fs.existsSync(shell));

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-posture-rollout-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const release = path.join(root, 'approved release with spaces');
  const current = path.join(root, 'wrong current folder');
  const log = path.join(root, 'calls.log');
  for (const directory of [release, current]) {
    const bin = path.join(directory, 'node_modules/.bin');
    fs.mkdirSync(bin, { recursive: true });
    // Always a stub. These tests cannot invoke the repository's real Wrangler.
    fs.writeFileSync(path.join(bin, 'wrangler'), '#!/bin/sh\nprintf "%s|%s\\n" "$PWD" "$*" >> "$REVIEW_CALL_LOG"\nexit "${REVIEW_STUB_EXIT:-0}"\n', { mode: 0o755 });
  }
  return { root, release, current, log };
}

function run(shell, block, directory, target, exitCode = '0') {
  fs.rmSync(directory.log, { force: true });
  const result = spawnSync(shell, ['-c', block.replaceAll('"RELEASE_WORKER_DIR"', '"$REVIEW_RELEASE_DIR"')], {
    cwd: directory.current, encoding: 'utf8', timeout: 5000,
    env: { ...process.env, REVIEW_RELEASE_DIR: target, REVIEW_CALL_LOG: directory.log, REVIEW_STUB_EXIT: exitCode }
  });
  assert.equal(result.error, undefined);
  const calls = fs.existsSync(directory.log) ? fs.readFileSync(directory.log, 'utf8').trim().split('\n') : [];
  return { result, calls };
}

test('PRIV-R3 every rollout block stops before Wrangler when the release directory is missing', t => {
  assert.equal(blocks.length, 4, 'exercise all four documented Wrangler blocks');
  assert.ok(shells.length > 0, 'a POSIX shell is required');
  const directory = fixture(t);
  for (const shell of shells) {
    for (const block of blocks) {
      const { result, calls } = run(shell, block, directory, path.join(directory.root, 'missing release'));
      assert.notEqual(result.status, 0, shell);
      assert.deepEqual(calls, [], shell + ' must not execute from the previous directory');
    }
  }
});

test('PRIV-R3 valid rollout paths with spaces invoke only the approved-folder stub', t => {
  const directory = fixture(t);
  for (const shell of shells) {
    for (const block of blocks) {
      const { result, calls } = run(shell, block, directory, directory.release);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(calls.length, block.includes('deployments status') ? 3 : 1);
      assert.ok(calls.every(call => call.startsWith(directory.release + '|')));
    }
  }
});

test('PRIV-R3 a failed preflight command prevents all subsequent Wrangler calls', t => {
  const directory = fixture(t);
  const preflight = blocks.find(block => block.includes('deployments status'));
  assert.ok(preflight);
  for (const shell of shells) {
    const { result, calls } = run(shell, preflight, directory, directory.release, '23');
    assert.equal(result.status, 23, shell);
    assert.equal(calls.length, 1, shell);
    assert.match(calls[0], /deployments status --json$/);
  }
});
