import React, { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Wallet, FileCode, Copy, Check } from "lucide-react";

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
  image?: string;
  fullLabel?: string;
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

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`relative group transition-all duration-300 flex items-center bg-[#151722] border rounded-[20px] pr-4 pl-1 py-1 min-w-[140px] max-w-[220px] shadow-lg cursor-pointer ${
        isExpanded ? "z-50 border-[#4b597c] ring-1 ring-[#4b597c]/50" : "z-10 border-[#2a2c3a] hover:border-[#3a3c4a]"
      }`}
    >
      {/* --- MULTI-PORT LEFT/RIGHT HANDLES --- */}

      {/* LEFT SIDE (Incoming Forward + Outgoing Backward) */}
      <Handle
        id="target-left-a"
        type="target"
        position={Position.Left}
        style={{ top: "30%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />
      <Handle
        id="target-left-b"
        type="target"
        position={Position.Left}
        style={{ top: "50%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />
      <Handle
        id="target-left-c"
        type="target"
        position={Position.Left}
        style={{ top: "70%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        style={{ top: "50%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />

      {/* RIGHT SIDE (Outgoing Forward + Incoming Backward) */}
      <Handle
        id="source-right-a"
        type="source"
        position={Position.Right}
        style={{ top: "30%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />
      <Handle
        id="source-right-b"
        type="source"
        position={Position.Right}
        style={{ top: "50%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />
      <Handle
        id="source-right-c"
        type="source"
        position={Position.Right}
        style={{ top: "70%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        style={{ top: "50%", opacity: 0 }}
        className="!w-2 !h-2 !border-none"
      />

      {/* Main Node Visual - ICON + TEXT INSIDE PILL */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden
         ${data.image ? "bg-[#1f2233]" : isContract ? "bg-[#25283d] text-blue-400" : "bg-[#1e293b] text-blue-300"}
       `}
      >
        {data.image ? (
          <img
            src={data.image}
            alt={data.label}
            className="w-full h-full object-cover"
          />
        ) : isContract ? (
          <FileCode size={14} className="opacity-80" />
        ) : (
          <Wallet size={14} className="opacity-80" />
        )}
      </div>

      <div className="flex flex-col ml-2.5 overflow-hidden pointer-events-none w-full">
        {data.label && data.label.trim() !== "" ? (
          <>
            <div
              className="text-[#e2e8f0] text-[11px] font-medium truncate tracking-wide"
              title={data.label}
            >
              {data.label}
            </div>
            <div className="text-[9px] text-[#64748b] font-mono truncate opacity-80" title={data.id}>
               {data.id.substring(0, 8)}...{data.id.substring(data.id.length - 6)}
            </div>
          </>
        ) : (
          <div className="text-[#e2e8f0] text-[11px] font-mono truncate tracking-wide" title={data.id}>
             {data.id.substring(0, 6)}...{data.id.substring(data.id.length - 4)}
          </div>
        )}
      </div>

      {/* Expanded Context Menu */}
      {isExpanded && (
        <div className="absolute top-10 left-0 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                {data.fullLabel || data.label}
              </h3>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                {isContract ? "Smart Contract" : "Wallet Account"}
              </div>
            </div>
            {data.image && (
              <img
                src={data.image}
                className="w-8 h-8 rounded-full bg-gray-800"
              />
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
              <div className="text-[10px] text-gray-400 mb-1">Address</div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-blue-200 font-mono flex-1 break-all">
                  {data.id}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                >
                  {copied ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              Analyze Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
