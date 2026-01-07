import React, { useState } from 'react';
import { MediaAsset, MediaType } from '../types';

interface MediaPoolProps {
  assets: MediaAsset[];
  selectedAssetId: number | null;
  onSelect: (assetId: number) => void;
  onImport: () => void;
  onTranscriptImport: () => void;
}

export const MediaPool: React.FC<MediaPoolProps> = ({ 
  assets, 
  selectedAssetId, 
  onSelect, 
  onImport,
  onTranscriptImport 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Helper to format bytes to readable MB/GB
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb > 1000 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  };

  // Helper to ensure FPS shows industry standard decimals
  const formatFPS = (fps: number) => {
    return typeof fps === 'number' ? fps.toFixed(3) : fps;
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c0c]">
      {/* Action Bar */}
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Media Pool</h2>
          <div className="flex bg-[#1a1a1a] rounded p-1 border border-[#2a2a2a]">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#333] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              title="Grid View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#333] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              title="List View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={onTranscriptImport}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[11px] font-medium text-gray-300 rounded hover:bg-[#2a2a2a] hover:text-white transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            Match Transcripts
          </button>
          <button 
            onClick={onImport}
            className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded hover:bg-indigo-500 shadow-md shadow-indigo-900/20 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import Media
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-4 opacity-40">
            <div className="w-16 h-16 border-2 border-dashed border-gray-800 rounded-full flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><polyline points="11 3 11 11 14 8 17 11 17 3"/></svg>
            </div>
            <p className="text-sm font-medium tracking-wide">Empty Project Bin</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {assets.map(asset => (
                <div 
                  key={asset.asset_id}
                  onClick={() => onSelect(asset.asset_id)}
                  className={`group cursor-pointer rounded-lg overflow-hidden border transition-all duration-200 ${
                    selectedAssetId === asset.asset_id 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-[#1a1a1a] scale-[1.02]' 
                    : 'border-[#2a2a2a] bg-[#121212] hover:border-[#444]'
                  }`}
                >
                  <div className="aspect-video bg-[#050505] relative flex items-center justify-center overflow-hidden">
                    <div className="text-[10px] text-gray-800 font-mono uppercase tracking-tighter">
                      {asset.metadata?.codec || 'N/A'}
                    </div>
                    {asset.type === MediaType.DIALOGUE && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500 text-black text-[8px] font-black rounded uppercase">
                        Dialog
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded border border-white/10">
                      {asset.start_tc}
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-indigo-900/80 text-indigo-200 text-[8px] font-mono rounded border border-indigo-500/30">
                      {asset.duration_frames} FR
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-semibold text-gray-200 truncate">{asset.file_name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[9px] text-gray-500 font-mono">{formatFPS(asset.fps)} FPS</p>
                      <p className="text-[9px] text-gray-500 font-mono">{asset.resolution || 'N/A'}</p>
                    </div>
                    <div className="text-right mt-1">
                      <p className="text-[9px] text-gray-500 font-mono">{formatFileSize(asset.size)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full">
               // src/renderer/components/MediaPool.tsx - Updated Table Section
<table className="w-full text-left border-collapse table-fixed">
  <thead className="sticky top-0 bg-[#121212] z-10 shadow-sm">
    <tr className="text-[9px] text-gray-500 uppercase tracking-[0.15em] border-b border-[#2a2a2a]">
      <th className="py-3 px-4 font-bold w-1/4">Filename</th>
      <th className="py-3 px-2 font-bold w-20">Type</th>
      <th className="py-3 px-2 font-bold w-16">FPS</th>
      <th className="py-3 px-2 font-bold w-24">Start TC</th>
      <th className="py-3 px-2 font-bold w-24">End TC</th>
      <th className="py-3 px-2 font-bold w-20">Frames</th>
      <th className="py-3 px-2 font-bold w-24">Res</th>
      <th className="py-3 px-4 font-bold w-24 text-right">Size</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-[#1a1a1a]">
    {assets.map(asset => (
      <tr 
        key={asset.asset_id} 
        onClick={() => onSelect(asset.asset_id)}
        className={`group text-[11px] cursor-pointer transition-colors ${
          selectedAssetId === asset.asset_id ? 'bg-indigo-500/10 text-white' : 'text-gray-400 hover:bg-[#161616]'
        }`}
      >
        <td className="py-2.5 px-4 truncate" title={asset.file_name}>{asset.file_name}</td>
        <td className="py-2.5 px-2">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
            asset.type === MediaType.DIALOGUE ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-gray-800/40 text-gray-500'
          }`}>
            {asset.type}
          </span>
        </td>
        <td className="py-2.5 px-2 font-mono text-[10px]">{formatFPS(asset.fps)}</td>
        <td className="py-2.5 px-2 font-mono text-[10px] text-indigo-300">{asset.start_tc}</td>
        <td className="py-2.5 px-2 font-mono text-[10px] text-indigo-300/60">{asset.end_tc}</td>
        <td className="py-2.5 px-2 font-mono text-[10px] italic">{asset.duration_frames}</td>
        <td className="py-2.5 px-2 font-mono text-[10px]">{asset.resolution || 'N/A'}</td>
        <td className="py-2.5 px-4 font-mono text-[10px] text-right">{formatFileSize(asset.size)}</td>
      </tr>
    ))}
  </tbody>
</table>
            </div>
          )
        )}
      </div>
    </div>
  );
};