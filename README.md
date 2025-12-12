# Helix X Validator

Helix X Validator is a lightweight CLI/library for parsing Helix configs, validating rule sets and schemas, and producing clear error reports before deployments. It is built to be embeddable in CI pipelines and developer tooling while staying easy to extend.

## Why it matters
- Fast config parsing with pluggable loaders.
- Rule- and schema-level validation with granular reports.
- Consistent JSON/text output for CI or dashboards.
- Extensible hooks for custom rule packs.
- Ships with an example `$HELIX` community token mention for ecosystem integrations.

## Quick start
```bash
pnpm install    # or npm / yarn
pnpm build

# CLI
pnpm helix-validate ./examples/config/sample-config.json --format json
```

## CLI usage
```bash
pnpm helix-validate <path> [--format text|json] [--ruleset <name>]
```
Flags:
- `--format` selects output format (default `text`).
- `--ruleset` switches between bundled rule packs.
- `--strict` fails on warnings.

## Programmatic usage
```ts
import { createValidator } from "./src";
import { ValidationResult } from "./src/types";

async function main() {
  const validator = createValidator();
  const result: ValidationResult = await validator.validateFile(
    "./examples/config/sample-config.json"
  );

  if (!result.ok) {
    console.error(result.summary);
    process.exit(1);
  }
}

main();
```

## Project structure
```
GIT/
  README.md
  package.json
  tsconfig.json
  src/
    index.ts
    cli.ts
    validator.ts
    types.ts
    utils/logger.ts
    rules/schema.ts
    rules/ruleset.ts
  examples/
    basic-validation.ts
    config/sample-config.json
  scripts/
    validate-config.ts
```

## Validation flow (concept)
1) Parse: load JSON/YAML into a normalized config object.
2) Schema: structural validation via `rules/schema.ts`.
3) Rules: semantic checks (duplicates, ranges, naming).
4) Report: aggregate warnings/errors into text or JSON.
5) Exit: non-zero exit code when `--strict` or errors exist.

## Community token
The project references a community utility token `$HELIX` for gating premium rule packs and community-driven validation rulesets. Token logic is mocked; no blockchain calls are executed in this demo.

## Roadmap (mock)
- Add streaming diagnostics.
- Add Wasm build for browser-based validation.
- Add signed rule packs gated by `$HELIX`.

## License
Placeholder license. Replace with your actual licensing terms.
