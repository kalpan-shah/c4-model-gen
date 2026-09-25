import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArchitectureElement,
  ArchitectureProject,
  ArchitectureRelationship,
  ArchitectureView,
  ParseDiagnostic,
} from '../types/c4';
import { parseC4Architecture } from '../parser/c4Parser';
import { COMMERCE_PLATFORM_MARKUP, ARCHITECTURE_TEMPLATES } from '../sampleData/templates';
import { enrichProjectDetails } from '../sampleData/elementEnricher';

const STORAGE_KEY = 'c4_architecture_source_v1';

export function useArchitectureStore() {
  // Initialize with Commerce Platform or local storage
  const [markup, setMarkup] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || COMMERCE_PLATFORM_MARKUP;
    } catch {
      return COMMERCE_PLATFORM_MARKUP;
    }
  });

  const [project, setProject] = useState<ArchitectureProject>(() => {
    const parsed = parseC4Architecture(markup);
    const proj = parsed.project || parseC4Architecture(COMMERCE_PLATFORM_MARKUP).project!;
    return enrichProjectDetails(proj);
  });

  const [lastValidProject, setLastValidProject] = useState<ArchitectureProject>(project);
  const [diagnostics, setDiagnostics] = useState<ParseDiagnostic[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string>('system-context');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  // History stack for back/forward navigation
  const [history, setHistory] = useState<string[]>(['system-context']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // UI state
  const [mode, setMode] = useState<'explore' | 'edit'>('explore');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Handle markup updates with live parsing & preservation of last valid diagram
  const updateMarkup = useCallback((newMarkup: string) => {
    setMarkup(newMarkup);
    const result = parseC4Architecture(newMarkup);
    setDiagnostics(result.diagnostics);

    if (result.success && result.project) {
      // Re-apply enrichment if on initial sample or preserve custom
      const enriched = enrichProjectDetails(result.project);
      setProject(enriched);
      setLastValidProject(enriched);
      try {
        localStorage.setItem(STORAGE_KEY, newMarkup);
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
    }
  }, []);

  // Navigate to a view and push into history
  const navigateToView = useCallback((viewId: string) => {
    setCurrentViewId((prev) => {
      if (prev === viewId) return prev;
      setHistory((oldHist) => {
        const truncated = oldHist.slice(0, historyIndex + 1);
        return [...truncated, viewId];
      });
      setHistoryIndex((prevIndex) => prevIndex + 1);
      return viewId;
    });
  }, [historyIndex]);

  // Back navigation
  const navigateBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentViewId(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Forward navigation
  const navigateForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentViewId(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Drill down into a system or container
  const drillDown = useCallback((elementId: string) => {
    const el = project.elements[elementId];
    if (!el) return;

    setSelectedElementId(elementId);
    setSelectedRelationshipId(null);

    if (el.type === 'softwareSystem') {
      const containerViewId = `containers-${el.id}`;
      if (project.views[containerViewId]) {
        navigateToView(containerViewId);
        return;
      }
    }

    if (el.type === 'container') {
      const componentViewId = `components-${el.id}`;
      if (project.views[componentViewId]) {
        navigateToView(componentViewId);
        return;
      }
    }

    // If no deeper view exists, just open details panel
    setIsRightPanelOpen(true);
  }, [project, navigateToView]);

  // Select element
  const selectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
    if (elementId) {
      setSelectedRelationshipId(null);
      setIsRightPanelOpen(true);
    }
  }, []);

  // Select relationship
  const selectRelationship = useCallback((relationshipId: string | null) => {
    setSelectedRelationshipId(relationshipId);
    if (relationshipId) {
      setSelectedElementId(null);
      setIsRightPanelOpen(true);
    }
  }, []);

  // Load a preset template
  const loadTemplate = useCallback((templateId: string) => {
    const tpl = ARCHITECTURE_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      updateMarkup(tpl.markup);
      setCurrentViewId('system-context');
      setHistory(['system-context']);
      setHistoryIndex(0);
      setSelectedElementId(null);
      setSelectedRelationshipId(null);
    }
  }, [updateMarkup]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    updateMarkup(COMMERCE_PLATFORM_MARKUP);
    setCurrentViewId('system-context');
    setHistory(['system-context']);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setSelectedRelationshipId(null);
  }, [updateMarkup]);

  // Compute breadcrumbs for current view
  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ id: string; title: string; viewId?: string; level: string }> = [];

    // Always start with System Context
    crumbs.push({
      id: 'root-context',
      title: 'System Context',
      viewId: 'system-context',
      level: 'L1',
    });

    const activeView = project.views[currentViewId];
    if (!activeView) return crumbs;

    if (activeView.level === 'container' && activeView.scopeElementId) {
      const sys = project.elements[activeView.scopeElementId];
      if (sys) {
        crumbs.push({
          id: sys.id,
          title: sys.name,
          viewId: activeView.id,
          level: 'L2 Containers',
        });
      }
    } else if (activeView.level === 'component' && activeView.scopeElementId) {
      const container = project.elements[activeView.scopeElementId];
      if (container) {
        // Find parent system
        if (container.parentId && project.elements[container.parentId]) {
          const sys = project.elements[container.parentId];
          crumbs.push({
            id: sys.id,
            title: sys.name,
            viewId: `containers-${sys.id}`,
            level: 'L2 Containers',
          });
        }
        crumbs.push({
          id: container.id,
          title: container.name,
          viewId: activeView.id,
          level: 'L3 Components',
        });
      }
    }

    // If an element is currently inspected inside this view
    if (selectedElementId && project.elements[selectedElementId]) {
      const el = project.elements[selectedElementId];
      if (!crumbs.some((c) => c.id === el.id)) {
        crumbs.push({
          id: el.id,
          title: el.name,
          level: el.type,
        });
      }
    }

    return crumbs;
  }, [project, currentViewId, selectedElementId]);

  // Current active view
  const currentView = useMemo<ArchitectureView>(() => {
    return (
      project.views[currentViewId] ||
      project.views['system-context'] || {
        id: 'system-context',
        title: `${project.name} - System Context`,
        level: 'systemContext',
        elementIds: Object.values(project.elements)
          .filter((e) => e.type === 'person' || e.type === 'softwareSystem')
          .map((e) => e.id),
        relationshipIds: [],
      }
    );
  }, [project, currentViewId]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.values(project.elements).filter((el) => {
      return (
        el.name.toLowerCase().includes(q) ||
        el.description?.toLowerCase().includes(q) ||
        el.technology?.toLowerCase().includes(q) ||
        el.type.toLowerCase().includes(q) ||
        el.responsibilities?.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [project, searchQuery]);

  return {
    project,
    lastValidProject,
    currentView,
    currentViewId,
    markup,
    diagnostics,
    selectedElementId,
    selectedRelationshipId,
    selectedElement: selectedElementId ? project.elements[selectedElementId] : null,
    selectedRelationship: selectedRelationshipId
      ? project.relationships.find((r) => r.id === selectedRelationshipId)
      : null,
    breadcrumbs,
    mode,
    isLeftPanelOpen,
    isRightPanelOpen,
    layoutDirection,
    searchQuery,
    isSearchOpen,
    searchResults,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1,

    // Actions
    setMode,
    updateMarkup,
    navigateToView,
    navigateBack,
    navigateForward,
    drillDown,
    selectElement,
    selectRelationship,
    loadTemplate,
    resetToDefault,
    setIsLeftPanelOpen,
    setIsRightPanelOpen,
    setLayoutDirection,
    setSearchQuery,
    setIsSearchOpen,
  };
}
