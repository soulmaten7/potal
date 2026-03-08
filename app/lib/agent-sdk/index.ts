/**
 * POTAL Agent SDK — Public API
 *
 * Provides AI agents with tool definitions and execution capabilities.
 *
 * Usage:
 *   import { getOpenAiTools, executeToolCall } from '@/app/lib/agent-sdk';
 *
 *   // Get tools for your AI agent
 *   const tools = getOpenAiTools(); // OpenAI format
 *   const tools = getAnthropicTools(); // Anthropic format
 *
 *   // Execute a tool call from the agent
 *   const result = await executeToolCall({ name: 'potal_calculate_landed_cost', arguments: {...} }, sellerId);
 */

export { getOpenAiTools, getAnthropicTools, POTAL_TOOLS } from './tools';
export type { ToolDefinition } from './tools';
export { executeToolCall } from './executor';
export type { ToolCallInput, ToolCallResult } from './executor';
