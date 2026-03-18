import React, { useState } from 'react';
import { Copy, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import { getChainLogo } from '../lib/metaSleuthUtils'; // Reusing this utility

export interface CustomNodeData {
  address: string;
  label?: string;
  chain?: string;
  logo?: string;
  type?: string;
  isTarget?: boolean;
}

const CustomNode = ({ data }: { data: CustomNodeData, isConnectable?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const displayAddress = data.address.includes('-') 
    ? data.address.substring(data.address.indexOf('-') + 1) 
    : data.address;

  const topHalf = displayAddress.slice(0, 32);
  const bottomHalf = displayAddress.slice(32);

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={clsx(
        "relative rounded-2xl shadow-xl flex flex-col transition-all duration-300 w-[380px] h-[100px]",
        data.isTarget ? "bg-[#252528] border-2 border-[#c1995c]" : "bg-[#252528] border border-gray-800 hover:outline hover:outline-2 hover:outline-blue-500"
      )}
      onClick={() => setShowDropdown(!showDropdown)}
    >
      {/* Node Content */}
      <div className="flex flex-row h-full w-full rounded-2xl overflow-hidden p-[1px]">
        <div className={clsx(
          "flex flex-row w-full h-full rounded-[15px] items-center p-4 cursor-pointer gap-4",
          data.isTarget ? "bg-opacity-90" : "bg-[#252528]"
        )}>
          
          {/* Left Square Logo Box */}
          <div className="w-12 h-12 bg-[#1A1D20] rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
            <img 
              src={data.logo || getChainLogo(data.chain || 'eth')} 
              alt="Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = getChainLogo(data.chain || 'eth');
                if (target.src !== window.location.origin + fallback) {
                  target.src = fallback;
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          </div>

          {/* Right Text Column */}
          <div className="flex flex-col flex-1 truncate">
            {data.label && (
              <div className="flex items-center justify-between mb-1">
                <span className={clsx(
                  "font-sans text-[13px] font-bold truncate",
                  data.isTarget ? "text-[#333]" : "text-white"
                )}>
                  {data.label.length > 25 ? `${data.label.slice(0, 25)}...` : data.label}
                </span>
                <ChevronDown className={clsx("w-4 h-4 ml-2", data.isTarget ? "text-[#333]" : "text-gray-400")} />
              </div>
            )}
            
            <span className={clsx(
              "font-mono text-[12px] leading-tight",
              data.isTarget ? "text-[#444]" : "text-[#9CA3AF]"
            )}>
              {topHalf}
            </span>
            {bottomHalf && (
              <span className={clsx(
                "font-mono text-[12px] leading-tight",
                data.isTarget ? "text-[#444]" : "text-[#9CA3AF]"
              )}>
                {bottomHalf}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Dropdown */}
      {showDropdown && (
        <div className="absolute top-[105%] left-0 w-full bg-[#1A1D20] rounded-xl border border-gray-700 shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <button 
            onClick={copyAddress}
            className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-[#2A2D30] hover:text-white rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 mr-3 text-green-500" /> : <Copy className="w-4 h-4 mr-3" />}
            {copied ? 'Copied!' : 'Copy Address'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomNode;
