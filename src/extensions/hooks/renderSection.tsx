'use client'

import React from 'react'
import type { PageSectionExtension } from '../registry'

/**
 * Renders a page section with plugin support (replace/hide).
 * Use with usePageSections(page): pass visibleSections, replacements, and renderSection for each default section.
 */
export function renderSection(
  sectionId: string,
  visibleSections: string[],
  replacements: Map<string, PageSectionExtension>,
  DefaultComponent: React.ComponentType<any>,
  props?: Record<string, any>
): React.ReactNode {
  if (!visibleSections.includes(sectionId)) return null
  const replacement = replacements.get(sectionId)
  const Component = replacement?.component ?? DefaultComponent
  return <Component {...(props ?? {})} />
}
