import { LLMProvider } from './provider';
import { LLMRequest, LLMResponse } from '../types';
import { logger } from '../utils/logger';

// ============================================================
// Mock LLM Provider
// Returns realistic, structured responses for each agent role
// Enables testing and demo without API keys
// ============================================================

const MOCK_RESPONSES: Record<string, (prompt: string) => string> = {
  'product-manager': (prompt: string) => {
    const feature = extractFeature(prompt);
    return JSON.stringify({
      feature,
      stories: [
        {
          id: 'US-001',
          title: `As a user, I can view all ${feature}`,
          acceptance: [
            `Given I am on the ${feature} page`,
            `When the page loads`,
            `Then I see a list of all ${feature} with name, status, and created date`,
          ],
          priority: 'high',
        },
        {
          id: 'US-002',
          title: `As a user, I can create a new ${feature.slice(0, -1)}`,
          acceptance: [
            `Given I click "Add New"`,
            `When I fill in the required fields and submit`,
            `Then a new ${feature.slice(0, -1)} is created and appears in the list`,
          ],
          priority: 'high',
        },
        {
          id: 'US-003',
          title: `As a user, I can delete a ${feature.slice(0, -1)}`,
          acceptance: [
            `Given I select a ${feature.slice(0, -1)} from the list`,
            `When I click delete and confirm`,
            `Then the ${feature.slice(0, -1)} is removed and the list updates`,
          ],
          priority: 'medium',
        },
        {
          id: 'US-004',
          title: `As a user, I can filter ${feature} by status`,
          acceptance: [
            `Given I am on the ${feature} page`,
            `When I select a status filter`,
            `Then only ${feature} matching that status are shown`,
          ],
          priority: 'low',
        },
      ],
      nonFunctional: [
        'Response time < 200ms for list operations',
        'Support pagination for > 100 items',
        'Input validation on all form fields',
      ],
      outOfScope: [`Edit functionality deferred to v2`, `Bulk operations not included`],
    });
  },

  architect: (prompt: string) => {
    const feature = extractFeature(prompt);
    return JSON.stringify({
      feature,
      architecture: {
        pattern: 'REST API with layered architecture',
        layers: ['Controller', 'Service', 'Repository', 'Model'],
      },
      endpoints: [
        { method: 'GET', path: `/api/v1/${feature}`, description: 'List all with pagination', auth: true },
        { method: 'GET', path: `/api/v1/${feature}/:id`, description: 'Get by ID', auth: true },
        { method: 'POST', path: `/api/v1/${feature}`, description: 'Create new', auth: true },
        { method: 'DELETE', path: `/api/v1/${feature}/:id`, description: 'Soft delete', auth: true },
        { method: 'GET', path: `/api/v1/${feature}/stats`, description: 'Aggregated stats', auth: true },
      ],
      dataModel: {
        tableName: feature,
        columns: [
          { name: 'id', type: 'uuid', primary: true },
          { name: 'name', type: 'varchar(255)', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'status', type: "enum('active','inactive','archived')", nullable: false, default: 'active' },
          { name: 'created_by', type: 'uuid', nullable: false, foreignKey: 'users.id' },
          { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', nullable: true },
        ],
        indexes: [
          { columns: ['status'], type: 'btree' },
          { columns: ['created_by'], type: 'btree' },
          { columns: ['created_at'], type: 'btree' },
        ],
      },
      decisions: [
        { decision: 'Soft delete over hard delete', rationale: 'Audit trail requirement' },
        { decision: 'UUID over auto-increment', rationale: 'Distributed system compatibility' },
        { decision: 'Pagination with cursor', rationale: 'Better performance at scale' },
      ],
    });
  },

  'backend-developer': (prompt: string) => {
    const feature = extractFeature(prompt);
    return JSON.stringify({
      feature,
      files: [
        {
          path: `src/modules/${feature}/${feature}.controller.ts`,
          description: 'HTTP request handling, validation, response formatting',
          code: generateControllerCode(feature),
        },
        {
          path: `src/modules/${feature}/${feature}.service.ts`,
          description: 'Business logic, orchestration',
          code: generateServiceCode(feature),
        },
        {
          path: `src/modules/${feature}/${feature}.repository.ts`,
          description: 'Data access layer',
          code: generateRepositoryCode(feature),
        },
        {
          path: `src/modules/${feature}/${feature}.model.ts`,
          description: 'Database schema and types',
          code: generateModelCode(feature),
        },
      ],
      migrations: [
        {
          name: `create_${feature}_table`,
          sql: `CREATE TABLE ${feature} (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active', created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW(), deleted_at TIMESTAMP);`,
        },
      ],
    });
  },

  'qa-engineer': (prompt: string) => {
    const feature = extractFeature(prompt);
    return JSON.stringify({
      feature,
      testPlan: {
        totalCases: 12,
        categories: ['unit', 'integration', 'e2e'],
      },
      results: [
        { suite: 'Unit Tests', tests: 6, passed: 6, failed: 0, coverage: '92%' },
        { suite: 'Integration Tests', tests: 4, passed: 4, failed: 0, coverage: '88%' },
        { suite: 'E2E Tests', tests: 2, passed: 2, failed: 0, coverage: '95%' },
      ],
      testCases: [
        { id: 'TC-001', type: 'unit', name: `${feature} service - create with valid input`, status: 'passed' },
        { id: 'TC-002', type: 'unit', name: `${feature} service - create with invalid input rejects`, status: 'passed' },
        { id: 'TC-003', type: 'unit', name: `${feature} service - list with pagination`, status: 'passed' },
        { id: 'TC-004', type: 'unit', name: `${feature} service - delete non-existent returns 404`, status: 'passed' },
        { id: 'TC-005', type: 'integration', name: `${feature} API - POST creates and returns 201`, status: 'passed' },
        { id: 'TC-006', type: 'integration', name: `${feature} API - GET returns paginated list`, status: 'passed' },
        { id: 'TC-007', type: 'e2e', name: `${feature} full workflow - create, list, delete`, status: 'passed' },
      ],
      allPassed: true,
      recommendation: 'Ready for deployment. All acceptance criteria covered.',
    });
  },

  'code-reviewer': (prompt: string) => {
    return JSON.stringify({
      reviewResult: 'approved',
      findings: [
        { severity: 'info', category: 'style', message: 'Consider extracting validation logic to a shared utility' },
        { severity: 'info', category: 'performance', message: 'Add database index on frequently queried columns' },
      ],
      securityChecks: [
        { check: 'SQL Injection', status: 'pass', note: 'Parameterized queries used throughout' },
        { check: 'Input Validation', status: 'pass', note: 'Zod schemas validate all inputs' },
        { check: 'Authentication', status: 'pass', note: 'All endpoints require valid JWT' },
        { check: 'Authorization', status: 'pass', note: 'Role-based access control enforced' },
      ],
      approved: true,
    });
  },
};

function extractFeature(prompt: string): string {
  const match = prompt.match(/feature[:\s]+["']?(\w+)/i) || prompt.match(/build[:\s]+["']?(\w+)/i);
  return match?.[1] || 'tasks';
}

function generateControllerCode(feature: string): string {
  const singular = feature.slice(0, -1);
  return `import { Request, Response, Router } from 'express';
import { ${capitalize(singular)}Service } from './${feature}.service';
import { Create${capitalize(singular)}Schema, PaginationSchema } from './${feature}.model';

const router = Router();
const service = new ${capitalize(singular)}Service();

router.get('/${feature}', async (req: Request, res: Response) => {
  const query = PaginationSchema.parse(req.query);
  const result = await service.findAll(query);
  res.json(result);
});

router.post('/${feature}', async (req: Request, res: Response) => {
  const data = Create${capitalize(singular)}Schema.parse(req.body);
  const item = await service.create(data, req.user.id);
  res.status(201).json(item);
});

router.delete('/${feature}/:id', async (req: Request, res: Response) => {
  await service.softDelete(req.params.id);
  res.status(204).send();
});

export default router;`;
}

function generateServiceCode(feature: string): string {
  const singular = feature.slice(0, -1);
  return `import { ${capitalize(singular)}Repository } from './${feature}.repository';
import { Create${capitalize(singular)}Input, PaginationInput } from './${feature}.model';

export class ${capitalize(singular)}Service {
  private repo = new ${capitalize(singular)}Repository();

  async findAll(pagination: PaginationInput) {
    return this.repo.findAll(pagination);
  }

  async create(data: Create${capitalize(singular)}Input, userId: string) {
    return this.repo.create({ ...data, createdBy: userId });
  }

  async softDelete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('${capitalize(singular)} not found');
    return this.repo.softDelete(id);
  }
}`;
}

function generateRepositoryCode(feature: string): string {
  const singular = feature.slice(0, -1);
  return `import { db } from '../../database';
import { ${feature} } from './${feature}.model';

export class ${capitalize(singular)}Repository {
  async findAll({ page, limit }: { page: number; limit: number }) {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db.select().from(${feature}).where(isNull(${feature}.deletedAt)).offset(offset).limit(limit),
      db.select({ count: count() }).from(${feature}).where(isNull(${feature}.deletedAt)),
    ]);
    return { data, total: total[0].count, page, limit };
  }

  async findById(id: string) {
    return db.select().from(${feature}).where(eq(${feature}.id, id)).limit(1);
  }

  async create(data: Record<string, unknown>) {
    return db.insert(${feature}).values(data).returning();
  }

  async softDelete(id: string) {
    return db.update(${feature}).set({ deletedAt: new Date() }).where(eq(${feature}.id, id));
  }
}`;
}

function generateModelCode(feature: string): string {
  const singular = feature.slice(0, -1);
  return `import { z } from 'zod';
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const ${feature} = pgTable('${feature}', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const Create${capitalize(singular)}Schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type Create${capitalize(singular)}Input = z.infer<typeof Create${capitalize(singular)}Schema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';
  private latencyMs: number;

  constructor(latencyMs = 500) {
    this.latencyMs = latencyMs;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.latencyMs));

    // Determine which agent is calling based on system prompt
    const role = this.detectRole(request.systemPrompt);
    const generator = MOCK_RESPONSES[role] || MOCK_RESPONSES['product-manager'];
    const content = generator(request.userPrompt);

    const durationMs = Date.now() - start;
    const promptTokens = Math.ceil(request.systemPrompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    logger.info({ provider: this.name, role, durationMs }, 'Mock LLM response generated');

    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      model: 'mock-gpt-4',
      durationMs,
    };
  }

  private detectRole(systemPrompt: string): string {
    const prompt = systemPrompt.toLowerCase();
    if (prompt.includes('architect') && prompt.includes('design how')) return 'architect';
    if (prompt.includes('backend developer') || prompt.includes('implement the code')) return 'backend-developer';
    if (prompt.includes('qa engineer') || prompt.includes('test the implementation')) return 'qa-engineer';
    if (prompt.includes('code reviewer') || prompt.includes('review code')) return 'code-reviewer';
    if (prompt.includes('product manager')) return 'product-manager';
    return 'product-manager';
  }
}
