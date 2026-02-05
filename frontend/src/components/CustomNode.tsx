import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Wallet, FileCode } from 'lucide-react';

export default memo(({ data }: { data: any }) => {
  const isContract = data.type === 'contract';
  
  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl bg-gray-900/95 border border-gray-600 min-w-[200px] hover:border-cyan-500 transition-all">
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isContract ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
          {isContract ? <FileCode size={16} /> : <Wallet size={16} />}
        </div>
        <div>

          <div className="text-white text-sm font-mono font-medium truncate max-w-[140px]" title={data.id}>
             {data.label}
          </div>
          {data.id !== data.label && (
             <div className="text-gray-600 text-[10px] font-mono truncate max-w-[140px]">
                {data.id.slice(0, 6)}...{data.id.slice(-4)}
             </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
});
