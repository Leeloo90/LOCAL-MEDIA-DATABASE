
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0c]">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-[#2a2a2a] flex flex-col bg-[#121212]">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-900/20">
            SG
          </div>
          <span className="font-bold tracking-tight hidden md:inline text-gray-200">STORY GRAPH</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sidebar}
        </div>
        <div className="p-4 border-t border-[#2a2a2a] text-[10px] text-gray-600 uppercase tracking-widest text-center">
          Local Bridge v1.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#2a2a2a] bg-[#121212] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-md">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs font-medium text-gray-400">Local DB Connected</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="text-xs text-gray-400 hover:text-white transition-colors">Settings</button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"></div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};
