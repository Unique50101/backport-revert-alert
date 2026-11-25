![Backport Revert Alert — copper and blue railway tracks branching across a navy background](./assets/banner.svg)

[![Tests](https://github.com/KPhanindraReddy/backport-revert-alert/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/KPhanindraReddy/backport-revert-alert/actions/workflows/test.yml) [![Release](https://img.shields.io/github/v/release/KPhanindraReddy/backport-revert-alert)](https://github.com/KPhanindraReddy/backport-revert-alert/releases/latest) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

When a pull request rolls back a fix, see which release branches already received it and which backports are still waiting to merge. The Action writes a linked table to the GitHub Actions job summary. It needs only pull request read access. No checkout, external service, or package installation is required.

[Install from GitHub Marketplace](https://github.com/marketplace/actions/backport-revert-alert) · [See a real workflow run](https://github.com/KPhanindraReddy/backport-revert-alert/actions/runs/45624196069)

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

## Worked example from pandas

When [rollback #71981](https://github.com/pandas-dev/pandas/pull/71981) reverted [original PR #71883](https://github.com/pandas-dev/pandas/pull/71883), the linked [backport #71982](https://github.com/pandas-dev/pandas/pull/71982) had closed without merging. The Action therefore reported no open or merged backport on `3.1.x`.

The [public run summary](https://github.com/KPhanindraReddy/backport-revert-alert/actions/runs/45624196069) also links a separate merged example: [original #72126](https://github.com/pandas-dev/pandas/pull/72126) and [backport #72146](https://github.com/pandas-dev/pandas/pull/72146). Run the offline tests locally with `node --test example.test.js`.

## Checks against public repositories

We ran the report function from the v1.0.0 tag locally with real PR records from the public GitHub API. These checks used read-only access and did not install the Action in the upstream projects.

| Rollback PR | What v1.0.0 reported | What the result means |
|---|---|---|
| [OpenVINO #40081](https://github.com/openvinotoolkit/openvino/pull/40081) | Recognized the rollback of GPU BF16 TopK support in [#39655](https://github.com/openvinotoolkit/openvino/pull/39655). | Scanned 27 PRs targeting `releases/2026/5`. No explicitly linked open or merged backport was found. |
| [GoogleTest #2609](https://github.com/google/googletest/pull/2609) | Read the title `Revert #2596` and identified the [MSVC workaround change](https://github.com/google/googletest/pull/2596). | Scanned 4 PRs targeting `v1.10.x`. No explicitly linked open or merged backport was found. |
| [OpenVINO #39654](https://github.com/openvinotoolkit/openvino/pull/39654) | Skipped before scanning release branches. | The body starts with `temporary reverts`. Version 1.0.0 expects the rollback marker at the start of a title or body line. |
| [pandas #71981](https://github.com/pandas-dev/pandas/pull/71981) | Identified original [#71883](https://github.com/pandas-dev/pandas/pull/71883). No linked open or merged backport on `3.1.x`. | The linked [backport #71982](https://github.com/pandas-dev/pandas/pull/71982) was closed without merging. The Action correctly excluded it. |
| [CPython #161988](https://github.com/python/cpython/pull/161988) | Skipped before scanning release branches. | The rollback uses `Reverts gh-161621`. Version 1.0.0 recognizes `Reverts #161621` and qualified GitHub references. |

The [live job summary](https://github.com/KPhanindraReddy/backport-revert-alert/actions/runs/45624196069) shows verified original and backport links alongside the OpenVINO, GoogleTest, and pandas rollback checks.

## Reference formats and limits

Start a title or body line with `Revert #412`, `Reverts owner/repo#412`, `Backport #412`, or `Backport of #412`. Qualified references must point to the same repository. Multiple rollback targets can be listed on separate lines. Treat these markers as declarations; keep them out of template examples.

The Action reads all pages of PR history on the configured base branches each time a rollback runs. Exact branch names only. Closed, unmerged PRs are ignored. Unmarked cherry-picks, commit-only reverts, and changes made directly to branches require manual review. A merged backport is a historical record, not proof that its code is still present. An API failure fails the run rather than reporting an empty result. In a busy repository, limit the configured list to supported release branches.

## License

MIT
