const test = require('node:test');
const assert = require('node:assert/strict');
const { report, references } = require('./index');
const env = { GITHUB_REPOSITORY: 'example/drivers', GITHUB_SERVER_URL: 'https://github.com',
  GITHUB_API_URL: 'https://api.github.com', 'INPUT_RELEASE-BRANCHES': 'release/3.2,release/3.1,release/3.0' };
const rollback = { pull_request: { number: 450, title: 'Revert "Driver fix"', body: 'Reverts example/drivers#412' } };
const fixture = { 'release/3.2': [{ number: 430, title: 'Backport #412', merged_at: '2026-10-01' }],
  'release/3.1': [{ number: 445, title: 'Driver fix', body: 'Backport of #412', state: 'open' }],
  'release/3.0': [{ number: 446, title: 'Backport #412', state: 'closed' }] };
const demo = () => report(env, rollback, async url => Response.json(fixture[url.searchParams.get('base')]));
test('rollback example shows merged, open and unmatched branches', async () => {
  const result = await demo();
  assert.match(result, /release\/3.2.*#430.*Merged/);
  assert.match(result, /release\/3.1.*#445.*Open/);
  assert.match(result, /release\/3.0.*No linked/);
  assert.doesNotMatch(result, /446/);
});
test('ordinary PRs skip without API access', async () => {
  assert.match(await report(env, { pull_request: { title: 'Fix #412' } }, assert.fail), /Skipped/);
});
test('references are exact, same-repository and deduplicated', () => {
  const pr = { title: 'Revert #12', body: 'Reverts example/drivers#12\nReverts other/drivers#13\nReverts #12abc\nReverts #22' };
  assert.deepEqual([...references(pr, 'revert', env.GITHUB_REPOSITORY)], ['12','22']);
});
test('later pages are included and HTTP errors fail the check', async () => {
  const one = { ...env, 'INPUT_RELEASE-BRANCHES': 'release/3.1' };
  const result = await report(one, rollback, async url => Response.json(url.searchParams.get('page') === '1'
    ? Array(100).fill({ title: 'Other', state: 'open' }) : fixture['release/3.1']));
  assert.match(result, /#445/);
  await assert.rejects(report(one, rollback, async () => new Response(null, { status: 403 })), /403/);
});
if (process.env.WRITE_DEMO_SUMMARY) test('write worked example', async () => {
  await require('node:fs/promises').appendFile(process.env.GITHUB_STEP_SUMMARY, '## Worked example (sample data)\n\n' + await demo());
});
