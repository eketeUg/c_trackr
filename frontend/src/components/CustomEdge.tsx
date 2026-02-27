import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from "@xyflow/react";

interface EdgeData extends Record<string, unknown> {
  step?: number;
  timestamp?: string;
  amount?: string;
  tokenSymbol?: string;
  description?: string;
  tokenIcon?: string;
}

const CustomEdge: FC<EdgeProps> = ({
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
}) => {
  const edgeData = data as EdgeData;
  const step = edgeData.step;
  const timestamp = edgeData.timestamp;
  const amount = edgeData.amount;
  const tokenSymbol = edgeData.tokenSymbol;
  const description = edgeData.description;
  const tokenIcon = edgeData.tokenIcon;
  // Parse duplicate and divergent info passed from Dagre mapping
  const duplicateIndex = Number(edgeData.duplicateIndex) || 0;
  const totalDuplicates = Number(edgeData.totalDuplicates) || 1;
  const divergentIndex = Number(edgeData.divergentIndex) || 0;
  const totalDivergent = Number(edgeData.totalDivergent) || 1;

  // Calculate curve offsets for multi-edges 
  let curveOffset = 0;
  
  if (totalDuplicates > 1) {
    // 1. Identical A->B and B->A pairs (Strong Offset: 90px loops)
    const centerIndex = (totalDuplicates - 1) / 2;
    const distanceToCenter = duplicateIndex - centerIndex;
    curveOffset = distanceToCenter * 90; 
  } else if (totalDivergent > 1) {
    // 2. Fanning edges from single source to different targets (Mild Offset: 90px sweeps)
    // Dagre naturally curves these, but if they go to targets in the exact same rank they will physically overlap.
    const centerIndex = (totalDivergent - 1) / 2;
    const distanceToCenter = divergentIndex - centerIndex;
    curveOffset = distanceToCenter * 90;
  }

  // To cleanly bow bezier curves, we adjust the vertical control points.
  // Because nodes are quite far apart horizontally (ranksep=260), we push the control points further inward 
  // (0.25 and 0.75 instead of 0.5) to create distinct looping bell-curves instead of flat arches.
  // When applying divergent curve offsets, we apply it strongly to the Source control point (c1Y) where they originate.
  const c1X = sourceX + (targetX - sourceX) * 0.25;
  const c1Y = sourceY + curveOffset;
  const c2X = targetX - (targetX - sourceX) * 0.25;
  const c2Y = targetY + (totalDuplicates > 1 ? curveOffset : 0); // Only apply offset to Target control point if it's a true duplicate loop

  const edgePath = `M ${sourceX},${sourceY} C ${c1X},${c1Y} ${c2X},${c2Y} ${targetX},${targetY}`;

  // Calculate label position exactly at the midpoint of the curve
  // B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3 where t=0.5
  const t = 0.5;

  const labelX = 
    Math.pow(1-t, 3) * sourceX + 
    3 * Math.pow(1-t, 2) * t * c1X + 
    3 * (1-t) * Math.pow(t, 2) * c2X + 
    Math.pow(t, 3) * targetX;
    
  const labelY = 
    Math.pow(1-t, 3) * sourceY + 
    3 * Math.pow(1-t, 2) * t * c1Y + 
    3 * (1-t) * Math.pow(t, 2) * c2Y + 
    Math.pow(t, 3) * targetY;

  // Format timestamp (e.g. "2025-11-14 21:24:37" -> "21:24:37")
  const timeStr = timestamp ? String(timestamp).split(" ")[1] : "";

  // Determine Edge Direction based on coordinates (Left-to-Right = Forward)
  const isForward = sourceX <= targetX;
  
  // Apply Red for Forward edges, Green for Backward edges
  const edgeColor = isForward ? "#ef4444" : "#22c55e"; // tailwind text-red-500 and text-green-500

  // Merge the chosen color into the edge styling
  const customEdgeStyle = {
    ...style,
    stroke: edgeColor,
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={customEdgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) translate(0, -10px)`, // Slight offset up
            fontSize: 10,
            pointerEvents: "auto", // Allow hovering if needed
          }}
          className="nodrag nopan"
        >
          <div className="flex flex-col items-center select-none">
            {/* Text-only label with drop shadow for readability on dark lines. Background matches canvas to hide the line. */}
            <div className={`flex items-center gap-1.5 whitespace-nowrap text-[10px] font-medium bg-[#151722] border px-2.5 py-1 rounded-full shadow-sm ${
              isForward ? "text-red-500 border-red-900/40" : "text-green-500 border-green-900/40"
            }`}>
              {/* Step Index*/}
              {step && <span className="opacity-70">[{step}]</span>}

              {/* Timestamp */}
              {timeStr && (
                <span className="opacity-70 text-[10px]">[{timeStr}]</span>
              )}

              {/* Amount + Symbol + Icon */}
              {(amount || tokenSymbol) && (
                <div className="flex items-center gap-1.5 focus:outline-none">
                  {amount} {tokenSymbol}
                  {tokenIcon && (
                    <img
                      src={tokenIcon}
                      alt={tokenSymbol}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* Fallback to description/label if structured data missing */}
              {!amount && !tokenSymbol && description && (
                <span className="opacity-70">{description}</span>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
