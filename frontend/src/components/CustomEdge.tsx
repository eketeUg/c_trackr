import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20, // Rounded corners for smooth step
  });

  const edgeData = data as EdgeData;
  const step = edgeData.step;
  const timestamp = edgeData.timestamp;
  const amount = edgeData.amount;
  const tokenSymbol = edgeData.tokenSymbol;
  const description = edgeData.description;
  const tokenIcon = edgeData.tokenIcon;

  // Format timestamp (e.g. "2025-11-14 21:24:37" -> "21:24:37")
  const timeStr = timestamp ? String(timestamp).split(" ")[1] : "";

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
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
            {/* Text-only label with drop shadow for readability on dark lines */}
            <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium drop-shadow-md bg-[#0f111a]/80 px-1.5 py-0.5 rounded text-gray-200">
              {/* Step Index*/}
              {step && <span className="text-[#3b82f6]">[{step}]</span>}

              {/* Timestamp */}
              {timeStr && (
                <span className="text-gray-500 text-[10px]">[{timeStr}]</span>
              )}

              {/* Amount + Symbol + Icon */}
              {(amount || tokenSymbol) && (
                <div className="flex items-center gap-1 text-gray-200">
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
                <span className="text-gray-400">{description}</span>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
