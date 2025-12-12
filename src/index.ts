import { HelixValidator } from "./validator";
import { ValidatorOptions, ValidationResult, HelixConfig } from "./types";

export function createValidator(options: ValidatorOptions = {}): HelixValidator {
  return new HelixValidator(options);
}

export type { ValidatorOptions, ValidationResult, HelixConfig };

