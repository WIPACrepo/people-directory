# HANDOFF — pyproject/CI modernization

**Status (2026-09-08):** Implementation essentially complete on branch `new-py`. Commits:
- `84a825c` Modernize to pyproject.toml + WIPAC CI
- `72496df` Fix lint findings (tz-aware datetimes, module loggers, sorted imports)
- `1822110` Pre-match setuptools-scm note (no bot churn)

## Done & verified
- **pyproject.toml** — validated: (1) `tomllib` parses; (2) **byte-identical to actual `wipac-dev-py-setup-action@v5.12` builder output** (ran its real `pyproject_toml_builder.py` locally against a repo copy with stubbed GitHub/semver — zero churn)
- **`people_directory/__init__.py`** — matches action output exactly (scm note at file end); py_compile OK
- **README.md** — matches action's badges/metadata output exactly (verified diff)
- **`.github/dependabot.yml`** — matches `ensure_dependabot.py` output exactly (verified diff)
- **Ruff** — `ruff 0.16.6 check people_directory/` → **All checks passed!** (fixed 13 pre-existing: I001 sorted imports, LOG015 module loggers, DTZ003→UTC-aware `datetime.now(UTC)`, UP017 `datetime.UTC`, TRY002 ValueError)
- **Workflows** — `wipac-cicd.yml` (new), `container.yml` (new), removed `wipac_cicd.yaml`/`docker.yaml`; manual diff vs iceprod shows only intended deviations (PACKAGING, no redis/mongo services, smoke tests, no PYPI_TOKEN, BUILD mode, default lint thresholds)
- **Dockerfile** — python:3.14, targeted COPY, venv, `ARG VERSION`→`SETUPTOOLS_SCM_PRETEND_VERSION_FOR_PEOPLE_DIRECTORY`, bind-mounted `.git` with `pip install --no-cache .` (avoids `COPY .` guardrail error), CMD `python -m people_directory`
- **.dockerignore** — does NOT ignore `.git` (guardrail requires it)
- setup.cfg/setup.py deleted; setupenv.sh → `.[tests,mypy]`; CHANGELOG placeholder removed

## Remaining (next agent — low-priority polish)
1. Commit the **implementation working tree is already committed**; final step: update `PLAN.md`/handoff notes? PLAN.md still describes future intent — optional.
2. **`.gitattributes`** — currently no file; iceprod has `setup.cfg merge=ours` (obsolete for us). Optional to add nothing.
3. **Optional**: verify `people_directory/static/` packaging by building a wheel — requires pip/venv (sandbox lacks it). The `[tool.setuptools.package-data] "*" = ["py.typed", "static/*"]` is correct; the action's `_tool_setuptools_packagedata_star` preserves extra entries (verified in source), so no churn.
4. **Watch on first CI run**: (a) `py-versions` action parses `requires-python` → 3.12/3.13/3.14 matrix; (b) `py-setup` will run the same builder (already pre-matched) and may only touch README/init (now identical); (c) `tag-and-release` first release: existing tags (`1.0.13`, no `v`) — next-version-action computes `1.0.14` → tags `v1.0.14`; (d) `lint-python` runs `ty` — we have no `[tool.ty]` section (iceprod has one); ty may report many type errors on legacy code — may need `[tool.ty]` exclude or accept.
5. **Possible**: `docker-build` job in workflow currently `if: github.ref != master/main` — correct.
6. **Static asset serving**: `create_server` uses `static_path=.../static` and template_path — assets must be present in image; verify in a real docker build (CI `docker-build` does `push:false` build — but it does not run the container; smoke test optional).

## Key files
- `/home/dschultz/Documents/github/people-directory` (branch `new-py`)
- Scratch (sandbox): `/tmp/pi-agent-tmp/tmp.q9mnCCvcc8/` — `psa/` (py-setup-action), `pd-test/` (repo copy for builder verification), `ruff-bin` (ruff 0.16.6 aarch64), `tklib/`, `wipac_dev_tools-1.21.0/`, `iceprod-ref/`, `wipac-workflows/`, `pda/`, `pva/`
