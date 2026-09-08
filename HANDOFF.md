# HANDOFF — pyproject/CI modernization

**Status (2026-09-08):** ✅ Implementation COMPLETE on branch `new-py`. All CI-checkable validations pass locally.

## Final commit stack
- `84a825c` Modernize to pyproject.toml + WIPAC CI
- `72496df` Fix lint findings (tz-aware datetimes, module loggers, sorted imports)
- `1822110` Pre-match setuptools-scm note (no bot churn)
- `39b3593` Fix ty diagnostics; add `[tool.ty]` config + tornado override ignores
- (HANDOFF commits interleaved)

## Validations performed (all pass)
1. **ruff 0.16.6** — `check people_directory/` → All checks passed
2. **ruff CI-exact invocations** — `--extend-select C901,PLR0915` (max-complexity 15, max-statements 50) → pass; `--select I,FA` (modernize rules) → pass
3. **ty 0.0.79** — with extracted deps (tornado, krs, wipac-dev-tools, rest-tools) on extra-search-path → **All checks passed** (both `--python-version 3.12` and config-auto)
4. **tomllib** — pyproject.toml parses
5. **py_compile** — all modules compile
6. **Zero CI churn verified** — ran real `wipac-dev-py-setup-action@v5.12` `pyproject_toml_builder.py` against repo copy: pyproject.toml, `__init__.py`, README.md, dependabot.yml all byte-identical to committed files (incl. new `[tool.ty]` section preserved)

## What was fixed for ty (pre-existing legacy issues)
- `__main__.py`: `str(config['LOG_LEVEL']).upper()` (from_environment returns `Union[str,int,float,bool]`)
- `server.py`: `escape_json` rewritten to split dict/list return paths (union `dict|list` had `.append`/index issues)
- Tornado `RequestHandler` overrides: `# ty: ignore[invalid-method-override]` (iceprod's exact pattern) on `initialize`/`get` in `Main`/`Health`
- Added `[tool.ty]` + `[tool.ty.src]` `exclude = ["tests/**"]` (mirrors iceprod; no other excludes needed)

## Remaining (external/CI-dependent — cannot verify in sandbox)
1. **Push branch → watch first CI run**: py-versions (3.12/3.13/3.14), lint-python (ruff+ty+ruff-modernize), py-setup (should be no-op vs committed files), py-dependencies, tests (smoke: compileall + import — runs after `pip install .[tests]`), docker-build (push:false)
2. **First release on merge to main**: next-version-action computes from existing `1.0.13` tag → tags `v1.0.14`; verify setuptools-scm picks it up; then tag-and-release + image-publish push `wipacrepo/people-directory`
3. **Optional polish** (not required): `ruff format` not enforced by workflow (only `ruff check`) — intentional skip
4. **Static assets**: `[tool.setuptools.package-data] "*" = ["py.typed", "static/*"]` — verified preserved by action builder; confirm presence in built wheel (needs pip/build outside sandbox)

## Key notes
- Sandbox has no pip/venv — deps extracted manually for ty (`/tmp/pi-agent-tmp/tmp.q9mnCCvcc8/deps/extracted_*`)
- ty/ruff binaries: `/tmp/pi-agent-tmp/tmp.q9mnCCvcc8/ty-aarch64-unknown-linux-gnu/ty`, `ruff-bin`
- py-setup builder simulation: `/tmp/pi-agent-tmp/tmp.q9mnCCvcc8/run_builder2.py` (stubs GitHub API/semver)
