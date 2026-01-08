import React, { useState, useEffect } from 'react';
import { ProjectsPage } from './components/ProjectsPage';
import { Workspace } from './components/Workspace';
import { ProjectCreateModal } from './components/ProjectCreateModal';
import { Project } from './types';
import { db } from './services/db';

type ViewState = 'PROJECTS' | 'WORKSPACE';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('PROJECTS');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const projs = await db.getProjects();
    setProjects(projs);
  };

  const handleSelectProject = (projectId: number) => {
    const project = projects.find(p => p.project_id === projectId);
    if (project) {
      setActiveProject(project);
      setCurrentView('WORKSPACE');
    }
  };

  const handleCreateProject = async (
    name: string,
    options: { description?: string; fps?: number; resolution?: string; client?: string }
  ) => {
    if (window.electronAPI) {
      const newProjectId = await window.electronAPI.db.createProject(name, options);
      await loadProjects();

      // Automatically open the newly created project
      const newProject = (await db.getProjects()).find(p => p.project_id === newProjectId);
      if (newProject) {
        setActiveProject(newProject);
        setCurrentView('WORKSPACE');
      }
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.electronAPI) {
      await window.electronAPI.db.deleteProject(projectId);
      await loadProjects();

      // If deleted project was active, go back to projects view
      if (activeProject?.project_id === projectId) {
        setActiveProject(null);
        setCurrentView('PROJECTS');
      }
    }
  };

  const handleBackToProjects = () => {
    setActiveProject(null);
    setCurrentView('PROJECTS');
    loadProjects(); // Refresh project list to show updated last_edited times
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0c0c0c]">
      {currentView === 'PROJECTS' ? (
        <ProjectsPage
          projects={projects}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setIsCreateModalOpen(true)}
          onDeleteProject={handleDeleteProject}
        />
      ) : activeProject ? (
        <Workspace
          project={activeProject}
          onBackToProjects={handleBackToProjects}
        />
      ) : null}

      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};

export default App;
