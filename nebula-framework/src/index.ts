import dotenv from 'dotenv';
dotenv.config();

import { app, initializeDatabase } from './api/server';
import { logger } from './utils/logger';
import { eventBus } from './events/event-bus';

// ============================================================
// Application Entry Point
// ============================================================

const PORT = parseInt(process.env.PORT || '4000', 10);

// Log all workflow events to console in dev
if (process.env.NODE_ENV !== 'production') {
  eventBus.on('workflow:started', (d) => logger.info(d, '🚀 Workflow started'));
  eventBus.on('workflow:completed', (d) => logger.info(d, '✅ Workflow completed'));
  eventBus.on('workflow:failed', (d) => logger.error(d, '❌ Workflow failed'));
  eventBus.on('step:started', (d) => logger.info(d, `⚡ Step started: ${d.stepId}`));
  eventBus.on('step:completed', (d) => logger.info(d, `✓ Step completed: ${d.stepId}`));
  eventBus.on('step:retrying', (d) => logger.warn(d, `↻ Step retrying: ${d.stepId} (${d.attempt}/${d.maxRetries})`));
  eventBus.on('gate:passed', (d) => logger.info(d, `🚪 Gate passed: ${d.gateId}`));
  eventBus.on('gate:failed', (d) => logger.warn(d, `⛔ Gate failed: ${d.gateId}`));
  eventBus.on('llm:response', (d) => logger.info(d, `🤖 LLM response: ${d.tokens} tokens in ${d.durationMs}ms`));
}

app.listen(PORT, async () => {
  logger.info({ port: PORT }, `Nebula Agent Framework running on http://localhost:${PORT}`);

  // Initialize database
  await initializeDatabase();

  logger.info('Available endpoints:');
  logger.info('  GET  /api/health          - Health check');
  logger.info('  GET  /api/workflows       - List workflow definitions');
  logger.info('  GET  /api/agents          - List agent contracts');
  logger.info('  GET  /api/gates           - List gate definitions');
  logger.info('  POST /api/execute         - Execute a workflow');
  logger.info('  GET  /api/executions      - List past executions');
  logger.info('  GET  /api/events          - SSE real-time events');
  logger.info('  GET  /api/admin/stats     - Admin dashboard stats');
  logger.info('  GET  /api/admin/config    - System configuration');
  logger.info('  GET  /api/admin/workflows - Workflow management');
});

export { app };
