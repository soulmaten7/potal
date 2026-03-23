/**
 * Data Management System — unified export for 12 TLC data management items.
 */

// Item 1: File Registry
export { DATA_REGISTRY, getAreaFiles, getP0Files, getDbTables, getFilesByFrequency } from './data-registry';
export type { DataFile } from './data-registry';

// Item 2: Update Tracker
export { logUpdate, getLastUpdate } from './update-tracker';

// Item 3: Update Scheduler
export { CRON_TO_DATA_MAP, getDailyChecks, getWeeklyChecks } from './update-scheduler';

// Item 4+8: Source Verifier
export { SOURCE_CONFIGS, verifySource } from './source-verifier';

// Item 5: Auto-Updater
export { executeUpdate } from './auto-updater';

// Item 6: Dependency Chain
export { DEPENDENCY_CHAINS, getDependents, getTriggers } from './dependency-chain';

// Item 7: Validation Rules
export { VALIDATION_RULES, getValidationRule } from './validation-rules';

// Item 9: Error Handler
export { handleError, getOpenErrors } from './error-handler';

// Item 10: Cost Tracker
export { MONTHLY_FIXED_COSTS, UPDATE_COST_ESTIMATES, getEstimatedMonthlyCost } from './cost-tracker';

// Item 11: Priority Manager
export { PRIORITY_SLA, getByPriority, getPrioritySummary } from './priority-manager';

// Item 12: Audit Trail
export { writeAudit, getRecentAudits } from './audit-trail';
