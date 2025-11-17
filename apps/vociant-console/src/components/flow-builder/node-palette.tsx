'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NodePaletteProps {
  onAddNode: (type: string) => void;
  onClose: () => void;
}

const NODE_TYPES = [
  {
    type: 'message',
    name: 'Message',
    description: 'Speak a message to the user',
    icon: '💬',
    color: 'bg-blue-500',
    category: 'Output',
  },
  {
    type: 'collect',
    name: 'Collect Input',
    description: 'Get user input with validation',
    icon: '🎤',
    color: 'bg-pink-500',
    category: 'Input',
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Branch based on a condition',
    icon: '🔀',
    color: 'bg-amber-500',
    category: 'Logic',
  },
  {
    type: 'goto',
    name: 'Go To',
    description: 'Jump to another node',
    icon: '➡️',
    color: 'bg-gray-500',
    category: 'Logic',
  },
  {
    type: 'tool',
    name: 'Tool Call',
    description: 'Execute a tool or function',
    icon: '🔧',
    color: 'bg-purple-500',
    category: 'Actions',
  },
  {
    type: 'webhook',
    name: 'Webhook',
    description: 'Call an external API',
    icon: '🌐',
    color: 'bg-cyan-500',
    category: 'Actions',
  },
  {
    type: 'variable',
    name: 'Set Variable',
    description: 'Set or update a variable',
    icon: '📝',
    color: 'bg-green-500',
    category: 'Data',
  },
  {
    type: 'end',
    name: 'End',
    description: 'End the conversation',
    icon: '🛑',
    color: 'bg-red-500',
    category: 'Control',
  },
];

const categories = [...new Set(NODE_TYPES.map((n) => n.category))];

export default function NodePalette({ onAddNode, onClose }: NodePaletteProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Add Node</h3>
        <button onClick={onClose} className="hover:bg-gray-100 rounded p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {NODE_TYPES.filter((n) => n.category === category).map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={() => onAddNode(nodeType.type)}
                  className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`${nodeType.color} w-10 h-10 rounded flex items-center justify-center text-xl flex-shrink-0`}
                    >
                      {nodeType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{nodeType.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {nodeType.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
