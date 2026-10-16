# Repository policy and releases

New commits and PR/MR titles use Conventional Commits. Merges require successful
checks and a squash commit; the squash subject comes from the PR/MR title.
Existing licenses remain authoritative; new otherwise-unspecified work uses MIT.

Use the existing project's release pipeline when it already uses svu and chglog.
The standalone fallback below does not replace project-specific packaging.

1. Fetch current tags: `git fetch --tags origin`.
2. Install tools: `python3 .repo-policy/release.py install`.
3. Inspect the next version: `python3 .repo-policy/release.py next`.
4. Prepare changelogs: `python3 .repo-policy/release.py changelog`.
5. Review and commit the generated changelog through normal CI and merge policy.
6. On the verified, clean release commit, explicitly create the local tag with
   `python3 .repo-policy/release.py tag`, then push only that tag when authorized.

Use `python` on Windows. Task equivalents are available through
`task -t .repo-policy/Taskfile.yml version:next` (and `tools`, `changelog`, `tag`).
Set `PYTHON=python` for Task on Windows. No bootstrap, policy check, or ordinary
sync automatically publishes a release or rewrites historical tags/changelogs.

GitHub uses squash-only merging plus required linear history, its closest
equivalent to GitLab fast-forward-with-squash. Without Enterprise commit metadata
rules, GitHub CI rejects nonconventional commits before merge, not before push.
