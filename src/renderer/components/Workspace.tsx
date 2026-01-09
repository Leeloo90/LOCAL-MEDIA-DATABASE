import React, { useState, useEffect, useCallback } from 'react';
import { MediaPool } from './MediaPool';
import { InspectorPanel } from './InspectorPanel';
import { StoryCanvas } from './StoryCanvas';
import { WordHighlighterModal } from './WordHighlighterModal';
import { CanvasContextMenu } from './CanvasContextMenu';
import { Project, MediaAsset, TranscriptSegment } from '../types';

interface WorkspaceProps {
  project: Project;
  onBackToProjects: () => void;
}

interface Canvas {
  canvas_id: number;
  name: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({ project, onBackToProjects }) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [highlightingSegment, setHighlightingSegment] = useState<TranscriptSegment | null>(null);
  const [graphVersion, setGraphVersion] = useState(0);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<number | null>(null);
  const [mediaViewMode, setMediaViewMode] = useState<'thumbnails' | 'list'>('list');
  const [bucketItems, setBucketItems] = useState<any[]>([]);
  const [bucketVisible, setBucketVisible] = useState(true);

  // Canvas Context Menu State
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    canvasId: number;
    canvasName: string;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    canvasId: 0,
    canvasName: '',
  });

  /**
   * DATABASE SYNC: Fetch Assets
   */
  const refreshAssets = useCallback(async () => {
    if (window.electronAPI) {
      const dbAssets = await window.electronAPI.db.getAssets(project.project_id);
      setAssets(dbAssets);
    }
  }, [project.project_id]);

  /**
   * DATABASE SYNC: Fetch Transcripts for selected asset
   */
  const refreshSegments = useCallback(async () => {
    if (window.electronAPI && selectedAssetId !== null) {
      const dbSegments = await window.electronAPI.db.getSegments(selectedAssetId);
      setSegments(dbSegments);
    } else {
      setSegments([]);
    }
  }, [selectedAssetId]);

  /**
   * DATABASE SYNC: Fetch Canvases
   */
  const refreshCanvases = useCallback(async () => {
    if (window.electronAPI) {
      const dbCanvases = await window.electronAPI.db.getCanvases(project.project_id);
      setCanvases(dbCanvases);
    }
  }, [project.project_id]);

  /**
   * DATABASE SYNC: Fetch Bucket Items
   */
  const refreshBucketItems = useCallback(async () => {
    if (window.electronAPI) {
      const dbBucketItems = await window.electronAPI.db.getBucketItems(project.project_id, activeCanvasId || undefined);
      setBucketItems(dbBucketItems);
    }
  }, [project.project_id, activeCanvasId]);

  // Initial Load & Project Activity Tracking
  useEffect(() => {
    refreshAssets();
    if (window.electronAPI) {
      window.electronAPI.db.touchProject(project.project_id);
    }
  }, [project.project_id, refreshAssets]);

  // Load Canvases on mount
  useEffect(() => {
    refreshCanvases();
  }, [refreshCanvases]);

  // Load Bucket Items on mount and when canvas changes
  useEffect(() => {
    refreshBucketItems();
  }, [refreshBucketItems]);

  // Segment Refresh on Asset Selection
  useEffect(() => {
    refreshSegments();
  }, [selectedAssetId, refreshSegments]);

  /**
   * MEDIA IMPORT HANDLER
   */
  const handleMediaImport = async () => {
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.dialog.openFiles();
    if (paths.length > 0) {
      const scanned = await window.electronAPI.media.scan(paths, project.project_id);
      await window.electronAPI.db.insertAssets(scanned);
      await refreshAssets();
    }
  };

  /**
   * TRANSCRIPT LINKING HANDLER
   */
  const handleTranscriptMatch = async () => {
    if (selectedAssetId === null) return;
    if (window.electronAPI) {
      const success = await window.electronAPI.transcript.matchManual(selectedAssetId);
      if (success) {
        await refreshAssets();
        await refreshSegments();
      }
    }
  };

  const handleCreateCanvas = async () => {
    if (!window.electronAPI) return;
    const name = `Canvas ${canvases.length + 1}`;
    const newId = await window.electronAPI.db.createCanvas(project.project_id, name);
    await refreshCanvases();
    setActiveCanvasId(newId);
  };

  const handleCanvasContextMenu = (event: React.MouseEvent, canvas: Canvas) => {
    event.preventDefault();
    event.stopPropagation();
    setCanvasContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      canvasId: canvas.canvas_id,
      canvasName: canvas.name,
    });
  };

  const handleCanvasRename = async (canvasId: number, newName: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.db.updateCanvas(canvasId, newName);
    await refreshCanvases();
  };

  const handleCanvasDelete = async (canvasId: number) => {
    if (!window.electronAPI) return;
    await window.electronAPI.db.deleteCanvas(canvasId);
    if (activeCanvasId === canvasId) {
      setActiveCanvasId(null);
    }
    await refreshCanvases();
  };

  /**
   * PRECISION TRIM HANDLER
   * Triggered when a user selects a range of words in the WordHighlighterModal.
   * Creates a 'timelineNode' (purple) on the Story Canvas.
   */
  const handleTrimConfirm = async (trim: { text: string; start_tc: string; end_tc: string }) => {
    if (!window.electronAPI || !highlightingSegment || activeCanvasId === null) {
      // If no canvas is active, we can't place the node. 
      // Optionally alert the user or auto-create a canvas.
      alert("Please select or create a Story Canvas to add this trim.");
      return;
    }

    const newNode = {
      node_id: `trim_${Date.now()}`,
      project_id: project.project_id,
      canvas_id: activeCanvasId,
      asset_id: highlightingSegment.asset_id,
      start_tc: trim.start_tc,
      end_tc: trim.end_tc,
      text_content: JSON.stringify({
        content: trim.text,
        speaker_label: highlightingSegment.speaker_label
      }),
      node_type: 'timelineNode',
      x_pos: 100, // Spawn position adjusted to be visible
      y_pos: 100
    };

    await window.electronAPI.db.saveStoryNode(newNode);
    setHighlightingSegment(null);
    setGraphVersion(v => v + 1);
    
    // Already in canvas mode if activeCanvasId is set
  };

  const selectedAsset = assets.find(a => a.asset_id === selectedAssetId) || null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0c0c0c]">
      
      {/* WORKSPACE HEADER 
          Handles Project navigation and high-level View switching
      */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#121212] border-b border-[#2a2a2a] shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToProjects}
            className="group flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="M19 12H5m7 7-7-7 7-7"/>
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Exit to Projects</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2a2a2a]" />
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-tight italic select-none">
              {project.name}
            </h2>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE CONTENT 
          Toggles between the Master Asset List (Pool) and the Narrative Graph (Canvas)
      */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* SIDEBAR: Canvas Management & Media Library */}
        <div className="w-72 bg-[#0f0f0f] border-r border-[#2a2a2a] flex flex-col shrink-0">

          {/* Canvases Section */}
          <div className="border-b border-[#2a2a2a]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#121212]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Canvases</span>
              <button onClick={handleCreateCanvas} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
              <div
                onClick={() => setActiveCanvasId(null)}
                className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors truncate ${activeCanvasId === null ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}
              >
                Media Pool View
              </div>
              {canvases.map(canvas => (
                <div
                  key={canvas.canvas_id}
                  onClick={() => setActiveCanvasId(canvas.canvas_id)}
                  onContextMenu={(e) => handleCanvasContextMenu(e, canvas)}
                  className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors truncate ${activeCanvasId === canvas.canvas_id ? 'bg-[#2a2a2a] text-white border-l-2 border-indigo-500' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}
                >
                  {canvas.name}
                </div>
              ))}
            </div>
          </div>

          {/* Media Library Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#121212]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Media Library</span>
              <div className="flex bg-[#0c0c0c] rounded p-1 border border-[#2a2a2a]">
                <button
                  onClick={() => setMediaViewMode('thumbnails')}
                  className={`p-1 rounded transition-all ${mediaViewMode === 'thumbnails' ? 'bg-[#222] text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
                  title="Thumbnail view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </button>
                <button
                  onClick={() => setMediaViewMode('list')}
                  className={`p-1 rounded transition-all ${mediaViewMode === 'list' ? 'bg-[#222] text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
                  title="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {assets.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider">No media assets</p>
                </div>
              ) : mediaViewMode === 'thumbnails' ? (
                /* Thumbnail View */
                <div className="p-2 grid grid-cols-2 gap-2">
                  {assets.map(asset => (
                    <div
                      key={asset.asset_id}
                      draggable
                      onDragStart={(e) => {
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
                        e.dataTransfer.setData('application/storygraph', JSON.stringify(fullClipPayload));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => setSelectedAssetId(asset.asset_id)}
                      className={`cursor-grab active:cursor-grabbing rounded overflow-hidden border transition-all ${
                        selectedAssetId === asset.asset_id
                          ? 'border-indigo-500 ring-1 ring-indigo-500'
                          : 'border-[#2a2a2a] hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="aspect-video bg-black relative flex items-center justify-center">
                        <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${asset.type === 'DIALOGUE' ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}`}>
                          {asset.type === 'DIALOGUE' ? 'Dialog' : 'B-Roll'}
                        </span>
                        <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/80 text-[7px] font-mono text-indigo-400 rounded">
                          {asset.start_tc}
                        </div>
                      </div>
                      <div className="p-1.5 bg-[#1a1a1a]">
                        <p className="text-[9px] font-medium text-gray-300 truncate">{asset.file_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="p-2 space-y-1">
                  {assets.map(asset => (
                    <div
                      key={asset.asset_id}
                      draggable
                      onDragStart={(e) => {
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
                        e.dataTransfer.setData('application/storygraph', JSON.stringify(fullClipPayload));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => setSelectedAssetId(asset.asset_id)}
                      className={`cursor-grab active:cursor-grabbing px-2 py-1.5 rounded text-[10px] transition-colors border flex items-center gap-2 ${
                        selectedAssetId === asset.asset_id
                          ? 'bg-indigo-500/20 text-white border-indigo-500'
                          : 'bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:border-indigo-500/50'
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase shrink-0 ${asset.type === 'DIALOGUE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-500'}`}>
                        {asset.type === 'DIALOGUE' ? 'Dialog' : 'B-Roll'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{asset.file_name}</div>
                        <div className="text-[8px] text-gray-600 font-mono mt-0.5">{asset.start_tc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bucket Section */}
          {bucketVisible && (
            <div className="border-t border-[#2a2a2a]">
              <div className="flex items-center justify-between px-4 py-3 bg-[#121212]">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bucket</span>
                <span className="text-[9px] text-gray-600 font-mono">{bucketItems.length}</span>
              </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {bucketItems.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider">No items in bucket</p>
                </div>
              ) : (
                bucketItems.map(item => (
                  <div
                    key={item.bucket_item_id}
                    draggable
                    onDragStart={(e) => {
                      const bucketPayload = {
                        type: 'BUCKET_ITEM',
                        bucket_item_id: item.bucket_item_id,
                        asset_id: item.asset_id,
                        start_tc: item.start_tc,
                        end_tc: item.end_tc,
                        text_content: item.text_content,
                        item_type: item.item_type,
                      };
                      e.dataTransfer.setData('application/storygraph', JSON.stringify(bucketPayload));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="cursor-grab active:cursor-grabbing px-2 py-1.5 rounded text-[10px] transition-colors border bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:border-amber-500/50"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-amber-400 shrink-0"
                      >
                        <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-[9px]">
                          {item.item_type || 'Clip'}
                        </div>
                        <div className="text-[8px] text-gray-600 font-mono mt-0.5">
                          {item.start_tc} - {item.end_tc}
                        </div>
                        {item.notes && (
                          <div className="text-[8px] text-gray-500 italic mt-0.5 truncate">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          )}
        </div>

        {activeCanvasId === null ? (
          /* --- MEDIA POOL VIEW --- */
          <>
            <div className="flex-1 min-w-0">
              <MediaPool
                assets={assets}
                selectedAssetId={selectedAssetId}
                onSelect={setSelectedAssetId}
                onImport={handleMediaImport}
                onTranscriptImport={handleTranscriptMatch}
                isFloating={false}
              />
            </div>
            <div className="w-80 shrink-0">
              <InspectorPanel
                asset={selectedAsset}
                segments={segments}
                onSegmentsUpdate={refreshSegments}
                onSegmentHighlight={(seg) => setHighlightingSegment(seg)}
              />
            </div>
          </>
        ) : (
          /* --- STORY CANVAS VIEW --- */
          <div className="flex-1 flex h-full w-full relative">

            {/* Infinite Storyboard Graph - Full Width */}
            <div className="flex-1">
              <StoryCanvas
                projectId={project.project_id}
                canvasId={activeCanvasId}
                assets={assets}
                onSelect={setSelectedAssetId}
                refreshTrigger={graphVersion}
                bucketVisible={bucketVisible}
                onToggleBucket={() => setBucketVisible(!bucketVisible)}
              />
            </div>

            {/* Floating Inspector: Metadata/Transcript viewer on the right side of the Canvas */}
            <div className="absolute right-4 top-4 bottom-4 w-80 bg-[#121212]/95 border border-[#2a2a2a] rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-20">
               <InspectorPanel
                asset={selectedAsset}
                segments={segments}
                onSegmentsUpdate={refreshSegments}
                onSegmentHighlight={(seg) => setHighlightingSegment(seg)}
              />
            </div>
          </div>
        )}
      </div>

      {/* OVERLAYS: Precision Editorial Tools
          Opens when 'Highlight' is clicked in the Inspector
      */}
      {highlightingSegment && (
        <WordHighlighterModal
          segment={highlightingSegment}
          onConfirm={handleTrimConfirm}
          onClose={() => setHighlightingSegment(null)}
        />
      )}

      {/* Canvas Context Menu */}
      <CanvasContextMenu
        isOpen={canvasContextMenu.isOpen}
        position={canvasContextMenu.position}
        canvasId={canvasContextMenu.canvasId}
        canvasName={canvasContextMenu.canvasName}
        onClose={() => setCanvasContextMenu({ ...canvasContextMenu, isOpen: false })}
        onRename={handleCanvasRename}
        onDelete={handleCanvasDelete}
      />
    </div>
  );
};