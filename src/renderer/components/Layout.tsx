import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  projectName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, projectName }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0c] text-gray-200">
      {/* Sidebar - Persistent Navigation & Project Library */}
      <aside className="w-16 md:w-64 border-r border-[#2a2a2a] flex flex-col bg-[#121212] z-30">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-900/20 shrink-0">
            SG
          </div>
          <span className="font-bold tracking-tight hidden md:inline text-gray-100 uppercase text-sm">
            Story Graph
          </span>
        </div>
        
        {/* Sidebar Content (Media Pool or Project List) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sidebar}
        </div>

        {/* Version Footer */}
        <div className="p-4 border-t border-[#2a2a2a] text-[9px] text-gray-600 uppercase tracking-[0.2em] text-center font-bold">
          Local Bridge v1.0
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Global Header */}
        <header className="h-14 border-b border-[#2a2a2a] bg-[#121212] flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-6">
             {/* System Status Indicator */}
             <div className="flex items-center gap-2 px-3 py-1 bg-[#0c0c0c] border border-[#2a2a2a] rounded-md">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Connected</span>
             </div>

             {/* Breadcrumb / Project Identity */}
             {projectName && (
               <div className="flex items-center gap-2 text-xs">
                 <span className="text-gray-600">/</span>
                 <span className="font-medium text-gray-300 tracking-wide uppercase text-[11px]">{projectName}</span>
               </div>
             )}
          </div>

          <div className="flex items-center gap-4">
             <button className="text-[11px] font-bold text-gray-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
               Settings
             </button>
             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 shadow-inner"></div>
          </div>
        </header>

        {/* Content Viewport (Media Pool Grid or Story Canvas) */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};