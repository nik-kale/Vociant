'use client';

interface FlowEdgeProps {
  edge: {
    id: string;
    type: 'default' | 'conditional' | 'fallback';
    label?: string;
  };
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  onDelete: () => void;
}

export default function FlowEdge({
  edge,
  sourceX,
  sourceY,
  targetX,
  targetY,
  onDelete,
}: FlowEdgeProps) {
  // Calculate control points for bezier curve
  const controlX1 = sourceX + (targetX - sourceX) * 0.5;
  const controlY1 = sourceY;
  const controlX2 = sourceX + (targetX - sourceX) * 0.5;
  const controlY2 = targetY;

  const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;

  // Edge color based on type
  const strokeColor =
    edge.type === 'conditional'
      ? '#f59e0b'
      : edge.type === 'fallback'
      ? '#ef4444'
      : '#94a3b8';

  // Arrow marker
  const markerId = `arrow-${edge.id}`;

  return (
    <g className="pointer-events-auto">
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Invisible thick line for easier clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        className="cursor-pointer"
        onClick={onDelete}
      />

      {/* Visible line */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        markerEnd={`url(#${markerId})`}
        className="pointer-events-none"
        strokeDasharray={edge.type === 'conditional' ? '5,5' : undefined}
      />

      {/* Label */}
      {edge.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2 - 5}
          fontSize="12"
          fill="#64748b"
          textAnchor="middle"
          className="pointer-events-none select-none"
        >
          {edge.label}
        </text>
      )}

      {/* Delete button */}
      <circle
        cx={(sourceX + targetX) / 2}
        cy={(sourceY + targetY) / 2}
        r="8"
        fill="white"
        stroke={strokeColor}
        strokeWidth="2"
        className="cursor-pointer hover:fill-red-50"
        onClick={onDelete}
      />
      <text
        x={(sourceX + targetX) / 2}
        y={(sourceY + targetY) / 2 + 4}
        fontSize="12"
        fill={strokeColor}
        textAnchor="middle"
        className="pointer-events-none select-none font-bold"
      >
        ×
      </text>
    </g>
  );
}
