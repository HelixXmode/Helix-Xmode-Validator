#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { stat } from "node:fs/promises";
import { createValidator } from "./index";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("helix-validate")
    .usage("$0 <path> [options]")
    .positional("path", {
      type: "string",
      describe: "Path to Helix config (JSON)",
      demandOption: true
    })
    .option("format", {
      choices: ["text", "json"] as const,
      default: "text",
      describe: "Output format"
    })
    .option("ruleset", {
      type: "string",
      describe: "Ruleset name (e.g., default, strict)"
    })
    .option("strict", {
      type: "boolean",
      default: false,
      describe: "Fail on warnings"
    })
    .help()
    .parse();

  const filePath = argv.path as string;

  // Early validation: check if file exists before creating validator
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      // eslint-disable-next-line no-console
      console.error(`Error: Path is not a file: ${filePath}`);
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const validator = createValidator({
    format: argv.format,
    ruleset: argv.ruleset,
    strict: argv.strict
  });

  const result = await validator.validateFile(filePath);
  
  // Optimize: avoid string concatenation for output
  const output =
    argv.format === "json"
      ? JSON.stringify(result, null, 2)
      : result.summary;
  process.stdout.write(output + "\n");

  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

