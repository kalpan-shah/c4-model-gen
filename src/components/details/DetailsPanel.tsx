import React, { useState } from 'react';
import {
  X,
  Layers,
  Server,
  User,
  Database,
  Cpu,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  Terminal,
  Code2,
  Sparkles,
} from 'lucide-react';
import { ArchitectureElement, ArchitectureRelationship, ArchitectureProject } from '../../types/c4';

interface DetailsPanelProps {
  element: ArchitectureElement | null;
  relationship: ArchitectureRelationship | null;
  project: ArchitectureProject;
  onClose: () => void;
  onDrillDown: (elementId: string) => void;
  onSelectElement: (elementId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
}

export function DetailsPanel({
  element,
  relationship,
  project,
  onClose,
  onDrillDown,
  onSelectElement,
  onSelectRelationship,
}: DetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'contracts'>('overview');

  if (!element && !relationship) {
    return (
      <div className="h-full w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Layers className="w-10 h-10 mb-3 opacity-30 text-cyan-400" />
        <h4 className="text-sm font-medium text-slate-300">No Element Selected</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
          Click any system, container, component, or connection in the canvas to inspect its details.
        </p>
      </div>
    );
  }

  // --- RELATIONSHIP DETAILS ---
  if (relationship) {
    const source = project.elements[relationship.sourceId];
    const target = project.elements[relationship.targetId];

    return (
      <div className="h-full w-84 bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Relationship Details
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5 flex-1 overflow-y-auto text-xs">
          {/* Connection flow box */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] uppercase font-mono text-slate-500">Directional Flow</div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => source && onSelectElement(source.id)}
                className="text-left font-semibold text-cyan-400 hover:underline truncate max-w-[100px]"
              >
                {source?.name || relationship.sourceId}
              </button>
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              <button
                onClick={() => target && onSelectElement(target.id)}
                className="text-left font-semibold text-cyan-400 hover:underline truncate max-w-[100px]"
              >
                {target?.name || relationship.targetId}
              </button>
            </div>
          </div>

          {/* Description */}
          {relationship.description && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Interaction Description
              </div>
              <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                {relationship.description}
              </p>
            </div>
          )}

          {/* Protocol & Technology */}
          {relationship.technology && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Protocol / Technology
              </div>
              <span className="font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-1 rounded inline-block">
                {relationship.technology}
              </span>
            </div>
          )}

          {/* Mode */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Communication Model
            </div>
            <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              {relationship.interactionType === 'async' ? 'Asynchronous Event' : 'Synchronous Request/Reply'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- ELEMENT DETAILS ---
  if (!element) return null;

  // Check if children exist for drill-down
  const children = Object.values(project.elements).filter((e) => e.parentId === element.id);
  const hasChildren = children.length > 0;
  const childLevelLabel =
    element.type === 'softwareSystem' ? 'Containers' : element.type === 'container' ? 'Components' : null;

  // Connected inbound and outbound relationships
  const inbounds = project.relationships.filter(
    (r) => r.targetId === element.id || r.targetId.startsWith(`${element.id}_`)
  );
  const outbounds = project.relationships.filter(
    (r) => r.sourceId === element.id || r.sourceId.startsWith(`${element.id}_`)
  );

  return (
    <div className="h-full w-88 bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1">
            <span>{element.type}</span>
            {element.isDatabase && <span>· Database</span>}
            {element.external && <span>· External</span>}
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{element.name}</h3>
          {element.technology && (
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">[{element.technology}]</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drill-down prominent action */}
      {hasChildren && (
        <div className="p-3 bg-cyan-950/40 border-b border-cyan-800/40 flex items-center justify-between">
          <div className="text-xs text-cyan-200">
            Contains <span className="font-semibold text-white">{children.length}</span> {childLevelLabel}
          </div>
          <button
            onClick={() => onDrillDown(element.id)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm"
          >
            <span>Explore deeper</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Segmented View Tabs */}
      <div className="flex border-b border-slate-800 px-4 text-xs font-medium bg-slate-950/40">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'contracts'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Interfaces & APIs
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'docs'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Documentation
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {activeTab === 'overview' && (
          <>
            {/* Description */}
            {element.description && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                  Description
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {element.description}
                </p>
              </div>
            )}

            {/* Core Responsibilities */}
            {element.responsibilities && element.responsibilities.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  Key Responsibilities
                </h4>
                <div className="space-y-1.5">
                  {element.responsibilities.map((resp, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technology Details */}
            {element.technology && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                  Technology Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {element.technology.split(',').map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 font-mono text-[11px] text-slate-300"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inbound Dependencies */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Inbound Callers ({inbounds.length})
              </h4>
              {inbounds.length === 0 ? (
                <div className="text-slate-500 italic text-[11px]">No inbound dependencies defined.</div>
              ) : (
                <div className="space-y-1.5">
                  {inbounds.map((rel) => {
                    const caller = project.elements[rel.sourceId];
                    return (
                      <div
                        key={rel.id}
                        onClick={() => caller && onSelectElement(caller.id)}
                        className="p-2 rounded bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-200">
                          <span className="truncate">{caller?.name || rel.sourceId}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </div>
                        {rel.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{rel.description}</p>
                        )}
                        {rel.technology && (
                          <span className="text-[9px] font-mono text-cyan-400">[{rel.technology}]</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outbound Dependencies */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Outbound Calls ({outbounds.length})
              </h4>
              {outbounds.length === 0 ? (
                <div className="text-slate-500 italic text-[11px]">No outbound dependencies defined.</div>
              ) : (
                <div className="space-y-1.5">
                  {outbounds.map((rel) => {
                    const target = project.elements[rel.targetId];
                    return (
                      <div
                        key={rel.id}
                        onClick={() => target && onSelectElement(target.id)}
                        className="p-2 rounded bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-200">
                          <span className="truncate">{target?.name || rel.targetId}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </div>
                        {rel.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{rel.description}</p>
                        )}
                        {rel.technology && (
                          <span className="text-[9px] font-mono text-cyan-400">[{rel.technology}]</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* External Links */}
            {element.links && element.links.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  External Artifacts
                </h4>
                <div className="space-y-1.5">
                  {element.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-cyan-400 hover:border-cyan-500 transition-colors"
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Interfaces & Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-xs leading-relaxed">
              Exposed network contracts, API endpoints, or message topics for{' '}
              <span className="text-white font-medium">{element.name}</span>.
            </div>

            {element.interfaces && element.interfaces.length > 0 ? (
              <div className="space-y-2">
                {element.interfaces.map((iface, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{iface.name}</span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-cyan-400">
                        {iface.type}
                      </span>
                    </div>
                    {iface.pathOrTopic && (
                      <div className="font-mono text-[11px] text-amber-400 bg-slate-900 px-2 py-1 rounded">
                        {iface.pathOrTopic}
                      </div>
                    )}
                    {iface.description && (
                      <p className="text-[11px] text-slate-400">{iface.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-slate-500">
                No explicit API contracts declared in markup.
              </div>
            )}
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-3">
            {element.documentation ? (
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800 leading-relaxed space-y-3">
                {element.documentation.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4 key={idx} className="text-sm font-bold text-white pt-1">
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h3 key={idx} className="text-base font-bold text-cyan-300 pt-2 border-b border-slate-800 pb-1">
                        {paragraph.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('```')) {
                    const code = paragraph.replace(/```[a-z]*\n?/g, '');
                    return (
                      <pre key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                    );
                  }
                  return <p key={idx}>{paragraph}</p>;
                })}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p>No attached Markdown documentation.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Add <code className="text-slate-400">docs "..."</code> in the editor to attach living documentation.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
