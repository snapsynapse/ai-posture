const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const declaration = JSON.parse(read('docs/.well-known/ai-posture.json'));
test('homepage steward summary matches the declaration', () => {
  const home = read('docs/index.html');
  for (const [name, vector] of Object.entries(declaration.vectors)) {
    assert.ok(home.includes(`<tr data-vector="${name}"><th scope="row">${name}</th><td>${vector.level}</td><td>${vector.level_name}</td></tr>`));
  }
  assert.ok(home.includes(`data-aggregate-level="${declaration.aggregate.level}"`));
  assert.ok(home.includes(`data-constraining-vectors>${declaration.constraining_vectors.join(', ')}</span>`));
  assert.ok(home.includes(`id="declaration-review" datetime="${declaration.next_review}"`));
});
test('every declaration evidence URL resolves locally including fragments', () => {
  for (const url of Object.values(declaration.evidence).flat()) {
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://aiposture.org');
    const file = 'docs' + parsed.pathname + (parsed.pathname.endsWith('/') ? 'index.html' : '');
    const body = read(file);
    if (parsed.hash) assert.ok(body.includes(`id="${parsed.hash.slice(1)}"`), url);
  }
});
test('agent framework discovers the steward declaration and evidence', () => {
  const framework = JSON.parse(read('docs/.well-known/ai-posture-framework.json'));
  assert.equal(framework.agent_resources.steward_declaration, 'https://aiposture.org/.well-known/ai-posture.json');
  assert.equal(framework.agent_resources.steward_evidence, 'https://aiposture.org/declaration/');
});
