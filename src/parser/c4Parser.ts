import {
  ArchitectureElement,
  ArchitectureProject,
  ArchitectureRelationship,
  ArchitectureView,
  ParseDiagnostic,
  ParseResult,
  C4ElementType,
} from '../types/c4';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parser for C4 Architecture DSL and Markdown formats.
 */
export function parseC4Architecture(source: string): ParseResult {
  const diagnostics: ParseDiagnostic[] = [];
  const elements: Record<string, ArchitectureElement> = {};
  const relationships: ArchitectureRelationship[] = [];
  let projectName = 'Architecture Project';
  let projectDesc = 'Software Architecture Model';

  if (!source || !source.trim()) {
    return {
      success: true,
      project: {
        id: 'c4-project',
        name: projectName,
        description: projectDesc,
        elements: {},
        relationships: [],
        views: {},
        sourceMarkup: source,
        updatedAt: new Date().toISOString(),
      },
      diagnostics: [],
    };
  }

  // Check if it's primarily Markdown formatted
  const isMarkdown = /^\s*#\s+[^\n]+/m.test(source) && /##\s+(People|Systems|Containers|Components|Relationships)/i.test(source);

  if (isMarkdown) {
    parseMarkdownFormat(source, elements, relationships, diagnostics, (name, desc) => {
      projectName = name;
      if (desc) projectDesc = desc;
    });
  } else {
    parseBlockDslFormat(source, elements, relationships, diagnostics, (name, desc) => {
      if (name) projectName = name;
      if (desc) projectDesc = desc;
    });
  }

  // Generate standard C4 views from the extracted elements and relationships
  const views = generateC4Views(elements, relationships, projectName);

  const hasFatalErrors = diagnostics.some((d) => d.severity === 'error');

  const project: ArchitectureProject = {
    id: 'c4-project',
    name: projectName,
    description: projectDesc,
    elements,
    relationships,
    views,
    sourceMarkup: source,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: !hasFatalErrors,
    project,
    diagnostics,
  };
}

/**
 * Parses Block DSL:
 *
 * person Customer "Online Shopper" {
 *   description "Places orders"
 * }
 *
 * system Commerce "Digital Commerce" {
 *   container Web "Web Application" {
 *     technology "React"
 *     description "Customer portal"
 *   }
 * }
 *
 * Customer -> Commerce.Web: "Places order [HTTPS]"
 */
function parseBlockDslFormat(
  source: string,
  elements: Record<string, ArchitectureElement>,
  relationships: ArchitectureRelationship[],
  diagnostics: ParseDiagnostic[],
  setProjectInfo: (name?: string, desc?: string) => void
) {
  const lines = source.split('\n');

  // Hierarchy stack: [currentElement]
  const scopeStack: ArchitectureElement[] = [];
  const idMap = new Map<string, string>(); // short/raw name -> canonical id

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trim();
    const lineNum = lineIndex + 1;

    if (!line || line.startsWith('//') || line.startsWith('#')) {
      // Check for project title comment e.g. # title: My App
      const titleMatch = line.match(/^#\s*(?:title:)?\s*(.+)/i);
      if (titleMatch && lineNum <= 3 && !line.includes('->')) {
        setProjectInfo(titleMatch[1].trim());
      }
      continue;
    }

    // Closing block
    if (line === '}') {
      if (scopeStack.length > 0) {
        scopeStack.pop();
      } else {
        diagnostics.push({
          line: lineNum,
          message: 'Unexpected closing brace "}" with no matching open block',
          severity: 'warning',
        });
      }
      continue;
    }

    // Relationship check: Source -> Target : Label [Protocol]
    // or Source.Child -> Target.Child : Label
    const relMatch = line.match(/^([\w.\-]+)\s*->\s*([\w.\-]+)(?:\s*:\s*([^;]+))?/);
    if (relMatch) {
      const rawSource = relMatch[1].trim();
      const rawTarget = relMatch[2].trim();
      let labelPart = (relMatch[3] || '').trim();

      // Remove optional surrounding quotes
      if (labelPart.startsWith('"') && labelPart.endsWith('"')) {
        labelPart = labelPart.slice(1, -1);
      }

      // Check for [protocol/tech] in label
      let technology: string | undefined;
      let description = labelPart;
      const techMatch = labelPart.match(/\[(.*?)\]/);
      if (techMatch) {
        technology = techMatch[1].trim();
        description = labelPart.replace(/\[.*?\]/, '').trim();
      }

      const sourceId = resolveElementId(rawSource, elements, idMap);
      const targetId = resolveElementId(rawTarget, elements, idMap);

      if (!sourceId) {
        diagnostics.push({
          line: lineNum,
          message: `Unknown source element "${rawSource}" in relationship`,
          severity: 'warning',
        });
      }
      if (!targetId) {
        diagnostics.push({
          line: lineNum,
          message: `Unknown target element "${rawTarget}" in relationship`,
          severity: 'warning',
        });
      }

      if (sourceId && targetId) {
        relationships.push({
          id: `rel-${sourceId}-${targetId}-${relationships.length}`,
          sourceId,
          targetId,
          description: description || undefined,
          technology,
        });
      }
      continue;
    }

    // Element declaration:
    // (person|system|container|component|database) [Id] "[DisplayName]" [external] [{]
    const elemMatch = line.match(
      /^(person|system|container|component|database)\s+([\w.\-]+)(?:\s+"([^"]+)")?(?:\s+(external))?\s*(\{)?/i
    );

    if (elemMatch) {
      const rawType = elemMatch[1].toLowerCase();
      const rawId = elemMatch[2].trim();
      const displayName = elemMatch[3] ? elemMatch[3].trim() : rawId;
      const isExternal = !!elemMatch[4] || line.includes(' external');
      const hasOpenBrace = !!elemMatch[5] || line.endsWith('{');

      let type: C4ElementType = 'softwareSystem';
      let isDb = false;

      if (rawType === 'person') type = 'person';
      else if (rawType === 'system') type = 'softwareSystem';
      else if (rawType === 'container') type = 'container';
      else if (rawType === 'component') type = 'component';
      else if (rawType === 'database') {
        type = 'container';
        isDb = true;
      }

      const parent = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : undefined;
      const canonicalId = parent ? `${parent.id}_${slugify(rawId)}` : slugify(rawId);

      const elem: ArchitectureElement = {
        id: canonicalId,
        name: displayName,
        type,
        external: isExternal,
        isDatabase: isDb,
        parentId: parent ? parent.id : undefined,
        responsibilities: [],
        tags: [],
      };

      elements[canonicalId] = elem;
      idMap.set(rawId, canonicalId);
      idMap.set(displayName.toLowerCase(), canonicalId);
      idMap.set(slugify(displayName), canonicalId);
      if (parent) {
        idMap.set(`${parent.name}.${rawId}`, canonicalId);
        idMap.set(`${parent.id}.${rawId}`, canonicalId);
      }

      if (hasOpenBrace) {
        scopeStack.push(elem);
      }
      continue;
    }

    // Inside block attributes:
    // description "...", technology "...", responsibility "...", type "database", docs "..."
    if (scopeStack.length > 0) {
      const current = scopeStack[scopeStack.length - 1];
      const attrMatch = line.match(/^(\w+)\s+(?:"([^"]+)"|'([^']+)'|([^\n;]+))/);
      if (attrMatch) {
        const key = attrMatch[1].toLowerCase();
        const val = (attrMatch[2] || attrMatch[3] || attrMatch[4] || '').trim();

        if (key === 'description' || key === 'desc') {
          current.description = val;
        } else if (key === 'technology' || key === 'tech') {
          current.technology = val;
        } else if (key === 'responsibility' || key === 'resp') {
          current.responsibilities = current.responsibilities || [];
          current.responsibilities.push(val);
        } else if (key === 'type' && (val.toLowerCase() === 'database' || val.toLowerCase() === 'db')) {
          current.isDatabase = true;
        } else if (key === 'external') {
          current.external = val.toLowerCase() === 'true';
        } else if (key === 'doc' || key === 'docs' || key === 'documentation') {
          current.documentation = (current.documentation ? current.documentation + '\n\n' : '') + val;
        } else if (key === 'tag' || key === 'tags') {
          current.tags = current.tags || [];
          current.tags.push(...val.split(',').map((t) => t.trim()));
        }
        continue;
      }
    }

    // If none matched and line is not empty
    if (line !== '{' && line !== '}') {
      diagnostics.push({
        line: lineNum,
        message: `Unrecognized statement: "${line.slice(0, 40)}"`,
        severity: 'info',
      });
    }
  }
}

/**
 * Parses Markdown-first format as defined in prompt section 7.
 */
function parseMarkdownFormat(
  source: string,
  elements: Record<string, ArchitectureElement>,
  relationships: ArchitectureRelationship[],
  diagnostics: ParseDiagnostic[],
  setProjectInfo: (name: string, desc?: string) => void
) {
  const lines = source.split('\n');
  let currentSection = '';
  let currentElement: ArchitectureElement | null = null;
  const idMap = new Map<string, string>();

  // Extract top-level project title
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i].trim();
    if (l.startsWith('# ')) {
      const title = l.replace(/^#\s+/, '').trim();
      const nextLine = lines[i + 1]?.trim();
      setProjectInfo(title, nextLine && !nextLine.startsWith('#') ? nextLine : undefined);
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNum = i + 1;

    if (!line) continue;

    // Detect section headers: ## People, ## Systems, ## Relationships, ## Commerce Platform / Containers, etc.
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      currentSection = h2Match[1].trim();
      currentElement = null;
      continue;
    }

    // Relationships section
    if (currentSection.toLowerCase().includes('relationship')) {
      const relMatch = line.match(/^([\w\s.\-]+)\s*->\s*([\w\s.\-]+)(?:\s*:\s*([^;]+))?/);
      if (relMatch) {
        const rawSource = relMatch[1].trim();
        const rawTarget = relMatch[2].trim();
        let labelPart = (relMatch[3] || '').trim();

        let technology: string | undefined;
        let description = labelPart;
        const techMatch = labelPart.match(/\[(.*?)\]/);
        if (techMatch) {
          technology = techMatch[1].trim();
          description = labelPart.replace(/\[.*?\]/, '').trim();
        }

        const sourceId = resolveElementId(rawSource, elements, idMap);
        const targetId = resolveElementId(rawTarget, elements, idMap);

        if (sourceId && targetId) {
          relationships.push({
            id: `rel-${sourceId}-${targetId}-${relationships.length}`,
            sourceId,
            targetId,
            description: description || undefined,
            technology,
          });
        }
      }
      continue;
    }

    // Element headers: ### Customer, ### Order Service
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      const name = h3Match[1].trim();
      const secLower = currentSection.toLowerCase();

      let type: C4ElementType = 'softwareSystem';
      let parentId: string | undefined;
      let isDb = false;

      if (secLower.includes('people') || secLower.includes('person')) {
        type = 'person';
      } else if (secLower.includes('systems') || secLower.includes('system')) {
        type = 'softwareSystem';
      } else if (secLower.includes('container')) {
        type = 'container';
        // Check if currentSection is "ParentName / Containers"
        const parentMatch = currentSection.match(/^(.+?)\s*\/\s*Containers/i);
        if (parentMatch) {
          parentId = resolveElementId(parentMatch[1].trim(), elements, idMap);
        }
      } else if (secLower.includes('component')) {
        type = 'component';
        const parentMatch = currentSection.match(/^(.+?)\s*\/\s*Components/i);
        if (parentMatch) {
          parentId = resolveElementId(parentMatch[1].trim(), elements, idMap);
        }
      }

      const id = parentId ? `${parentId}_${slugify(name)}` : slugify(name);
      if (name.toLowerCase().includes('db') || name.toLowerCase().includes('database')) {
        isDb = true;
      }

      currentElement = {
        id,
        name,
        type,
        parentId,
        isDatabase: isDb,
        responsibilities: [],
        external: secLower.includes('external') || name.toLowerCase().includes('external'),
      };

      elements[id] = currentElement;
      idMap.set(name, id);
      idMap.set(name.toLowerCase(), id);
      idMap.set(slugify(name), id);
      continue;
    }

    // Element metadata list items:
    // - Technology: React
    // - Responsibility: Customer-facing app
    if (currentElement) {
      const bulletMatch = line.match(/^[-*]\s*(\w+):\s*(.+)$/i);
      if (bulletMatch) {
        const key = bulletMatch[1].toLowerCase();
        const val = bulletMatch[2].trim();
        if (key === 'technology' || key === 'tech') {
          currentElement.technology = val;
        } else if (key === 'responsibility' || key === 'resp') {
          currentElement.responsibilities = currentElement.responsibilities || [];
          currentElement.responsibilities.push(val);
        } else if (key === 'type' && (val.toLowerCase() === 'database' || val.toLowerCase() === 'db')) {
          currentElement.isDatabase = true;
        }
        continue;
      }

      // Or plain paragraph as description
      if (!currentElement.description) {
        currentElement.description = line;
      } else {
        currentElement.documentation = (currentElement.documentation ? currentElement.documentation + '\n' : '') + line;
      }
    }
  }
}

/**
 * Resolves a raw name or path to a canonical element ID.
 */
function resolveElementId(
  raw: string,
  elements: Record<string, ArchitectureElement>,
  idMap: Map<string, string>
): string | undefined {
  const trimmed = raw.trim();

  // Direct ID check
  if (elements[trimmed]) return trimmed;

  // Direct map check
  if (idMap.has(trimmed)) return idMap.get(trimmed);
  if (idMap.has(trimmed.toLowerCase())) return idMap.get(trimmed.toLowerCase());
  if (idMap.has(slugify(trimmed))) return idMap.get(slugify(trimmed));

  // Dotted notation: Parent.Child
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    const parent = resolveElementId(parts[0], elements, idMap);
    if (parent) {
      const childSlug = slugify(parts[1]);
      const potentialChildId = `${parent}_${childSlug}`;
      if (elements[potentialChildId]) return potentialChildId;
      // Search in elements with parentId = parent
      for (const el of Object.values(elements)) {
        if (el.parentId === parent && (slugify(el.name) === childSlug || el.id.endsWith(childSlug))) {
          return el.id;
        }
      }
    }
  }

  // Find by name substring or case-insensitive match
  for (const el of Object.values(elements)) {
    if (el.name.toLowerCase() === trimmed.toLowerCase()) return el.id;
    if (slugify(el.name) === slugify(trimmed)) return el.id;
  }

  return undefined;
}

/**
 * Automatically creates standard C4 views from elements and relationships:
 * 1. System Context: all people + software systems
 * 2. Container Views: for each software system, its containers + connecting boundary nodes
 * 3. Component Views: for each container that has components, its components + connecting siblings
 */
export function generateC4Views(
  elements: Record<string, ArchitectureElement>,
  relationships: ArchitectureRelationship[],
  projectName: string
): Record<string, ArchitectureView> {
  const views: Record<string, ArchitectureView> = {};

  // 1. System Context View
  const contextElements = Object.values(elements).filter(
    (e) => e.type === 'person' || e.type === 'softwareSystem'
  );
  const contextElementIds = contextElements.map((e) => e.id);
  const contextElementSet = new Set(contextElementIds);

  const contextRelIds = relationships
    .filter((r) => {
      // Direct relationship between context elements
      if (contextElementSet.has(r.sourceId) && contextElementSet.has(r.targetId)) {
        return true;
      }
      // Or relationship involving a descendant container/component, which gets rolled up
      const sourceRoot = getRootSystemId(r.sourceId, elements);
      const targetRoot = getRootSystemId(r.targetId, elements);
      return sourceRoot && targetRoot && sourceRoot !== targetRoot && contextElementSet.has(sourceRoot) && contextElementSet.has(targetRoot);
    })
    .map((r) => r.id);

  views['system-context'] = {
    id: 'system-context',
    title: `${projectName} - System Context`,
    level: 'systemContext',
    elementIds: contextElementIds,
    relationshipIds: contextRelIds,
    description: 'High-level architecture view showing users, systems, and external integrations.',
  };

  // 2. Container Views for each software system
  const softwareSystems = Object.values(elements).filter((e) => e.type === 'softwareSystem');

  for (const sys of softwareSystems) {
    const containers = Object.values(elements).filter((e) => e.type === 'container' && e.parentId === sys.id);

    if (containers.length > 0) {
      const containerIds = containers.map((c) => c.id);
      const containerSet = new Set(containerIds);

      // Find boundary elements: people or other systems directly connected to these containers
      const boundaryElementIds = new Set<string>();
      const containerRelIds: string[] = [];

      for (const rel of relationships) {
        const sourceIsContainer = containerSet.has(rel.sourceId);
        const targetIsContainer = containerSet.has(rel.targetId);

        if (sourceIsContainer && targetIsContainer) {
          containerRelIds.push(rel.id);
        } else if (sourceIsContainer) {
          // target is outside
          const rootTarget = getRootSystemOrPersonId(rel.targetId, elements);
          if (rootTarget && rootTarget !== sys.id) {
            boundaryElementIds.add(rootTarget);
            containerRelIds.push(rel.id);
          }
        } else if (targetIsContainer) {
          // source is outside
          const rootSource = getRootSystemOrPersonId(rel.sourceId, elements);
          if (rootSource && rootSource !== sys.id) {
            boundaryElementIds.add(rootSource);
            containerRelIds.push(rel.id);
          }
        }
      }

      const allViewElementIds = [...containerIds, ...Array.from(boundaryElementIds)];

      views[`containers-${sys.id}`] = {
        id: `containers-${sys.id}`,
        title: `${sys.name} - Container Architecture`,
        level: 'container',
        scopeElementId: sys.id,
        elementIds: allViewElementIds,
        relationshipIds: containerRelIds,
        description: `Containers, applications, and databases inside ${sys.name}.`,
      };
    }
  }

  // 3. Component Views for each container
  const allContainers = Object.values(elements).filter((e) => e.type === 'container');

  for (const container of allContainers) {
    const components = Object.values(elements).filter((e) => e.type === 'component' && e.parentId === container.id);

    if (components.length > 0) {
      const componentIds = components.map((c) => c.id);
      const componentSet = new Set(componentIds);

      // Find external/sibling container dependencies
      const boundaryIds = new Set<string>();
      const componentRelIds: string[] = [];

      for (const rel of relationships) {
        const sourceIsComp = componentSet.has(rel.sourceId);
        const targetIsComp = componentSet.has(rel.targetId);

        if (sourceIsComp && targetIsComp) {
          componentRelIds.push(rel.id);
        } else if (sourceIsComp) {
          const targetCont = getParentContainerId(rel.targetId, elements);
          if (targetCont && targetCont !== container.id) {
            boundaryIds.add(targetCont);
            componentRelIds.push(rel.id);
          } else if (elements[rel.targetId]) {
            boundaryIds.add(rel.targetId);
            componentRelIds.push(rel.id);
          }
        } else if (targetIsComp) {
          const sourceCont = getParentContainerId(rel.sourceId, elements);
          if (sourceCont && sourceCont !== container.id) {
            boundaryIds.add(sourceCont);
            componentRelIds.push(rel.id);
          } else if (elements[rel.sourceId]) {
            boundaryIds.add(rel.sourceId);
            componentRelIds.push(rel.id);
          }
        }
      }

      views[`components-${container.id}`] = {
        id: `components-${container.id}`,
        title: `${container.name} - Component Architecture`,
        level: 'component',
        scopeElementId: container.id,
        elementIds: [...componentIds, ...Array.from(boundaryIds)],
        relationshipIds: componentRelIds,
        description: `Internal components, controllers, and services inside ${container.name}.`,
      };
    }
  }

  return views;
}

function getRootSystemId(elementId: string, elements: Record<string, ArchitectureElement>): string | undefined {
  const el = elements[elementId];
  if (!el) return undefined;
  if (el.type === 'softwareSystem') return el.id;
  if (el.parentId) return getRootSystemId(el.parentId, elements);
  return undefined;
}

function getRootSystemOrPersonId(elementId: string, elements: Record<string, ArchitectureElement>): string | undefined {
  const el = elements[elementId];
  if (!el) return undefined;
  if (el.type === 'person' || el.type === 'softwareSystem') return el.id;
  if (el.parentId) return getRootSystemOrPersonId(el.parentId, elements);
  return undefined;
}

function getParentContainerId(elementId: string, elements: Record<string, ArchitectureElement>): string | undefined {
  const el = elements[elementId];
  if (!el) return undefined;
  if (el.type === 'container') return el.id;
  if (el.parentId) return getParentContainerId(el.parentId, elements);
  return undefined;
}
