"""Run the existing tool tests against their production modules."""
import ast
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
tools = root / "tools"
failures = []
for file in sorted(tools.rglob("*.py")):
    if any(part in {"node_modules", ".venv", "__pycache__", "session"} for part in file.parts):
        continue
    try:
        ast.parse(file.read_text(encoding="utf-8"), filename=str(file))
    except (SyntaxError, UnicodeError) as error:
        failures.append(str(error))
for family in sorted(tools.rglob("tests")):
    if not family.is_dir() or "node_modules" in family.parts:
        continue
    if list(family.glob("test*.py")):
        result = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", str(family), "-p", "test*.py"], cwd=family.parent)
        if result.returncode:
            failures.append(str(family.relative_to(root)))
    javascript = sorted([*family.glob("*.test.js"), *family.glob("*.test.mjs")])
    if javascript:
        result = subprocess.run(["node", "--test", *map(str, javascript)], cwd=family.parent)
        if result.returncode:
            failures.append(str(family.relative_to(root)))
for file in sorted([*tools.rglob("*.js"), *tools.rglob("*.mjs")]):
    if any(part in {"node_modules", "session", "assets"} for part in file.parts):
        continue
    result = subprocess.run(["node", "--input-type=module", "--check"], input=file.read_bytes(), capture_output=True)
    if result.returncode:
        failures.append(str(file.relative_to(root)) + ": " + result.stderr.decode())
for failure in failures:
    print("FAIL", failure)
print("Tool source and regression corpus:", "FAIL" if failures else "PASS")
sys.exit(bool(failures))
