import { GateDefinition, GateResult, GateViolation, GateValidator } from '../types';
import { logger } from '../utils/logger';

// ============================================================
// Gate Engine - Validates outputs before pipeline advances
// Each gate runs a set of validators against agent output
// Prevents coordination drift between pipeline stages
// ============================================================

export class GateEngine {
  evaluate(gate: GateDefinition, output: Record<string, unknown>): GateResult {
    const violations: GateViolation[] = [];

    for (const validator of gate.validators) {
      const violation = this.runValidator(validator, output);
      if (violation) {
        violations.push(violation);
      }
    }

    const passed = violations.filter(v => v.severity === 'error').length === 0;

    const result: GateResult = {
      gateId: gate.id,
      passed,
      timestamp: new Date(),
      violations,
    };

    logger.info(
      { gate: gate.id, passed, violationCount: violations.length },
      `Gate evaluation: ${passed ? 'PASSED' : 'FAILED'}`
    );

    return result;
  }

  private runValidator(validator: GateValidator, output: Record<string, unknown>): GateViolation | null {
    const value = this.getNestedValue(output, validator.field);

    switch (validator.rule) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return this.createViolation(validator);
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < (validator.value as number)) {
          return this.createViolation(validator);
        }
        break;

      case 'minItems':
        if (Array.isArray(value) && value.length < (validator.value as number)) {
          return this.createViolation(validator);
        }
        if (!Array.isArray(value)) {
          return this.createViolation(validator);
        }
        break;

      case 'matches':
        if (typeof value === 'string') {
          const regex = new RegExp(validator.value as string);
          if (!regex.test(value)) {
            return this.createViolation(validator);
          }
        }
        break;

      case 'custom':
        if (validator.customFn && !validator.customFn(value)) {
          return this.createViolation(validator);
        }
        break;
    }

    return null;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private createViolation(validator: GateValidator): GateViolation {
    return {
      validator: validator.rule,
      field: validator.field,
      message: validator.message,
      severity: 'error',
    };
  }
}

export const gateEngine = new GateEngine();
