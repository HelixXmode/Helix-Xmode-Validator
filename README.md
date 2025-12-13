# Helix X Validator

Helix X Validator is a lightweight CLI and library for parsing Helix configuration files, validating rule sets and schemas, and producing clear error reports before deployments. It is designed for CI/CD integration, fast feedback loops, and extensibility through a plugin system.

## Features

- **Multi-format support**: JSON and YAML configuration loading with encoding validation
- **Comprehensive validation**: Schema validation, semantic rule checks, and custom rule plugins
- **Flexible output**: Human-readable text or structured JSON formats
- **Extensible architecture**: Plugin system for custom validation rules
- **CI/CD ready**: Batch validation, exit codes, and CI-friendly output formats
- **Developer experience**: Clear error messages, colorized output, and detailed diagnostics

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Validate a configuration file
npm run helix-validate ./examples/config/sample-config.json --format json

# Or use the compiled binary directly
node dist/cli.js ./examples/config/sample-config.json
```

## Installation

```bash
npm install helix-x-validator
# or
pnpm add helix-x-validator
# or
yarn add helix-x-validator
```

## CLI Usage

```bash
helix-validate <path> [options]
```

### Options

- `--format <text|json>` - Output format (default: `text`)
- `--ruleset <name>` - Ruleset to use (e.g., `default`, `strict`)
- `--strict` - Treat warnings as errors

### Examples

```bash
# Basic validation
helix-validate config.json

# JSON output for CI/CD
helix-validate config.json --format json

# Strict mode (fail on warnings)
helix-validate config.json --strict

# Custom ruleset
helix-validate config.json --ruleset strict
```

## Programmatic Usage

```typescript
import { createValidator } from "helix-x-validator";
import { ValidationResult } from "helix-x-validator";

async function validateConfig() {
  const validator = createValidator({
    format: "json",
    strict: false,
    ruleset: "default"
  });

  const result: ValidationResult = await validator.validateFile(
    "./config/helix-config.json"
  );

  if (!result.ok) {
    console.error("Validation failed:");
    console.error(result.summary);
    
    // Access individual issues
    result.issues.forEach(issue => {
      console.error(`${issue.severity}: ${issue.path} - ${issue.message}`);
    });
    
    process.exit(1);
  }

  console.log("✓ Configuration is valid");
}

validateConfig();
```

## Architecture Overview

```
Helix X Validator
│
├── Entry Points
│   ├── CLI (src/cli.ts) - Command-line interface
│   └── Programmatic API (src/index.ts) - Library exports
│
├── Core Engine
│   ├── Validator (src/validator.ts) - Main validation orchestrator
│   ├── Types (src/types.ts) - TypeScript definitions
│   └── Configuration Resolver (src/utils/config-resolver.ts)
│
├── Loaders
│   ├── JSON Loader (src/loaders/json-loader.ts) - JSON file parsing
│   └── YAML Loader (src/loaders/yaml-loader.ts) - YAML file parsing
│
├── Validation Pipeline
│   ├── Schema Validator (src/rules/schema.ts) - Structural validation
│   ├── Ruleset Engine (src/rules/ruleset.ts) - Semantic rule checks
│   └── Plugin System (src/plugins/rule-plugin.ts) - Extensible rules
│
├── Output Formatters
│   ├── JSON Formatter (src/formatters/json-formatter.ts) - Structured output
│   └── Text Formatter (src/formatters/text-formatter.ts) - Human-readable output
│
├── Utilities
│   ├── Logger (src/utils/logger.ts) - Logging with levels and colors
│   └── Error Handler (src/utils/error-handler.ts) - Error management
│
├── Development Tools
│   ├── Scripts (scripts/) - Build, lint, CI validation
│   ├── Examples (examples/) - Usage examples
│   └── Tests (tests/) - Test suite
│
└── Ecosystem
    └── $HELIX Token - Community utility token for ecosystem integrations
```

## Project Structure

```
helix-x-validator/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── index.ts                  # Library exports
│   ├── validator.ts              # Core validator class
│   ├── types.ts                  # TypeScript type definitions
│   │
│   ├── loaders/                  # Configuration loaders
│   │   ├── json-loader.ts        # JSON file loader
│   │   └── yaml-loader.ts        # YAML file loader
│   │
│   ├── formatters/               # Output formatters
│   │   ├── json-formatter.ts     # JSON output formatter
│   │   └── text-formatter.ts    # Text output formatter
│   │
│   ├── rules/                    # Validation rules
│   │   ├── schema.ts             # Schema validation
│   │   └── ruleset.ts            # Ruleset engine
│   │
│   ├── plugins/                  # Plugin system
│   │   └── rule-plugin.ts        # Plugin interface and registry
│   │
│   └── utils/                    # Utility modules
│       ├── logger.ts              # Logging utility
│       ├── config-resolver.ts    # Configuration file resolver
│       └── error-handler.ts      # Error handling utilities
│
├── examples/                     # Usage examples
│   ├── basic-validation.ts       # Basic validation example
│   ├── advanced-validation.ts    # Advanced batch validation
│   ├── batch-validation.ts       # Batch processing example
│   └── config/
│       └── sample-config.json    # Sample configuration
│
├── scripts/                      # Development scripts
│   ├── validate-config.ts        # Standalone validation script
│   ├── build-check.ts              # Build verification
│   ├── lint-all.ts                # Linting script
│   ├── pre-commit.ts              # Pre-commit hook
│   ├── ci-validate.ts            # CI/CD validation
│   └── generate-types.ts          # Type generation
│
├── tests/                        # Test suite
│   └── validator.test.ts         # Validator tests
│
├── package.json                  # Project configuration
├── tsconfig.json                # TypeScript configuration
├── LICENSE                      # License file
└── README.md                    # This file
```

## Validation Flow

The validation process follows these steps:

1. **Load**: Configuration file is loaded using the appropriate loader (JSON or YAML)
2. **Parse**: File content is parsed and validated for syntax errors
3. **Schema Validation**: Structural validation checks required fields and types
4. **Rule Validation**: Semantic rules are applied (naming conventions, duplicates, etc.)
5. **Plugin Execution**: Custom plugins run additional validations
6. **Format Output**: Results are formatted as text or JSON
7. **Exit**: Process exits with appropriate code (0 for success, 1 for failure)

## Advanced Examples

### Batch Validation

```typescript
import { createValidator } from "helix-x-validator";
import { glob } from "glob";

async function validateAll() {
  const validator = createValidator({ format: "json" });
  const configFiles = await glob("configs/**/*.json");

  for (const file of configFiles) {
    const result = await validator.validateFile(file);
    if (!result.ok) {
      console.error(`Failed: ${file}`);
    }
  }
}
```

### Custom Plugin

```typescript
import { RulePlugin, PluginRegistry } from "helix-x-validator";

class CustomRulePlugin implements RulePlugin {
  name = "custom-rules";
  version = "1.0.0";

  validate(config: HelixConfig): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    // Your custom validation logic
    return issues;
  }
}

const registry = new PluginRegistry();
registry.register(new CustomRulePlugin());
```

## Scripts

The project includes several utility scripts:

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode compilation
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run validate` - Validate example configuration

## Community Token

`$HELIX` is a conceptual community utility token associated with the validator ecosystem. It represents the community-driven nature of the project and potential future integrations for premium features and rule packs.

## Roadmap

- **Rulepack SDK**: Plugin loader for custom validations with isolation and versioning
- **Stronger schema validation**: JSON Schema + custom semantic validators
- **Deterministic rule signatures**: Optional `$HELIX`-gated premium rulepacks
- **Incremental validation**: Hashed validation for large configs and cached CI runs
- **GitHub Action**: Template with status checks and PR annotations
- **VS Code extension**: Inline diagnostics and quick-fix hints
- **WASM build**: Browser/edge usage without Node.js dependencies
- **Performance budget**: Benchmarks and flamegraphs on CI
- **Opt-in telemetry**: PII redaction and local-only mode by default
- **Signed releases**: SBOM generation for supply-chain hygiene

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.
