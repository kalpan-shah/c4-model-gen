import React, { useEffect, useRef } from 'react';
import { Search, X, Layers, Server, User, Database, Cpu, ArrowRight } from 'lucide-react';
import { ArchitectureElement, ArchitectureProject } from '../../types/c4';

interface SearchModalProps {
  isOpen: boolean;
  project: ArchitectureProject;
  searchQuery: string;
  searchResults: ArchitectureElement[];
  onSearchChange: (q: string) => void;
  onClose: () => void;
  onSelectResult: (elementId: string) => void;
}

export function SearchModal({
  isOpen,
  project,
  searchQuery,
  searchResults,
  onSearchChange,
  onClose,
  onSelectResult,
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onSearchChange('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSearchChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search systems, containers, components, technologies (e.g., PostgreSQL, Order, React)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          {searchQuery.trim() === '' ? (
            <div className="p-6 text-center text-slate-500">
              Type keywords to search across architecture elements, technologies, and documentation.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No architecture elements matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            searchResults.map((el) => {
              const Icon =
                el.type === 'person'
                  ? User
                  : el.type === 'softwareSystem'
                  ? Server
                  : el.isDatabase
                  ? Database
                  : el.type === 'container'
                  ? Layers
                  : Cpu;

              return (
                <div
                  key={el.id}
                  onClick={() => {
                    onSelectResult(el.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                          {el.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {el.type}
                        </span>
                      </div>
                      {el.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {el.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {el.technology && (
                      <span className="font-mono text-[10px] text-slate-400">
                        [{el.technology}]
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>{searchResults.length} matching elements</span>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
