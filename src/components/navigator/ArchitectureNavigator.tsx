import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Server,
  User,
  Database,
  Cpu,
  Search,
  ExternalLink,
  FolderTree,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ArchitectureProject, ArchitectureElement, C4Level } from '../../types/c4';

interface ArchitectureNavigatorProps {
  project: ArchitectureProject;
  currentViewId: string;
  selectedElementId: string | null;
  onNavigateToView: (viewId: string) => void;
  onSelectElement: (elementId: string) => void;
  onDrillDown: (elementId: string) => void;
}

export function ArchitectureNavigator({
  project,
  currentViewId,
  selectedElementId,
  onNavigateToView,
  onSelectElement,
  onDrillDown,
}: ArchitectureNavigatorProps) {
  const [filterText, setFilterText] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group elements into hierarchy
  const hierarchy = useMemo(() => {
    const people = Object.values(project.elements).filter((e) => e.type === 'person');
    const systems = Object.values(project.elements).filter((e) => e.type === 'softwareSystem');

    const systemMap: Record<
      string,
      {
        system: ArchitectureElement;
        containers: Array<{
          container: ArchitectureElement;
          components: ArchitectureElement[];
        }>;
      }
    > = {};

    for (const sys of systems) {
      const containers = Object.values(project.elements).filter(
        (e) => e.type === 'container' && e.parentId === sys.id
      );

      systemMap[sys.id] = {
        system: sys,
        containers: containers.map((cont) => {
          const components = Object.values(project.elements).filter(
            (e) => e.type === 'component' && e.parentId === cont.id
          );
          return { container: cont, components };
        }),
      };
    }

    return { people, systemMap };
  }, [project]);

  // Overall counts
  const stats = useMemo(() => {
    const all = Object.values(project.elements);
    return {
      people: all.filter((e) => e.type === 'person').length,
      systems: all.filter((e) => e.type === 'softwareSystem').length,
      containers: all.filter((e) => e.type === 'container').length,
      components: all.filter((e) => e.type === 'component').length,
      relationships: project.relationships.length,
    };
  }, [project]);

  const matchesFilter = (el: ArchitectureElement) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      el.name.toLowerCase().includes(q) ||
      el.technology?.toLowerCase().includes(q) ||
      el.description?.toLowerCase().includes(q)
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 w-72 shrink-0">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Architecture Tree
          </h3>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          C4 Model
        </span>
      </div>

      {/* Filter / Search inside tree */}
      <div className="p-2.5 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter components..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Quick Level Navigation */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/40">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
          C4 Quick Levels
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          <button
            onClick={() => onNavigateToView('system-context')}
            className={`px-2 py-1 rounded text-left transition-colors flex items-center justify-between ${
              currentViewId === 'system-context'
                ? 'bg-blue-950 text-blue-300 font-semibold border border-blue-800'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>L1 Context</span>
            <span className="text-[10px] font-mono">{stats.systems}</span>
          </button>
          <button
            onClick={() => {
              // Jump to first available container view
              const firstSys = Object.values(project.elements).find(
                (e) => e.type === 'softwareSystem' && !e.external && project.views[`containers-${e.id}`]
              );
              if (firstSys) onNavigateToView(`containers-${firstSys.id}`);
            }}
            className={`px-2 py-1 rounded text-left transition-colors flex items-center justify-between ${
              currentViewId.startsWith('containers-')
                ? 'bg-teal-950 text-teal-300 font-semibold border border-teal-800'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>L2 Containers</span>
            <span className="text-[10px] font-mono">{stats.containers}</span>
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {/* System Context item */}
        <div
          onClick={() => onNavigateToView('system-context')}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
            currentViewId === 'system-context'
              ? 'bg-slate-800 text-cyan-400 font-medium'
              : 'hover:bg-slate-800/50 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">System Context View</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">L1</span>
        </div>

        {/* People group */}
        {hierarchy.people.length > 0 && (
          <div className="pt-2">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <User className="w-3 h-3 text-slate-400" />
              <span>People ({hierarchy.people.length})</span>
            </div>
            <div className="pl-2 space-y-0.5">
              {hierarchy.people.filter(matchesFilter).map((person) => (
                <div
                  key={person.id}
                  onClick={() => onSelectElement(person.id)}
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                    selectedElementId === person.id
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{person.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Systems Tree */}
        <div className="pt-2">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Systems & Architecture</span>
          </div>

          <div className="space-y-1">
            {Object.values(hierarchy.systemMap).map(({ system, containers }) => {
              const isSysExpanded = expandedNodes[system.id] ?? true;
              const hasContainers = containers.length > 0;
              const isSelected = selectedElementId === system.id;
              const isCurrentView = currentViewId === `containers-${system.id}`;

              if (!matchesFilter(system) && !containers.some((c) => matchesFilter(c.container))) {
                return null;
              }

              return (
                <div key={system.id} className="space-y-0.5">
                  {/* System Row */}
                  <div
                    onClick={() => {
                      onSelectElement(system.id);
                      if (hasContainers) {
                        onDrillDown(system.id);
                      }
                    }}
                    className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : isCurrentView
                        ? 'bg-slate-800 text-slate-100 font-medium'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {hasContainers ? (
                        <button
                          onClick={(e) => toggleExpand(system.id, e)}
                          className="p-0.5 hover:text-white text-slate-400"
                        >
                          {isSysExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <div className="w-3.5" />
                      )}
                      <Server
                        className={`w-3.5 h-3.5 shrink-0 ${
                          system.external ? 'text-purple-400' : 'text-blue-400'
                        }`}
                      />
                      <span className="truncate">{system.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {system.external && (
                        <span className="text-[9px] font-mono text-purple-400">Ext</span>
                      )}
                      {hasContainers && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {containers.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Containers list */}
                  {hasContainers && isSysExpanded && (
                    <div className="pl-4 space-y-0.5 border-l border-slate-800/80 ml-3">
                      {containers.map(({ container, components }) => {
                        const isContExpanded = expandedNodes[container.id] ?? false;
                        const hasComponents = components.length > 0;
                        const isContSelected = selectedElementId === container.id;
                        const isContView = currentViewId === `components-${container.id}`;

                        return (
                          <div key={container.id} className="space-y-0.5">
                            {/* Container Row */}
                            <div
                              onClick={() => {
                                onSelectElement(container.id);
                                if (hasComponents) {
                                  onDrillDown(container.id);
                                }
                              }}
                              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                                isContSelected
                                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                                  : isContView
                                  ? 'bg-slate-800 text-teal-300 font-medium'
                                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {hasComponents ? (
                                  <button
                                    onClick={(e) => toggleExpand(container.id, e)}
                                    className="p-0.5 text-slate-500 hover:text-slate-300"
                                  >
                                    {isContExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-3" />
                                )}
                                {container.isDatabase ? (
                                  <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                )}
                                <span className="truncate">{container.name}</span>
                              </div>

                              {hasComponents && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  {components.length}
                                </span>
                              )}
                            </div>

                            {/* Components list */}
                            {hasComponents && isContExpanded && (
                              <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-3">
                                {components.map((comp) => (
                                  <div
                                    key={comp.id}
                                    onClick={() => onSelectElement(comp.id)}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors text-[11px] ${
                                      selectedElementId === comp.id
                                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <Cpu className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="truncate">{comp.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigator Footer Stats */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <span>{stats.systems} Systems</span>
          <span>·</span>
          <span>{stats.containers} Containers</span>
          <span>·</span>
          <span>{stats.components} Components</span>
        </div>
      </div>
    </div>
  );
}
