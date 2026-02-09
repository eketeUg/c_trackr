import React, { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Wallet, FileCode, Copy, Check, ArrowRight, ArrowLeft } from "lucide-react";

interface FlowStat {
  token: string;
  amount: number;
  symbol: string;
}

interface NodeFlowData {
  incoming: FlowStat[];
  outgoing: FlowStat[];
}

interface NodeData {
  id: string;
  label: string;
  type: "wallet" | "contract";
  flowData?: NodeFlowData;
}

export default memo(({ data }: { data: NodeData }) => {
  const isContract = data.type === "contract";
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasFlows =
    (data.flowData?.incoming?.length ?? 0) > 0 ||
    (data.flowData?.outgoing?.length ?? 0) > 0;

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`px-4 py-3 rounded-xl bg-gray-900/95 border border-gray-600 hover:border-cyan-500 transition-all cursor-pointer relative ${
        isExpanded ? "z-50 min-w-[300px]" : "min-w-[200px]"
      }`}
    >
      {/* --- MULTI-PORT LEFT/RIGHT HANDLES --- */}
      
      {/* LEFT SIDE (Incoming Forward + Outgoing Backward) */}
      {/* Multiple Targets for Forward In to allow vertical distribution */}
      <Handle id="target-left-a" type="target" position={Position.Left} style={{ top: "20%" }} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      <Handle id="target-left-b" type="target" position={Position.Left} style={{ top: "40%" }} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      <Handle id="target-left-c" type="target" position={Position.Left} style={{ top: "60%" }} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      {/* Source for Backward Out */}
      <Handle id="source-left" type="source" position={Position.Left} style={{ top: "80%" }} className="!bg-red-500 !w-2 !h-2 !border-none" />

      {/* RIGHT SIDE (Outgoing Forward + Incoming Backward) */}
      {/* Multiple Sources for Forward Out */}
      <Handle id="source-right-a" type="source" position={Position.Right} style={{ top: "20%" }} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      <Handle id="source-right-b" type="source" position={Position.Right} style={{ top: "40%" }} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      <Handle id="source-right-c" type="source" position={Position.Right} style={{ top: "60%" }} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      {/* Target for Backward In */}
      <Handle id="target-right" type="target" position={Position.Right} style={{ top: "80%" }} className="!bg-red-500 !w-2 !h-2 !border-none" />

      {/* Node Content */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-full border border-white/10 ${
            isContract
              ? "bg-purple-500/10 text-purple-400"
              : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {isContract ? <FileCode size={20} /> : <Wallet size={20} />}
        </div>

        <div className="flex-1 overflow-hidden">
          <div
            className="text-white text-sm font-bold truncate"
            title={data.label}
          >
            {data.label}
          </div>
          <div className="text-xs text-gray-500 font-mono truncate">
            {data.id}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2 animate-in fade-in duration-200">
           <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Address</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-mono truncate max-w-[150px]">{data.id}</span>
                <button
                  onClick={handleCopy}
                  className="hover:text-white text-gray-500 transition-colors"
                >
                   {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                </button>
              </div>
           </div>
           <div className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">
              {isContract ? "Smart Contract" : "Wallet Account"}
           </div>
        </div>
      )}
    </div>
  );
});
