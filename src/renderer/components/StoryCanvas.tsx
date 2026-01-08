import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MediaNode } from './nodes/MediaNode';
import { TimelineNode } from './nodes/TimelineNode';
import { MediaAsset, MediaType } from '../types';

const nodeTypes = {
  mediaNode: MediaNode,
  timelineNode: TimelineNode,
};

interface StoryCanvasProps {
  projectId: number;
  assets: MediaAsset[];
  selectedAssetId: number | null;
  onSelect: (assetId: number) => void;
}

const StoryCanvasInner: React.FC<StoryCanvasProps> = ({ projectId, assets, selectedAssetId, onSelect }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted nodes from database on mount
  useEffect(() => {
    loadNodesFromDatabase();
  }, [projectId]);

  const loadNodesFromDatabase = async () => {
    if (!window.electronAPI) return;

    try {
      const savedNodes = await window.electronAPI.db.getStoryNodes(projectId);

      if (savedNodes && savedNodes.length > 0) {
        const reconstructedNodes: Node[] = savedNodes.map((dbNode: any) => {
          const asset = assets.find(a => a.asset_id === dbNode.asset_id);

          if (dbNode.node_type === 'timeline') {
            // Timeline node (trimmed segment)
            return {
              id: dbNode.node_id,
              type: 'timelineNode',
              position: { x: dbNode.x_pos, y: dbNode.y_pos },
              data: {
                speaker_label: dbNode.text_content ? JSON.parse(dbNode.text_content).speaker_label : 'Unknown',
                content: dbNode.text_content ? JSON.parse(dbNode.text_content).content : '',
                start_tc: dbNode.start_tc,
                end_tc: dbNode.end_tc,
                asset_id: dbNode.asset_id,
              },
            };
          } else {
            // Media node (full clip)
            const durationSeconds = asset ? Math.round(asset.duration_frames / asset.fps) : 0;
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            return {
              id: dbNode.node_id,
              type: 'mediaNode',
              position: { x: dbNode.x_pos, y: dbNode.y_pos },
              data: {
                label: asset?.file_name || 'Unknown',
                status: asset?.type || MediaType.BROLL,
                duration,
                hasTranscript: asset?.type === MediaType.DIALOGUE,
              },
            };
          }
        });

        setNodes(reconstructedNodes);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load nodes:', error);
      setIsLoaded(true);
    }
  };

  // Handle node position changes with auto-save
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Auto-save position changes with debouncing
      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging === false && change.position) {
          // Node finished dragging - save to database
          if (window.electronAPI) {
            window.electronAPI.db.updateStoryNodePosition(
              change.id,
              change.position.x,
              change.position.y
            );
          }
        }
      });
    },
    [onNodesChange]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Extract asset_id from node data if available
      const assetId = node.data.asset_id || parseInt(node.id);
      if (!isNaN(assetId)) {
        onSelect(assetId);
      }
    },
    [onSelect]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const dataString = event.dataTransfer.getData('application/storygraph');
      if (!dataString) return;

      const data = JSON.parse(dataString);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (data.type === 'TRANSCRIPT_TRIM') {
        // EDITORIAL: Trimmed segment with specific In/Out points
        const nodeId = `trim_${data.asset_id}_${Date.now()}`;
        const newNode: Node = {
          id: nodeId,
          type: 'timelineNode',
          position,
          data: {
            speaker_label: data.speaker_label,
            content: data.content,
            start_tc: data.start_tc,  // Specific In point
            end_tc: data.end_tc,      // Specific Out point
            asset_id: data.asset_id,
          },
        };

        setNodes((nds) => nds.concat(newNode));

        // Persist to database
        if (window.electronAPI) {
          await window.electronAPI.db.saveStoryNode({
            node_id: nodeId,
            project_id: projectId,
            asset_id: data.asset_id,
            start_tc: data.start_tc,
            end_tc: data.end_tc,
            text_content: JSON.stringify({
              content: data.content,
              speaker_label: data.speaker_label,
              word_map: data.word_map,
            }),
            node_type: 'timeline',
            x_pos: position.x,
            y_pos: position.y,
          });
        }
      } else if (data.type === 'FULL_CLIP') {
        // FULL CLIP: Uses master start_tc and end_tc
        const nodeId = `media_${data.asset_id}_${Date.now()}`;
        const durationSeconds = Math.round(data.duration_frames / data.fps);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const newNode: Node = {
          id: nodeId,
          type: 'mediaNode',
          position,
          data: {
            label: data.file_name,
            status: data.asset_type,
            duration,
            hasTranscript: data.asset_type === MediaType.DIALOGUE,
          },
        };

        setNodes((nds) => nds.concat(newNode));

        // Persist to database
        if (window.electronAPI) {
          await window.electronAPI.db.saveStoryNode({
            node_id: nodeId,
            project_id: projectId,
            asset_id: data.asset_id,
            start_tc: data.start_tc,  // Master start
            end_tc: data.end_tc,      // Master end
            text_content: null,
            node_type: 'media',
            x_pos: position.x,
            y_pos: position.y,
          });
        }
      }
    },
    [screenToFlowPosition, setNodes, projectId]
  );

  if (!isLoaded) {
    return (
      <div className="h-full w-full bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} className="h-full w-full bg-[#0c0c0c]" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        defaultEdgeOptions={{
          style: { stroke: '#4f46e5', strokeWidth: 2 },
          animated: true,
        }}
      >
        <Background color="#222" gap={20} size={1} />
        <Controls className="bg-[#1a1a1a] border border-[#2a2a2a]" />
        <MiniMap
          className="bg-[#1a1a1a] border border-[#2a2a2a]"
          nodeColor={(node) => {
            if (node.type === 'timelineNode') return '#a78bfa'; // Purple for timeline nodes
            return node.data.status === MediaType.DIALOGUE ? '#22c55e' : '#6b7280';
          }}
        />
        <Panel position="top-left" className="bg-[#121212] px-3 py-2 rounded border border-[#2a2a2a]">
          <h3 className="text-white text-xs font-bold uppercase tracking-widest">Story Graph Canvas</h3>
          <p className="text-gray-500 text-[9px] mt-1">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} on canvas
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const StoryCanvas: React.FC<StoryCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <StoryCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
