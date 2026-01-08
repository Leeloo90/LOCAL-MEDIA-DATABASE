import React, { useState, useEffect } from 'react';
import { MediaPool } from './MediaPool';
import { InspectorPanel } from './InspectorPanel';
import { StoryCanvas } from './StoryCanvas';
import { Project, MediaAsset, TranscriptSegment } from '../types';
import { db } from '../services/db';

type ViewMode = 'pool' | 'canvas';

interface WorkspaceProps {
  project: Project;
  onBackToProjects: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ project, onBackToProjects }) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('pool');

  useEffect(() => {
    refreshData();
    // Touch project to update last_edited
    if (window.electronAPI) {
      window.electronAPI.db.touchProject(project.project_id);
    }
  }, [project.project_id]);

  const loadSegments = async () => {
    if (selectedAssetId !== null) {
      const segs = await db.getTranscripts(selectedAssetId);
      setSegments(segs);
    } else {
      setSegments([]);
    }
  };

  useEffect(() => {
    loadSegments();
  }, [selectedAssetId, assets]);

  const refreshData = async () => {
    const assts = await db.getAssets(project.project_id);
    setAssets(assts);
  };

  const handleMediaImport = async () => {
    await db.ingestFiles(project.project_id);
    await refreshData();
  };

  const handleTranscriptMatch = async () => {
    if (selectedAssetId === null) {
      alert("Please select a media file first to link a transcript.");
      return;
    }

    const success = await db.matchTranscript(selectedAssetId);
    if (success) {
      await refreshData();
    }
  };

  const selectedAsset = assets.find(a => a.asset_id === selectedAssetId) || null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0c0c0c]">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#121212] border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToProjects}
            className="p-2 hover:bg-[#1a1a1a] rounded transition-colors text-gray-400 hover:text-gray-200"
            title="Back to Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">{project.name}</h2>
            <p className="text-[10px] text-gray-500">
              {project.resolution} • {project.fps} fps
              {project.client && ` • ${project.client}`}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('pool')}
            className={`px-4 py-2 rounded text-xs font-medium transition-all ${
              viewMode === 'pool'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-200 hover:bg-[#222]'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Media Pool
            </div>
          </button>
          <button
            onClick={() => setViewMode('canvas')}
            className={`px-4 py-2 rounded text-xs font-medium transition-all ${
              viewMode === 'canvas'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-200 hover:bg-[#222]'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="19" cy="5" r="2"/>
                <circle cx="5" cy="19" r="2"/>
                <path d="M10.5 10.5L6.5 17"/>
                <path d="M13.5 13.5L17.5 7"/>
              </svg>
              Story Canvas
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0">
          {viewMode === 'pool' ? (
            <MediaPool
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelect={setSelectedAssetId}
              onImport={handleMediaImport}
              onTranscriptImport={handleTranscriptMatch}
            />
          ) : (
            <StoryCanvas
              projectId={project.project_id}
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelect={setSelectedAssetId}
            />
          )}
        </div>
        <div className="w-[350px] shrink-0">
          <InspectorPanel
            asset={selectedAsset}
            segments={segments}
            onSegmentsUpdate={loadSegments}
          />
        </div>
      </div>
    </div>
  );
};
