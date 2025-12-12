# Helix X Validator

Helix X Validator is a lightweight CLI/library for parsing Helix configs, validating rule sets and schemas, and producing clear error reports before deployments. It is designed for CI friendliness, fast feedback, and extensibility via custom rule packs.

## Why it matters
- Fast parsing with pluggable loaders.
- Schema + semantic validation with granular reports.
- Consistent JSON/text output for CI or dashboards.
- Extensible hooks for custom rule packs.
- `$HELIX` token context for future ecosystem integrations.

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

## At a glance (mental map)
```
Helix X Validator
├─ Interfaces
│  ├─ CLI (yargs)
│  └─ Programmatic API (createValidator)
├─ Core
│  ├─ Parser/Loader (JSON)
│  ├─ Schema checks (schema.ts)
│  └─ Rule engine (ruleset.ts)
├─ Reporting
│  ├─ Text summary
│  └─ JSON output
├─ Tooling
│  ├─ Scripts (validate-config.ts)
│  ├─ Examples (basic-validation.ts)
│  └─ Roadmap: GH Action, VS Code extension, WASM
└─ Ecosystem
   └─ `$HELIX` token (concept) for gated rule packs
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
`$HELIX` is a conceptual community utility token associated with the validator ecosystem.

## Roadmap (draft)
- Rulepack SDK: plugin loader for custom validations with isolation and versioning.
- Stronger schema validation: JSON Schema + custom semantic validators.
- Deterministic rule signatures and optional `$HELIX`-gated premium rulepacks.
- Incremental/hashed validation for large configs and cached CI runs.
- GitHub Action template with status checks and PR annotations.
- VS Code extension: inline diagnostics and quick-fix hints.
- WASM build for browser/edge usage (no Node APIs).
- Performance budget with benchmarks and flamegraphs on CI.
- Opt-in telemetry with PII redaction and local-only mode by default.
- Signed release artifacts and SBOM generation for supply-chain hygiene.

## License
Placeholder license. Replace with your actual licensing terms.
