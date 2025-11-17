'use client';

import { useState, useRef } from 'react';
import { Trash2, Link } from 'lucide-react';

interface FlowNodeProps {
  node: {
    id: string;
    type: string;
    label: string;
    positionX: number;
    positionY: number;
    config: Record<string, any>;
  };
  isSelected: boolean;
  isConnecting: boolean;
  onMove: (nodeId: string, deltaX: number, deltaY: number) => void;
  onClick: (nodeId: string) => void;
  onConnect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

const NODE_COLORS: Record<string, string> = {
  message: 'bg-blue-500',
  condition: 'bg-amber-500',
  tool: 'bg-purple-500',
  variable: 'bg-green-500',
  webhook: 'bg-cyan-500',
  goto: 'bg-gray-500',
  collect: 'bg-pink-500',
  end: 'bg-red-500',
};

const NODE_ICONS: Record<string, string> = {
  message: '💬',
  condition: '🔀',
  tool: '🔧',
  variable: '📝',
  webhook: '🌐',
  goto: '➡️',
  collect: '🎤',
  end: '🛑',
};

export default function FlowNode({
  node,
  isSelected,
  isConnecting,
  onMove,
  onClick,
  onConnect,
  onDelete,
}: FlowNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      onMove(node.id, deltaX, deltaY);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Add/remove event listeners
  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  const colorClass = NODE_COLORS[node.type] || 'bg-gray-500';
  const icon = NODE_ICONS[node.type] || '📦';

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-move select-none ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: node.positionX,
        top: node.positionY,
        width: 200,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onClick(node.id)}
    >
      {/* Connection points */}
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full cursor-pointer hover:bg-blue-100 hover:border-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          onConnect(node.id);
        }}
        title="Connect from here"
      />
      <div
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full cursor-pointer hover:bg-blue-100 hover:border-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          onConnect(node.id);
        }}
        title="Connect from here"
      />

      {/* Node card */}
      <div
        className={`
          bg-white rounded-lg shadow-lg border-2 overflow-hidden transition-all
          ${isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-200'}
          ${isConnecting ? 'ring-2 ring-blue-300' : ''}
          ${isDragging ? 'opacity-75' : ''}
        `}
      >
        {/* Header */}
        <div className={`${colorClass} px-3 py-2 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-sm truncate">{node.type}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="hover:bg-white/20 rounded p-1 transition-colors"
            title="Delete node"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3">
          <div className="font-medium text-sm mb-1">{node.label}</div>

          {/* Preview of config */}
          <div className="text-xs text-gray-600">
            {node.type === 'message' && node.config.message && (
              <div className="truncate">{node.config.message}</div>
            )}
            {node.type === 'condition' && <div className="text-gray-400">If/Then logic</div>}
            {node.type === 'tool' && node.config.toolId && (
              <div className="truncate">Tool: {node.config.toolId}</div>
            )}
            {node.type === 'variable' && node.config.variableName && (
              <div className="truncate">Var: {node.config.variableName}</div>
            )}
            {node.type === 'webhook' && node.config.url && (
              <div className="truncate">{node.config.url}</div>
            )}
            {node.type === 'end' && (
              <div className="text-gray-400">End conversation</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
