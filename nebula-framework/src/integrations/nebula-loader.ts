import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

// ============================================================
// Nebula Agents Integration
// Reads real agent definitions from the cloned nebula-agents repo
// and makes them available as runtime data for our orchestrator
// ============================================================

const NEBULA_AGENTS_PATH = path.resolve(__dirname, '../../../nebula-agents/agents');
const NEBULA_CRM_PATH = path.resolve(__dirname, '../../../nebula-insurance-crm');

interface NebulaAgent {
  role: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  tools: string[];
  identity: string;
  principles: string[];
  inScope: string[];
  outOfScope: string[];
  rawContent: string;
}

interface NebulaAction {
  id: string;
  name: string;
  description: string;
  agents: string[];
  rawContent: string;
}

// Parse YAML-like frontmatter from markdown
function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const yaml = match[1];
  const result: Record<string, any> = {};
  
  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kvMatch) {
      let value = kvMatch[2].trim();
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1);
        result[kvMatch[1]] = value.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        result[kvMatch[1]] = value.replace(/^["']|["']$/g, '');
      }
    }
    // Handle nested metadata
    if (line.match(/^\s+[\w-]+:/)) {
      const nestedMatch = line.match(/^\s+([\w-]+):\s*(.+)/);
      if (nestedMatch) {
        if (!result.metadata) result.metadata = {};
        let val = nestedMatch[2].trim().replace(/^["']|["']$/g, '');
        if (val.startsWith('[') && val.endsWith(']')) {
          val = val.slice(1, -1);
          result.metadata[nestedMatch[1]] = val.split(',').map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
        } else {
          result.metadata[nestedMatch[1]] = val;
        }
      }
    }
  }
  return result;
}

// Extract section content by heading
function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`## ${heading}[\\s\\S]*?(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  return match ? match[0].replace(/^## .+\n/, '').trim() : '';
}

// Extract bullet points from a section
function extractBullets(section: string): string[] {
  return section
    .split('\n')
    .filter(l => l.match(/^[-*]\s/))
    .map(l => l.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

// Load a single agent from its SKILL.md
function loadAgent(agentDir: string): NebulaAgent | null {
  const skillPath = path.join(agentDir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);
    const role = path.basename(agentDir);

    // Extract key sections
    const identity = extractSection(content, 'Agent Identity');
    const principles = extractBullets(extractSection(content, 'Core Principles'));
    const scopeSection = extractSection(content, 'Scope & Boundaries');
    
    // Split in-scope and out-of-scope
    const inScopeMatch = scopeSection.match(/In Scope[\s\S]*?(?=Out of Scope|$)/i);
    const outScopeMatch = scopeSection.match(/Out of Scope[\s\S]*/i);

    return {
      role,
      name: frontmatter.name || role,
      description: frontmatter.description || '',
      version: frontmatter.metadata?.version || '1.0.0',
      tags: frontmatter.metadata?.tags || [],
      tools: (frontmatter.metadata?.['allowed-tools'] || '').split(/\s+/).filter(Boolean),
      identity: identity.split('\n')[0] || '',
      principles,
      inScope: inScopeMatch ? extractBullets(inScopeMatch[0]) : [],
      outOfScope: outScopeMatch ? extractBullets(outScopeMatch[0]) : [],
      rawContent: content,
    };
  } catch (err) {
    logger.warn({ agentDir, error: (err as Error).message }, 'Failed to load agent');
    return null;
  }
}

// Load an action composition
function loadAction(actionFile: string): NebulaAction | null {
  try {
    const content = fs.readFileSync(actionFile, 'utf-8');
    const id = path.basename(actionFile, '.md');
    
    // Extract first heading as name
    const nameMatch = content.match(/^#\s+(.+)/m);
    const name = nameMatch ? nameMatch[1] : id;

    // Extract agent references (look for role mentions)
    const agentRoles = [
      'product-manager', 'architect', 'backend-developer', 'frontend-developer',
      'ai-engineer', 'quality-engineer', 'devops', 'code-reviewer', 'security',
      'technical-writer', 'blogger'
    ];
    const agents = agentRoles.filter(role => content.toLowerCase().includes(role));

    // Get first paragraph as description
    const bodyStart = content.indexOf('\n\n');
    const descMatch = content.slice(bodyStart).match(/\n\n([^#\n][^\n]+)/);
    const description = descMatch ? descMatch[1].trim() : '';

    return { id, name, description, agents, rawContent: content };
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────

export function isNebulaAgentsAvailable(): boolean {
  return fs.existsSync(NEBULA_AGENTS_PATH);
}

export function isNebulaCrmAvailable(): boolean {
  return fs.existsSync(NEBULA_CRM_PATH);
}

export function loadAllAgents(): NebulaAgent[] {
  if (!isNebulaAgentsAvailable()) return [];

  const agents: NebulaAgent[] = [];
  const entries = fs.readdirSync(NEBULA_AGENTS_PATH, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !['actions', 'templates', 'docs', 'scripts'].includes(entry.name)) {
      const agent = loadAgent(path.join(NEBULA_AGENTS_PATH, entry.name));
      if (agent) agents.push(agent);
    }
  }

  logger.info({ count: agents.length }, 'Loaded nebula-agents roles');
  return agents;
}

export function loadAllActions(): NebulaAction[] {
  if (!isNebulaAgentsAvailable()) return [];

  const actionsDir = path.join(NEBULA_AGENTS_PATH, 'actions');
  if (!fs.existsSync(actionsDir)) return [];

  const actions: NebulaAction[] = [];
  const files = fs.readdirSync(actionsDir).filter(f => f.endsWith('.md') && f !== 'README.md');

  for (const file of files) {
    const action = loadAction(path.join(actionsDir, file));
    if (action) actions.push(action);
  }

  logger.info({ count: actions.length }, 'Loaded nebula-agents actions');
  return actions;
}

export function loadCrmBlueprint(): string | null {
  const blueprintPath = path.join(NEBULA_CRM_PATH, 'BLUEPRINT.md');
  if (!fs.existsSync(blueprintPath)) return null;
  try {
    return fs.readFileSync(blueprintPath, 'utf-8');
  } catch {
    return null;
  }
}

export function getIntegrationStatus() {
  return {
    nebulaAgents: {
      available: isNebulaAgentsAvailable(),
      path: NEBULA_AGENTS_PATH,
    },
    nebulaCrm: {
      available: isNebulaCrmAvailable(),
      path: NEBULA_CRM_PATH,
    },
  };
}
