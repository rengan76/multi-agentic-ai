import { GateEngine } from '../../src/gates/gate-engine';
import { GateDefinition } from '../../src/types';

describe('GateEngine', () => {
  let engine: GateEngine;

  beforeEach(() => {
    engine = new GateEngine();
  });

  describe('evaluate', () => {
    const gate: GateDefinition = {
      id: 'test-gate',
      name: 'Test Gate',
      description: 'A test gate',
      requiresApproval: false,
      validators: [
        { field: 'stories', rule: 'minItems', value: 2, message: 'Need at least 2 stories' },
        { field: 'feature', rule: 'required', message: 'Feature is required' },
        { field: 'title', rule: 'minLength', value: 5, message: 'Title must be at least 5 chars' },
      ],
    };

    it('should pass when all validators are satisfied', () => {
      const output = {
        feature: 'tasks',
        stories: [{ id: '1' }, { id: '2' }, { id: '3' }],
        title: 'Hello World',
      };

      const result = engine.evaluate(gate, output);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.gateId).toBe('test-gate');
    });

    it('should fail when required field is missing', () => {
      const output = {
        stories: [{ id: '1' }, { id: '2' }],
        title: 'Hello World',
      };

      const result = engine.evaluate(gate, output);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].field).toBe('feature');
      expect(result.violations[0].message).toBe('Feature is required');
    });

    it('should fail when array has insufficient items', () => {
      const output = {
        feature: 'tasks',
        stories: [{ id: '1' }],
        title: 'Hello World',
      };

      const result = engine.evaluate(gate, output);

      expect(result.passed).toBe(false);
      expect(result.violations[0].field).toBe('stories');
    });

    it('should fail when string is too short', () => {
      const output = {
        feature: 'tasks',
        stories: [{ id: '1' }, { id: '2' }],
        title: 'Hi',
      };

      const result = engine.evaluate(gate, output);

      expect(result.passed).toBe(false);
      expect(result.violations[0].field).toBe('title');
    });

    it('should report multiple violations', () => {
      const output = {
        stories: [],
        title: 'Hi',
      };

      const result = engine.evaluate(gate, output);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle nested field paths', () => {
      const nestedGate: GateDefinition = {
        id: 'nested-gate',
        name: 'Nested Gate',
        description: 'Tests nested paths',
        requiresApproval: false,
        validators: [
          { field: 'dataModel.tableName', rule: 'required', message: 'Table name required' },
        ],
      };

      const passing = { dataModel: { tableName: 'users' } };
      const failing = { dataModel: {} };

      expect(engine.evaluate(nestedGate, passing).passed).toBe(true);
      expect(engine.evaluate(nestedGate, failing).passed).toBe(false);
    });

    it('should support custom validator functions', () => {
      const customGate: GateDefinition = {
        id: 'custom-gate',
        name: 'Custom Gate',
        description: 'Uses custom function',
        requiresApproval: false,
        validators: [
          {
            field: 'allPassed',
            rule: 'custom',
            message: 'All tests must pass',
            customFn: (v) => v === true,
          },
        ],
      };

      expect(engine.evaluate(customGate, { allPassed: true }).passed).toBe(true);
      expect(engine.evaluate(customGate, { allPassed: false }).passed).toBe(false);
    });

    it('should handle matches rule with regex', () => {
      const regexGate: GateDefinition = {
        id: 'regex-gate',
        name: 'Regex Gate',
        description: 'Uses regex matching',
        requiresApproval: false,
        validators: [
          { field: 'version', rule: 'matches', value: '^\\d+\\.\\d+\\.\\d+$', message: 'Must be semver' },
        ],
      };

      expect(engine.evaluate(regexGate, { version: '1.0.0' }).passed).toBe(true);
      expect(engine.evaluate(regexGate, { version: 'latest' }).passed).toBe(false);
    });
  });
});
