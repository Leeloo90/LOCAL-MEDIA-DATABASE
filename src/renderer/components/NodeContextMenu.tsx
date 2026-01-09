import React from 'react';

interface NodeContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  nodeId: string;
  nodeType: string;
  isEnabled: boolean;
  onClose: () => void;
  onToggleEnabled: (nodeId: string, isEnabled: boolean) => void;
  onAssignAsSpine?: (nodeId: string) => void;
  onAddToBucket?: (nodeId: string) => void;
}

/**
 * NodeContextMenu: Right-click context menu for nodes
 * Provides options like Enable/Disable, Assign as Spine, Add to Bucket
 */
export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  isOpen,
  position,
  nodeId,
  nodeType,
  isEnabled,
  onClose,
  onToggleEnabled,
  onAssignAsSpine,
  onAddToBucket,
}) => {
  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    onToggleEnabled(nodeId, !isEnabled);
    onClose();
  };

  const handleAssignAsSpine = () => {
    if (onAssignAsSpine) {
      onAssignAsSpine(nodeId);
      onClose();
    }
  };

  const handleAddToBucket = () => {
    if (onAddToBucket) {
      onAddToBucket(nodeId);
      onClose();
    }
  };

  // Show "Assign as Spine" only for timeline nodes and satellite nodes
  const canBeSpine = nodeType === 'timelineNode' || nodeType === 'satelliteNode';

  return (
    <>
      {/* Backdrop to detect outside clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl py-1 min-w-[180px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <button
          onClick={handleToggleEnabled}
          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {isEnabled ? (
              // Eye Off Icon (Disable)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              // Eye Icon (Enable)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-400"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </div>
          <span className="font-medium">
            {isEnabled ? 'Disable Node' : 'Enable Node'}
          </span>
        </button>

        {/* Assign as Spine (only for timeline and satellite nodes) */}
        {canBeSpine && onAssignAsSpine && (
          <button
            onClick={handleAssignAsSpine}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-400"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <span className="font-medium">Assign as Spine</span>
          </button>
        )}

        {/* Add to Bucket */}
        {onAddToBucket && (
          <button
            onClick={handleAddToBucket}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-amber-400"
              >
                <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="font-medium">Add to Bucket</span>
          </button>
        )}

        <div className="h-px bg-[#333] my-1" />

        <div className="px-4 py-2">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider font-black">
            Node ID
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
            {nodeId}
          </div>
        </div>
      </div>
    </>
  );
};
