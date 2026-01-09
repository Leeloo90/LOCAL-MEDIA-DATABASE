import React, { useState } from 'react';
import { MediaAsset, MediaType } from '../types';

interface MediaPoolProps {
  assets: MediaAsset[];
  selectedAssetId: number | null;
  onSelect: (assetId: number) => void;
  onImport: () => void;
  onTranscriptImport: () => void;
  isFloating?: boolean; // New prop to toggle compact mode for Canvas view
}

export const MediaPool: React.FC<MediaPoolProps> = ({
  assets,
  selectedAssetId,
  onSelect,
  onImport,
  onTranscriptImport,
  isFloating = false
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isFloating ? 'grid' : 'list');

  /**
   * DRAG START: Master Asset Payload
   * Used for dragging a full clip onto the Story Canvas.
   */
  const onDragStart = (event: React.DragEvent, asset: MediaAsset) => {
    const fullClipPayload = {
      type: 'FULL_CLIP',
      asset_id: asset.asset_id,
      start_tc: asset.start_tc,
      end_tc: asset.end_tc,
      file_name: asset.file_name,
      file_path: asset.file_path,
      duration_frames: asset.duration_frames,
      fps: asset.fps,
      asset_type: asset.type
    };
    // Ensure the key matches what StoryCanvas is looking for
    event.dataTransfer.setData('application/storygraph', JSON.stringify(fullClipPayload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb > 1000 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  };

  const formatFPS = (fps: number) => {
    return typeof fps === 'number' ? fps.toFixed(3) : fps;
  };

  // If floating, we use a much more compact styling for the sidebar
  const containerClasses = isFloating 
    ? "h-full flex flex-col bg-[#121212]/95 backdrop-blur-md border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
    : "h-full flex flex-col bg-[#0c0c0c] border-r border-[#2a2a2a]";

  return (
    <div className={containerClasses}>
      {/* Top Action Bar */}
      <div className={`p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]/50 flex items-center justify-between shrink-0 ${isFloating ? 'py-2 px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
            {isFloating ? 'Library' : 'Media Pool'}
          </h2>
          {!isFloating && (
            <div className="flex bg-[#0c0c0c] rounded p-1 border border-[#2a2a2a]">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-[#222] text-indigo-400 shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-[#222] text-indigo-400 shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          )}
        </div>
        
        {!isFloating && (
          <div className="flex gap-2">
            <button 
              onClick={onTranscriptImport}
              className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[10px] font-bold uppercase tracking-wider text-gray-400 rounded hover:border-indigo-500 hover:text-white transition-all flex items-center gap-2"
            >
              Match Transcripts
            </button>
            <button 
              onClick={onImport}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
            >
              Import
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Bin Empty</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={`p-4 grid gap-4 ${isFloating ? 'grid-cols-1 p-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3'}`}>
            {assets.map(asset => (
              <div
                key={asset.asset_id}
                draggable
                onDragStart={(e) => onDragStart(e, asset)}
                onClick={() => onSelect(asset.asset_id)}
                className={`group cursor-pointer rounded bg-[#1a1a1a] border transition-all ${
                  selectedAssetId === asset.asset_id
                  ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-2xl'
                  : 'border-[#2a2a2a] hover:border-indigo-500/50'
                }`}
              >
                <div className={`bg-black relative flex items-center justify-center overflow-hidden rounded-t ${isFloating ? 'aspect-[21/9]' : 'aspect-video'}`}>
                  {asset.type === MediaType.DIALOGUE && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-500 text-black text-[7px] font-black rounded uppercase">
                      Dialog
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/80 text-[8px] font-mono text-indigo-400 rounded">
                    {asset.start_tc}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-bold text-gray-300 truncate tracking-tight">{asset.file_name}</p>
                  {!isFloating && (
                    <p className="text-[9px] text-gray-600 font-mono mt-1">{asset.resolution} • {formatFPS(asset.fps)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="sticky top-0 bg-[#121212] z-10">
              <tr className="text-[9px] text-gray-600 uppercase tracking-widest border-b border-[#222]">
                <th className="py-3 px-4 font-black">Filename</th>
                <th className="py-3 px-2 font-black">Type</th>
                <th className="py-3 px-2 font-black">Start TC</th>
                <th className="py-3 px-2 font-black">Duration</th>
                <th className="py-3 px-4 font-black text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {assets.map(asset => (
                <tr
                  key={asset.asset_id}
                  draggable
                  onDragStart={(e) => onDragStart(e, asset)}
                  onClick={() => onSelect(asset.asset_id)}
                  className={`group text-[11px] cursor-pointer transition-colors ${
                    selectedAssetId === asset.asset_id ? 'bg-indigo-500/10 text-white' : 'text-gray-400 hover:bg-[#111]'
                  }`}
                >
                  <td className="py-2.5 px-4 truncate max-w-[200px]" title={asset.file_name}>{asset.file_name}</td>
                  <td className="py-2.5 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      asset.type === MediaType.DIALOGUE ? 'text-green-500 bg-green-950/30' : 'text-gray-600 bg-gray-800/30'
                    }`}>
                      {asset.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-indigo-400/80">{asset.start_tc}</td>
                  <td className="py-2.5 px-2 font-mono text-gray-500">{asset.duration_frames} fr</td>
                  <td className="py-2.5 px-4 font-mono text-right text-gray-600">{formatFileSize(asset.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};