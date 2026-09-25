import React from 'react';
import {
  Compass,
  Edit3,
  Search,
  Download,
  Share2,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
} from 'lucide-react';
import { C4Level } from '../../types/c4';

interface HeaderProps {
  mode: 'explore' | 'edit';
  currentLevel: C4Level;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onSetMode: (mode: 'explore' | 'edit') => void;
  onOpenSearch: () => void;
  onNavigateToLevel: (level: 'systemContext' | 'container' | 'component') => void;
  onExport: () => void;
}

export function Header({
  mode,
  currentLevel,
  isLeftPanelOpen,
  isRightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  onSetMode,
  onOpenSearch,
  onNavigateToLevel,
  onExport,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* Zone 1: Single text element wordmark + Panel toggles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLeftPanel}
          title={isLeftPanelOpen ? 'Collapse Left Navigator' : 'Expand Left Navigator'}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60"
        >
          {isLeftPanelOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>C4 Architecture Explorer</span>
        </span>
      </div>

      {/* Zone 2: Navigation Links / Interactive Segmented Level Controls & Search */}
      <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
        {/* Quick Level Switchers */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          <button
            onClick={() => onNavigateToLevel('systemContext')}
            className={`px-3 py-1 rounded-md transition-colors ${
              currentLevel === 'systemContext'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            System Context
          </button>
          <button
            onClick={() => onNavigateToLevel('container')}
            className={`px-3 py-1 rounded-md transition-colors ${
              currentLevel === 'container'
                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Containers
          </button>
          <button
            onClick={() => onNavigateToLevel('component')}
            className={`px-3 py-1 rounded-md transition-colors ${
              currentLevel === 'component'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Components
          </button>
        </div>

        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Quick Search...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Explore / Edit Mode Switch + Export + Right Panel Toggle) */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => onSetMode('explore')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'explore'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Mode</span>
          </button>
          <button
            onClick={() => onSetMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'edit'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Markup</span>
          </button>
        </div>

        {/* Export Action */}
        <button
          onClick={onExport}
          title="Export Architecture / Diagram"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Details Panel Toggle */}
        <button
          onClick={onToggleRightPanel}
          title={isRightPanelOpen ? 'Collapse Details Panel' : 'Expand Details Panel'}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60"
        >
          {isRightPanelOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
