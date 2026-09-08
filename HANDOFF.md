# HANDOFF — pyproject/CI modernization plan

**Status (2026-09-08):** PLAN.md written and committed. No code changes made (user requested plan only).

## Done
- Analyzed current repo (`setup.cfg`/`setup.py`, `wipac_cicd.yaml`, `docker.yaml`, Dockerfile, source imports)
- Cloned and analyzed reference repo `WIPACrepo/iceprod` (pyproject.toml, wipac-cicd.yml, container.yml, docs.yml, Dockerfile)
- Cloned and analyzed `WIPACrepo/wipac-dev-workflows` (lint-python.yml, tag-and-release.yml, image-publish.yml) and helper actions (py-setup, py-versions, py-dependencies)
- Verified latest action versions and PyPI deps (wipac-dev-tools 1.21.0, krs 1.5.7, wipac-rest-tools 1.13.5, motor 3.7.1)
- Wrote full plan to `PLAN.md` (phases 1–6 + 8 open questions)

## Remaining (next agent)
- Get user answers to the 8 questions in PLAN.md §1 (Python range, PyPI publishing, motor dep, tests, Docker/CVMFS, filename, setup.py, ruff rules)
- Execute phases when user approves: pyproject.toml, version handling, GHA rewrite, Dockerfile, misc files

## Notes
- Repo work dir is read-only for `ls` on parent dirs; scratch clones live in `/tmp/pi-agent-tmp/<tmpdir>/` (sandboxed)
- Branch: `new-py` (clean tree before PLAN.md)
