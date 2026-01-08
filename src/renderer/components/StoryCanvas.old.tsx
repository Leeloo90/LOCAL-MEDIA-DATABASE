import React, { useCallback, useEffect, useRef } from 'react';
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
  assets: MediaAsset[];
  selectedAssetId: number | null;
  onSelect: (assetId: number) => void;
}

const StoryCanvasInner: React.FC<StoryCanvasProps> = ({ assets, selectedAssetId, onSelect }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert assets to nodes
  useEffect(() => {
    const newNodes: Node[] = assets.map((asset, index) => {
      // Arrange nodes in a grid layout
      const col = index % 4;
      const row = Math.floor(index / 4);

      // Format duration for display
      const durationSeconds = Math.round(asset.duration_frames / asset.fps);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return {
        id: asset.asset_id.toString(),
        type: 'mediaNode',
        position: { x: col * 280, y: row * 150 },
        data: {
          label: asset.file_name,
          status: asset.type,
          duration,
          hasTranscript: asset.type === MediaType.DIALOGUE,
        },
        selected: asset.asset_id === selectedAssetId,
      };
    });

    setNodes(newNodes);
  }, [assets, selectedAssetId, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelect(parseInt(node.id));
    },
    [onSelect]
  );

  // Drag and Drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataString = event.dataTransfer.getData('application/reactflow');
      if (!dataString) return;

      const data = JSON.parse(dataString);

      // Calculate drop position on canvas
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if it's a transcript segment or a media asset
      if (data.type === 'transcript-segment') {
        // Create timeline node for transcript segment
        const newNode: Node = {
          id: `segment_${data.segment_id}_${Date.now()}`,
          type: 'timelineNode',
          position,
          data: {
            speaker_label: data.speaker_label,
            content: data.content,
            start_tc: data.start_tc,
            end_tc: data.end_tc,
            asset_id: data.asset_id,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      } else {
        // It's a media asset - create media node
        const asset: MediaAsset = data;

        // Format duration for display
        const durationSeconds = Math.round(asset.duration_frames / asset.fps);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const newNode: Node = {
          id: `${asset.asset_id}_${Date.now()}`,
          type: 'mediaNode',
          position,
          data: {
            label: asset.file_name,
            status: asset.type,
            duration,
            hasTranscript: asset.type === MediaType.DIALOGUE,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full bg-[#0c0c0c]" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
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
            {assets.length} asset{assets.length !== 1 ? 's' : ''} loaded
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
