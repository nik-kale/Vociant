/**
 * Tool Execution Framework
 *
 * Handles execution of system, server, and client tools
 */

import { Tool, ToolCall, ToolExecutionResult } from '../types';

export class ToolExecutor {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool for execution
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: Tool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Execute a tool call
   */
  async execute(toolCall: ToolCall, context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const toolName = toolCall.function.name;
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    try {
      let args: any;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        return {
          success: false,
          error: 'Invalid tool arguments: not valid JSON',
          executionTimeMs: Date.now() - startTime,
        };
      }

      let result: any;

      switch (tool.category) {
        case 'system':
          result = await this.executeSystemTool(tool, args, context);
          break;
        case 'server':
          result = await this.executeServerTool(tool, args, context);
          break;
        case 'client':
          result = await this.executeClientTool(tool, args, context);
          break;
        default:
          throw new Error(`Unknown tool category: ${tool.category}`);
      }

      return {
        success: true,
        result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute a system tool (modifies internal state)
   */
  private async executeSystemTool(
    tool: Tool,
    args: any,
    context: ToolExecutionContext
  ): Promise<any> {
    // System tools modify the session state
    const { sessionState } = context;

    // Example: set_variable tool
    if (tool.name === 'set_variable') {
      const { name, value } = args;
      sessionState.variables[name] = value;
      return { success: true, variable: name, value };
    }

    // Example: get_variable tool
    if (tool.name === 'get_variable') {
      const { name } = args;
      return { value: sessionState.variables[name] };
    }

    // Custom system tool execution
    if (tool.config?.handler) {
      return await tool.config.handler(args, sessionState);
    }

    throw new Error(`System tool not implemented: ${tool.name}`);
  }

  /**
   * Execute a server tool (calls external API)
   */
  private async executeServerTool(
    tool: Tool,
    args: any,
    context: ToolExecutionContext
  ): Promise<any> {
    if (!tool.endpoint) {
      throw new Error(`Server tool ${tool.name} missing endpoint`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    if (tool.auth) {
      switch (tool.auth.type) {
        case 'api-key':
          if (tool.auth.credentials?.apiKey) {
            headers['X-API-Key'] = tool.auth.credentials.apiKey;
          }
          break;
        case 'bearer':
          if (tool.auth.credentials?.token) {
            headers['Authorization'] = `Bearer ${tool.auth.credentials.token}`;
          }
          break;
      }
    }

    const response = await fetch(tool.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`Server tool failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute a client tool (sends instruction to client)
   */
  private async executeClientTool(
    tool: Tool,
    args: any,
    context: ToolExecutionContext
  ): Promise<any> {
    // Client tools are sent to the client for execution
    // The result is typically just an acknowledgment
    return {
      type: 'client_action',
      tool: tool.name,
      args,
      message: 'Client tool execution requested',
    };
  }

  /**
   * Get a registered tool
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export interface ToolExecutionContext {
  sessionId: string;
  sessionState: {
    variables: Record<string, any>;
  };
  agentId: string;
}
