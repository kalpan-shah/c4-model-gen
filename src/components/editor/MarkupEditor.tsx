import React, { useState, useRef, useEffect } from 'react';
import {
  Code,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  FileCode,
  Download,
  Upload,
  Plus,
  Play,
  Split,
  Eye,
} from 'lucide-react';
import { ParseDiagnostic } from '../../types/c4';
import { ARCHITECTURE_TEMPLATES } from '../../sampleData/templates';

interface MarkupEditorProps {
  markup: string;
  diagnostics: ParseDiagnostic[];
  onMarkupChange: (newMarkup: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onResetToDefault: () => void;
  onSwitchToExplore: () => void;
}

export function MarkupEditor({
  markup,
  diagnostics,
  onMarkupChange,
  onLoadTemplate,
  onResetToDefault,
  onSwitchToExplore,
}: MarkupEditorProps) {
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Line count for gutter
  const lines = markup.split('\n');
  const errorLines = new Set(diagnostics.filter((d) => d.severity === 'error').map((d) => d.line));
  const warningLines = new Set(diagnostics.filter((d) => d.severity === 'warning').map((d) => d.line));

  // Insert code snippet at cursor
  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = markup.substring(0, start);
    const after = markup.substring(end);

    const updated = before + '\n' + snippet + '\n' + after;
    onMarkupChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length + 2, start + snippet.length + 2);
    }, 20);
  };

  // Export current markup as .c4 file
  const handleExportFile = () => {
    const blob = new Blob([markup], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-${new Date().toISOString().slice(0, 10)}.c4`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onMarkupChange(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const hasErrors = diagnostics.some((d) => d.severity === 'error');

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Architecture Markup
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
            C4 DSL
          </span>
        </div>

        {/* Template Selector & Snippets */}
        <div className="flex items-center gap-1.5">
          <select
            onChange={(e) => {
              if (e.target.value) onLoadTemplate(e.target.value);
            }}
            defaultValue=""
            className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="" disabled>Load Sample Template...</option>
            {ARCHITECTURE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            title="Syntax Help"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportFile}
            title="Export .c4 file"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import .c4 file"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".c4,.txt,.dsl,.md"
            className="hidden"
          />

          <button
            onClick={onResetToDefault}
            title="Reset to initial sample"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Snippet Quick Insert Bar */}
      <div className="px-3 py-1.5 border-b border-slate-800/80 bg-slate-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Insert:</span>
        <button
          onClick={() => insertSnippet('person User "Customer" {\n  description "Places orders"\n}')}
          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          + Person
        </button>
        <button
          onClick={() =>
            insertSnippet(
              'system NewSystem "System Name" {\n  description "Service description"\n  technology "Microservices"\n}'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-blue-300 transition-colors"
        >
          + System
        </button>
        <button
          onClick={() =>
            insertSnippet(
              '  container App "Service Name" {\n    technology "Node.js"\n    description "Container description"\n  }'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-teal-300 transition-colors"
        >
          + Container
        </button>
        <button
          onClick={() =>
            insertSnippet(
              '  database MainDb "Database Name" {\n    technology "PostgreSQL 16"\n    description "Stores relational records"\n  }'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 transition-colors"
        >
          + Database
        </button>
        <button
          onClick={() =>
            insertSnippet(
              '    component Controller "Main Controller" {\n      technology "REST API"\n      description "Handles requests"\n    }'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300 transition-colors"
        >
          + Component
        </button>
        <button
          onClick={() => insertSnippet('Source -> Target: "Interacts via [HTTPS]"')}
          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 transition-colors"
        >
          + Connection
        </button>
      </div>

      {/* Syntax Cheat Sheet Drawer */}
      {showCheatSheet && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between font-semibold text-cyan-400">
            <span>C4 Architecture Markup Syntax Guide</span>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-bold mb-1">// Element Syntax:</div>
              <div>person Id "Label" &#123; ... &#125;</div>
              <div>system Id "Label" external &#123; ... &#125;</div>
              <div>container Id "Label" &#123; ... &#125;</div>
              <div>database Id "Label" &#123; ... &#125;</div>
              <div>component Id "Label" &#123; ... &#125;</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-bold mb-1">// Properties & Connections:</div>
              <div>technology "React 19"</div>
              <div>description "Order processing"</div>
              <div>responsibility "Validates data"</div>
              <div>Source -&gt; Target: "Label [HTTPS]"</div>
            </div>
          </div>
        </div>
      )}

      {/* Code Textarea with Line Numbers */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-xs">
        {/* Line Numbers Gutter */}
        <div className="w-11 py-3 bg-slate-950/80 border-r border-slate-800/80 text-right select-none pr-2.5 text-slate-600 shrink-0 overflow-hidden">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isErr = errorLines.has(lineNum);
            const isWarn = warningLines.has(lineNum);
            return (
              <div
                key={i}
                className={`leading-5 ${
                  isErr
                    ? 'text-red-400 font-bold bg-red-950/40 -mr-2.5 pr-2.5'
                    : isWarn
                    ? 'text-amber-400'
                    : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={markup}
          onChange={(e) => onMarkupChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full h-full p-3 bg-transparent text-slate-200 resize-none focus:outline-none leading-5 overflow-auto selection:bg-cyan-500/30 font-mono text-[12px]"
          placeholder="Define your software architecture in C4 DSL..."
        />
      </div>

      {/* Diagnostics / Validation Status Footer */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <div className="flex items-center gap-1.5 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {diagnostics.filter((d) => d.severity === 'error').length} validation issues (Last valid diagram preserved)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Architecture markup valid</span>
            </div>
          )}
        </div>

        <button
          onClick={onSwitchToExplore}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Explore Architecture</span>
        </button>
      </div>

      {/* Diagnostic list if errors exist */}
      {diagnostics.length > 0 && (
        <div className="px-3 py-2 bg-red-950/30 border-t border-red-900/40 max-h-24 overflow-y-auto text-[11px] space-y-1">
          {diagnostics.map((diag, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 ${
                diag.severity === 'error'
                  ? 'text-red-300'
                  : diag.severity === 'warning'
                  ? 'text-amber-300'
                  : 'text-slate-400'
              }`}
            >
              <span className="font-mono font-semibold">Line {diag.line}:</span>
              <span>{diag.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
