import React from 'react';
import { Download, FileJson, FileCode, Image, X, FileText } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import { ArchitectureProject } from '../../types/c4';

interface ExportModalProps {
  isOpen: boolean;
  project: ArchitectureProject;
  markup: string;
  onClose: () => void;
}

export function ExportModal({ isOpen, project, markup, onClose }: ExportModalProps) {
  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkup = () => {
    downloadFile(
      markup,
      `${project.name.toLowerCase().replace(/\s+/g, '-')}.c4`,
      'text/plain;charset=utf-8'
    );
    onClose();
  };

  const handleExportJson = () => {
    downloadFile(
      JSON.stringify(project, null, 2),
      `${project.name.toLowerCase().replace(/\s+/g, '-')}-model.json`,
      'application/json;charset=utf-8'
    );
    onClose();
  };

  const handleExportPng = async () => {
    const container = document.getElementById('c4-canvas-container');
    if (!container) return;
    try {
      const dataUrl = await toPng(container, {
        backgroundColor: '#020617',
        quality: 0.95,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-diagram.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
    onClose();
  };

  const handleExportSvg = async () => {
    const container = document.getElementById('c4-canvas-container');
    if (!container) return;
    try {
      const dataUrl = await toSvg(container, {
        backgroundColor: '#020617',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-diagram.svg`;
      a.click();
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Export Architecture Artifacts</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 text-xs">
          {/* Export C4 DSL */}
          <button
            onClick={handleExportMarkup}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-cyan-300">
                  C4 Markup Source (.c4)
                </div>
                <div className="text-[11px] text-slate-400">
                  Human-readable architecture definition DSL
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              .c4
            </span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-amber-300">
                  Architecture Model JSON (.json)
                </div>
                <div className="text-[11px] text-slate-400">
                  Normalized graph with elements, links, and views
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              .json
            </span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPng}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-emerald-300">
                  Current Diagram Image (PNG)
                </div>
                <div className="text-[11px] text-slate-400">
                  High-resolution raster snapshot of the current canvas view
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              .png
            </span>
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-blue-300">
                  Vector Diagram (SVG)
                </div>
                <div className="text-[11px] text-slate-400">
                  Scalable vector format for architectural documentation
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              .svg
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
