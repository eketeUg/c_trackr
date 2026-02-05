"use client";

import React, { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import TransactionFlow from '@/components/TransactionFlow';
import { getTransactionFlow } from '@/lib/api';

import GalaxyBackground from '@/components/GalaxyBackground';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (chain: string, hash: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getTransactionFlow(chain, hash);
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch transaction data. Ensure the hash and chain are correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen text-white font-sans relative flex flex-col items-center ${!data ? 'justify-center' : 'justify-start pt-24'}`}>
      <GalaxyBackground />
      
      {/* Fixed Top-Left Logo */}
      <div className="fixed top-6 left-8 z-50 text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.reload()}>
        C-Trackr
      </div>

      <div className={`flex flex-col items-center gap-10 p-8 relative z-10 w-full transition-all duration-500 ${data ? 'pt-0' : ''}`}>
        
        {/* Header */}
        {!data && (
            <div className="text-center space-y-4 pt-4 animate-in fade-in zoom-in duration-500">
            <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                C-Trackr
            </h1>
            <p className="text-blue-200/70 text-xl max-w-2xl mx-auto drop-shadow-md">
                Visualize crypto transaction flows across multiple chains.
            </p>
            </div>
        )}

        {/* Search Section - Transitions to top when data exists */}
        <div className={`w-full flex justify-center transition-all duration-700 ${data ? 'fixed top-4 left-0 right-0 z-40 px-4' : ''}`}>
           <div className={`w-full transition-all duration-700 ${data ? 'max-w-4xl scale-90' : 'max-w-5xl'}`}>
              <SearchForm onSearch={handleSearch} isLoading={loading} />
           </div>
        </div>

        {/* Error Message */}
        {error && (
            <div className="w-full max-w-2xl bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mt-20">
                {error}
            </div>
        )}
      </div>

      {/* Results Section */}
      {data && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 mt-8">
              <div className="max-w-4xl mx-auto w-full px-4 fixed top-36 left-0 right-0 z-30 pointer-events-none">
                  <div className="grid grid-cols-4 gap-2 bg-gray-900/40 p-2 rounded-full border border-gray-800/50 backdrop-blur-md pointer-events-auto">
                      <div className="flex flex-col items-center">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Status</span>
                          <div className={`font-mono text-xs font-bold ${data.metadata.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
                              {data.metadata.status}
                          </div>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Block</span>
                          <div className="text-white font-mono text-xs">{data.metadata.blockNumber}</div>
                      </div>
                       <div className="flex flex-col items-center">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Gas</span>
                          <div className="text-white font-mono text-xs">{data.metadata.gasUsed}</div>
                      </div>
                       <div className="flex flex-col items-center">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Time</span>
                          <div className="text-white font-mono text-xs whitespace-nowrap">{new Date(data.metadata.timestamp).toLocaleTimeString()}</div>
                      </div>
                  </div>
              </div>

              {/* Graph Visualization - Full Width */}
              <div className="w-full border-t border-gray-800 bg-black/60 backdrop-blur-sm" style={{ height: '90vh', minHeight: '900px' }}>
                  <TransactionFlow data={data} />
              </div>
          </div>
      )}
    </main>
  );
}
