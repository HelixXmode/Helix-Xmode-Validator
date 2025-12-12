import { createValidator } from "../src";

async function demo() {
  const validator = createValidator({ format: "text", ruleset: "strict", strict: true });
  const result = await validator.validateFile("./examples/config/sample-config.json");
  // eslint-disable-next-line no-console
  console.log(result.summary);
}

demo();

