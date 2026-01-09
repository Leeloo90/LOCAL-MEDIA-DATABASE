import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  onSelectProject: (projectId: number) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: number) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return `Just now`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-900/20 text-green-400 border-green-800/30';
      case 'completed':
        return 'bg-blue-900/20 text-blue-400 border-blue-800/30';
      case 'archived':
        return 'bg-gray-800/40 text-gray-500 border-gray-700/50';
      default:
        return 'bg-indigo-900/20 text-indigo-400 border-indigo-800/30';
    }
  };

  // Helper to generate a 2-letter project avatar
  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="h-full w-full bg-[#0c0c0c] flex flex-col overflow-hidden">
      {/* Header Bar */}
      <header className="border-b border-[#2a2a2a] bg-[#121212] shrink-0">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Productions
              </h1>
              <p className="text-[11px] font-bold text-gray-500 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Select a workspace to begin assembly
              </p>
            </div>
            <button
              onClick={onCreateProject}
              className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-xl shadow-indigo-900/20 font-black uppercase text-[11px] tracking-widest active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Production
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-[#121212] border-2 border-dashed border-[#2a2a2a] rounded-full flex items-center justify-center mb-8 opacity-20">
                <svg className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Database Empty</h3>
              <p className="text-[11px] text-gray-600 mt-3 max-w-sm leading-relaxed uppercase font-bold tracking-tight">
                No local productions found. Create your first project to initialize the media database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.project_id}
                  onMouseEnter={() => setHoveredCard(project.project_id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group"
                >
                  <div
                    onClick={() => onSelectProject(project.project_id)}
                    className="relative bg-[#121212] border border-[#2a2a2a] rounded-xl p-6 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-[#161616] flex flex-col h-full shadow-2xl overflow-hidden"
                  >
                    {/* Background Initials Accent */}
                    <div className="absolute -top-4 -right-4 text-[120px] font-black text-white/[0.02] select-none group-hover:text-indigo-500/[0.03] transition-colors pointer-events-none italic">
                      {getProjectInitials(project.name)}
                    </div>

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-lg italic shadow-lg shadow-indigo-900/20">
                        {getProjectInitials(project.name)}
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                          {project.status || 'Active'}
                        </span>
                        {hoveredCard === project.project_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Archive project "${project.name}"?\nThis action cannot be undone.`)) {
                                onDeleteProject(project.project_id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-500 transition-all"
                            title="Delete project"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10 flex-1">
                      <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase italic mb-2">
                        {project.name}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-500 line-clamp-2 uppercase tracking-tight leading-relaxed">
                        {project.description || 'No production notes available.'}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-[#2a2a2a] relative z-10">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Configuration</span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {project.resolution} @ {project.fps}FPS
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Last Modified</span>
                          <span className="text-[10px] font-mono text-indigo-400/80 uppercase">
                            {formatDate(project.last_edited)}
                          </span>
                        </div>
                      </div>

                      {project.client && (
                        <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-[#0c0c0c] px-2 py-1 rounded border border-[#1a1a1a] w-fit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span className="uppercase tracking-wider">{project.client}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};