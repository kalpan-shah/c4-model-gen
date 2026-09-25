export type C4ElementType = 'person' | 'softwareSystem' | 'container' | 'component' | 'code';

export type C4Level = 'systemContext' | 'container' | 'component' | 'code' | 'custom';

export interface ArchitectureLink {
  title: string;
  url: string;
  type?: 'github' | 'docs' | 'api' | 'runbook' | 'other';
}

export interface ArchitectureInterface {
  name: string;
  type: 'REST' | 'gRPC' | 'GraphQL' | 'Queue' | 'Event' | 'SQL' | 'WebSocket';
  pathOrTopic?: string;
  description?: string;
}

export interface ArchitectureElement {
  id: string;
  name: string;
  type: C4ElementType;
  description?: string;
  technology?: string;
  parentId?: string; // e.g. systemId for a container, containerId for a component
  external?: boolean;
  isDatabase?: boolean;
  documentation?: string; // Markdown formatted documentation
  responsibilities?: string[];
  interfaces?: ArchitectureInterface[];
  links?: ArchitectureLink[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ArchitectureRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  description?: string;
  technology?: string;
  protocol?: string;
  interactionType?: 'sync' | 'async' | 'bidirectional';
  metadata?: Record<string, unknown>;
}

export interface ArchitectureView {
  id: string;
  title: string;
  level: C4Level;
  scopeElementId?: string; // The system or container whose internals are shown
  elementIds: string[];
  relationshipIds: string[];
  description?: string;
}

export interface ArchitectureProject {
  id: string;
  name: string;
  description: string;
  elements: Record<string, ArchitectureElement>;
  relationships: ArchitectureRelationship[];
  views: Record<string, ArchitectureView>;
  sourceMarkup: string;
  updatedAt: string;
}

export interface ParseDiagnostic {
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ParseResult {
  success: boolean;
  project?: ArchitectureProject;
  diagnostics: ParseDiagnostic[];
}
