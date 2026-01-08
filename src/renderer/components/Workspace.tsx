import React, { useState, useEffect } from 'react';
import { MediaPool } from './MediaPool';
import { InspectorPanel } from './InspectorPanel';
import { StoryCanvas } from './StoryCanvas';
import { WordHighlighterModal } from './WordHighlighterModal'; // Added import
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

  const [highlightingSegment, setHighlightingSegment] = useState<TranscriptSegment | null>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, asset: MediaAsset) => {
    event.dataTransfer.setData('asset/id', String(asset.asset_id));
    event.dataTransfer.setData('asset/type', asset.type);
    event.dataTransfer.effectAllowed = 'move';
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
      {viewMode === 'pool' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 min-w-0">
            <MediaPool
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelect={setSelectedAssetId}
              onImport={handleMediaImport}
              onTranscriptImport={handleTranscriptMatch}
            />
          </div>
          <div className="w-[350px] shrink-0">
            <InspectorPanel
              asset={selectedAsset}
              segments={segments}
              onSegmentsUpdate={loadSegments}
            />
          </div>
        </div>
      ) : ( // viewMode === 'canvas'
        <div className="flex-1 flex h-full w-full overflow-hidden bg-[#0c0c0c] relative">
          {/* Floating Mini Media Pool */}
          <div className="absolute left-4 top-4 bottom-4 w-56 bg-[#121212]/90 border border-[#2a2a2a] rounded-lg z-20 flex flex-col backdrop-blur-md shadow-2xl">
            <div className="p-3 border-b border-[#2a2a2a] flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Library</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {assets.map(asset => (
                <div
                  key={asset.asset_id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                  onClick={() => setSelectedAssetId(asset.asset_id)}
                  className={`p-2 rounded border transition-all cursor-pointer ${
                    selectedAssetId === asset.asset_id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-gray-500'
                  }`}
                >
                  <p className="text-[11px] text-white truncate font-medium">{asset.file_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] px-1 rounded uppercase font-bold ${
                      asset.type === 'DIALOGUE' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {asset.type}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">{asset.resolution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Canvas Area */}
          <StoryCanvas
            projectId={project.project_id}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelect={setSelectedAssetId}
          />

          {/* Existing Inspector Panel on the Right */}
          <div className="w-80 border-l border-[#2a2a2a]">
            <InspectorPanel
              asset={selectedAsset}
              segments={segments}
              onSegmentDoubleClick={(segment) => setHighlightingSegment(segment)}
              onSegmentsUpdate={loadSegments}
            />
          </div>
        </div>
      )}

      {highlightingSegment && selectedAsset && (
        <WordHighlighterModal
          segment={highlightingSegment}
          onConfirm={(trim) => {
            console.log('Trim confirmed:', trim);
            // Here you would typically create a new story node with the trimmed data
            // For now, just close the modal
            setHighlightingSegment(null);
          }}
          onClose={() => setHighlightingSegment(null)}
        />
      )}
    </div>
  );
};
