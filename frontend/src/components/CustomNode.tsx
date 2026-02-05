import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Wallet, FileCode, Copy, Check } from 'lucide-react';

export default memo(({ data }: { data: any }) => {
  const isContract = data.type === 'contract';
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
      className={`px-4 py-3 shadow-2xl rounded-xl bg-gray-900/95 border border-gray-600 hover:border-cyan-500 transition-all cursor-pointer relative ${isExpanded ? 'z-50 min-w-[300px]' : 'min-w-[200px]'}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isContract ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
          {isContract ? <FileCode size={16} /> : <Wallet size={16} />}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-white text-sm font-mono font-medium truncate" title={data.id}>
             {data.label}
          </div>
          
          {isExpanded ? (
            <div className="mt-2 space-y-1 animate-in fade-in duration-200">
               <div className="flex items-center gap-2 bg-gray-800/50 p-1.5 rounded-md border border-gray-700">
                  <span className="text-xs text-gray-300 font-mono break-all">{data.id}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
               </div>
               <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">
                 {isContract ? 'Step: Contract Interaction' : 'Step: Wallet Transfer'}
               </div>
            </div>
          ) : (
            data.id !== data.label && (
               <div className="text-gray-600 text-[10px] font-mono truncate max-w-[140px]">
                  {data.id.slice(0, 6)}...{data.id.slice(-4)}
               </div>
            )
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
});
