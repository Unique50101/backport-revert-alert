const fs = require('node:fs/promises');

const markers = {
  revert: /^\s*reverts?\s+(?:PR\s+)?(?:([\w.-]+\/[\w.-]+))?#([1-9]\d*)(?=$|[\s.:),-])/i,
  backport: /^\s*backport(?:\s+of)?\s+(?:PR\s+)?(?:([\w.-]+\/[\w.-]+))?#([1-9]\d*)(?=$|[\s.:),-])/i
};

function references(pr, kind, repo) {
  const ids = new Set();
  for (const line of [pr.title, ...(pr.body || '').split(/\r?\n/)]) {
    const match = markers[kind].exec(line);
    if (match && (!match[1] || match[1].toLowerCase() === repo.toLowerCase())) ids.add(match[2]);
  }
  return ids;
}

async function listPulls(env, branch, request) {
  const pulls = [];
  const url = new URL(env.GITHUB_API_URL + '/repos/' + env.GITHUB_REPOSITORY + '/pulls');
  url.search = new URLSearchParams({ state: 'all', base: branch, per_page: '100' });
  for (let page = 1; ; page++) {
    url.searchParams.set('page', String(page));
    const res = await request(url, { headers: { Authorization: 'Bearer ' + env.INPUT_TOKEN,
      Accept: 'application/vnd.github+json' }, redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error('GitHub PR lookup failed (HTTP ' + res.status + '). Check permissions and rate limits.');
    const batch = await res.json();
    pulls.push(...batch);
    if (batch.length < 100) return pulls;
  }
}

async function report(env, event, request = fetch) {
  const pr = event.pull_request;
  if (!pr) throw new Error('Use this Action in a pull_request workflow.');
  const repo = env.GITHUB_REPOSITORY;
  const originals = references(pr, 'revert', repo);
  if (!originals.size) return 'No explicit rollback reference found. Skipped.\n';
  const branches = [...new Set((env['INPUT_RELEASE-BRANCHES'] || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean))];
  if (!branches.length) throw new Error('Set release-branches to one or more exact branch names.');
  const prLink = n => '[#' + n + '](' + env.GITHUB_SERVER_URL + '/' + repo + '/pull/' + n + ')';
  const lines = ['## Backport Revert Alert', '', '| Original PR | Release branch | Linked backport | Status |', '|---|---|---|---|'];
  for (const branch of branches) {
    const safeBranch = Array.from(branch, c => /[\w./-]/.test(c) ? c : '&#' + c.codePointAt(0) + ';').join('');
    const candidates = (await listPulls(env, branch, request))
      .filter(p => p.number !== pr.number && (p.merged_at || p.state === 'open'));
    for (const id of originals) {
      const matches = candidates.filter(p => references(p, 'backport', repo).has(id));
      const prefix = '| ' + prLink(id) + ' | ' + safeBranch + ' | ';
      if (!matches.length) lines.push(prefix + '— | No linked open or merged backport found |');
      for (const p of matches) lines.push(prefix + prLink(p.number) + ' | ' +
        (p.merged_at ? 'Merged — review this release' : 'Open — review before merging') + ' |');
    }
  }
  lines.push('', 'Matches use explicit PR references. Check manual cherry-picks separately.');
  return lines.join('\n') + '\n';
}

async function run() {
  const event = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const summary = await report(process.env, event);
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
}

if (require.main === module) run().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { report, references };
