import dagre from 'dagre';
import { Edge, Node } from '@xyflow/react';
import {
  ArchitectureElement,
  ArchitectureProject,
  ArchitectureRelationship,
  ArchitectureView,
  C4Level,
} from '../types/c4';

export interface C4NodeData {
  element: ArchitectureElement;
  level: C4Level;
  isSelected: boolean;
  hasChildren: boolean;
  childCount: number;
  childLevelName?: string;
  isBoundary?: boolean;
  isDatabase?: boolean;
  onDrillDown?: (elementId: string) => void;
  onSelect?: (elementId: string) => void;
}

export interface C4EdgeData {
  relationship: ArchitectureRelationship;
  label?: string;
  technology?: string;
  isSelected?: boolean;
}

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  person: { width: 230, height: 125 },
  softwareSystem: { width: 250, height: 135 },
  container: { width: 235, height: 125 },
  component: { width: 220, height: 115 },
  code: { width: 200, height: 105 },
};

/**
 * Computes layout using Dagre and transforms into React Flow Nodes and Edges.
 */
export function computeDiagramLayout(
  project: ArchitectureProject,
  currentView: ArchitectureView,
  selectedElementId?: string,
  selectedRelationshipId?: string,
  direction: 'TB' | 'LR' = 'TB',
  callbacks?: {
    onDrillDown?: (elementId: string) => void;
    onSelect?: (elementId: string) => void;
  }
): { nodes: Node[]; edges: Edge[] } {
  const elements = project.elements;
  const viewElementIds = new Set(currentView.elementIds);

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    align: 'DL',
    nodesep: direction === 'TB' ? 65 : 55,
    ranksep: direction === 'TB' ? 75 : 65,
    marginx: 40,
    marginy: 40,
  });

  // Check children counts for each element
  const childrenMap = new Map<string, ArchitectureElement[]>();
  for (const el of Object.values(elements)) {
    if (el.parentId) {
      const list = childrenMap.get(el.parentId) || [];
      list.push(el);
      childrenMap.set(el.parentId, list);
    }
  }

  // 1. Add nodes to dagre
  const nodes: Node[] = [];
  for (const elementId of currentView.elementIds) {
    const el = elements[elementId];
    if (!el) continue;

    const dims = NODE_DIMENSIONS[el.type] || { width: 220, height: 120 };
    dagreGraph.setNode(elementId, { width: dims.width, height: dims.height });

    const children = childrenMap.get(elementId) || [];
    const hasChildren = children.length > 0;
    const childLevelName =
      el.type === 'softwareSystem' ? 'Containers' : el.type === 'container' ? 'Components' : undefined;

    // Check if this element is a boundary node in this view (e.g. an external system or outside person shown for context)
    const isBoundary =
      currentView.level === 'container' && el.type !== 'container'
        ? true
        : currentView.level === 'component' && el.type !== 'component'
        ? true
        : false;

    const nodeData: C4NodeData = {
      element: el,
      level: currentView.level,
      isSelected: selectedElementId === elementId,
      hasChildren,
      childCount: children.length,
      childLevelName,
      isBoundary,
      isDatabase: el.isDatabase || el.type === 'container' && el.name.toLowerCase().includes('database') || el.name.toLowerCase().includes('db'),
      onDrillDown: callbacks?.onDrillDown,
      onSelect: callbacks?.onSelect,
    };

    nodes.push({
      id: elementId,
      type: 'c4Node',
      position: { x: 0, y: 0 }, // computed below
      data: nodeData as unknown as Record<string, unknown>,
    });
  }

  // 2. Identify view-relevant relationships with roll-up support
  const edges: Edge[] = [];
  const processedEdges = new Set<string>();

  for (const rel of project.relationships) {
    // Resolve source and target to nodes visible in current view
    const visibleSource = resolveToVisibleNode(rel.sourceId, viewElementIds, elements);
    const visibleTarget = resolveToVisibleNode(rel.targetId, viewElementIds, elements);

    if (visibleSource && visibleTarget && visibleSource !== visibleTarget) {
      const edgeKey = `${visibleSource}->${visibleTarget}:${rel.description || ''}`;
      if (processedEdges.has(edgeKey)) continue;
      processedEdges.add(edgeKey);

      dagreGraph.setEdge(visibleSource, visibleTarget);

      const isSelected = selectedRelationshipId === rel.id;

      let edgeLabel = rel.description || '';
      if (rel.technology) {
        edgeLabel = edgeLabel ? `${edgeLabel} [${rel.technology}]` : `[${rel.technology}]`;
      }

      edges.push({
        id: rel.id,
        source: visibleSource,
        target: visibleTarget,
        type: 'c4Edge',
        animated: rel.interactionType === 'async' || rel.technology?.toLowerCase().includes('kafka') || rel.technology?.toLowerCase().includes('event'),
        data: {
          relationship: rel,
          label: rel.description,
          technology: rel.technology,
          isSelected,
        },
      });
    }
  }

  // 3. Run layout calculation
  dagre.layout(dagreGraph);

  // 4. Update node positions from Dagre (offset by half width/height to center coordinates)
  for (const node of nodes) {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) {
      const dims = NODE_DIMENSIONS[(node.data as unknown as C4NodeData).element.type] || {
        width: 220,
        height: 120,
      };
      node.position = {
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      };
    }
  }

  return { nodes, edges };
}

/**
 * If an element is directly in the view, returns it.
 * Otherwise traverses up parent chain to see if any ancestor is in the view.
 */
function resolveToVisibleNode(
  elementId: string,
  viewElementIds: Set<string>,
  elements: Record<string, ArchitectureElement>
): string | undefined {
  if (viewElementIds.has(elementId)) {
    return elementId;
  }

  const el = elements[elementId];
  if (!el) return undefined;

  let currentParentId = el.parentId;
  while (currentParentId) {
    if (viewElementIds.has(currentParentId)) {
      return currentParentId;
    }
    const parentEl = elements[currentParentId];
    currentParentId = parentEl?.parentId;
  }

  return undefined;
}
