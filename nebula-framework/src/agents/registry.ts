import { z } from 'zod';
import { AgentContract, AgentRole, GateDefinition } from '../types';

// ============================================================
// Agent Registry - Defines contracts for all agent roles
// Each contract specifies: capabilities, boundaries, schemas,
// system prompts, and the gate that validates their output
// ============================================================

export const AGENT_CONTRACTS: Record<AgentRole, AgentContract> = {
  [AgentRole.PRODUCT_MANAGER]: {
    role: AgentRole.PRODUCT_MANAGER,
    description: 'Defines WHAT to build through user stories and requirements',
    capabilities: [
      'Write user stories with acceptance criteria',
      'Define non-functional requirements',
      'Prioritize features',
      'Define scope boundaries (what is out of scope)',
    ],
    boundaries: [
      'Cannot make technology decisions',
      'Cannot write code or pseudo-code',
      'Cannot design database schemas',
      'Cannot define API contracts',
    ],
    inputSchema: z.object({
      featureName: z.string().min(1),
      context: z.string().optional(),
      constraints: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      feature: z.string(),
      stories: z.array(z.object({
        id: z.string(),
        title: z.string(),
        acceptance: z.array(z.string()),
        priority: z.enum(['high', 'medium', 'low']),
      })).min(1),
      nonFunctional: z.array(z.string()),
      outOfScope: z.array(z.string()),
    }),
    systemPrompt: `You are a Product Manager agent. Your ONLY job is to define WHAT to build.

RULES:
- Write clear user stories with Given/When/Then acceptance criteria
- Define non-functional requirements (performance, security, scalability)
- Explicitly state what is OUT OF SCOPE
- Prioritize stories (high/medium/low)
- NEVER suggest technology, architecture, or implementation details
- NEVER write code or pseudo-code

OUTPUT FORMAT: JSON with { feature, stories[], nonFunctional[], outOfScope[] }`,
    temperature: 0.7,
    maxRetries: 2,
  },

  [AgentRole.ARCHITECT]: {
    role: AgentRole.ARCHITECT,
    description: 'Designs HOW to build it - API contracts, data models, architectural decisions',
    capabilities: [
      'Design REST API endpoints',
      'Define database schemas',
      'Make architectural decisions with rationale',
      'Define system boundaries and interfaces',
    ],
    boundaries: [
      'Cannot change requirements or user stories',
      'Cannot write implementation code',
      'Cannot make product decisions',
      'Cannot skip documenting architectural decisions',
    ],
    inputSchema: z.object({
      feature: z.string(),
      stories: z.array(z.object({
        id: z.string(),
        title: z.string(),
        acceptance: z.array(z.string()),
        priority: z.string(),
      })),
      nonFunctional: z.array(z.string()),
    }),
    outputSchema: z.object({
      feature: z.string(),
      endpoints: z.array(z.object({
        method: z.string(),
        path: z.string(),
        description: z.string(),
        auth: z.boolean(),
      })).min(1),
      dataModel: z.object({
        tableName: z.string(),
        columns: z.array(z.object({
          name: z.string(),
          type: z.string(),
        })),
      }),
      decisions: z.array(z.object({
        decision: z.string(),
        rationale: z.string(),
      })),
    }),
    systemPrompt: `You are an Architect agent. Your ONLY job is to design HOW to build the feature.

INPUTS: User stories and requirements from the Product Manager.

RULES:
- Design REST API endpoints (method, path, auth requirement)
- Define database schema (tables, columns, types, indexes)
- Document architectural decisions with RATIONALE
- NEVER change requirements - work within what PM defined
- NEVER write implementation code
- Design for the non-functional requirements given

OUTPUT FORMAT: JSON with { feature, endpoints[], dataModel{}, decisions[] }`,
    temperature: 0.4,
    maxRetries: 2,
  },

  [AgentRole.BACKEND_DEVELOPER]: {
    role: AgentRole.BACKEND_DEVELOPER,
    description: 'Implements the code following the architecture design',
    capabilities: [
      'Write TypeScript/Node.js implementation code',
      'Create controllers, services, repositories',
      'Write database migrations',
      'Implement input validation',
    ],
    boundaries: [
      'Cannot change architecture or API design',
      'Cannot change requirements',
      'Cannot skip error handling',
      'Cannot bypass input validation',
    ],
    inputSchema: z.object({
      feature: z.string(),
      endpoints: z.array(z.object({
        method: z.string(),
        path: z.string(),
        description: z.string(),
      })),
      dataModel: z.object({
        tableName: z.string(),
        columns: z.array(z.unknown()),
      }),
    }),
    outputSchema: z.object({
      feature: z.string(),
      files: z.array(z.object({
        path: z.string(),
        description: z.string(),
        code: z.string(),
      })).min(1),
      migrations: z.array(z.object({
        name: z.string(),
        sql: z.string(),
      })),
    }),
    systemPrompt: `You are a Backend Developer agent. Your ONLY job is to IMPLEMENT the code.

INPUTS: Architecture design from the Architect (endpoints, data model, decisions).

RULES:
- Follow the EXACT API design provided (don't change endpoints or schemas)
- Use layered architecture: Controller → Service → Repository
- Implement proper error handling and input validation (use Zod)
- Write TypeScript with strict types
- Include database migrations
- NEVER change the architecture or add endpoints not in the design

OUTPUT FORMAT: JSON with { feature, files[{path, description, code}], migrations[] }`,
    temperature: 0.3,
    maxRetries: 3,
  },

  [AgentRole.FRONTEND_DEVELOPER]: {
    role: AgentRole.FRONTEND_DEVELOPER,
    description: 'Builds the UI components following API contracts',
    capabilities: [
      'Write React/TypeScript components',
      'Implement forms with validation',
      'Build responsive layouts',
      'Integrate with backend APIs',
    ],
    boundaries: [
      'Cannot change API contracts',
      'Cannot modify backend logic',
      'Cannot change requirements',
    ],
    inputSchema: z.object({
      feature: z.string(),
      endpoints: z.array(z.unknown()),
      stories: z.array(z.unknown()),
    }),
    outputSchema: z.object({
      feature: z.string(),
      components: z.array(z.object({
        path: z.string(),
        description: z.string(),
        code: z.string(),
      })).min(1),
    }),
    systemPrompt: `You are a Frontend Developer agent. Build React components that consume the designed API.`,
    temperature: 0.3,
    maxRetries: 2,
  },

  [AgentRole.QA_ENGINEER]: {
    role: AgentRole.QA_ENGINEER,
    description: 'Tests everything works according to acceptance criteria',
    capabilities: [
      'Write unit tests',
      'Write integration tests',
      'Validate acceptance criteria coverage',
      'Report test results',
    ],
    boundaries: [
      'Cannot change code',
      'Cannot change requirements',
      'Cannot skip testing any acceptance criteria',
    ],
    inputSchema: z.object({
      feature: z.string(),
      stories: z.array(z.object({
        id: z.string(),
        title: z.string(),
        acceptance: z.array(z.string()),
      })),
      files: z.array(z.object({
        path: z.string(),
        code: z.string(),
      })),
      endpoints: z.array(z.object({
        method: z.string(),
        path: z.string(),
      })),
    }),
    outputSchema: z.object({
      feature: z.string(),
      results: z.array(z.object({
        suite: z.string(),
        tests: z.number(),
        passed: z.number(),
        failed: z.number(),
      })),
      testCases: z.array(z.object({
        id: z.string(),
        type: z.string(),
        name: z.string(),
        status: z.enum(['passed', 'failed']),
      })),
      allPassed: z.boolean(),
    }),
    systemPrompt: `You are a QA Engineer agent. Your ONLY job is to TEST the implementation.

INPUTS: Implementation code and original acceptance criteria.

RULES:
- Every acceptance criterion must have at least one test
- Write unit tests for services, integration tests for APIs
- Report pass/fail with clear test names
- NEVER modify the code being tested
- NEVER skip edge cases

OUTPUT FORMAT: JSON with { feature, results[], testCases[], allPassed }`,
    temperature: 0.2,
    maxRetries: 2,
  },

  [AgentRole.CODE_REVIEWER]: {
    role: AgentRole.CODE_REVIEWER,
    description: 'Reviews code for quality, security, and standards compliance',
    capabilities: [
      'Review code quality',
      'Check security vulnerabilities',
      'Validate coding standards',
      'Approve or request changes',
    ],
    boundaries: [
      'Cannot write code',
      'Cannot change requirements',
      'Must provide rationale for all findings',
    ],
    inputSchema: z.object({
      files: z.array(z.object({
        path: z.string(),
        code: z.string(),
      })),
    }),
    outputSchema: z.object({
      reviewResult: z.enum(['approved', 'changes-requested']),
      findings: z.array(z.object({
        severity: z.enum(['critical', 'warning', 'info']),
        category: z.string(),
        message: z.string(),
      })),
      securityChecks: z.array(z.object({
        check: z.string(),
        status: z.enum(['pass', 'fail']),
        note: z.string(),
      })),
      approved: z.boolean(),
    }),
    systemPrompt: `You are a Code Reviewer agent. Review code for quality and security.`,
    temperature: 0.2,
    maxRetries: 1,
  },

  [AgentRole.SECURITY]: {
    role: AgentRole.SECURITY,
    description: 'Security-focused review and threat modeling',
    capabilities: ['Threat modeling', 'OWASP validation', 'Authentication review'],
    boundaries: ['Cannot write code', 'Cannot change architecture'],
    inputSchema: z.object({ files: z.array(z.unknown()), endpoints: z.array(z.unknown()) }),
    outputSchema: z.object({ threats: z.array(z.unknown()), mitigations: z.array(z.unknown()), approved: z.boolean() }),
    systemPrompt: `You are a Security agent. Perform threat modeling and OWASP validation.`,
    temperature: 0.2,
    maxRetries: 1,
  },

  [AgentRole.DEVOPS]: {
    role: AgentRole.DEVOPS,
    description: 'Infrastructure, CI/CD, and deployment configuration',
    capabilities: ['Docker configuration', 'CI/CD pipelines', 'Infrastructure as code'],
    boundaries: ['Cannot change application code', 'Cannot change requirements'],
    inputSchema: z.object({ feature: z.string(), files: z.array(z.unknown()) }),
    outputSchema: z.object({ dockerfile: z.string(), pipeline: z.unknown(), deploymentNotes: z.array(z.string()) }),
    systemPrompt: `You are a DevOps agent. Configure deployment infrastructure.`,
    temperature: 0.3,
    maxRetries: 2,
  },

  [AgentRole.AI_ENGINEER]: {
    role: AgentRole.AI_ENGINEER,
    description: 'AI/ML integration, LLM workflows, MCP tools, and agent design',
    capabilities: ['LLM integration', 'MCP server tools', 'Agent prompt design', 'RAG pipelines'],
    boundaries: ['Cannot change business logic', 'Cannot bypass security controls'],
    inputSchema: z.object({ feature: z.string(), context: z.unknown().optional() }),
    outputSchema: z.object({ files: z.array(z.unknown()), mcpTools: z.array(z.unknown()), approved: z.boolean() }),
    systemPrompt: `You are an AI Engineer agent. Design and implement AI-powered features.`,
    temperature: 0.5,
    maxRetries: 2,
  },

  [AgentRole.TECHNICAL_WRITER]: {
    role: AgentRole.TECHNICAL_WRITER,
    description: 'API documentation, user guides, and runbooks',
    capabilities: ['API reference docs', 'User guides', 'Architecture diagrams', 'Changelog entries'],
    boundaries: ['Cannot change code', 'Cannot change architecture'],
    inputSchema: z.object({ feature: z.string(), files: z.array(z.unknown()).optional() }),
    outputSchema: z.object({ documents: z.array(z.unknown()), approved: z.boolean() }),
    systemPrompt: `You are a Technical Writer agent. Produce clear documentation.`,
    temperature: 0.4,
    maxRetries: 1,
  },

  [AgentRole.BLOGGER]: {
    role: AgentRole.BLOGGER,
    description: 'Dev logs, technical articles, and project updates',
    capabilities: ['Technical blog posts', 'Dev logs', 'Tutorial writing'],
    boundaries: ['Cannot change code', 'Cannot make decisions'],
    inputSchema: z.object({ feature: z.string(), context: z.unknown().optional() }),
    outputSchema: z.object({ article: z.unknown(), approved: z.boolean() }),
    systemPrompt: `You are a Blogger agent. Write engaging technical content.`,
    temperature: 0.7,
    maxRetries: 1,
  },
};

// ============================================================
// Gate Definitions - Tied to workflow steps
// ============================================================

export const GATE_DEFINITIONS: Record<string, GateDefinition> = {
  'requirements-complete': {
    id: 'requirements-complete',
    name: 'Requirements Gate',
    description: 'Validates PM output has sufficient stories with acceptance criteria',
    requiresApproval: false,
    validators: [
      { field: 'stories', rule: 'minItems', value: 2, message: 'At least 2 user stories required' },
      { field: 'feature', rule: 'required', message: 'Feature name is required' },
      { field: 'nonFunctional', rule: 'minItems', value: 1, message: 'At least 1 non-functional requirement' },
      { field: 'outOfScope', rule: 'minItems', value: 1, message: 'Must define at least 1 out-of-scope item' },
    ],
  },
  'design-approved': {
    id: 'design-approved',
    name: 'Architecture Gate',
    description: 'Validates architecture has endpoints, data model, and documented decisions',
    requiresApproval: false,
    validators: [
      { field: 'endpoints', rule: 'minItems', value: 2, message: 'At least 2 API endpoints required' },
      { field: 'dataModel.tableName', rule: 'required', message: 'Data model must have a table name' },
      { field: 'dataModel.columns', rule: 'minItems', value: 3, message: 'At least 3 columns in data model' },
      { field: 'decisions', rule: 'minItems', value: 1, message: 'At least 1 architectural decision documented' },
    ],
  },
  'code-complete': {
    id: 'code-complete',
    name: 'Implementation Gate',
    description: 'Validates developer output has all required code files',
    requiresApproval: false,
    validators: [
      { field: 'files', rule: 'minItems', value: 3, message: 'At least 3 code files required (controller, service, repository)' },
      { field: 'migrations', rule: 'minItems', value: 1, message: 'At least 1 migration required' },
    ],
  },
  'tests-pass': {
    id: 'tests-pass',
    name: 'QA Gate',
    description: 'Validates all tests pass and coverage is sufficient',
    requiresApproval: false,
    validators: [
      { field: 'allPassed', rule: 'custom', message: 'All tests must pass', customFn: (v) => v === true },
      { field: 'testCases', rule: 'minItems', value: 5, message: 'At least 5 test cases required' },
      { field: 'results', rule: 'minItems', value: 2, message: 'At least 2 test suites required' },
    ],
  },
  'review-approved': {
    id: 'review-approved',
    name: 'Code Review Gate',
    description: 'Code review must approve with no critical findings',
    requiresApproval: false,
    validators: [
      { field: 'approved', rule: 'custom', message: 'Code review must be approved', customFn: (v) => v === true },
    ],
  },
};
