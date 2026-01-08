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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400 border-green-900/50';
      case 'completed':
        return 'bg-blue-900/30 text-blue-400 border-blue-900/50';
      case 'archived':
        return 'bg-gray-800/50 text-gray-500 border-gray-700/50';
      default:
        return 'bg-gray-800/50 text-gray-400 border-gray-700/50';
    }
  };

  return (
    <div className="h-full w-full bg-[#0c0c0c] overflow-auto">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] bg-[#121212] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Productions</h1>
              <p className="text-sm text-gray-500 mt-1">Select a project to open workspace</p>
            </div>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg hover:shadow-indigo-500/50 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="w-20 h-20 text-gray-700 mb-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md">Create your first production to start organizing media assets and building story graphs.</p>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.project_id}
                onMouseEnter={() => setHoveredCard(project.project_id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative"
              >
                <div
                  onClick={() => onSelectProject(project.project_id)}
                  className="relative bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl p-6 cursor-pointer transition-all hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    {hoveredCard === project.project_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${project.name}"? This will remove all associated media and graphs.`)) {
                            onDeleteProject(project.project_id);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-red-900/20 text-red-500/60 hover:text-red-400 transition-colors"
                        title="Delete project"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Project Name */}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 mt-auto pt-4 border-t border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                      <span className="font-mono">{project.resolution}</span>
                      <span className="text-gray-700">•</span>
                      <span className="font-mono">{project.fps} fps</span>
                    </div>

                    {project.client && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>{project.client}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>Edited {formatDate(project.last_edited)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
