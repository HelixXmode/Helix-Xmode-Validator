import { createValidator } from "../src";

async function run() {
  const validator = createValidator({ format: "json" });
  const result = await validator.validateFile(
    process.argv[2] ?? "./examples/config/sample-config.json"
  );
  // eslint-disable-next-line no-console mode
  console.log(result.summary);
  process.exit(result.ok ? 0 : 1);
}

run();

