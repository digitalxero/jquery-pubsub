#!/usr/bin/env python3
"""Validate new Conventional Commits and a PR/MR title without rewriting history."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys

SUBJECT = re.compile(r"[a-z][a-z0-9-]*(?:\([^()\r\n]+\))?!?: [^ \t\r\n][^\r\n]*")


def git(*args):
    return subprocess.run(["git", *args], check=True, text=True, encoding="utf-8", capture_output=True).stdout.strip()


def valid_subject(message):
    return bool(message and SUBJECT.fullmatch(message.splitlines()[0]))


def check(base=None, head=None, title=None):
    if title is not None and not valid_subject(title):
        raise ValueError("PR/MR title must be a Conventional Commit subject")
    head = head or "HEAD"
    # Resolve refs before constructing a revision range; never treat user input as options.
    head = git("rev-parse", "--verify", "--end-of-options", head + "^{commit}")
    if base and set(base) != {"0"}:
        base = git("rev-parse", "--verify", "--end-of-options", base + "^{commit}")
        commits = git("rev-list", base + ".." + head).splitlines()
    else:
        # Audit from policy introduction on a new branch/initial push. This checks all
        # introduced commits while leaving imported history before adoption alone.
        introduced = git("log", "--reverse", "--diff-filter=A", "--format=%H", head,
                         "--", ".repo-policy/check.py").splitlines()
        parents = git("rev-list", "--parents", "-n", "1", introduced[0]).split()[1:] if introduced else []
        commits = git("rev-list", head, *("^" + p for p in parents)).splitlines()
    failures = []
    for commit in commits:
        message = git("show", "-s", "--format=%B", commit)
        if not valid_subject(message):
            failures.append(commit[:12] + ": " + message.splitlines()[0])
    if failures:
        raise ValueError("Nonconventional new commits:\n" + "\n".join(failures))
    root = Path(__file__).resolve().parent.parent
    if not (root / ".repo-policy/release.py").is_file():
        raise ValueError("Missing svu/chglog release helper")
    print(f"Validated {len(commits)} new commit(s) and repository policy")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base")
    parser.add_argument("--head")
    parser.add_argument("--title")
    args = parser.parse_args()
    base, head, title = args.base, args.head, args.title
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if event_path:
        event = json.loads(Path(event_path).read_text(encoding="utf-8"))
        if "pull_request" in event:
            pr = event["pull_request"]
            base, head, title = pr["base"]["sha"], pr["head"]["sha"], pr["title"]
        else:
            base, head = event.get("before"), event.get("after")
    if os.environ.get("GITLAB_CI"):
        base = os.environ.get("CI_MERGE_REQUEST_DIFF_BASE_SHA") or os.environ.get("CI_COMMIT_BEFORE_SHA")
        head = os.environ.get("CI_COMMIT_SHA")
        title = os.environ.get("CI_MERGE_REQUEST_TITLE")
    check(base, head, title)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
