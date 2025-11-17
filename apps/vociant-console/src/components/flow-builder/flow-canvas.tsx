'use client';

import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Play, Save, Download, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import FlowNode from './flow-node';
import FlowEdge from './flow-edge';
import NodePalette from './node-palette';

interface Node {
  id: string;
  type: string;
  label: string;
  positionX: number;
  positionY: number;
  config: Record<string, any>;
}

interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'default' | 'conditional' | 'fallback';
  label?: string;
}

interface FlowCanvasProps {
  flowId?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onTest?: () => void;
}

export default function FlowCanvas({ flowId, onSave, onTest }: FlowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'start_1',
      type: 'message',
      label: 'Start Message',
      positionX: 100,
      positionY: 100,
      config: { message: 'Hello! How can I help you today?' },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
      positionX: position?.x || 200 + nodes.length * 50,
      positionY: position?.y || 200 + nodes.length * 50,
      config: {},
    };

    setNodes((prev) => [...prev, newNode]);
    setIsPaletteOpen(false);
  }, [nodes.length]);

  const handleNodeMove = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              positionX: node.positionX + deltaX / zoom,
              positionY: node.positionY + deltaY / zoom,
            }
          : node
      )
    );
  }, [zoom]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  const handleNodeConnect = useCallback((nodeId: string) => {
    if (connectingFrom) {
      // Create edge
      const newEdge: Edge = {
        id: `edge_${Date.now()}`,
        sourceId: connectingFrom,
        targetId: nodeId,
        type: 'default',
      };
      setEdges((prev) => [...prev, newEdge]);
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  }, [connectingFrom]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleEdgeDelete = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="flex h-screen">
      {/* Node Palette */}
      {isPaletteOpen && (
        <div className="w-64 bg-white border-r overflow-y-auto">
          <NodePalette onAddNode={handleAddNode} onClose={() => setIsPaletteOpen(false)} />
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button size="sm" onClick={() => setIsPaletteOpen(!isPaletteOpen)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Node
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          {onTest && (
            <Button size="sm" variant="outline" onClick={onTest}>
              <Play className="h-4 w-4 mr-1" />
              Test Flow
            </Button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="text-xs text-center px-2 py-1 bg-white border rounded">
            {Math.round(zoom * 100)}%
          </div>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
              >
                <circle cx="1" cy="1" r="1" fill="#e5e7eb" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Transform container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Edges */}
            <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.sourceId);
                const targetNode = nodes.find((n) => n.id === edge.targetId);

                if (!sourceNode || !targetNode) return null;

                return (
                  <FlowEdge
                    key={edge.id}
                    edge={edge}
                    sourceX={sourceNode.positionX + 100}
                    sourceY={sourceNode.positionY + 40}
                    targetX={targetNode.positionX}
                    targetY={targetNode.positionY + 40}
                    onDelete={() => handleEdgeDelete(edge.id)}
                  />
                );
              })}

              {/* Connecting line */}
              {connectingFrom && (
                <line
                  x1={nodes.find((n) => n.id === connectingFrom)!.positionX + 100}
                  y1={nodes.find((n) => n.id === connectingFrom)!.positionY + 40}
                  x2={nodes.find((n) => n.id === connectingFrom)!.positionX + 150}
                  y2={nodes.find((n) => n.id === connectingFrom)!.positionY + 40}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <FlowNode
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                isConnecting={connectingFrom === node.id}
                onMove={handleNodeMove}
                onClick={handleNodeClick}
                onConnect={handleNodeConnect}
                onDelete={handleNodeDelete}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNodeData && (
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-4">Node Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Label</label>
              <input
                type="text"
                value={selectedNodeData.label}
                onChange={(e) => {
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === selectedNode ? { ...n, label: e.target.value } : n
                    )
                  );
                }}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="mt-1 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                {selectedNodeData.type}
              </div>
            </div>

            {/* Type-specific config */}
            {selectedNodeData.type === 'message' && (
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={selectedNodeData.config.message || ''}
                  onChange={(e) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode
                          ? { ...n, config: { ...n.config, message: e.target.value } }
                          : n
                      )
                    );
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Enter message text..."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
