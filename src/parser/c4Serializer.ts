import { ArchitectureProject } from '../types/c4';

/**
 * Serializes an ArchitectureProject into clean, readable C4 Block DSL markup.
 */
export function serializeC4Architecture(project: ArchitectureProject): string {
  const lines: string[] = [];

  lines.push(`# title: ${project.name}`);
  if (project.description) {
    lines.push(`# ${project.description}`);
  }
  lines.push('');

  const elements = Object.values(project.elements);

  // 1. People
  const people = elements.filter((e) => e.type === 'person');
  if (people.length > 0) {
    lines.push('// People');
    for (const p of people) {
      lines.push(`person ${sanitizeId(p.name)} "${p.name}" {`);
      if (p.description) lines.push(`  description "${p.description}"`);
      if (p.responsibilities && p.responsibilities.length > 0) {
        for (const resp of p.responsibilities) {
          lines.push(`  responsibility "${resp}"`);
        }
      }
      lines.push('}');
      lines.push('');
    }
  }

  // 2. Systems
  const systems = elements.filter((e) => e.type === 'softwareSystem');
  for (const sys of systems) {
    const isExt = sys.external ? ' external' : '';
    lines.push(`system ${sanitizeId(sys.name)} "${sys.name}"${isExt} {`);
    if (sys.description) lines.push(`  description "${sys.description}"`);
    if (sys.technology) lines.push(`  technology "${sys.technology}"`);

    // Containers inside this system
    const containers = elements.filter((e) => e.type === 'container' && e.parentId === sys.id);
    for (const cont of containers) {
      lines.push('');
      const isDb = cont.isDatabase ? ' database' : ' container';
      lines.push(`  ${isDb.trim()} ${sanitizeId(cont.name)} "${cont.name}" {`);
      if (cont.technology) lines.push(`    technology "${cont.technology}"`);
      if (cont.description) lines.push(`    description "${cont.description}"`);
      if (cont.responsibilities && cont.responsibilities.length > 0) {
        for (const resp of cont.responsibilities) {
          lines.push(`    responsibility "${resp}"`);
        }
      }

      // Components inside this container
      const components = elements.filter((e) => e.type === 'component' && e.parentId === cont.id);
      for (const comp of components) {
        lines.push('');
        lines.push(`    component ${sanitizeId(comp.name)} "${comp.name}" {`);
        if (comp.technology) lines.push(`      technology "${comp.technology}"`);
        if (comp.description) lines.push(`      description "${comp.description}"`);
        if (comp.responsibilities && comp.responsibilities.length > 0) {
          for (const resp of comp.responsibilities) {
            lines.push(`      responsibility "${resp}"`);
          }
        }
        lines.push('    }');
      }

      lines.push('  }');
    }

    lines.push('}');
    lines.push('');
  }

  // 3. Relationships
  if (project.relationships.length > 0) {
    lines.push('// Relationships');
    for (const rel of project.relationships) {
      const source = project.elements[rel.sourceId];
      const target = project.elements[rel.targetId];
      const sourceName = source ? sanitizeId(source.name) : rel.sourceId;
      const targetName = target ? sanitizeId(target.name) : rel.targetId;

      let label = rel.description || '';
      if (rel.technology) {
        label = label ? `${label} [${rel.technology}]` : `[${rel.technology}]`;
      }

      if (label) {
        lines.push(`${sourceName} -> ${targetName}: "${label}"`);
      } else {
        lines.push(`${sourceName} -> ${targetName}`);
      }
    }
  }

  return lines.join('\n');
}

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, '');
}
