# HANDOFF — pyproject/CI modernization plan

**Status (2026-09-08):** PLAN.md rewritten with all 8 owner decisions addressed. No code changes yet (user asked for plan only).

## Decisions confirmed
1. Python range → `>=3.12, <3.15` (3.10 EOL Oct 2026)
2. Keep unpublished (mode PACKAGING, no PyPI token)
3. Keep `motor` dependency
4. Tests → smoke/import check only (no pytest, no coverage gate)
5. Docker → BUILD only (no CVMFS)
6. Rename workflow to `wipac-cicd.yml`; delete `docker.yaml`
7. Delete `setup.py`
8. ruff-modernize-rules defaults (I,FA; max-complexity 15; max-statements 50)

## Done
- Analyzed current repo + iceprod reference + wipac-dev-workflows reusable workflows + helper actions + PyPI dep versions
- Wrote full plan in PLAN.md (phases 1–6, risks)

## Remaining (next agent, when approved)
- Execute: create pyproject.toml, remove __version__/version_info, rewrite workflows (wipac-cicd.yml, delete docker.yaml, optional container.yml), update Dockerfile (python:3.14, setuptools-scm + ARG VERSION), delete setup.py, update setupenv.sh
- Validate: local install/build (static/ packaging), ruff/ty, branch CI run, release pipeline

## Notes
- Scratch clones live in /tmp/pi-agent-tmp/<tmpdir>/ (sandboxed); repo is /home/dschultz/Documents/github/people-directory
- Branch: new-py; PLAN.md + HANDOFF.md committed (co-authored by AI)
