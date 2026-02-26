"use client";

import React from 'react';
import { Search, ShieldCheck, FileSearch, ShieldAlert, LineChart, Cpu, ArrowRightLeft, Layers, Database, Lock, SearchCode, AlertTriangle } from 'lucide-react';
import SearchForm from './SearchForm';
import { Marquee } from './Marquee';

interface LandingPageProps {
  onSearch: (chain: string, hash: string) => void;
  isLoading: boolean;
  error: string | null;
}

const addressLabels = [
  "Terrorist Financing", "Scam", "Hot Wallet", "Honeypot",
  "Mixer", "Sanctioned", "Wallet", "Deposit Address", "Infrastructure",
  "Smart Money", "DEX", "Ransomware", "Bridge", "Mining Pool",
  "CEX", "Whale", "Hacker", "Payment Processor", "Rug Pull"
];

const partners = [
  "Bitquery", "Blockscout", "OKLINK", "RSS3", "AMBER", "BYBIT", "imToken", "GOPLUS"
];

const testimonials = [
  { username: "@cryptoash10", name: "CryptoAsh", text: "Another awesome tool to track wallets and funds is C-Trackr. It makes it really easy to work out and display the information you want and automatically show the transactions between each point!" },
  { username: "@crypt0sheek", name: "David.Sheek.xbt", text: "C-Trackr is #fire 🔥 This shows a simpler view of how the transaction is being carried out 👇" },
  { username: "@zachxbt", name: "ZachXBT", text: "C-Trackr is probably best free option for EVM chains rn" },
  { username: "@DeDotFiSecurity", name: "De.Fi Antivirus Web3", text: "Great tool to visualize on-chain movement. It's great to know that you're open to further communication. Keep up the excellent work!" },
  { username: "@bandabera", name: "banda", text: "this is my favorite tool in a long time. going to save me so much time looking through internal transfers on etherscan and outbound txs" },
  { username: "@bigwhale143", name: "BIG WHALE 🐳", text: "Finally, C-Trackr is a comprehensive platform that provides insights and analytics on various blockchain protocols, including their transaction volume, tokenomics, and user behavior." }
];

export default function LandingPage({ onSearch, isLoading, error }: LandingPageProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <header className="w-full flex justify-between items-center py-6 px-10 relative z-50">
        <div className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] cursor-pointer hover:opacity-80 transition-opacity">
          C-Trackr
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
          <a href="#" className="hover:text-cyan-400 transition-colors">API</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a>
          <a href="#" className="hover:textcyan-400 transition-colors">Blog</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Docs</a>
        </nav>
        <div className="flex gap-4 items-center">
          <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign in</button>
          <button className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all">Sign up</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-5xl mx-auto flex flex-col items-center pt-24 pb-32 px-4 z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-12 drop-shadow-lg">
          Crypto Tracking and<br className="hidden md:block" /> Investigation Platform
        </h1>

        <div className="w-full max-w-4xl">
          <SearchForm onSearch={onSearch} isLoading={isLoading} />
        </div>
        
        {/* Error Message */}
        {error && (
            <div className="w-full max-w-2xl bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mt-6 text-center shadow-lg">
                {error}
            </div>
        )}

        <div className="flex gap-6 mt-12 text-gray-500 flex-wrap justify-center opacity-80">
          <div className="w-6 h-6 rounded-full bg-gray-600/50 flex items-center justify-center text-xs font-bold text-gray-300">B</div>
          <div className="w-6 h-6 rounded-full bg-gray-600/50 flex items-center justify-center text-xs font-bold text-gray-300">E</div>
          <div className="w-6 h-6 rounded-full bg-gray-600/50 flex items-center justify-center text-xs font-bold text-gray-300">S</div>
          <div className="w-6 h-6 rounded-full bg-gray-600/50 flex items-center justify-center text-xs font-bold text-gray-300">P</div>
          <div className="w-6 h-6 rounded-full bg-gray-600/50 flex items-center justify-center text-xs font-bold text-gray-300">A</div>
        </div>
      </section>

      {/* Primary Application Scenarios */}
      <section className="w-full max-w-6xl mx-auto py-24 px-4 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-cyan-500"></div>
          <h2 className="text-3xl font-bold text-white">Primary Application Scenarios</h2>
          <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-cyan-500"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card 1 */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 hover:bg-gray-800/60 hover:border-cyan-900/50 transition-all flex justify-between items-center group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="max-w-[70%] z-10">
              <h3 className="text-xl font-bold text-white mb-2">DYOR (Do Your Own Research)</h3>
              <p className="text-gray-400 text-sm">Engage in comprehensive research before investing in Altcoins.</p>
            </div>
            <div className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity z-10">
              <FileSearch size={48} strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 hover:bg-gray-800/60 hover:border-cyan-900/50 transition-all flex justify-between items-center group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="max-w-[70%] z-10">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">Compliance Measures <span className="text-cyan-500 rotate-45">↗</span></h3>
              <p className="text-gray-400 text-sm">Detect illicit activities, mitigate risks, and ensure full AML/CFT compliance.</p>
            </div>
            <div className="text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity z-10">
              <ShieldCheck size={48} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 hover:bg-gray-800/60 hover:border-cyan-900/50 transition-all flex justify-between items-center group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="max-w-[70%] z-10">
              <h3 className="text-xl font-bold text-white mb-2">Stolen Funds Tracking</h3>
              <p className="text-gray-400 text-sm">Track funds in case of phishing, scams, or compromised private keys. Get immediate help.</p>
            </div>
            <div className="text-cyan-600 opacity-50 group-hover:opacity-100 transition-opacity z-10">
              <ShieldAlert size={48} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 hover:bg-gray-800/60 hover:border-cyan-900/50 transition-all flex justify-between items-center group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="max-w-[70%] z-10">
              <h3 className="text-xl font-bold text-white mb-2">Forensics Analysis</h3>
              <p className="text-gray-400 text-sm">In-depth investigation and forensic analysis capabilities.</p>
            </div>
            <div className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity z-10">
              <LineChart size={48} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      {/* Address Labels Marquee Section */}
      <section className="w-full bg-black/50 py-24 flex flex-col items-center overflow-hidden border-y border-gray-900/50 relative z-10">
         <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center">
            Over <span className="text-cyan-500">400M</span> Address Labels
         </h2>
         <div className="relative w-full overflow-hidden flex flex-col gap-4 max-w-[100vw]">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black to-transparent z-10"></div>
            
            <Marquee className="w-full" pauseOnHover={true}>
              {addressLabels.slice(0, 10).map((label, idx) => (
                <div key={idx} className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-gray-300 whitespace-nowrap hover:border-cyan-500/50 hover:text-white transition-colors cursor-pointer">
                  {idx % 2 === 0 ? <Database size={14} className="text-cyan-500" /> : <Lock size={14} className="text-blue-500" />}
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </Marquee>
            <Marquee className="w-full" reverse pauseOnHover={true}>
              {addressLabels.slice(10).map((label, idx) => (
                <div key={idx} className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-gray-300 whitespace-nowrap hover:border-cyan-500/50 hover:text-white transition-colors cursor-pointer">
                   {idx % 2 !== 0 ? <AlertTriangle size={14} className="text-cyan-500" /> : <ShieldAlert size={14} className="text-red-500" />}
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </Marquee>
         </div>
      </section>

      {/* Easy Tracking Features */}
      <section className="w-full max-w-6xl mx-auto py-32 px-4 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-24">
            <span className="text-white">Easy Tracking</span> <span className="text-cyan-500">for Everyone</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Feature 1 */}
            <div className="bg-gray-900/30 border border-gray-800/60 rounded-3xl p-10 flex flex-col overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="z-10 mb-10">
                    <h3 className="text-2xl font-bold text-white mb-4">Highlight Major Interactions Intelligently</h3>
                    <p className="text-gray-400">Prioritize important interactions by using factors like address labels, compliance scores, and funding relationships. Keep it straightforward and focused.</p>
                </div>
                <div className="flex-1 min-h-[250px] relative border border-gray-800/80 rounded-xl bg-black/60 overflow-hidden flex items-center justify-center p-6 mt-auto">
                    {/* Abstract Graph Representation */}
                    <div className="flex items-center w-full justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-900/50 border border-red-500/50 flex items-center justify-center"><ShieldAlert size={16} className="text-red-400" /></div>
                            <div className="w-10 h-10 rounded-full bg-cyan-900/50 border border-cyan-500/50 flex items-center justify-center"><Database size={16} className="text-cyan-400" /></div>
                            <div className="w-10 h-10 rounded-full bg-orange-900/50 border border-orange-500/50 flex items-center justify-center"><Lock size={16} className="text-orange-400" /></div>
                        </div>
                        <div className="h-[2px] w-20 bg-gradient-to-r from-cyan-500/20 to-cyan-500 relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                        </div>
                        <div className="w-48 h-32 bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col gap-2 p-3 shadow-2xl">
                             <div className="w-full h-4 bg-gray-700 rounded-sm"></div>
                             <div className="w-3/4 h-3 bg-gray-700/50 rounded-sm"></div>
                             <div className="w-1/2 h-3 bg-gray-700/50 rounded-sm"></div>
                             <div className="mt-auto w-full h-8 bg-cyan-900/40 border border-cyan-500/30 rounded flex items-center px-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
                                <div className="w-1/2 h-2 bg-cyan-700 rounded-sm"></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/30 border border-gray-800/60 rounded-3xl p-10 flex flex-col overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="z-10 mb-10">
                    <h3 className="text-2xl font-bold text-white mb-4">Uncover Hidden Paths Automatically</h3>
                    <p className="text-gray-400">Effortlessly explore paths to key nodes, including CEX and Mixer, revealing crucial clues and invaluable evidence to enhance your investigation with ease.</p>
                </div>
                 <div className="flex-1 min-h-[250px] relative border border-gray-800/80 rounded-xl bg-black/60 overflow-hidden flex items-center justify-center p-6 mt-auto">
                    {/* Abstract Path Representation */}
                     <div className="w-full max-w-[80%] border border-gray-700 rounded-xl p-4 bg-gray-900/80 flex items-center justify-between relative opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center"><SearchCode size={16} className="text-gray-400" /></div>
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-gray-600 via-blue-500 to-gray-600 mx-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-8 h-full bg-white opacity-50 blur-sm animate-[translateX_2s_infinite]"></div>
                        </div>
                        <div className="w-32 h-16 bg-gray-800 border border-blue-500/40 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 shadow-[0_0_5px_#60a5fa] animate-pulse"></span>
                            <div className="w-12 h-2 bg-gray-600 rounded"></div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full max-w-6xl mx-auto py-24 px-4 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-blue-500"></div>
          <h2 className="text-3xl font-bold text-white">Hear from our users</h2>
          <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-blue-500"></div>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="break-inside-avoid bg-gray-900/40 border border-gray-800 rounded-xl p-6 hover:bg-gray-800/60 transition-colors">
               <p className="text-gray-300 text-sm mb-6 leading-relaxed">"{t.text}"</p>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-white font-bold opacity-80">
                      {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.username}</div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full bg-black/80 border-t border-gray-800 py-16 px-10 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12 text-sm">
            <div className="max-w-xs">
                <div className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
                  C-Trackr
                </div>
                <p className="text-gray-400">The premier platform for visualizing and analyzing blockchain transactions across multiple networks.</p>
            </div>
            
            <div className="flex gap-16">
                <div>
                    <h4 className="text-white font-semibold mb-4">Products</h4>
                    <ul className="text-gray-400 space-y-2">
                        <li><a href="#" className="hover:text-cyan-400">Transaction Flow</a></li>
                        <li><a href="#" className="hover:text-cyan-400">Address Labels</a></li>
                        <li><a href="#" className="hover:text-cyan-400">Risk API</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Resources</h4>
                    <ul className="text-gray-400 space-y-2">
                        <li><a href="#" className="hover:text-cyan-400">Documentation</a></li>
                        <li><a href="#" className="hover:text-cyan-400">Blog</a></li>
                        <li><a href="#" className="hover:text-cyan-400">Help Center</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Company</h4>
                    <ul className="text-gray-400 space-y-2">
                        <li><a href="#" className="hover:text-cyan-400">About Us</a></li>
                        <li><a href="#" className="hover:text-cyan-400">Contact</a></li>
                        <li><a href="#" className="hover:text-cyan-400">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-800 mt-12 pt-8 flex justify-between items-center text-gray-500 text-xs">
            <p>© 2026 C-Trackr. All rights reserved.</p>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% - var(--gap))); }
        }
        @keyframes marquee-reverse {
          from { transform: translateX(calc(-100% - var(--gap))); }
          to { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee var(--duration) linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse var(--duration) linear infinite;
        }
      `}} />
    </div>
  );
}
