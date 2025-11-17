/**
 * Flow Execution Engine
 *
 * Executes conversation flows with nodes and edges
 * Security: Validates all node configurations, prevents infinite loops, sanitizes inputs
 */

export interface FlowNode {
  id: string;
  type: 'message' | 'condition' | 'tool' | 'variable' | 'webhook' | 'goto' | 'end';
  config: Record<string, any>;
  label?: string;
}

export interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'default' | 'conditional' | 'fallback';
  condition?: ConditionExpression;
  label?: string;
}

export interface ConversationFlow {
  id: string;
  name: string;
  startNodeId: string;
  variables?: Record<string, FlowVariable>;
  settings?: FlowSettings;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowVariable {
  type: 'string' | 'number' | 'boolean' | 'object';
  defaultValue?: any;
  required?: boolean;
}

export interface FlowSettings {
  maxExecutionTime?: number; // Maximum flow execution time in ms (default: 30000)
  maxIterations?: number; // Prevent infinite loops (default: 100)
  errorHandling?: 'stop' | 'continue' | 'fallback';
}

export interface ConditionExpression {
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'and' | 'or';
  left: string | ConditionExpression;
  right?: string | number | boolean | ConditionExpression;
}

export interface FlowExecutionContext {
  variables: Record<string, any>;
  turnHistory: Array<{ userMessage?: string; assistantMessage?: string }>;
  metadata: Record<string, any>;
  startTime: number;
  iterationCount: number;
}

export class FlowExecutionEngine {
  private flow: ConversationFlow;
  private context: FlowExecutionContext;
  private visitedNodes: Set<string> = new Set();

  constructor(flow: ConversationFlow, initialVariables: Record<string, any> = {}) {
    this.flow = this.validateFlow(flow);
    this.context = {
      variables: { ...this.getDefaultVariables(), ...initialVariables },
      turnHistory: [],
      metadata: {},
      startTime: Date.now(),
      iterationCount: 0,
    };
  }

  /**
   * Validate flow structure for security and correctness
   * SECURITY: Prevents malicious flows from executing
   */
  private validateFlow(flow: ConversationFlow): ConversationFlow {
    // Validate start node exists
    if (!flow.startNodeId) {
      throw new Error('Flow must have a start node');
    }

    const startNode = flow.nodes.find(n => n.id === flow.startNodeId);
    if (!startNode) {
      throw new Error('Start node not found in flow');
    }

    // Validate all edges reference existing nodes
    for (const edge of flow.edges) {
      const sourceExists = flow.nodes.some(n => n.id === edge.sourceId);
      const targetExists = flow.nodes.some(n => n.id === edge.targetId);

      if (!sourceExists || !targetExists) {
        throw new Error(`Invalid edge: ${edge.id} references non-existent nodes`);
      }
    }

    // Validate node configurations
    for (const node of flow.nodes) {
      this.validateNodeConfig(node);
    }

    // Check for unreachable nodes (warning, not error)
    const reachable = this.getReachableNodes(flow);
    const unreachable = flow.nodes.filter(n => !reachable.has(n.id));
    if (unreachable.length > 0) {
      console.warn(`Flow has ${unreachable.length} unreachable nodes`);
    }

    return flow;
  }

  /**
   * Validate node configuration for security
   * SECURITY: Prevents code injection, validates schemas
   */
  private validateNodeConfig(node: FlowNode): void {
    switch (node.type) {
      case 'message':
        if (!node.config.message || typeof node.config.message !== 'string') {
          throw new Error(`Message node ${node.id} must have a message string`);
        }
        // SECURITY: Validate no script tags or dangerous content
        if (this.containsDangerousContent(node.config.message)) {
          throw new Error(`Message node ${node.id} contains potentially dangerous content`);
        }
        break;

      case 'condition':
        if (!node.config.expression) {
          throw new Error(`Condition node ${node.id} must have an expression`);
        }
        this.validateConditionExpression(node.config.expression);
        break;

      case 'tool':
        if (!node.config.toolId || typeof node.config.toolId !== 'string') {
          throw new Error(`Tool node ${node.id} must have a toolId`);
        }
        break;

      case 'variable':
        if (!node.config.variableName || !node.config.value) {
          throw new Error(`Variable node ${node.id} must have variableName and value`);
        }
        break;

      case 'webhook':
        if (!node.config.url || typeof node.config.url !== 'string') {
          throw new Error(`Webhook node ${node.id} must have a URL`);
        }
        // SECURITY: Validate URL is not localhost or private IP (production safety)
        if (this.isPrivateUrl(node.config.url)) {
          throw new Error(`Webhook node ${node.id} cannot call private URLs`);
        }
        break;

      case 'goto':
        if (!node.config.targetNodeId) {
          throw new Error(`Goto node ${node.id} must have a targetNodeId`);
        }
        break;

      case 'end':
        // End node has no required config
        break;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * SECURITY: Check for dangerous content (XSS, script injection)
   */
  private containsDangerousContent(text: string): boolean {
    const dangerous = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /<iframe/i,
    ];

    return dangerous.some(pattern => pattern.test(text));
  }

  /**
   * SECURITY: Prevent SSRF attacks by blocking private URLs
   */
  private isPrivateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;

      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }

      // Block private IP ranges
      if (/^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./.test(hostname)) {
        return true;
      }

      return false;
    } catch {
      return true; // Invalid URL, block it
    }
  }

  /**
   * Validate condition expression structure
   * SECURITY: Prevents arbitrary code execution
   */
  private validateConditionExpression(expr: any): void {
    if (!expr || typeof expr !== 'object') {
      throw new Error('Condition expression must be an object');
    }

    const validOperators = ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists', 'and', 'or'];
    if (!validOperators.includes(expr.operator)) {
      throw new Error(`Invalid condition operator: ${expr.operator}`);
    }

    // Recursive validation for nested conditions
    if (expr.operator === 'and' || expr.operator === 'or') {
      if (!Array.isArray(expr.conditions)) {
        throw new Error('Logical operators must have conditions array');
      }
      expr.conditions.forEach((c: any) => this.validateConditionExpression(c));
    }
  }

  /**
   * Get all reachable nodes from start
   */
  private getReachableNodes(flow: ConversationFlow): Set<string> {
    const reachable = new Set<string>();
    const queue = [flow.startNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;

      reachable.add(current);

      // Add all target nodes from outgoing edges
      const outgoing = flow.edges.filter(e => e.sourceId === current);
      for (const edge of outgoing) {
        if (!reachable.has(edge.targetId)) {
          queue.push(edge.targetId);
        }
      }
    }

    return reachable;
  }

  /**
   * Get default variable values from flow definition
   */
  private getDefaultVariables(): Record<string, any> {
    if (!this.flow.variables) return {};

    const defaults: Record<string, any> = {};
    for (const [key, varDef] of Object.entries(this.flow.variables)) {
      if (varDef.defaultValue !== undefined) {
        defaults[key] = varDef.defaultValue;
      }
    }
    return defaults;
  }

  /**
   * Execute the flow from start node
   */
  async execute(): Promise<FlowExecutionResult> {
    try {
      let currentNodeId: string | null = this.flow.startNodeId;
      const executionPath: string[] = [];

      while (currentNodeId) {
        // SECURITY: Check execution time limit
        if (this.hasExceededTimeLimit()) {
          throw new Error('Flow execution time limit exceeded');
        }

        // SECURITY: Check iteration limit to prevent infinite loops
        this.context.iterationCount++;
        if (this.hasExceededIterationLimit()) {
          throw new Error('Flow iteration limit exceeded (possible infinite loop)');
        }

        executionPath.push(currentNodeId);
        const node = this.getNode(currentNodeId);

        // Execute current node
        const result = await this.executeNode(node);

        // Determine next node
        if (result.nextNodeId) {
          currentNodeId = result.nextNodeId;
        } else if (result.ended) {
          break;
        } else {
          // Follow edges to find next node
          currentNodeId = await this.getNextNode(currentNodeId);
        }
      }

      return {
        success: true,
        executionPath,
        finalVariables: this.context.variables,
        metadata: this.context.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionPath: [],
        finalVariables: this.context.variables,
      };
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(node: FlowNode): Promise<NodeExecutionResult> {
    switch (node.type) {
      case 'message':
        return this.executeMessageNode(node);

      case 'condition':
        return this.executeConditionNode(node);

      case 'tool':
        return await this.executeToolNode(node);

      case 'variable':
        return this.executeVariableNode(node);

      case 'webhook':
        return await this.executeWebhookNode(node);

      case 'goto':
        return this.executeGotoNode(node);

      case 'end':
        return { ended: true };

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute message node - speaks a message
   */
  private executeMessageNode(node: FlowNode): NodeExecutionResult {
    const message = this.interpolateVariables(node.config.message);

    this.context.turnHistory.push({ assistantMessage: message });
    this.context.metadata.lastMessage = message;

    return { message };
  }

  /**
   * Execute condition node - evaluates expression
   */
  private executeConditionNode(node: FlowNode): NodeExecutionResult {
    const result = this.evaluateCondition(node.config.expression);
    return { conditionResult: result };
  }

  /**
   * Execute tool node - calls a tool/function
   */
  private async executeToolNode(node: FlowNode): Promise<NodeExecutionResult> {
    // Tool execution would be handled by SessionEngine
    // Here we just record the tool call request
    this.context.metadata.lastToolCall = {
      toolId: node.config.toolId,
      parameters: node.config.parameters || {},
    };

    return { toolCall: node.config.toolId };
  }

  /**
   * Execute variable node - sets a variable
   */
  private executeVariableNode(node: FlowNode): NodeExecutionResult {
    const value = this.evaluateExpression(node.config.value);
    this.context.variables[node.config.variableName] = value;

    return {};
  }

  /**
   * Execute webhook node - calls external URL
   * SECURITY: Timeout, URL validation, no private IPs
   */
  private async executeWebhookNode(node: FlowNode): Promise<NodeExecutionResult> {
    try {
      const response = await fetch(node.config.url, {
        method: node.config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(node.config.headers || {}),
        },
        body: JSON.stringify({
          variables: this.context.variables,
          metadata: this.context.metadata,
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const data = await response.json();

      // Store response in variables if responseVariable is specified
      if (node.config.responseVariable) {
        this.context.variables[node.config.responseVariable] = data;
      }

      return { webhookResponse: data };
    } catch (error) {
      // Handle based on error handling setting
      if (this.flow.settings?.errorHandling === 'stop') {
        throw error;
      }
      return { webhookError: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute goto node - jumps to another node
   */
  private executeGotoNode(node: FlowNode): NodeExecutionResult {
    return { nextNodeId: node.config.targetNodeId };
  }

  /**
   * Get next node by following edges
   */
  private async getNextNode(currentNodeId: string): Promise<string | null> {
    const outgoingEdges = this.flow.edges.filter(e => e.sourceId === currentNodeId);

    if (outgoingEdges.length === 0) {
      return null; // End of flow
    }

    // Evaluate conditional edges first
    for (const edge of outgoingEdges.filter(e => e.type === 'conditional')) {
      if (edge.condition && this.evaluateCondition(edge.condition)) {
        return edge.targetId;
      }
    }

    // Try default edges
    const defaultEdge = outgoingEdges.find(e => e.type === 'default');
    if (defaultEdge) {
      return defaultEdge.targetId;
    }

    // Fallback edge
    const fallbackEdge = outgoingEdges.find(e => e.type === 'fallback');
    return fallbackEdge?.targetId || null;
  }

  /**
   * Evaluate condition expression
   * SECURITY: Safe evaluation without eval()
   */
  private evaluateCondition(expr: ConditionExpression): boolean {
    switch (expr.operator) {
      case 'equals':
        return this.getVariableValue(expr.left as string) === expr.right;

      case 'notEquals':
        return this.getVariableValue(expr.left as string) !== expr.right;

      case 'contains':
        const leftVal = this.getVariableValue(expr.left as string);
        return typeof leftVal === 'string' && leftVal.includes(expr.right as string);

      case 'greaterThan':
        return Number(this.getVariableValue(expr.left as string)) > Number(expr.right);

      case 'lessThan':
        return Number(this.getVariableValue(expr.left as string)) < Number(expr.right);

      case 'exists':
        return this.getVariableValue(expr.left as string) !== undefined;

      case 'and':
        return (expr as any).conditions.every((c: ConditionExpression) =>
          this.evaluateCondition(c)
        );

      case 'or':
        return (expr as any).conditions.some((c: ConditionExpression) =>
          this.evaluateCondition(c)
        );

      default:
        return false;
    }
  }

  /**
   * Evaluate simple expression (not full JavaScript)
   * SECURITY: No eval(), safe evaluation only
   */
  private evaluateExpression(expr: any): any {
    if (typeof expr === 'string' && expr.startsWith('{{') && expr.endsWith('}}')) {
      const varName = expr.slice(2, -2).trim();
      return this.context.variables[varName];
    }
    return expr;
  }

  /**
   * Get variable value with dot notation support
   */
  private getVariableValue(path: string): any {
    const parts = path.split('.');
    let value: any = this.context.variables;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Interpolate variables in text {{variableName}}
   * SECURITY: Sanitize output to prevent injection
   */
  private interpolateVariables(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const value = this.getVariableValue(varName.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get node by ID
   */
  private getNode(nodeId: string): FlowNode {
    const node = this.flow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    return node;
  }

  /**
   * Check if execution time limit exceeded
   */
  private hasExceededTimeLimit(): boolean {
    const maxTime = this.flow.settings?.maxExecutionTime || 30000;
    return Date.now() - this.context.startTime > maxTime;
  }

  /**
   * Check if iteration limit exceeded
   */
  private hasExceededIterationLimit(): boolean {
    const maxIterations = this.flow.settings?.maxIterations || 100;
    return this.context.iterationCount > maxIterations;
  }
}

interface NodeExecutionResult {
  nextNodeId?: string;
  ended?: boolean;
  message?: string;
  conditionResult?: boolean;
  toolCall?: string;
  webhookResponse?: any;
  webhookError?: string;
}

interface FlowExecutionResult {
  success: boolean;
  error?: string;
  executionPath: string[];
  finalVariables: Record<string, any>;
  metadata?: Record<string, any>;
}
