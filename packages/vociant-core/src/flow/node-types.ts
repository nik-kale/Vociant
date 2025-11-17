/**
 * Flow Node Type Definitions
 *
 * Standardized node configurations for different flow node types
 */

export interface BaseNodeConfig {
  type: string;
  label?: string;
  description?: string;
}

export interface MessageNodeConfig extends BaseNodeConfig {
  type: 'message';
  message: string; // Can include {{variables}}
  delay?: number; // Optional delay in ms before speaking
}

export interface ConditionNodeConfig extends BaseNodeConfig {
  type: 'condition';
  expression: ConditionExpression;
  truePath?: string; // Node ID to go to if true
  falsePath?: string; // Node ID to go to if false
}

export interface ToolNodeConfig extends BaseNodeConfig {
  type: 'tool';
  toolId: string;
  parameters?: Record<string, any>;
  resultVariable?: string; // Store result in this variable
  onSuccess?: string; // Node ID on success
  onError?: string; // Node ID on error
}

export interface VariableNodeConfig extends BaseNodeConfig {
  type: 'variable';
  variableName: string;
  value: any; // Can be literal or {{variable}} reference
  operation?: 'set' | 'append' | 'increment';
}

export interface WebhookNodeConfig extends BaseNodeConfig {
  type: 'webhook';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any>;
  responseVariable?: string;
  timeout?: number; // Timeout in ms
}

export interface GotoNodeConfig extends BaseNodeConfig {
  type: 'goto';
  targetNodeId: string;
}

export interface CollectInputNodeConfig extends BaseNodeConfig {
  type: 'collect';
  prompt: string; // What to ask the user
  variable: string; // Variable to store user input
  validation?: InputValidation;
  maxAttempts?: number;
  retryPrompt?: string;
}

export interface EndNodeConfig extends BaseNodeConfig {
  type: 'end';
  endReason?: 'success' | 'timeout' | 'error' | 'user_hangup';
  finalMessage?: string;
}

export type NodeConfig =
  | MessageNodeConfig
  | ConditionNodeConfig
  | ToolNodeConfig
  | VariableNodeConfig
  | WebhookNodeConfig
  | GotoNodeConfig
  | CollectInputNodeConfig
  | EndNodeConfig;

export interface ConditionExpression {
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual'
    | 'exists'
    | 'isEmpty'
    | 'and'
    | 'or'
    | 'not';
  left?: string | ConditionExpression;
  right?: string | number | boolean | ConditionExpression;
  conditions?: ConditionExpression[]; // For logical operators
}

export interface InputValidation {
  type: 'email' | 'phone' | 'number' | 'regex' | 'custom';
  pattern?: string; // For regex validation
  min?: number; // For number validation
  max?: number; // For number validation
  errorMessage?: string;
}

/**
 * Node Type Metadata - for UI rendering
 */
export const NODE_TYPE_METADATA = {
  message: {
    name: 'Message',
    description: 'Speak a message to the user',
    icon: '💬',
    color: '#3b82f6',
    category: 'output',
  },
  condition: {
    name: 'Condition',
    description: 'Branch based on a condition',
    icon: '🔀',
    color: '#f59e0b',
    category: 'logic',
  },
  tool: {
    name: 'Tool Call',
    description: 'Execute a tool or function',
    icon: '🔧',
    color: '#8b5cf6',
    category: 'action',
  },
  variable: {
    name: 'Set Variable',
    description: 'Set or update a variable',
    icon: '📝',
    color: '#10b981',
    category: 'data',
  },
  webhook: {
    name: 'Webhook',
    description: 'Call an external API',
    icon: '🌐',
    color: '#06b6d4',
    category: 'action',
  },
  goto: {
    name: 'Go To',
    description: 'Jump to another node',
    icon: '➡️',
    color: '#6b7280',
    category: 'logic',
  },
  collect: {
    name: 'Collect Input',
    description: 'Get user input with validation',
    icon: '🎤',
    color: '#ec4899',
    category: 'input',
  },
  end: {
    name: 'End',
    description: 'End the conversation',
    icon: '🛑',
    color: '#ef4444',
    category: 'control',
  },
} as const;

/**
 * Create a new node with default configuration
 */
export function createNode(type: NodeConfig['type'], position: { x: number; y: number }): any {
  const baseId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const baseNode = {
    id: baseId,
    type,
    positionX: position.x,
    positionY: position.y,
    label: NODE_TYPE_METADATA[type as keyof typeof NODE_TYPE_METADATA]?.name || type,
  };

  // Type-specific defaults
  switch (type) {
    case 'message':
      return {
        ...baseNode,
        config: {
          message: 'Hello! This is a message.',
        },
      };

    case 'condition':
      return {
        ...baseNode,
        config: {
          expression: {
            operator: 'equals',
            left: 'variable_name',
            right: 'value',
          },
        },
      };

    case 'tool':
      return {
        ...baseNode,
        config: {
          toolId: '',
          parameters: {},
        },
      };

    case 'variable':
      return {
        ...baseNode,
        config: {
          variableName: 'myVariable',
          value: '',
          operation: 'set',
        },
      };

    case 'webhook':
      return {
        ...baseNode,
        config: {
          url: 'https://api.example.com/endpoint',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      };

    case 'goto':
      return {
        ...baseNode,
        config: {
          targetNodeId: '',
        },
      };

    case 'collect':
      return {
        ...baseNode,
        config: {
          prompt: 'What would you like to say?',
          variable: 'userInput',
          maxAttempts: 3,
        },
      };

    case 'end':
      return {
        ...baseNode,
        config: {
          endReason: 'success',
          finalMessage: 'Thank you! Goodbye.',
        },
      };

    default:
      return baseNode;
  }
}

/**
 * Validate node configuration
 */
export function validateNodeConfig(node: any): string[] {
  const errors: string[] = [];

  if (!node.id) {
    errors.push('Node must have an ID');
  }

  if (!node.type) {
    errors.push('Node must have a type');
  }

  if (!node.config) {
    errors.push('Node must have a config');
  }

  // Type-specific validation
  switch (node.type) {
    case 'message':
      if (!node.config.message) {
        errors.push('Message node must have a message');
      }
      break;

    case 'condition':
      if (!node.config.expression) {
        errors.push('Condition node must have an expression');
      }
      break;

    case 'tool':
      if (!node.config.toolId) {
        errors.push('Tool node must have a toolId');
      }
      break;

    case 'variable':
      if (!node.config.variableName) {
        errors.push('Variable node must have a variableName');
      }
      break;

    case 'webhook':
      if (!node.config.url) {
        errors.push('Webhook node must have a URL');
      }
      try {
        new URL(node.config.url);
      } catch {
        errors.push('Webhook URL must be valid');
      }
      break;

    case 'goto':
      if (!node.config.targetNodeId) {
        errors.push('Goto node must have a targetNodeId');
      }
      break;

    case 'collect':
      if (!node.config.prompt || !node.config.variable) {
        errors.push('Collect node must have prompt and variable');
      }
      break;
  }

  return errors;
}
