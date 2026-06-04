import { AgentRole, WorkflowDefinition } from '../types';
import { GATE_DEFINITIONS } from '../agents/registry';

// ============================================================
// Predefined Workflows
// These mirror Nebula's 9 actions: plan, build, feature, etc.
// ============================================================

const DEFAULT_STEP_CONFIG = {
  timeout: 30000,
  retries: 2,
  retryDelay: 1000,
  allowPartialOutput: false,
};

export const WORKFLOWS: Record<string, WorkflowDefinition> = {
  /**
   * FEATURE workflow - Full vertical slice
   * PM → Architect → Developer → QA → Review
   * The most comprehensive pipeline
   */
  feature: {
    id: 'feature',
    name: 'Feature Build',
    description: 'Complete feature implementation: requirements → design → code → test → review',
    version: '1.0.0',
    steps: [
      {
        id: 'requirements',
        order: 1,
        agent: AgentRole.PRODUCT_MANAGER,
        gate: 'requirements-complete',
        dependsOn: [],
        config: { ...DEFAULT_STEP_CONFIG },
      },
      {
        id: 'architecture',
        order: 2,
        agent: AgentRole.ARCHITECT,
        gate: 'design-approved',
        dependsOn: ['requirements'],
        config: { ...DEFAULT_STEP_CONFIG },
      },
      {
        id: 'implementation',
        order: 3,
        agent: AgentRole.BACKEND_DEVELOPER,
        gate: 'code-complete',
        dependsOn: ['architecture'],
        config: { ...DEFAULT_STEP_CONFIG, retries: 3 },
      },
      {
        id: 'testing',
        order: 4,
        agent: AgentRole.QA_ENGINEER,
        gate: 'tests-pass',
        dependsOn: ['implementation'],
        config: { ...DEFAULT_STEP_CONFIG },
      },
      {
        id: 'review',
        order: 5,
        agent: AgentRole.CODE_REVIEWER,
        gate: 'review-approved',
        dependsOn: ['implementation'],
        config: { ...DEFAULT_STEP_CONFIG, retries: 1 },
      },
    ],
    gates: GATE_DEFINITIONS,
  },

  /**
   * PLAN workflow - Requirements + Architecture only
   * PM → Architect (no implementation)
   */
  plan: {
    id: 'plan',
    name: 'Plan Feature',
    description: 'Define requirements and architecture without implementation',
    version: '1.0.0',
    steps: [
      {
        id: 'requirements',
        order: 1,
        agent: AgentRole.PRODUCT_MANAGER,
        gate: 'requirements-complete',
        dependsOn: [],
        config: { ...DEFAULT_STEP_CONFIG },
      },
      {
        id: 'architecture',
        order: 2,
        agent: AgentRole.ARCHITECT,
        gate: 'design-approved',
        dependsOn: ['requirements'],
        config: { ...DEFAULT_STEP_CONFIG },
      },
    ],
    gates: GATE_DEFINITIONS,
  },

  /**
   * BUILD workflow - Implementation from existing plan
   * Developer → QA → Review
   */
  build: {
    id: 'build',
    name: 'Build from Plan',
    description: 'Implement and test from an existing architecture plan',
    version: '1.0.0',
    steps: [
      {
        id: 'implementation',
        order: 1,
        agent: AgentRole.BACKEND_DEVELOPER,
        gate: 'code-complete',
        dependsOn: [],
        config: { ...DEFAULT_STEP_CONFIG, retries: 3 },
      },
      {
        id: 'testing',
        order: 2,
        agent: AgentRole.QA_ENGINEER,
        gate: 'tests-pass',
        dependsOn: ['implementation'],
        config: { ...DEFAULT_STEP_CONFIG },
      },
      {
        id: 'review',
        order: 3,
        agent: AgentRole.CODE_REVIEWER,
        gate: 'review-approved',
        dependsOn: ['implementation'],
        config: { ...DEFAULT_STEP_CONFIG, retries: 1 },
      },
    ],
    gates: GATE_DEFINITIONS,
  },

  /**
   * REVIEW workflow - Code review only
   */
  review: {
    id: 'review',
    name: 'Code Review',
    description: 'Review existing code for quality and security',
    version: '1.0.0',
    steps: [
      {
        id: 'review',
        order: 1,
        agent: AgentRole.CODE_REVIEWER,
        gate: 'review-approved',
        dependsOn: [],
        config: { ...DEFAULT_STEP_CONFIG },
      },
    ],
    gates: GATE_DEFINITIONS,
  },
};
