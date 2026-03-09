import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
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

  // Determine Edge Direction based on coordinates (Left-to-Right = Forward)
  const isForward = sourceX <= targetX;

  // Calculate curve offsets for multi-edges (fanning them out)
  let spreadIndex = 0;
  let totalSpread = 1;
  const verticalSeparation = 40; 
  const horizontalStagger = 15; // Shift tight corners inward so they nest
  
  if (totalDuplicates > 1) {
    spreadIndex = duplicateIndex;
    totalSpread = totalDuplicates;
  } else if (totalDivergent > 1) {
    spreadIndex = divergentIndex;
    totalSpread = totalDivergent;
  }

  const centerIndex = (totalSpread - 1) / 2;
  const offsetMultiplier = spreadIndex - centerIndex;

  // Push lines up/down from the direct center path
  const controlYOffset = offsetMultiplier * verticalSeparation;
  
  // Stagger the horizontal curve point so inner tracks turn earlier and outer tracks turn later, preventing crossover collision
  // Take absolute because both the top and bottom outer-tracks need to turn wider than the center track
  const nestOffset = Math.abs(offsetMultiplier) * horizontalStagger;  

  // Calculate smooth Bezier Curve with Control Points pushed out horizontally to flatten the middle
  const distX = Math.abs(targetX - sourceX);
  const dirX = isForward ? 1 : -1;

  // The base curve goes out about 50% of the way before turning
  const baseCurveX = Math.max(distX * 0.45, 60);

  // Apply nesting stagger to X control points, and separation to Y control points
  const c1X = sourceX + ((baseCurveX - nestOffset) * dirX);
  const c1Y = sourceY + controlYOffset; 
  
  const c2X = targetX - ((baseCurveX - nestOffset) * dirX);
  const c2Y = targetY + controlYOffset;

  const edgePath = `M ${sourceX},${sourceY} C ${c1X},${c1Y} ${c2X},${c2Y} ${targetX},${targetY}`;

  // Calculate Exact Midpoint of the Bezier Curve for the Label Placement (t=0.5)
  const t = 0.5;
  const mt = 1 - t;
  const labelX = 
    (mt * mt * mt * sourceX) + 
    (3 * mt * mt * t * c1X) + 
    (3 * mt * t * t * c2X) + 
    (t * t * t * targetX);
    
  const labelY = 
    (mt * mt * mt * sourceY) + 
    (3 * mt * mt * t * c1Y) + 
    (3 * mt * t * t * c2Y) + 
    (t * t * t * targetY);

  // Format timestamp (e.g. "2025-11-14 21:24:37" -> "21:24:37")
  const timeStr = timestamp ? String(timestamp).split(" ")[1] : "";
  
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
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, // centered exactly on the line
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
