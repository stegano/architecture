#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import { runLinter } from "./core.mjs";

const printHelp = () => {
  process.stdout.write(`Usage:
  node linter/cli.mjs [rootDir] [--config <path>] [--format json|text] [--root <dir>] [--fail-on-warn]

Options:
  --config <path>     Use config file (relative to rootDir)
  --format json|text  Output format (default: json)
  --root <dir>        Alias for rootDir
  --fail-on-warn      Exit with code 1 when errors found
  --help              Print this help
`);
};

const printHintRootCandidates = (cwd) => {
  const candidates = [
    "src",
    "linter/tests/fixtures/fail-basic",
    ".",
    "linter/tests",
  ];

  const existing = candidates
    .filter((candidate) => {
      const p = path.resolve(cwd, candidate);
      try {
        return fs.statSync(p).isDirectory();
      } catch {
        return false;
      }
    })
    .map((candidate) => path.resolve(cwd, candidate));

  if (existing.length === 0) {
    return;
  }

  process.stderr.write("Hint: you can try one of these existing directories:\n");
  for (const p of existing) {
    process.stderr.write(`  - ${p}\n`);
  }
};

const parseArgs = (argv) => {
  const options = {
    rootDir: process.cwd(),
    configPath: undefined,
    format: "json",
    failOnWarn: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--config") {
      options.configPath = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--root") {
      const value = argv[i + 1];
      if (typeof value === "string") {
        options.rootDir = path.resolve(process.cwd(), value);
        i += 1;
      }
      continue;
    }

    if (token === "--format") {
      const value = argv[i + 1];
      options.format = value === "json" ? "json" : "text";
      i += 1;
      continue;
    }

    if (token === "--fail-on-warn") {
      options.failOnWarn = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }

    if (!token.startsWith("-")) {
      options.rootDir = path.resolve(process.cwd(), token);
    }
  }

  return options;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  try {
    const rootStat = fs.statSync(options.rootDir);
    if (!rootStat.isDirectory()) {
      process.stderr.write(`Error: root path is not a directory: ${options.rootDir}\n`);
      printHintRootCandidates(process.cwd());
      process.exit(1);
    }
  } catch {
    process.stderr.write(`Error: root path is not accessible: ${options.rootDir}\n`);
    printHintRootCandidates(process.cwd());
    process.exit(1);
  }

  const result = runLinter({
    rootDir: options.rootDir,
    configPath: options.configPath,
    format: options.format,
  });

  process.stdout.write(`${result.output}\n`);

  if (options.failOnWarn) {
    process.exit(result.exitCode > 0 ? 1 : 0);
  }

  process.exit(result.exitCode);
};

main();
