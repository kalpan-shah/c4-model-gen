import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from '@xyflow/react';
import { C4EdgeData } from '../../layout/diagramLayout';

export const C4Edge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const edgeData = data as unknown as C4EdgeData | undefined;
  const isSelected = edgeData?.isSelected;
  const label = edgeData?.label;
  const technology = edgeData?.technology;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isSelected ? '#38bdf8' : '#64748b',
          strokeWidth: isSelected ? 2.5 : 1.5,
          strokeDasharray: edgeData?.relationship?.interactionType === 'async' ? '4 4' : undefined,
          ...style,
        }}
      />
      {(label || technology) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] backdrop-blur-md border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {label && <span className="font-medium truncate max-w-[140px]">{label}</span>}
              {technology && (
                <span className="font-mono text-[9px] text-slate-400 border-l border-slate-700 pl-1.5">
                  [{technology}]
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

C4Edge.displayName = 'C4Edge';
