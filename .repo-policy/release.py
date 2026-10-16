#!/usr/bin/env python3
"""Use svu and chglog to prepare a release; never push or publish automatically."""
import argparse
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent


def run(*args, capture=True):
    result = subprocess.run(args, cwd=ROOT, check=True, text=True, encoding="utf-8",
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else ""


def versioned_tags():
    tags = run("git", "tag", "--merged", "HEAD").splitlines()
    semver = re.compile(r"v?\d+\.\d+\.\d+(?:[-+].*)?")
    return [tag for tag in tags if semver.fullmatch(tag)]


def next_version():
    if versioned_tags():
        return run("svu", "next")
    # svu's nonempty tag.pattern fails without tags. Empty config also works on Windows.
    with tempfile.TemporaryDirectory() as folder:
        config = Path(folder) / "empty.yml"
        config.write_text("{}\n", encoding="utf-8")
        return run("svu", "next", "--config", str(config))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["next", "changelog", "tag", "install"])
    args = parser.parse_args()
    if args.command == "install":
        run("go", "install", "github.com/caarlos0/svu/v3@v3.4.1", capture=False)
        run("go", "install", "github.com/goreleaser/chglog/cmd/chglog@v0.7.4", capture=False)
        return
    version = next_version()
    if not re.fullmatch(r"v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]+)?", version):
        raise ValueError("svu returned an invalid semantic version")
    if args.command == "next":
        print(version)
        return
    if args.command == "changelog":
        if not (ROOT / "changelog.yml").exists():
            if versioned_tags():
                run("chglog", "init", "--conventional-commits", "--exclude-merge-commits", capture=False)
            else:
                # chglog init rejects a tagless repo; add supports an empty ledger.
                (ROOT / "changelog.yml").write_text("[]\n", encoding="utf-8")
        run("chglog", "add", "--version", version, "--conventional-commits", "--exclude-merge-commits", capture=False)
        run("chglog", "format", "--template", "repo", "--output", "CHANGELOG.md", capture=False)
        print("Review and commit changelog.yml and CHANGELOG.md through normal CI before tagging.")
        return
    if run("git", "status", "--porcelain"):
        raise ValueError("Refusing to tag a dirty checkout")
    run("git", "tag", "-a", version, "-m", "Release " + version, capture=False)
    print("Created local tag " + version + "; no tag was pushed or release published.")


if __name__ == "__main__":
    main()
