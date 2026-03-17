import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

type EdgeLabelNodeData = {
  timestamp: string;
  amount: number | string;
  tokenSymbol: string;
  tokenColor?: string;
  kind?: string;
};

const formatTimestamp = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

function EdgeLabelNode({ data }: { data: EdgeLabelNodeData }) {
  const strokeColor = data.tokenColor || "#5f78d8";
  const kind = (data.kind || "transfer").toUpperCase();
  const timestamp = formatTimestamp(data.timestamp);

  return (
    <div className="pointer-events-none relative flex min-w-[220px] items-center justify-center">
      <Handle type="target" position={Position.Left} id="target-left" isConnectable={false} className="opacity-0" />
      <Handle type="target" position={Position.Right} id="target-right" isConnectable={false} className="opacity-0" />
      <Handle type="source" position={Position.Left} id="source-left" isConnectable={false} className="opacity-0" />
      <Handle type="source" position={Position.Right} id="source-right" isConnectable={false} className="opacity-0" />

      <div className="absolute left-0 right-0 top-1/2 z-0 h-[2px] -translate-y-1/2" style={{ backgroundColor: strokeColor }} />

      <div className="z-10 flex items-center gap-2 rounded-md border border-[#4a5060] bg-[#1f222b] px-2 py-1 font-mono text-[10px] text-[#d0d6e5] shadow-[0_4px_12px_rgba(0,0,0,0.28)]">
        <span className="rounded border border-[#59617a] bg-[#2b3040] px-1 py-[1px] text-[9px] font-semibold text-[#bec9e8]">{kind}</span>
        {timestamp ? <span className="text-[#8f9ab4]">{timestamp}</span> : null}
        <span className="font-semibold" style={{ color: strokeColor }}>
          {data.amount}
        </span>
        {data.tokenSymbol ? <span className="text-[#dce2f2]">{data.tokenSymbol}</span> : null}
      </div>
    </div>
  );
}

export default memo(EdgeLabelNode);
