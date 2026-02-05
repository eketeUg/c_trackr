"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchFormProps {
  onSearch: (chain: string, hash: string) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [chain, setChain] = useState('ethereum');
  const [hash, setHash] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hash) {
      onSearch(chain, hash);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full max-w-5xl bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-blue-900/30">
      <select
        value={chain}
        onChange={(e) => setChain(e.target.value)}
        className="bg-gray-800 text-white px-6 py-3 rounded-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        disabled={isLoading}
      >
        <option value="ethereum">Ethereum</option>
        <option value="bnb">BNB Chain</option>
        <option value="base">Base</option>
        <option value="arbitrum">Arbitrum</option>
      </select>

      <div className="relative flex-grow">
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Enter Transaction Hash (0x...)"
          className="w-full bg-gray-800 text-white px-6 py-3 pl-12 rounded-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
          disabled={isLoading}
        />
        <Search className="absolute left-4 top-3.5 text-cyan-400 h-5 w-5" />
      </div>

      <button
        type="submit"
        disabled={isLoading || !hash}
        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
      >
        {isLoading ? (
            <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching
            </>
        ) : 'Analyze'}
      </button>
    </form>
  );
}
