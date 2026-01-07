
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { MediaPool } from './components/MediaPool';
import { InspectorPanel } from './components/InspectorPanel';
import { Project, MediaAsset, TranscriptSegment } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedAssetId !== null) {
      setSegments(db.getTranscripts(selectedAssetId));
    } else {
      setSegments([]);
    }
  }, [selectedAssetId, assets]);

  const refreshData = () => {
    setProjects(db.getProjects());
    setAssets(db.getAssets(selectedProjectId));
  };

  const handleMediaImport = async () => {
    // Native Electron Ingest
    await db.ingestFromFolder(selectedProjectId);
    refreshData();
  };

  const handleTranscriptMatch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      await db.matchTranscripts(files);
      refreshData();
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
        </div>
      }
    >
      <div className="h-full flex overflow-hidden">
        {/* Only transcript input remains as browser input for this prototype stage */}
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={transcriptInputRef} 
          onChange={handleTranscriptMatch} 
          accept=".txt,.srtx"
        />

        <div className="flex-1 min-w-0">
          <MediaPool 
            assets={assets} 
            selectedAssetId={selectedAssetId}
            onSelect={setSelectedAssetId}
            onImport={handleMediaImport}
            onTranscriptImport={() => transcriptInputRef.current?.click()}
          />
        </div>
        <div className="w-[350px] shrink-0">
          <InspectorPanel 
            asset={selectedAsset}
            segments={segments}
          />
        </div>
      </div>
    </Layout>
  );
};

export default App;
