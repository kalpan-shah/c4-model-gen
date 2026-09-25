import React, { useState } from 'react';
import { useArchitectureStore } from './store/useArchitectureStore';
import { Header } from './components/common/Header';
import { ArchitectureNavigator } from './components/navigator/ArchitectureNavigator';
import { C4Canvas } from './components/canvas/C4Canvas';
import { DetailsPanel } from './components/details/DetailsPanel';
import { MarkupEditor } from './components/editor/MarkupEditor';
import { SearchModal } from './components/search/SearchModal';
import { ExportModal } from './components/export/ExportModal';

export default function App() {
  const store = useArchitectureStore();
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Quick navigation to a C4 level from header
  const handleNavigateToLevel = (level: 'systemContext' | 'container' | 'component') => {
    if (level === 'systemContext') {
      store.navigateToView('system-context');
      return;
    }

    if (level === 'container') {
      // Find primary software system container view
      const firstSys = Object.values(store.project.elements).find(
        (e) => e.type === 'softwareSystem' && !e.external && store.project.views[`containers-${e.id}`]
      );
      if (firstSys) {
        store.navigateToView(`containers-${firstSys.id}`);
      } else {
        store.navigateToView('system-context');
      }
      return;
    }

    if (level === 'component') {
      // Find first container with components
      const firstCont = Object.values(store.project.elements).find(
        (e) => e.type === 'container' && store.project.views[`components-${e.id}`]
      );
      if (firstCont) {
        store.navigateToView(`components-${firstCont.id}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <Header
        mode={store.mode}
        currentLevel={store.currentView.level}
        isLeftPanelOpen={store.isLeftPanelOpen}
        isRightPanelOpen={store.isRightPanelOpen}
        onToggleLeftPanel={() => store.setIsLeftPanelOpen(!store.isLeftPanelOpen)}
        onToggleRightPanel={() => store.setIsRightPanelOpen(!store.isRightPanelOpen)}
        onSetMode={store.setMode}
        onOpenSearch={() => store.setIsSearchOpen(true)}
        onNavigateToLevel={handleNavigateToLevel}
        onExport={() => setIsExportOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {store.mode === 'explore' ? (
          /* EXPLORE MODE: 3-Region Layout */
          <>
            {/* Left Region: Architecture Navigator */}
            {store.isLeftPanelOpen && (
              <ArchitectureNavigator
                project={store.project}
                currentViewId={store.currentViewId}
                selectedElementId={store.selectedElementId}
                onNavigateToView={store.navigateToView}
                onSelectElement={store.selectElement}
                onDrillDown={store.drillDown}
              />
            )}

            {/* Center Region: Interactive Architecture Canvas */}
            <main className="flex-1 h-full relative overflow-hidden">
              <C4Canvas
                project={store.project}
                currentView={store.currentView}
                selectedElementId={store.selectedElementId}
                selectedRelationshipId={store.selectedRelationshipId}
                breadcrumbs={store.breadcrumbs}
                layoutDirection={store.layoutDirection}
                canGoBack={store.canGoBack}
                canGoForward={store.canGoForward}
                onNavigateBack={store.navigateBack}
                onNavigateForward={store.navigateForward}
                onNavigateToView={store.navigateToView}
                onDrillDown={store.drillDown}
                onSelectElement={store.selectElement}
                onSelectRelationship={store.selectRelationship}
                onToggleLayoutDirection={() =>
                  store.setLayoutDirection(store.layoutDirection === 'TB' ? 'LR' : 'TB')
                }
                onExportImage={() => setIsExportOpen(true)}
              />
            </main>

            {/* Right Region: Contextual Details Panel */}
            {store.isRightPanelOpen && (
              <DetailsPanel
                element={store.selectedElement || null}
                relationship={store.selectedRelationship || null}
                project={store.project}
                onClose={() => store.setIsRightPanelOpen(false)}
                onDrillDown={store.drillDown}
                onSelectElement={store.selectElement}
                onSelectRelationship={store.selectRelationship}
              />
            )}
          </>
        ) : (
          /* EDIT MODE: Split Markup Editor + Live Preview */
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* Left Split: Architecture Markup Editor */}
            <div className="w-1/2 h-full flex flex-col border-r border-slate-800">
              <MarkupEditor
                markup={store.markup}
                diagnostics={store.diagnostics}
                onMarkupChange={store.updateMarkup}
                onLoadTemplate={store.loadTemplate}
                onResetToDefault={store.resetToDefault}
                onSwitchToExplore={() => store.setMode('explore')}
              />
            </div>

            {/* Right Split: Live Diagram Preview */}
            <div className="w-1/2 h-full flex flex-col relative bg-slate-950">
              <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 z-10">
                <span className="font-semibold text-slate-200">Live Preview</span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {store.project.name} · {store.currentView.title}
                </span>
              </div>
              <div className="flex-1 relative">
                <C4Canvas
                  project={store.project}
                  currentView={store.currentView}
                  selectedElementId={store.selectedElementId}
                  selectedRelationshipId={store.selectedRelationshipId}
                  breadcrumbs={store.breadcrumbs}
                  layoutDirection={store.layoutDirection}
                  canGoBack={store.canGoBack}
                  canGoForward={store.canGoForward}
                  onNavigateBack={store.navigateBack}
                  onNavigateForward={store.navigateForward}
                  onNavigateToView={store.navigateToView}
                  onDrillDown={store.drillDown}
                  onSelectElement={store.selectElement}
                  onSelectRelationship={store.selectRelationship}
                  onToggleLayoutDirection={() =>
                    store.setLayoutDirection(store.layoutDirection === 'TB' ? 'LR' : 'TB')
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Search Palette (⌘K) */}
      <SearchModal
        isOpen={store.isSearchOpen}
        project={store.project}
        searchQuery={store.searchQuery}
        searchResults={store.searchResults}
        onSearchChange={store.setSearchQuery}
        onClose={() => store.setIsSearchOpen(false)}
        onSelectResult={(id) => {
          store.drillDown(id);
          store.selectElement(id);
        }}
      />

      {/* Export Dialog */}
      <ExportModal
        isOpen={isExportOpen}
        project={store.project}
        markup={store.markup}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
