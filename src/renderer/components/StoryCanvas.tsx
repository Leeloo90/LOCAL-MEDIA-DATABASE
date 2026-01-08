import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow, // <--- Add curly braces here
  addEdge,
  Background,
  Connection,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node, // Added 'type' for cleaner TS compilation
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Project } from '../types';

interface StoryCanvasProps {
    project: Project;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const StoryCanvas: React.FC<StoryCanvasProps> = ({ project }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        async (params: Connection) => {
          setEdges((eds) => addEdge(params, eds));
          if (window.electronAPI) {
            await window.electronAPI.db.saveStoryEdge({
              edge_id: `edge_${params.source}_${params.target}`,
              project_id: project.project_id,
              source_node: params.source,
              target_node: params.target
            });
          }
        },
        [project.project_id, setEdges]
      );

    useEffect(() => {
        const loadGraph = async () => {
            if(window.electronAPI) {
                const dbNodes = await window.electronAPI.db.getStoryNodes(project.project_id);
                const dbEdges = await window.electronAPI.db.getStoryEdges(project.project_id);

                const flowNodes = dbNodes.map(node => ({
                    id: node.node_id,
                    position: { x: node.x_pos, y: node.y_pos },
                    data: { label: node.text_content ? JSON.parse(node.text_content).content : 'Media' },
                    type: 'default',
                }));

                const flowEdges = dbEdges.map(edge => ({
                    id: edge.edge_id,
                    source: edge.source_node,
                    target: edge.target_node,
                }));
                
                setNodes(flowNodes);
                setEdges(flowEdges);
            }
        };
        loadGraph();
    }, [project.project_id, setNodes, setEdges]);


    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
        >
            <Background />
            <Controls />
            <MiniMap />
        </ReactFlow>
    );
};