import fs from "node:fs";
import path from "node:path";
import { runLinter } from "../core.mjs";

const fixturesRoot = path.resolve("linter/tests/fixtures");

const dirs = fs
  .readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

let failures = 0;

for (const name of dirs) {
  const fixtureDir = path.join(fixturesRoot, name);
  const expectedPath = path.join(fixtureDir, "expected.json");
  if (!fs.existsSync(expectedPath)) {
    continue;
  }

  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
  const result = runLinter({
    rootDir: fixtureDir,
    configPath: path.resolve("linter/fla-lint.config.json"),
    format: "json",
  });

  const payload = JSON.parse(result.output);
  const actualCount = payload.summary.errorCount;
  const expectedCount = expected.errorCount;
  let fixtureFailed = false;

  if (actualCount !== expectedCount) {
    fixtureFailed = true;
    failures += 1;
    process.stdout.write(
      `[FAIL] ${name}: expected errorCount=${expectedCount}, actual=${actualCount}\n`,
    );
  }

  if (expected.rules) {
    for (const [ruleId, count] of Object.entries(expected.rules)) {
      const actualRuleCount = payload.summary.ruleCounts[ruleId] || 0;
      if (actualRuleCount !== count) {
        fixtureFailed = true;
        failures += 1;
        process.stdout.write(
          `[FAIL] ${name}: expected ${ruleId}=${count}, actual=${actualRuleCount}\n`,
        );
      }
    }
  }

  if (!fixtureFailed) {
    process.stdout.write(`[PASS] ${name}\n`);
  }
}

if (failures > 0) {
  process.stdout.write(`Fixture tests failed: ${failures}\n`);
  process.exit(1);
}

process.stdout.write("All fixture tests passed.\n");
