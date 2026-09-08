# HANDOFF — pyproject/CI modernization (implementation in progress)

**Status (2026-09-08):** Partially implemented. Commit `84a825c` on branch `new-py`.

## Done (committed)
- `pyproject.toml` — created, TOML-validated with stdlib tomllib. PEP 621: `[build-system]` setuptools>=78.1 + setuptools-scm; `[project]` name/description/readme/license MIT, keywords WIPAC, classifiers 3.12/3.13/3.14, `requires-python = ">=3.12, <3.15"`, `dynamic = ["version"]`; deps = motor, tornado, wipac-dev-tools, wipac-keycloak-rest-services, wipac-rest-tools; `[project.optional-dependencies]` tests (coverage/pytest/pytest-asyncio/pytest-cov/pytest-mock/ruff) + mypy (auto-generated shape); authors; urls (GitHub only — no PyPI); `[tool.setuptools]` packages=[people_directory], package-data `"*" = ["py.typed","static/*"]`; `[tool.setuptools_scm]` fallback; `[tool.pytest.ini_options]` markers role; `[tool.coverage.*]` migrated; `[tool.ruff]`/`[tool.ruff.lint]`
- `people_directory/__init__.py` — removed `__version__`/`version_info`, added setuptools-scm note
- `.github/workflows/wipac-cicd.yml` — NEW (replaces `wipac_cicd.yaml`): py-versions@v2.8, lint-python@v1.33 (defaults I,FA; max-complexity 15; max-statements 50), py-setup@v5.12 (PACKAGING, py_min 3.12, py_max 3.14, package_dirs, author/keywords to prevent churn, auto_mypy), py-dependencies@v3.4, tests (smoke: compileall + import, no pytest), docker-build (push:false), release-version@v1.8, tag-and-release@v1.33 (publish-to-pypi:false, artifact py-dependencies-logs), image-publish@v1.33 (wipacrepo/people-directory, BUILD, VERSION build-arg, extra tag)
- `.github/workflows/container.yml` — NEW (manual workflow_dispatch → image-publish BUILD)
- Removed: `wipac_cicd.yaml`, `docker.yaml`, `setup.py`, `setup.cfg`
- `.github/dependabot.yml` — NEW (pip + github-actions weekly, matches py-setup action output)
- `Dockerfile` — python:3.14, app user gid/uid 1000, targeted COPY (pyproject/README/LICENSE/people_directory), venv in /app, ARG VERSION → SETUPTOOLS_SCM_PRETEND_VERSION_FOR_PEOPLE_DIRECTORY, `pip install --no-cache .` with bind-mounted .git, CMD python -m people_directory
- `.dockerignore` — excludes junk, does NOT exclude .git
- `README.md` — badges replaced w/ action-exact output (no PyPI/to kei), metadata section added (URLs only)
- `CHANGELOG.md` — removed `<!--next-version-placeholder-->`
- `setupenv.sh` — `pip install -e .[tests,mypy]`

## Validation done
- `py_compile` of all package modules: OK
- `tomllib` parse: OK
- Ruff 0.16.6 (aarch64 binary in /tmp/pi-agent-tmp/tmp.q9mnCCvcc8/ruff-bin) against `people_directory/`: **13 errors** — all pre-existing style/deprecation (e.g. DTZ003 utcnow, LOG015 root logger, B008, UP) EXCEPT the initial `W503/W504` config error (fixed — removed from ignore; ruff dropped those rules)

## Remaining (next agent)
1. **Decide ruff errors**: pre-existing 13 — add to `[tool.ruff.lint.ignore]` (to match old flake8 tolerance) or fix code. Recommend ignoring to keep diff minimal: likely codes = DTZ (utcnow), LOG015, B008 (default args), UP/SIM (e.g. datetime.utcnow, .items() usage), etc. Run: `/tmp/pi-agent-tmp/tmp.q9mnCCvcc8/ruff-bin check people_directory/` to enumerate.
2. **YAML lint sanity**: no yaml parser available in sandbox; visually verified workflows match iceprod syntax.
3. **Verify py-setup action will not churn**: compare generated output expectations — name derivation ("people-directory" from people_directory), deps sorted (motor, tornado, wipac-dev-tools, wipac-keycloak-rest-services, wipac-rest-tools = alphabetical ✓), package-data "*" (action keeps existing + ensures py.typed; we added static/* — action may rewrite to just py.typed? NOTE: `_tool_setuptools_packagedata_star` preserves existing entries, so static/* stays ✓), mypy extra = union of all extras (action regenerates: tests+coverage... = same ✓), authors/keywords preserved.
4. **Update HANDOFF/PLAN.md** after completion; report to user.
5. **Consider**: `.gitattributes` (setup.cfg merge=ours — now obsolete; optional), `UNKNOWN.egg-info/` (junk, gitignored, was already untracked), and whether `git safe.directory` bind-mount works for `pip install` with BuildKit (validate on CI).
6. **Possible gotcha**: `tag-and-release` requires git tags; existing tags are `1.0.13` (no `v`) — first release computes from them; watch first run.

## Notes
- Sandbox: no pip/venv/network installs; can only download binaries (ruff) to /tmp/pi-agent-tmp/
- Repo: /home/dschultz/Documents/github/people-directory; scratch: /tmp/pi-agent-tmp/tmp.q9mnCCvcc8/ (psa=py-setup-action src, iceprod-ref, wipac-workflows, pda, pva)
