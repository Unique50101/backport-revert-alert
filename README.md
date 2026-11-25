![Backport Revert Alert — copper and blue railway tracks branching across a navy background](./assets/banner.svg)

[![Tests](https://github.com/KPhanindraReddy/backport-revert-alert/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/KPhanindraReddy/backport-revert-alert/actions/workflows/test.yml) [![Release](https://img.shields.io/github/v/release/KPhanindraReddy/backport-revert-alert)](https://github.com/KPhanindraReddy/backport-revert-alert/releases/latest) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

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

## Checks against public repositories

We ran the report function from the v1.0.0 tag locally with real PR records from the public GitHub API. These checks used read-only access and did not install the Action in either project.

| Rollback PR | What v1.0.0 reported | What the result means |
|---|---|---|
| [pandas #71981](https://github.com/pandas-dev/pandas/pull/71981) | Identified original [#71883](https://github.com/pandas-dev/pandas/pull/71883). No linked open or merged backport on `3.1.x`. | The linked [backport #71982](https://github.com/pandas-dev/pandas/pull/71982) was closed without merging. The Action correctly excluded it. |
| [CPython #161988](https://github.com/python/cpython/pull/161988) | Skipped before scanning release branches. | The rollback uses `Reverts gh-161621`. Version 1.0.0 recognizes `Reverts #161621` and qualified GitHub references. |

The [worked-example workflow](https://github.com/KPhanindraReddy/backport-revert-alert/actions/runs/45619144196) demonstrates the open and merged outcomes with sample data.

## Reference formats and limits

Start a title or body line with `Revert #412`, `Reverts owner/repo#412`, `Backport #412`, or `Backport of #412`. Qualified references must point to the same repository. Multiple rollback targets can be listed on separate lines. Treat these markers as declarations; keep them out of template examples.

The Action reads all pages of PR history on the configured base branches each time a rollback runs. Exact branch names only. Closed, unmerged PRs are ignored. Unmarked cherry-picks, commit-only reverts, and changes made directly to branches require manual review. A merged backport is a historical record, not proof that its code is still present. An API failure fails the run rather than reporting an empty result. In a busy repository, limit the configured list to supported release branches.

## License

MIT
