# Backport Revert Alert

When a pull request rolls back a fix, see which release branches already received it and which backports are still waiting to merge. The Action writes a linked table to the GitHub Actions job summary. It needs only pull request read access. No checkout, external service, or package installation is required.

**Developer** · Kphanindra reddy

## Install

Save this workflow as `.github/workflows/backport-revert.yml` in the repository that contains your release branches. Replace the example branch names with yours.

```yaml
name: Backport revert alert
on:
  pull_request:
    branches: [main]
    types: [opened, edited, reopened, synchronize, closed]
permissions:
  pull-requests: read
jobs:
  backports:
    if: github.event.action != 'closed' || github.event.pull_request.merged
    runs-on: ubuntu-latest
    steps:
      - uses: KPhanindraReddy/backport-revert-alert@v1.0.0
        with:
          release-branches: release/3.2, release/3.1, release/3.0
```

## Worked example

1. Merge driver fix **#412** into main.
2. Open **#430** against release/3.2 with `Backport #412` in the body and merge it. Leave a second backport **#445** open against release/3.1.
3. Open rollback **#450** against main. Put `Reverts #412` on its own line in the description.
4. Open the workflow run summary from the PR checks.

| Original PR | Release branch | Linked backport | Status |
|---|---|---|---|
| #412 | release/3.2 | #430 | Merged — review this release |
| #412 | release/3.1 | #445 | Open — review before merging |
| #412 | release/3.0 | — | No linked open or merged backport found |

These numbers are sample data. Open **Actions → Tests and worked example** for the executable demonstration, or run `node --test example.test.js` locally with Node.js 24.

## Reference formats and limits

Start a title or body line with `Revert #412`, `Reverts owner/repo#412`, `Backport #412`, or `Backport of #412`. Qualified references must point to the same repository. Multiple rollback targets can be listed on separate lines. Treat these markers as declarations; keep them out of template examples.

The Action reads all pages of PR history on the configured base branches each time a rollback runs. Exact branch names only. Closed, unmerged PRs are ignored. Unmarked cherry-picks, commit-only reverts, and changes made directly to branches require manual review. A merged backport is a historical record, not proof that its code is still present. An API failure fails the run rather than reporting an empty result. In a busy repository, limit the configured list to supported release branches.

## License

MIT
