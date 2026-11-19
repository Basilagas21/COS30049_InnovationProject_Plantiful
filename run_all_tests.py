#!/usr/bin/env python3
"""Run every Plantiful test suite and print one pass/fail summary.

Usage (from the repository root):
    python3 run_all_tests.py              # unit tests, lint and type checks
    python3 run_all_tests.py --coverage   # also measure line coverage
    python3 run_all_tests.py --live       # also run the Supabase security checks
                                          # (needs web/.env or web/.env.local)
    python3 run_all_tests.py --e2e        # also run the Playwright browser flows
    python3 run_all_tests.py --all        # everything above

Missing node_modules are installed automatically. Results are also written to
test-results/summary.html (screenshot-friendly) and test-results/summary.md.
Only the Python standard library is used.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "test-results"
COVERAGE_EXCLUDE = '--test-coverage-exclude="**/*.test.mjs" --test-coverage-exclude="**/test-stubs/**"'


@dataclass
class Suite:
    area: str
    name: str
    kind: str
    cwd: str
    command: str
    parser: str  # "node", "unittest", "exit", "playwright"
    env: dict = field(default_factory=dict)
    skip_reason: str | None = None


@dataclass
class Result:
    suite: Suite
    status: str  # "PASS", "FAIL", "SKIP"
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    seconds: float = 0.0
    note: str = ""
    coverage: str = ""
    output: str = ""

    @property
    def total(self) -> int:
        return self.passed + self.failed + self.skipped


# ---------------------------------------------------------------- helpers

def colour(text: str, code: str) -> str:
    if not sys.stdout.isatty() and not os.environ.get("FORCE_COLOR"):
        return text
    return f"\033[{code}m{text}\033[0m"


STATUS_COLOUR = {"PASS": "1;32", "FAIL": "1;31", "SKIP": "1;33"}


def npm_script(folder: str, name: str) -> str:
    scripts = json.loads((ROOT / folder / "package.json").read_text())["scripts"]
    return scripts[name]


def with_coverage(test_cmd: str) -> str:
    """Turn a `node ... --test files` script into its coverage variant."""
    return test_cmd.replace(" --test ", f" --experimental-test-coverage {COVERAGE_EXCLUDE} --test ", 1)


def find_env_file() -> Path | None:
    for name in ("web/.env", "web/.env.local", "mobile/.env"):
        if (ROOT / name).exists():
            return ROOT / name
    return None


def ensure_node_modules(folder: str, extra: str = "") -> None:
    if (ROOT / folder / "node_modules").exists():
        return
    print(colour(f"Installing {folder} dependencies (first run only)...", "2"))
    subprocess.run(f"npm ci --no-audit --no-fund {extra}", shell=True, cwd=ROOT / folder,
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, check=False)


# ---------------------------------------------------------------- suites

def build_suites(args) -> list[Suite]:
    web_test = npm_script("web", "test")
    mobile_test = npm_script("mobile", "test")
    if args.coverage:
        web_test, mobile_test = with_coverage(web_test), with_coverage(mobile_test)

    suites = [
        Suite("Web", "Web unit and API tests", "Unit", "web", web_test, "node"),
        Suite("Web", "Web lint (ESLint)", "Static", "web", "npx eslint", "exit"),
        Suite("Web", "Web type check (TypeScript)", "Static", "web",
              f"npx next typegen >{os.devnull} && npx tsc --noEmit", "exit"),
        Suite("Mobile", "Mobile unit tests", "Unit", "mobile", mobile_test, "node"),
        Suite("Mobile", "Mobile lint (Expo ESLint)", "Static", "mobile", "npx expo lint", "exit"),
        Suite("Mobile", "Mobile type check (TypeScript)", "Static", "mobile", "npx tsc --noEmit", "exit"),
        Suite("Mobile", "Mobile acceptance metrics", "Unit", "mobile/scripts",
              f'"{sys.executable}" -m unittest -v test_summarize_acceptance', "unittest"),
        Suite("IoT", "IoT bridge, alerts and recovery", "Unit", "iot",
              f'"{sys.executable}" -m unittest discover -v -s . -p "test_*.py"', "unittest"),
        Suite("AI", "AI dataset photo filter", "Unit", "Ai/research",
              "node --test collect-candidates.test.mjs", "node"),
    ]

    # Database row-level security battery: needs Docker and the migrations
    # folder, which is kept out of git, so it only runs where both exist.
    rls = Suite("Backend", "Database RLS policies (pgTAP)", "Security", ".",
                "bash backend/tests/local/run.sh", "pgtap")
    if not (ROOT / "backend/supabase/migrations/001_schema.sql").exists():
        rls.skip_reason = "backend/supabase/migrations not in this checkout"
    elif not shutil.which("docker"):
        rls.skip_reason = "Docker not installed"
    suites.append(rls)

    env_file = find_env_file()
    if args.live:
        for flag, label in (("PUBLIC_READ_LIVE", "Live: visitors only see published data"),
                            ("ANON_MUTATION_LIVE", "Live: visitors cannot change data")):
            file = "public-read-api" if flag == "PUBLIC_READ_LIVE" else "anon-mutation-api"
            s = Suite("Security", label, "Security", "web",
                      f"node --test src/lib/{file}.test.mjs", "node", env={flag: "1"})
            if not env_file:
                s.skip_reason = "no web/.env or web/.env.local with Supabase keys"
            suites.append(s)

    if args.e2e:
        s = Suite("Web", "Browser flows (Playwright)", "End-to-end", "web",
                  "npx playwright test --reporter=list", "playwright")
        chrome = os.environ.get("PW_EXECUTABLE", "/usr/bin/google-chrome")
        if not env_file:
            s.skip_reason = "no web/.env or web/.env.local"
        elif not Path(chrome).exists():
            alt = "/opt/pw-browsers/chromium"
            if Path(alt).exists():
                s.env = {"PW_EXECUTABLE": alt}
            else:
                s.skip_reason = f"Chrome not found at {chrome} (set PW_EXECUTABLE)"
        suites.append(s)
    return suites


# ---------------------------------------------------------------- parsing

def parse(result: Result, code: int) -> None:
    out = result.output
    p = result.suite.parser
    if p == "node":
        def grab(key):
            m = re.findall(rf"^[#ℹ] {key} (\d+)", out, re.M)
            return int(m[-1]) if m else 0
        result.passed, result.failed, result.skipped = grab("pass"), grab("fail"), grab("skipped")
        cov = re.findall(r"all files\s*\|\s*([\d.]+)", out)
        if cov:
            result.coverage = f"{cov[-1]}% lines"
    elif p == "unittest":
        ran = re.search(r"Ran (\d+) tests?", out)
        total = int(ran.group(1)) if ran else 0
        fails = sum(int(n) for n in re.findall(r"(?:failures|errors)=(\d+)", out))
        skips = sum(int(n) for n in re.findall(r"skipped=(\d+)", out))
        result.failed, result.skipped = fails, skips
        result.passed = max(total - fails - skips, 0)
    elif p == "playwright":
        for key, attr in (("passed", "passed"), ("failed", "failed"), ("skipped", "skipped")):
            m = re.search(rf"(\d+) {key}", out)
            setattr(result, attr, int(m.group(1)) if m else 0)
    elif p == "pgtap":
        result.passed = len(re.findall(r"^\s*ok \d+", out, re.M))
        result.failed = len(re.findall(r"^\s*not ok \d+", out, re.M))
    else:  # "exit": lint / type check, one check that passes or fails
        problems = re.search(r"(\d+) problems?", out)
        errors = len(re.findall(r"error TS\d+", out))
        result.passed, result.failed = (1, 0) if code == 0 else (0, 1)
        if code != 0:
            result.note = f"{problems.group(1)} problems" if problems else (
                f"{errors} type errors" if errors else "see output")
        else:
            result.note = "no errors"

    if code != 0 and result.failed == 0:
        result.failed = 1
        result.note = result.note or f"exit code {code}"
    result.status = "FAIL" if result.failed else "PASS"
    if result.status == "PASS" and result.passed == 0 and result.skipped:
        result.status = "SKIP"
        result.note = skip_note(out)
    if result.status == "PASS" and result.skipped and not result.note:
        result.note = skip_note(out)


def skip_note(out: str) -> str:
    reasons = set(re.findall(r"# SKIP (.+)", out))
    if any("LIVE=1" in r for r in reasons):
        return "live Supabase checks run separately with --live"
    return "; ".join(sorted(reasons))[:80]


def run(suite: Suite) -> Result:
    if suite.skip_reason:
        return Result(suite, "SKIP", note=suite.skip_reason)
    env = {**os.environ, **suite.env, "NO_COLOR": "1", "FORCE_COLOR": "0", "CI": "1"}
    env.pop("NODE_TEST_CONTEXT", None)
    start = time.time()
    proc = subprocess.run(suite.command, shell=True, cwd=ROOT / suite.cwd, env=env,
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                          encoding="utf-8", errors="replace")
    result = Result(suite, "PASS", seconds=time.time() - start, output=proc.stdout)
    parse(result, proc.returncode)
    return result


# ---------------------------------------------------------------- reports

def git_info() -> tuple[str, str]:
    def git(*a):
        try:
            return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        except OSError:
            return ""
    return git("rev-parse", "--abbrev-ref", "HEAD") or "?", git("log", "-1", "--format=%h %cd", "--date=short") or "?"


def print_summary(results: list[Result], elapsed: float) -> None:
    w = max(len(r.suite.name) for r in results) + 2
    line = "─" * (w + 46)
    print("\n" + colour("PLANTIFUL TEST SUMMARY", "1"))
    print(line)
    print(f"{'Status':<8}{'Suite':<{w}}{'Pass':>6}{'Fail':>6}{'Skip':>6}{'Time':>8}  Note")
    print(line)
    for r in results:
        status = colour(f"{r.status:<8}", STATUS_COLOUR[r.status])
        note = r.coverage + (" · " if r.coverage and r.note else "") + r.note
        t = f"{r.seconds:.1f}s" if r.status != "SKIP" else "-"
        print(f"{status}{r.suite.name:<{w}}{r.passed:>6}{r.failed:>6}{r.skipped:>6}{t:>8}  {note}")
    print(line)
    tp, tf, ts = (sum(getattr(r, a) for r in results) for a in ("passed", "failed", "skipped"))
    ran = [r for r in results if r.status != "SKIP"]
    ok = sum(r.status == "PASS" for r in ran)
    verdict = colour("ALL PASSED", "1;32") if tf == 0 else colour(f"{tf} FAILED", "1;31")
    print(f"{verdict}  {ok}/{len(ran)} suites passed · {tp} passed · {tf} failed · {ts} skipped · {elapsed:.1f}s")
    print(f"Report: {OUT_DIR / 'summary.html'}")


def write_markdown(results: list[Result], stamp: str, branch: str, commit: str) -> None:
    rows = ["| Status | Area | Suite | Passed | Failed | Skipped | Time | Note |",
            "|---|---|---|---:|---:|---:|---:|---|"]
    for r in results:
        note = " · ".join(x for x in (r.coverage, r.note) if x)
        rows.append(f"| {r.status} | {r.suite.area} | {r.suite.name} | {r.passed} | {r.failed} | "
                    f"{r.skipped} | {r.seconds:.1f}s | {note} |")
    (OUT_DIR / "summary.md").write_text(
        f"# Plantiful test results\n\nRun {stamp} on `{branch}` at `{commit}`.\n\n" + "\n".join(rows) + "\n")


def write_html(results: list[Result], stamp: str, branch: str, commit: str, elapsed: float) -> None:
    tp, tf, ts = (sum(getattr(r, a) for r in results) for a in ("passed", "failed", "skipped"))
    ran = [r for r in results if r.status != "SKIP"]
    ok = sum(r.status == "PASS" for r in ran)
    areas = []
    for r in results:
        if r.suite.area not in areas:
            areas.append(r.suite.area)

    area_cards = []
    for a in areas:
        rs = [r for r in results if r.suite.area == a and r.status != "SKIP"]
        if not rs:
            continue
        p = sum(r.passed for r in rs)
        f = sum(r.failed for r in rs)
        cls = "bad" if f else "good"
        area_cards.append(f'<div class="area {cls}"><div class="aname">{html.escape(a)}</div>'
                          f'<div class="anum">{p}<span>/{p + f}</span></div><div class="alab">checks passed</div></div>')

    body_rows = []
    for r in results:
        note = " · ".join(x for x in (r.coverage, r.note) if x)
        t = f"{r.seconds:.1f}s" if r.status != "SKIP" else "–"
        detail = ""
        if r.status == "FAIL":
            tail = "\n".join(r.output.strip().splitlines()[-40:])
            detail = f'<tr class="detail"><td colspan="8"><pre>{html.escape(tail)}</pre></td></tr>'
        body_rows.append(
            f'<tr><td><span class="pill {r.status.lower()}">{r.status}</span></td>'
            f'<td class="muted">{html.escape(r.suite.area)}</td><td>{html.escape(r.suite.name)}</td>'
            f'<td class="muted">{html.escape(r.suite.kind)}</td>'
            f'<td class="n">{r.passed}</td><td class="n {"redt" if r.failed else ""}">{r.failed}</td>'
            f'<td class="n muted">{r.skipped}</td><td class="n muted">{t}</td></tr>'
            + (f'<tr class="note"><td></td><td colspan="7">{html.escape(note)}</td></tr>' if note else "")
            + detail)

    verdict = "All suites passed" if tf == 0 else f"{tf} check(s) failed"
    vcls = "good" if tf == 0 else "bad"
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plantiful Test Results</title>
<style>
:root {{ --bg:#f5f7f2; --card:#fff; --ink:#1d2a1f; --muted:#6b776c; --line:#e3e8df;
  --green:#2f7d4f; --greenbg:#e3f3e8; --red:#b42318; --redbg:#fde8e6; --amber:#9a6700; --amberbg:#fff4d6; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--bg); color:var(--ink); font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }}
.wrap {{ max-width:1180px; margin:0 auto; padding:28px 24px 40px; }}
header {{ display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; margin-bottom:20px; }}
h1 {{ margin:0; font-size:28px; letter-spacing:-.01em; }}
h1 span {{ color:var(--green); }}
.meta {{ color:var(--muted); font-size:13px; text-align:right; }}
.hero {{ display:grid; grid-template-columns:1.4fr repeat(3,1fr); gap:14px; margin-bottom:14px; }}
.tile {{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px 18px; }}
.tile .big {{ font-size:34px; font-weight:700; line-height:1.1; }}
.tile .lab {{ color:var(--muted); font-size:13px; margin-top:4px; }}
.verdict.good {{ background:var(--green); color:#fff; border-color:var(--green); }}
.verdict.bad {{ background:var(--red); color:#fff; border-color:var(--red); }}
.verdict .lab {{ color:rgba(255,255,255,.85); }}
.areas {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:14px; margin-bottom:18px; }}
.area {{ background:var(--card); border:1px solid var(--line); border-left:5px solid var(--green); border-radius:12px; padding:12px 14px; }}
.area.bad {{ border-left-color:var(--red); }}
.aname {{ font-weight:600; }}
.anum {{ font-size:26px; font-weight:700; }} .anum span {{ font-size:15px; color:var(--muted); font-weight:500; }}
.alab {{ color:var(--muted); font-size:12px; }}
table {{ width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; }}
th {{ text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); background:#fafbf8; padding:10px 12px; border-bottom:1px solid var(--line); }}
td {{ padding:9px 12px; border-top:1px solid var(--line); vertical-align:top; }}
tr.note td, tr.detail td {{ border-top:none; padding-top:0; color:var(--muted); font-size:13px; }}
.n {{ text-align:right; font-variant-numeric:tabular-nums; }} th.n {{ text-align:right; }}
.muted {{ color:var(--muted); }} .redt {{ color:var(--red); font-weight:700; }}
.pill {{ display:inline-block; min-width:48px; text-align:center; font-size:12px; font-weight:700; padding:2px 8px; border-radius:999px; }}
.pill.pass {{ background:var(--greenbg); color:var(--green); }}
.pill.fail {{ background:var(--redbg); color:var(--red); }}
.pill.skip {{ background:var(--amberbg); color:var(--amber); }}
pre {{ white-space:pre-wrap; background:#1e1e1e; color:#eee; padding:10px; border-radius:8px; font-size:12px; max-height:320px; overflow:auto; }}
footer {{ color:var(--muted); font-size:12px; margin-top:14px; }}
@media (max-width:760px) {{ .hero {{ grid-template-columns:1fr 1fr; }} .meta {{ text-align:left; }} td:nth-child(2), th:nth-child(2), td:nth-child(4), th:nth-child(4) {{ display:none; }} }}
</style></head><body><div class="wrap">
<header><h1><span>Plantiful</span> automated test results</h1>
<div class="meta">Run {html.escape(stamp)}<br>Branch {html.escape(branch)} · commit {html.escape(commit)}</div></header>
<section class="hero">
  <div class="tile verdict {vcls}"><div class="big">{verdict}</div><div class="lab">{ok} of {len(ran)} suites passed in {elapsed:.0f}s</div></div>
  <div class="tile"><div class="big" style="color:var(--green)">{tp}</div><div class="lab">checks passed</div></div>
  <div class="tile"><div class="big" style="color:{'var(--red)' if tf else 'var(--ink)'}">{tf}</div><div class="lab">checks failed</div></div>
  <div class="tile"><div class="big" style="color:var(--amber)">{ts}</div><div class="lab">skipped</div></div>
</section>
<section class="areas">{''.join(area_cards)}</section>
<table><thead><tr><th>Status</th><th>Area</th><th>Suite</th><th>Type</th><th class="n">Passed</th><th class="n">Failed</th><th class="n">Skipped</th><th class="n">Time</th></tr></thead>
<tbody>{''.join(body_rows)}</tbody></table>
<footer>Generated by run_all_tests.py. Lint and type checks count as one check each.</footer>
</div></body></html>"""
    (OUT_DIR / "summary.html").write_text(page, encoding="utf-8")


# ---------------------------------------------------------------- main

def main() -> int:
    # Windows consoles default to a legacy code page; keep the table readable.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    if os.name == "nt":
        os.system("")  # turn on ANSI colours in the Windows console
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--coverage", action="store_true", help="measure line coverage for web and mobile")
    ap.add_argument("--live", action="store_true", help="run Supabase security checks (needs web/.env)")
    ap.add_argument("--e2e", action="store_true", help="run Playwright browser flows (needs web/.env)")
    ap.add_argument("--all", action="store_true", help="coverage + live + e2e")
    ap.add_argument("--only", help="comma-separated areas to run, e.g. web,iot")
    args = ap.parse_args()
    if args.all:
        args.coverage = args.live = args.e2e = True

    ensure_node_modules("web")
    ensure_node_modules("mobile", "--legacy-peer-deps")

    suites = build_suites(args)
    if args.only:
        wanted = {a.strip().lower() for a in args.only.split(",")}
        suites = [s for s in suites if s.area.lower() in wanted]

    OUT_DIR.mkdir(exist_ok=True)
    shutil.rmtree(OUT_DIR / "logs", ignore_errors=True)
    start = time.time()
    results = []
    for s in suites:
        print(f"{colour('▶', '36')} {s.name} ...", end=" ", flush=True)
        r = run(s)
        extra = f"{r.passed} passed" + (f", {r.failed} failed" if r.failed else "") if r.status != "SKIP" else r.note
        print(colour(r.status, STATUS_COLOUR[r.status]), colour(f"({extra})", "2"))
        results.append(r)
        log = OUT_DIR / "logs"
        log.mkdir(exist_ok=True)
        (log / (re.sub(r"[^a-z0-9]+", "-", s.name.lower()).strip("-") + ".log")).write_text(r.output, encoding="utf-8")
    elapsed = time.time() - start

    # The web unit run skips the live checks that the Security rows run on
    # their own; once those ran, do not count the same checks as skipped.
    live_ran = [r for r in results if r.suite.area == "Security" and r.status != "SKIP"]
    if live_ran:
        for r in results:
            if r.suite.name == "Web unit and API tests" and r.skipped:
                r.skipped = 0
                r.note = "live checks counted in the Security rows"

    branch, commit = git_info()
    stamp = datetime.now().strftime("%d %b %Y, %H:%M")
    write_html(results, stamp, branch, commit, elapsed)
    write_markdown(results, stamp, branch, commit)
    print_summary(results, elapsed)
    return 1 if any(r.status == "FAIL" for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
