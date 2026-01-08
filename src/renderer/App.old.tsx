
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { MediaPool } from './components/MediaPool';
import { InspectorPanel } from './components/InspectorPanel';
import { StoryCanvas } from './components/StoryCanvas';
import { Project, MediaAsset, TranscriptSegment } from './types';
import { db } from './services/db';

type ViewMode = 'pool' | 'canvas';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('pool');

  useEffect(() => {
    refreshData();
  }, [selectedProjectId]);

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
    const projs = await db.getProjects();
    const assts = await db.getAssets(selectedProjectId);
    setProjects(projs);
    setAssets(assts);
  };

  const handleMediaImport = async () => {
    await db.ingestFiles(selectedProjectId);
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
    <Layout
      sidebar={
        <div className="flex flex-col gap-1 p-2">
          <div className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Workspace</div>
          {projects.map(p => (
            <button
              key={p.project_id}
              onClick={() => setSelectedProjectId(p.project_id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                selectedProjectId === p.project_id 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-900/30' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span className="text-xs font-medium truncate">{p.name}</span>
            </button>
          ))}
          <button className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 hover:text-gray-300 transition-all mt-4 border border-dashed border-[#2a2a2a] group">
            <svg className="group-hover:rotate-90 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="text-xs font-medium">New Project</span>
          </button>
          <button 
            onClick={async () => {
              if (confirm('Are you sure you want to clear the entire database? This cannot be undone.')) {
                await db.clear();
                await refreshData();
              }
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-red-500/60 hover:text-red-400 hover:bg-red-900/20 transition-all mt-auto border border-dashed border-red-900/40 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            <span className="text-xs font-medium">Clear Database</span>
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#121212] border-b border-[#2a2a2a]">
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
    </Layout>
  );
};

export default App;
