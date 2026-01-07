
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="h-full flex flex-col bg-[#0c0c0c]">
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Media Pool</h2>
          <div className="flex bg-[#1a1a1a] rounded p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={onTranscriptImport}
            className="px-3 py-1.5 bg-[#222] border border-[#333] text-xs font-medium text-gray-300 rounded hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            Match Transcripts
          </button>
          <button 
            onClick={onImport}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import Media
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
            <div className="w-16 h-16 border-2 border-dashed border-gray-800 rounded-full flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><polyline points="11 3 11 11 14 8 17 11 17 3"/></svg>
            </div>
            <p className="text-sm">No media ingested yet. Import files to begin.</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {assets.map(asset => (
                <div 
                  key={asset.asset_id}
                  onClick={() => onSelect(asset.asset_id)}
                  className={`group cursor-pointer rounded-lg overflow-hidden border transition-all ${
                    selectedAssetId === asset.asset_id 
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-[#1a1a1a]' 
                    : 'border-[#2a2a2a] bg-[#121212] hover:border-[#3a3a3a]'
                  }`}
                >
                  <div className="aspect-video bg-[#0a0a0a] relative flex items-center justify-center">
                    <div className="text-[10px] text-gray-700 font-mono">
                      {asset.metadata.resolution}
                    </div>
                    {asset.type === MediaType.DIALOGUE && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-900/40 text-green-400 text-[8px] font-bold rounded border border-green-800/50 uppercase">
                        Dialogue
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded">
                      {asset.start_tc}
                    </div>
                  </div>
                  <div className="p-2 truncate">
                    <p className="text-[11px] font-medium text-gray-300 truncate">{asset.file_name}</p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">{asset.fps} FPS</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-[#2a2a2a]">
                     <th className="py-2 px-3 font-semibold">Name</th>
                     <th className="py-2 px-3 font-semibold">Type</th>
                     <th className="py-2 px-3 font-semibold">FPS</th>
                     <th className="py-2 px-3 font-semibold">Start TC</th>
                     <th className="py-2 px-3 font-semibold">Res</th>
                   </tr>
                 </thead>
                 <tbody>
                   {assets.map(asset => (
                     <tr 
                      key={asset.asset_id}
                      onClick={() => onSelect(asset.asset_id)}
                      className={`text-[11px] border-b border-[#1a1a1a] cursor-pointer hover:bg-[#1a1a1a] ${
                        selectedAssetId === asset.asset_id ? 'bg-indigo-900/10 text-white' : 'text-gray-400'
                      }`}
                     >
                       <td className="py-2 px-3 font-medium truncate max-w-[200px]">{asset.file_name}</td>
                       <td className="py-2 px-3">
                         <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                           asset.type === MediaType.DIALOGUE ? 'bg-green-900/20 text-green-500 border border-green-900/30' : 'bg-gray-800 text-gray-400'
                         }`}>
                           {asset.type}
                         </span>
                       </td>
                       <td className="py-2 px-3 font-mono">{asset.fps}</td>
                       <td className="py-2 px-3 font-mono">{asset.start_tc}</td>
                       <td className="py-2 px-3 font-mono">{asset.metadata.resolution}</td>
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
