import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  User,
  Server,
  Layers,
  Database,
  Cpu,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { C4NodeData } from '../../layout/diagramLayout';

export const C4Node = memo(({ data }: { data: C4NodeData }) => {
  const {
    element,
    isSelected,
    hasChildren,
    childCount,
    childLevelName,
    isBoundary,
    isDatabase,
    onDrillDown,
    onSelect,
  } = data;

  const isExternal = element.external;

  // Visual theming based on C4 element type
  const getTypeConfig = () => {
    if (element.type === 'person') {
      return {
        label: 'Person',
        icon: User,
        borderColor: isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-500/50'
          : 'border-slate-600 hover:border-slate-400',
        bg: 'bg-slate-900/90 text-slate-100',
        badgeBg: 'text-slate-400',
        tagColor: 'text-slate-300',
      };
    }

    if (element.type === 'softwareSystem') {
      if (isExternal) {
        return {
          label: 'External System',
          icon: ExternalLink,
          borderColor: isSelected
            ? 'border-purple-400 ring-2 ring-purple-500/50'
            : 'border-dashed border-purple-500/60 hover:border-purple-400',
          bg: 'bg-purple-950/40 text-purple-100',
          badgeBg: 'text-purple-300',
          tagColor: 'text-purple-300',
        };
      }
      return {
        label: 'Software System',
        icon: Server,
        borderColor: isSelected
          ? 'border-blue-400 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
          : 'border-blue-600/70 hover:border-blue-400',
        bg: 'bg-blue-950/40 text-blue-50',
        badgeBg: 'text-blue-300',
        tagColor: 'text-blue-300',
      };
    }

    if (element.type === 'container') {
      if (isDatabase) {
        return {
          label: 'Database Container',
          icon: Database,
          borderColor: isSelected
            ? 'border-amber-400 ring-2 ring-amber-500/50'
            : 'border-amber-600/70 hover:border-amber-400',
          bg: 'bg-amber-950/30 text-amber-50',
          badgeBg: 'text-amber-400',
          tagColor: 'text-amber-300',
        };
      }
      return {
        label: 'Container',
        icon: Layers,
        borderColor: isSelected
          ? 'border-teal-400 ring-2 ring-teal-500/50 shadow-lg shadow-teal-500/10'
          : 'border-teal-600/70 hover:border-teal-400',
        bg: 'bg-teal-950/30 text-teal-50',
        badgeBg: 'text-teal-300',
        tagColor: 'text-teal-300',
      };
    }

    // Component
    return {
      label: 'Component',
      icon: Cpu,
      borderColor: isSelected
        ? 'border-indigo-400 ring-2 ring-indigo-500/50'
        : 'border-indigo-600/70 hover:border-indigo-400',
      bg: 'bg-indigo-950/30 text-indigo-50',
      badgeBg: 'text-indigo-300',
      tagColor: 'text-indigo-300',
    };
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(element.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onDrillDown) {
      onDrillDown(element.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`group relative rounded-xl border p-3.5 backdrop-blur-md transition-all duration-150 cursor-pointer select-none ${
        config.borderColor
      } ${config.bg} ${
        isBoundary ? 'opacity-80 scale-95' : 'opacity-100'
      }`}
      style={{
        minWidth: 210,
        maxWidth: 260,
      }}
    >
      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Top micro-header */}
      <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-white/5 text-[11px] font-medium tracking-wide">
        <div className="flex items-center gap-1.5">
          <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className={`${config.badgeBg} truncate uppercase tracking-wider text-[10px]`}>
            {isBoundary ? `Boundary / ${config.label}` : config.label}
          </span>
        </div>
        {isExternal && (
          <span className="text-[9px] uppercase tracking-wider text-purple-400 font-mono">External</span>
        )}
      </div>

      {/* Main title */}
      <div className="mt-1">
        <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {element.name}
        </h4>
        {element.technology && (
          <p className="text-[11px] font-mono text-slate-400 line-clamp-1 mt-0.5">
            [{element.technology}]
          </p>
        )}
      </div>

      {/* Description */}
      {element.description && (
        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug">
          {element.description}
        </p>
      )}

      {/* Bottom drill-down indicator */}
      {hasChildren && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">
            {childCount} {childLevelName || 'sub-items'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDrillDown) onDrillDown(element.id);
            }}
            className="flex items-center gap-0.5 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 transition-colors"
          >
            <span>Explore</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
});

C4Node.displayName = 'C4Node';
