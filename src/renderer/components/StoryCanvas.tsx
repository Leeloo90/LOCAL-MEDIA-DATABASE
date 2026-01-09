import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  type Node,
  type Edge,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MediaNode } from './nodes/MediaNode';
import { TimelineNode } from './nodes/TimelineNode';
import { SpineNode } from './nodes/SpineNode';
import { SatelliteNode } from './nodes/SatelliteNode';
import { ActContainer } from './nodes/ActContainer';
import { SceneContainer } from './nodes/SceneContainer';
import { WordAnchorModal } from './WordAnchorModal';
import { NodeContextMenu } from './NodeContextMenu';
import { ContainerNameDialog } from './ContainerNameDialog';
import { CanvasMenuBar } from './CanvasMenuBar';
import { SelectionContextMenu } from './SelectionContextMenu';
import { MediaAsset, MediaType } from '../types';

const nodeTypes = {
  mediaNode: MediaNode,
  timelineNode: TimelineNode,
  spineNode: SpineNode,
  satelliteNode: SatelliteNode,
  actContainer: ActContainer,
  sceneContainer: SceneContainer,
};

interface StoryCanvasProps {
  projectId: number;
  canvasId: number;
  assets: MediaAsset[];
  onSelect: (id: number) => void;
  refreshTrigger?: number;
  bucketVisible?: boolean;
  onToggleBucket?: () => void;
}

const StoryCanvasInner: React.FC<StoryCanvasProps> = ({ projectId, canvasId, assets, onSelect, refreshTrigger, bucketVisible = true, onToggleBucket }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Word Anchor Modal State
  const [anchorModalState, setAnchorModalState] = useState<{
    isOpen: boolean;
    connection: Connection | null;
    sourceNode: Node | null;
    targetNode: Node | null;
  }>({
    isOpen: false,
    connection: null,
    sourceNode: null,
    targetNode: null,
  });

  // Context Menu State
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    nodeId: string;
    nodeType: string;
    isEnabled: boolean;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    nodeId: '',
    nodeType: '',
    isEnabled: true,
  });

  // Zoom Mode State (for hierarchical navigation)
  const [zoomMode, setZoomMode] = useState<{
    level: 'project' | 'act' | 'scene';
    actId: number | null;
    sceneId: number | null;
  }>({
    level: 'project',
    actId: null,
    sceneId: null,
  });

  // Container Name Dialog State
  const [containerDialogState, setContainerDialogState] = useState<{
    isOpen: boolean;
    containerType: 'scene' | 'act';
  }>({
    isOpen: false,
    containerType: 'scene',
  });

  // Link Mode State - when enabled, moving a node moves all connected nodes
  const [linkModeEnabled, setLinkModeEnabled] = useState(false);

  // Selection Context Menu State
  const [selectionContextMenu, setSelectionContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  // Helper to find all connected nodes (recursive traversal)
  const getConnectedNodes = useCallback((nodeId: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(nodeId)) return visited;
    visited.add(nodeId);

    const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    connectedEdges.forEach(edge => {
      const connectedId = edge.source === nodeId ? edge.target : edge.source;
      getConnectedNodes(connectedId, visited);
    });

    return visited;
  }, [edges]);

  // Track position changes and auto-save to database
  const handleNodesChange = useCallback((changes: any[]) => {
    // If link mode is enabled, we need to move connected nodes together
    if (linkModeEnabled) {
      const positionChanges = changes.filter(c => c.type === 'position' && c.dragging);

      if (positionChanges.length > 0) {
        const additionalChanges: any[] = [];
        const processedNodes = new Set<string>();

        positionChanges.forEach(change => {
          if (!processedNodes.has(change.id) && change.position) {
            const connectedNodeIds = getConnectedNodes(change.id);
            const draggedNode = nodes.find(n => n.id === change.id);

            if (draggedNode) {
              const deltaX = change.position.x - draggedNode.position.x;
              const deltaY = change.position.y - draggedNode.position.y;

              // Move all connected nodes by the same delta
              connectedNodeIds.forEach(connectedId => {
                if (connectedId !== change.id && !processedNodes.has(connectedId)) {
                  const connectedNode = nodes.find(n => n.id === connectedId);
                  if (connectedNode) {
                    additionalChanges.push({
                      type: 'position',
                      id: connectedId,
                      position: {
                        x: connectedNode.position.x + deltaX,
                        y: connectedNode.position.y + deltaY,
                      },
                      dragging: change.dragging,
                    });
                    processedNodes.add(connectedId);
                  }
                }
              });
              processedNodes.add(change.id);
            }
          }
        });

        // Apply both original and additional changes
        onNodesChange([...changes, ...additionalChanges]);
      } else {
        onNodesChange(changes);
      }
    } else {
      onNodesChange(changes);
    }

    // Auto-save position updates when user finishes dragging
    changes.forEach((change) => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        // Node drag finished - persist to database
        console.log(`[StoryCanvas] Saving position for node ${change.id}:`, change.position);
        if (window.electronAPI) {
          window.electronAPI.db.updateStoryNodePosition(
            change.id,
            change.position.x,
            change.position.y
          );
        }
      } else if (change.type === 'remove') {
        // Node deleted - remove from database
        console.log(`[StoryCanvas] Deleting node ${change.id}`);
        if (window.electronAPI) {
          window.electronAPI.db.deleteStoryNode(change.id);
        }
      }
    });
  }, [onNodesChange, linkModeEnabled, edges, nodes, getConnectedNodes]);

  // Track edge deletions and persist to database
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);

    changes.forEach((change) => {
      if (change.type === 'remove') {
        // Edge deleted - remove from database
        if (window.electronAPI) {
          window.electronAPI.db.deleteStoryEdge(change.id);
        }
      }
    });
  }, [onEdgesChange]);

  const onConnect = useCallback((params: Connection) => {
    // Check if this is a satellite→spine connection
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    // If connecting satellite to spine, show word anchor modal
    if (sourceNode?.type === 'satelliteNode' && targetNode?.type === 'spineNode') {
      setAnchorModalState({
        isOpen: true,
        connection: params,
        sourceNode,
        targetNode,
      });
      return; // Don't create edge yet, wait for modal
    }

    // Otherwise, create edge normally
    setEdges((eds) => {
      const newEdge = { ...params, id: `edge_${params.source}_${params.target}` };
      if (window.electronAPI) {
        window.electronAPI.db.saveStoryEdge({
          edge_id: newEdge.id,
          project_id: projectId,
          canvas_id: canvasId,
          source_node: params.source || '',
          target_node: params.target || ''
        });
      }
      return addEdge(params, eds);
    });
  }, [setEdges, projectId, canvasId, nodes]);

  useEffect(() => {
    const loadGraph = async () => {
      if (!window.electronAPI) return;
      try {
        console.log(`[StoryCanvas] Loading canvas ${canvasId} at zoom level ${zoomMode.level}...`);

        let flowNodes: Node[] = [];

        // Load different content based on zoom level
        if (zoomMode.level === 'project') {
          // Project level: Show Act containers
          const acts = await window.electronAPI.db.getActs(canvasId);
          flowNodes = acts.map((act: any) => ({
            id: `act_${act.act_id}`,
            type: 'actContainer',
            position: { x: act.x_pos, y: act.y_pos },
            data: {
              act_id: act.act_id,
              name: act.name,
              scene_count: 0, // TODO: Count scenes
              spine_count: 0, // TODO: Count spine nodes
              satellite_count: 0, // TODO: Count satellites
              estimated_runtime: 0,
              transcript_preview: '',
            },
          }));
        } else if (zoomMode.level === 'act' && zoomMode.actId) {
          // Act level: Show Scene containers
          const scenes = await window.electronAPI.db.getScenes(zoomMode.actId);
          flowNodes = scenes.map((scene: any) => ({
            id: `scene_${scene.scene_id}`,
            type: 'sceneContainer',
            position: { x: scene.x_pos, y: scene.y_pos },
            data: {
              scene_id: scene.scene_id,
              name: scene.name,
              spine_count: 0, // TODO: Count spine nodes
              satellite_count: 0, // TODO: Count satellites
              estimated_runtime: 0,
              transcript_preview: '',
            },
          }));
        } else {
          // Scene level (or default): Show actual nodes
          const dbNodes = await window.electronAPI.db.getStoryNodes(canvasId);

          // Filter nodes by scene if in scene mode
          const filteredNodes = zoomMode.level === 'scene' && zoomMode.sceneId
            ? dbNodes.filter((n: any) => n.scene_id === zoomMode.sceneId)
            : dbNodes;

          flowNodes = filteredNodes.map((n: any) => {
          let data = {};
          let nodeType = n.node_type;

          // Handle new spine/satellite node types
          if (nodeType === 'spineNode' && n.text_content) {
            try {
              const parsed = JSON.parse(n.text_content);
              data = {
                speaker_label: parsed.speaker_label,
                content: parsed.content,
                start_tc: n.start_tc,
                end_tc: n.end_tc,
                asset_id: n.asset_id,
                duration_seconds: n.duration_seconds,
                sequence_order: n.sequence_order,
                is_enabled: n.is_enabled !== 0, // SQLite stores boolean as 0/1
              };
            } catch (e) { console.error('JSON parse error', e); }
          } else if (nodeType === 'satelliteNode') {
            const asset = assets.find((a) => a.asset_id === n.asset_id);
            data = {
              file_name: asset?.file_name || 'Unknown',
              start_tc: n.start_tc,
              end_tc: n.end_tc,
              asset_id: n.asset_id,
              duration_seconds: n.duration_seconds,
              anchor_word_index: n.anchor_word_index,
              visual_tags: [],
              is_enabled: n.is_enabled !== 0, // SQLite stores boolean as 0/1
            };
          } else if (nodeType === 'timelineNode' && n.text_content) {
            try {
              const parsed = JSON.parse(n.text_content);
              data = {
                speaker_label: parsed.speaker_label,
                content: parsed.content,
                start_tc: n.start_tc,
                end_tc: n.end_tc,
                asset_id: n.asset_id,
              };
            } catch (e) { console.error('JSON parse error', e); }
          } else {
            // Legacy mediaNode
            const asset = assets.find((a) => a.asset_id === n.asset_id);
            data = {
              label: asset?.file_name || 'Unknown',
              status: asset?.type || 'VIDEO',
              duration: `${n.start_tc} - ${n.end_tc}`,
              hasTranscript: asset?.type === 'DIALOGUE',
            };
          }
          return { id: n.node_id, type: nodeType, position: { x: n.x_pos, y: n.y_pos }, data };
        });
        }

        // Load edges (only for scene level where actual nodes are shown)
        let flowEdges: Edge[] = [];
        if (zoomMode.level === 'scene' || (!zoomMode.actId && !zoomMode.sceneId)) {
          const dbEdges = await window.electronAPI.db.getStoryEdges(canvasId);
          flowEdges = dbEdges.map((e: any) => ({ id: e.edge_id, source: e.source_node, target: e.target_node }));
        }

        console.log(`[StoryCanvas] Rendered ${flowNodes.length} nodes, ${flowEdges.length} edges`);
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('Failed to load graph', error);
      }
    };
    loadGraph();
    // Only reload when canvasId, zoomMode, or refreshTrigger changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId, zoomMode.level, zoomMode.actId, zoomMode.sceneId, refreshTrigger]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Calculate next spine position using horizontal auto-layout
   * Spine nodes flow left-to-right forming the narrative sequence
   */
  const getNextSpinePosition = useCallback(() => {
    const spineNodes = nodes.filter(n => n.type === 'spineNode');
    if (spineNodes.length === 0) {
      return { x: 100, y: 400 }; // First spine node at baseline
    }

    // Find rightmost spine node and place next one after it
    const rightmost = spineNodes.reduce((max, node) =>
      node.position.x > max.position.x ? node : max
    , spineNodes[0]);

    return {
      x: rightmost.position.x + 650, // Space between spine nodes
      y: 400 // Fixed Y for consistent horizontal alignment
    };
  }, [nodes]);

  /**
   * Calculate satellite position (above the spine)
   */
  const getSatellitePosition = useCallback((dropX: number, dropY: number) => {
    // Satellites float above the spine (y < 400)
    return {
      x: dropX,
      y: Math.min(dropY, 200) // Ensure it's above the spine baseline
    };
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const dataString = event.dataTransfer.getData('application/storygraph');
      if (!dataString) return;

      const payload = JSON.parse(dataString);
      const dropPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      let newNode: Node;
      let nodeSubtype = 'spine';
      let sequenceOrder = null;
      let durationSeconds = null;

      // SPINE-FIRST ARCHITECTURE:
      // - Dialogue/Transcript → Spine Node (horizontal sequence)
      // - Video/B-Roll → Satellite Node (floating above)

      if (payload.type === 'TRANSCRIPT_TRIM') {
        // Transcript segments become SPINE nodes
        const spinePosition = getNextSpinePosition();
        const contentWords = payload.content.split(' ').length;
        durationSeconds = contentWords * 0.5; // Rough estimate

        const spineNodes = nodes.filter(n => n.type === 'spineNode');
        sequenceOrder = spineNodes.length;

        newNode = {
          id: `spine_${Date.now()}`,
          type: 'spineNode',
          position: spinePosition,
          data: {
            speaker_label: payload.speaker_label,
            content: payload.content,
            start_tc: payload.start_tc,
            end_tc: payload.end_tc,
            asset_id: payload.asset_id,
            duration_seconds: durationSeconds,
            sequence_order: sequenceOrder,
          },
        };
        nodeSubtype = 'spine';
      } else if (payload.type === 'FULL_CLIP') {
        // Full clips become SATELLITE nodes (B-Roll coverage)
        const satellitePosition = getSatellitePosition(dropPosition.x, dropPosition.y);

        newNode = {
          id: `satellite_${Date.now()}`,
          type: 'satelliteNode',
          position: satellitePosition,
          data: {
            file_name: payload.file_name,
            start_tc: payload.start_tc,
            end_tc: payload.end_tc,
            asset_id: payload.asset_id,
            duration_seconds: payload.duration_frames / payload.fps,
            visual_tags: [],
          },
        };
        nodeSubtype = 'satellite';
      } else {
        return;
      }

      setNodes((nds) => nds.concat(newNode));

      // Persistence: Save to database with new spine/satellite architecture
      if (window.electronAPI) {
        const nodeToSave = {
          node_id: newNode.id,
          project_id: projectId,
          canvas_id: canvasId,
          asset_id: payload.asset_id,
          start_tc: payload.start_tc,
          end_tc: payload.end_tc,
          text_content: payload.type === 'TRANSCRIPT_TRIM'
            ? JSON.stringify({
                content: payload.content,
                speaker_label: payload.speaker_label
              })
            : null,
          node_type: newNode.type,
          node_subtype: nodeSubtype,
          x_pos: newNode.position.x,
          y_pos: newNode.position.y,
          duration_seconds: durationSeconds,
          sequence_order: sequenceOrder,
        };
        console.log(`[StoryCanvas] Saving new ${nodeSubtype} node to canvas ${canvasId}:`, nodeToSave);
        await window.electronAPI.db.saveStoryNode(nodeToSave);
      }
    },
    [screenToFlowPosition, setNodes, projectId, canvasId, getNextSpinePosition, getSatellitePosition, nodes]
  );

  // Handle word anchor modal confirmation
  const handleAnchorConfirm = useCallback((mode: 'clip' | 'word', wordIndex?: number, wordTimecode?: string) => {
    const { connection, sourceNode } = anchorModalState;
    if (!connection || !sourceNode) return;

    setEdges((eds) => {
      const newEdge = { ...connection, id: `edge_${connection.source}_${connection.target}` };
      if (window.electronAPI) {
        window.electronAPI.db.saveStoryEdge({
          edge_id: newEdge.id,
          project_id: projectId,
          canvas_id: canvasId,
          source_node: connection.source || '',
          target_node: connection.target || '',
          anchor_to_node: connection.target || undefined,
          anchor_word_timecode: mode === 'word' ? wordTimecode : undefined,
          anchor_mode: mode,
        });
      }
      return addEdge(connection, eds);
    });

    setAnchorModalState({ isOpen: false, connection: null, sourceNode: null, targetNode: null });
  }, [anchorModalState, setEdges, projectId, canvasId]);

  // Handle node context menu (right-click)
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const nodeData = node.data as any;
    setContextMenuState({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      nodeId: node.id,
      nodeType: node.type || 'unknown',
      isEnabled: nodeData.is_enabled !== false,
    });
  }, []);

  // Handle pane context menu (right-click on canvas background)
  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    const selectedNodes = nodes.filter(n => n.selected);
    // Only show selection context menu if there are selected nodes
    if (selectedNodes.length > 0) {
      event.preventDefault();
      setSelectionContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
      });
    }
  }, [nodes]);

  // Handle toggle enabled/disabled
  const handleToggleEnabled = useCallback(async (nodeId: string, isEnabled: boolean) => {
    if (window.electronAPI) {
      await window.electronAPI.db.updateNodeEnabled(nodeId, isEnabled);
    }

    // Update the node data locally
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, is_enabled: isEnabled } }
          : n
      )
    );
  }, [setNodes]);

  // Handle "Assign as Spine" - Convert timeline/satellite node to spine node
  const handleAssignAsSpine = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeData = node.data as any;
    const spinePosition = getNextSpinePosition();
    const newSpineId = `spine_${Date.now()}`;
    const spineNodes = nodes.filter(n => n.type === 'spineNode');

    const newSpineNode: Node = {
      id: newSpineId,
      type: 'spineNode',
      position: { x: node.position.x, y: spinePosition.y },
      data: {
        speaker_label: nodeData.speaker_label || 'Speaker',
        content: nodeData.content || nodeData.file_name || 'Converted to spine',
        start_tc: nodeData.start_tc,
        end_tc: nodeData.end_tc,
        asset_id: nodeData.asset_id,
        duration_seconds: nodeData.duration_seconds,
        sequence_order: spineNodes.length,
        is_enabled: nodeData.is_enabled !== false,
      },
    };

    // Replace old node with new spine node
    setNodes((nds) => [...nds.filter(n => n.id !== nodeId), newSpineNode]);

    // Persist to database
    if (window.electronAPI) {
      await window.electronAPI.db.deleteStoryNode(nodeId);
      await window.electronAPI.db.saveStoryNode({
        node_id: newSpineId,
        project_id: projectId,
        canvas_id: canvasId,
        asset_id: nodeData.asset_id,
        start_tc: nodeData.start_tc,
        end_tc: nodeData.end_tc,
        text_content: JSON.stringify({
          content: nodeData.content || nodeData.file_name || 'Converted to spine',
          speaker_label: nodeData.speaker_label || 'Speaker'
        }),
        node_type: 'spineNode',
        node_subtype: 'spine',
        x_pos: node.position.x,
        y_pos: spinePosition.y,
        duration_seconds: nodeData.duration_seconds,
        sequence_order: spineNodes.length,
      });
    }
  }, [nodes, setNodes, projectId, canvasId, getNextSpinePosition]);

  // Handle "Add to Bucket" - Save node to bucket_items for later use
  const handleAddToBucket = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !window.electronAPI) return;

    const nodeData = node.data as any;

    await window.electronAPI.db.addBucketItem({
      project_id: projectId,
      canvas_id: canvasId,
      asset_id: nodeData.asset_id,
      start_tc: nodeData.start_tc,
      end_tc: nodeData.end_tc,
      text_content: nodeData.content ? JSON.stringify({
        content: nodeData.content,
        speaker_label: nodeData.speaker_label
      }) : null,
      item_type: node.type || 'clip',
      notes: `Added from canvas at ${new Date().toLocaleTimeString()}`,
    });
  }, [nodes, projectId, canvasId]);

  // Handle double-click on containers to drill into them
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'actContainer') {
      const actData = node.data as any;
      setZoomMode({ level: 'act', actId: actData.act_id, sceneId: null });
    } else if (node.type === 'sceneContainer') {
      const sceneData = node.data as any;
      setZoomMode({ level: 'scene', actId: zoomMode.actId, sceneId: sceneData.scene_id });
    }
  }, [zoomMode.actId]);

  // Handle "Create Scene" button click - can create empty or with selection
  const handleCreateSceneClick = useCallback(() => {
    setContainerDialogState({ isOpen: true, containerType: 'scene' });
  }, []);

  // Handle "Create Act" button click - can create empty or with selection
  const handleCreateActClick = useCallback(() => {
    setContainerDialogState({ isOpen: true, containerType: 'act' });
  }, []);

  // Handle container name confirmation
  const handleContainerNameConfirm = useCallback(async (name: string, description?: string) => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (!window.electronAPI) return;

    // Calculate position and size based on selection or use defaults
    let x = 100;
    let y = 100;
    let width = 2000; // Size of ~10 nodes (200px width * 10)
    let height = 1200;

    if (selectedNodes.length > 0) {
      // Calculate bounding box of selected nodes
      const bounds = selectedNodes.reduce((acc, node) => {
        const minX = Math.min(acc.minX, node.position.x);
        const minY = Math.min(acc.minY, node.position.y);
        const maxX = Math.max(acc.maxX, node.position.x + 300); // Estimate node width
        const maxY = Math.max(acc.maxY, node.position.y + 150); // Estimate node height
        return { minX, minY, maxX, maxY };
      }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

      width = Math.max(bounds.maxX - bounds.minX + 100, 2000); // Add padding, minimum 2000
      height = Math.max(bounds.maxY - bounds.minY + 100, 1200);
      x = bounds.minX - 50;
      y = bounds.minY - 50;
    }

    if (containerDialogState.containerType === 'scene') {
      // For Scene: we need an actId - for now, create a default act if none exists
      // TODO: In future, allow user to select which act to add scene to
      const acts = await window.electronAPI.db.getActs(canvasId);
      let actId: number;

      if (acts.length === 0) {
        // Create a default act
        actId = await window.electronAPI.db.createAct({
          canvas_id: canvasId,
          name: 'Act 1',
          x_pos: 0,
          y_pos: 0,
          sequence_order: 0,
          width: 2000,
          height: 1500,
        });
      } else {
        actId = acts[0].act_id;
      }

      const sceneId = await window.electronAPI.db.createScene({
        act_id: actId,
        name,
        x_pos: x,
        y_pos: y,
        sequence_order: 0,
        width,
        height,
      });

      // Update selected nodes to belong to this scene
      for (const node of selectedNodes) {
        await window.electronAPI.db.saveStoryNode({
          node_id: node.id,
          project_id: projectId,
          canvas_id: canvasId,
          asset_id: (node.data as any).asset_id,
          start_tc: (node.data as any).start_tc,
          end_tc: (node.data as any).end_tc,
          text_content: (node.data as any).content ? JSON.stringify({
            content: (node.data as any).content,
            speaker_label: (node.data as any).speaker_label
          }) : null,
          node_type: node.type,
          node_subtype: 'spine',
          x_pos: node.position.x,
          y_pos: node.position.y,
          scene_id: sceneId,
        });
      }
    } else {
      // Create Act
      await window.electronAPI.db.createAct({
        canvas_id: canvasId,
        name,
        x_pos: x,
        y_pos: y,
        sequence_order: 0,
        width,
        height,
      });
    }

    // Clear selection and close dialog
    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
    setContainerDialogState({ ...containerDialogState, isOpen: false });
  }, [nodes, projectId, canvasId, containerDialogState, setNodes]);

  return (
    <div 
      ref={reactFlowWrapper} 
      className="h-full w-full bg-[#0c0c0c]" 
      onDrop={onDrop} 
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        selectionOnDrag={false}
        panOnDrag={true}
        selectionKeyCode="Shift"
      >
        <Background color="#222" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'spineNode') return '#6366f1'; // Indigo for spine
            if (n.type === 'satelliteNode') return '#a855f7'; // Purple for satellite
            if (n.type === 'timelineNode') return '#a78bfa'; // Light purple for timeline
            if (n.type === 'actContainer') return '#4f46e5'; // Deep indigo for acts
            if (n.type === 'sceneContainer') return '#9333ea'; // Deep purple for scenes
            return '#374151'; // Gray for media
          }}
          maskColor="rgba(0,0,0,0.7)"
        />
        {/* Breadcrumb Navigation */}
        <Panel position="top-left" className="bg-[#121212] px-4 py-2 rounded border border-[#2a2a2a] flex items-center gap-2">
          <button
            onClick={() => setZoomMode({ level: 'project', actId: null, sceneId: null })}
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              zoomMode.level === 'project'
                ? 'text-indigo-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Project
          </button>
          {zoomMode.actId && (
            <>
              <span className="text-gray-600">/</span>
              <button
                onClick={() => setZoomMode({ level: 'act', actId: zoomMode.actId, sceneId: null })}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  zoomMode.level === 'act'
                    ? 'text-indigo-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Act {zoomMode.actId}
              </button>
            </>
          )}
          {zoomMode.sceneId && (
            <>
              <span className="text-gray-600">/</span>
              <button
                className="text-xs font-bold uppercase tracking-wider text-purple-400"
              >
                Scene {zoomMode.sceneId}
              </button>
            </>
          )}
        </Panel>

      </ReactFlow>

      {/* Canvas Menu Bar */}
      <CanvasMenuBar
        linkModeEnabled={linkModeEnabled}
        onToggleLinkMode={() => setLinkModeEnabled(!linkModeEnabled)}
        bucketVisible={bucketVisible}
        onToggleBucket={onToggleBucket || (() => {})}
        onCreateScene={handleCreateSceneClick}
        onCreateAct={handleCreateActClick}
        hasSelection={nodes.some(n => n.selected)}
        zoomLevel={zoomMode.level}
      />

      {/* Word Anchor Modal */}
      {anchorModalState.targetNode && (
        <WordAnchorModal
          isOpen={anchorModalState.isOpen}
          onClose={() => setAnchorModalState({ isOpen: false, connection: null, sourceNode: null, targetNode: null })}
          spineNodeData={anchorModalState.targetNode.data as any}
          onAnchor={handleAnchorConfirm}
        />
      )}

      {/* Node Context Menu */}
      <NodeContextMenu
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        nodeId={contextMenuState.nodeId}
        nodeType={contextMenuState.nodeType}
        isEnabled={contextMenuState.isEnabled}
        onClose={() => setContextMenuState({ ...contextMenuState, isOpen: false })}
        onToggleEnabled={handleToggleEnabled}
        onAssignAsSpine={handleAssignAsSpine}
        onAddToBucket={handleAddToBucket}
      />

      {/* Container Name Dialog */}
      <ContainerNameDialog
        isOpen={containerDialogState.isOpen}
        containerType={containerDialogState.containerType}
        onConfirm={handleContainerNameConfirm}
        onCancel={() => setContainerDialogState({ ...containerDialogState, isOpen: false })}
      />

      {/* Selection Context Menu */}
      <SelectionContextMenu
        isOpen={selectionContextMenu.isOpen}
        position={selectionContextMenu.position}
        selectionCount={nodes.filter(n => n.selected).length}
        onClose={() => setSelectionContextMenu({ ...selectionContextMenu, isOpen: false })}
        onCreateScene={handleCreateSceneClick}
        onCreateAct={handleCreateActClick}
        zoomLevel={zoomMode.level}
      />
    </div>
  );
};

export const StoryCanvas: React.FC<StoryCanvasProps> = (props) => (
  <ReactFlowProvider>
    <StoryCanvasInner {...props} />
  </ReactFlowProvider>
);