import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from '@xyflow/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  // 1. Calculate Standard React Flow path as fallback
  const [bezierPath, bX, bY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  // 2. Use Graphviz-extracted path if available (Hybrid Method)
  // We offset by (-190, -50) to align with our top-left node positioning
  const gvPath = data?.path as string | undefined;
  const gvLabelPos = data?.labelPos as { x: number, y: number } | undefined;

  const finalPath = gvPath || bezierPath;
  const finalLabelX = gvLabelPos ? gvLabelPos.x - 190 : bX;
  const finalLabelY = gvLabelPos ? gvLabelPos.y - 50 : bY;

  return (
    <>
      <g transform={gvPath ? "translate(-190, -50)" : undefined}>
        <path
          id={id}
          style={style}
          className="react-flow__edge-path"
          d={finalPath}
          markerEnd={markerEnd}
        />
      </g>
      
      {/* EdgeLabelRenderer renders HTML strictly over the SVG context */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center justify-center gap-1 z-10"
        >
          {data?.serial !== undefined && (
            <span style={{ color: style?.stroke as string || '#00A54C' }} className="font-mono text-[12px]">
              [{data.serial as number}]
            </span>
          )}
          {data?.label ? (
            <span className="text-gray-300 font-sans text-[13px] tracking-wide relative">
              <span className="absolute inset-0 bg-[#16181D] blur-[4px] -z-10 rounded-full scale-150 opacity-80"></span>
              <span className="relative z-10">{data.label as string}</span>
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
