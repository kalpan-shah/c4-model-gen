import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Layers,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { C4Node } from './C4Node';
import { C4Edge } from './C4Edge';
import { computeDiagramLayout } from '../../layout/diagramLayout';
import { ArchitectureProject, ArchitectureView } from '../../types/c4';

const nodeTypes = {
  c4Node: C4Node,
};

const edgeTypes = {
  c4Edge: C4Edge,
};

interface C4CanvasProps {
  project: ArchitectureProject;
  currentView: ArchitectureView;
  selectedElementId: string | null;
  selectedRelationshipId: string | null;
  breadcrumbs: Array<{ id: string; title: string; viewId?: string; level: string }>;
  layoutDirection: 'TB' | 'LR';
  canGoBack: boolean;
  canGoForward: boolean;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  onNavigateToView: (viewId: string) => void;
  onDrillDown: (elementId: string) => void;
  onSelectElement: (elementId: string | null) => void;
  onSelectRelationship: (relationshipId: string | null) => void;
  onToggleLayoutDirection: () => void;
  onExportImage?: () => void;
}

function CanvasInner({
  project,
  currentView,
  selectedElementId,
  selectedRelationshipId,
  breadcrumbs,
  layoutDirection,
  canGoBack,
  canGoForward,
  onNavigateBack,
  onNavigateForward,
  onNavigateToView,
  onDrillDown,
  onSelectElement,
  onSelectRelationship,
  onToggleLayoutDirection,
  onExportImage,
}: C4CanvasProps) {
  const { fitView } = useReactFlow();

  // Compute layout with Dagre
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return computeDiagramLayout(
      project,
      currentView,
      selectedElementId || undefined,
      selectedRelationshipId || undefined,
      layoutDirection,
      {
        onDrillDown,
        onSelect: onSelectElement,
      }
    );
  }, [
    project,
    currentView,
    selectedElementId,
    selectedRelationshipId,
    layoutDirection,
    onDrillDown,
    onSelectElement,
  ]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever view or selection updates
  React.useEffect(() => {
    setTimeout(() => {
      fitView({ duration: 350, padding: 0.2 });
    }, 50);
  }, [currentView.id, layoutDirection, fitView]);

  const handlePaneClick = useCallback(() => {
    onSelectElement(null);
    onSelectRelationship(null);
  }, [onSelectElement, onSelectRelationship]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      onSelectRelationship(edge.id);
    },
    [onSelectRelationship]
  );

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Top Floating Breadcrumb Bar */}
      <div className="z-10 flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-xs">
        {/* Navigation History & Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0 border-r border-slate-800 pr-2">
            <button
              onClick={onNavigateBack}
              disabled={!canGoBack}
              title="Navigate Back"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateForward}
              disabled={!canGoForward}
              title="Navigate Forward"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumb sequence */}
          <nav className="flex items-center gap-1.5 whitespace-nowrap text-slate-300">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id + idx}>
                  {idx > 0 && <span className="text-slate-600">/</span>}
                  <button
                    onClick={() => {
                      if (crumb.viewId) onNavigateToView(crumb.viewId);
                      else onSelectElement(crumb.id);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                      isLast
                        ? 'text-cyan-400 font-semibold bg-cyan-950/40 border border-cyan-800/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{crumb.title}</span>
                    <span className="text-[10px] opacity-60 font-mono">[{crumb.level}]</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleLayoutDirection}
            title={`Switch to ${layoutDirection === 'TB' ? 'Left-to-Right' : 'Top-to-Bottom'} layout`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors border border-slate-700/60"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{layoutDirection === 'TB' ? 'Vertical Layout' : 'Horizontal Layout'}</span>
          </button>

          <button
            onClick={() => fitView({ duration: 300, padding: 0.2 })}
            title="Fit to view"
            className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {onExportImage && (
            <button
              onClick={onExportImage}
              title="Export diagram as image"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors border border-slate-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div id="c4-canvas-container" className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={handlePaneClick}
          onEdgeClick={handleEdgeClick}
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#334155"
            className="opacity-40"
          />
          <Controls
            showInteractive={false}
            className="bg-slate-900! border-slate-800! fill-slate-300! text-slate-300! [&>button]:border-slate-800! [&>button]:bg-slate-900! [&>button:hover]:bg-slate-800!"
          />
          <MiniMap
            nodeColor={(n) => {
              const el = (n.data as any)?.element;
              if (el?.type === 'person') return '#64748b';
              if (el?.type === 'softwareSystem') return el.external ? '#9333ea' : '#2563eb';
              if (el?.type === 'container') return el.isDatabase ? '#d97706' : '#0d9488';
              return '#4f46e5';
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="bg-slate-950! border-slate-800! rounded-lg overflow-hidden shadow-lg hidden sm:block"
          />

          {/* Canvas info indicator */}
          <Panel position="bottom-left" className="m-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-md flex items-center gap-3">
              <span className="font-semibold text-slate-200">{currentView.title}</span>
              <span className="text-slate-600">·</span>
              <span>{initialNodes.length} nodes</span>
              <span className="text-slate-600">·</span>
              <span>{initialEdges.length} connections</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export function C4Canvas(props: C4CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
