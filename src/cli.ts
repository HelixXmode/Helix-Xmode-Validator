#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
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

  const validator = createValidator({
    format: argv.format,
    ruleset: argv.ruleset,
    strict: argv.strict
  });

  const result = await validator.validateFile(argv.path as string);
  if (argv.format === "json") {
    process.stdout.write(result.summary + "\n");
  } else {
    process.stdout.write(result.summary + "\n");
  }

  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

