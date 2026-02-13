#!/usr/bin/env node
import { runLinter } from "./core.mjs";

const parseArgs = (argv) => {
  const options = {
    configPath: undefined,
    format: "text",
    failOnWarn: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--config") {
      options.configPath = argv[i + 1];
      i += 1;
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
  }

  return options;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const result = runLinter({
    rootDir: process.cwd(),
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
