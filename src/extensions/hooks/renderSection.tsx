'use client'

import React from 'react'
import type { PageSlotExtension } from '../registry'

/**
 * Renders a page slot with plugin support (replace/hide).
 * Use with usePageSlots(page): pass visibleSlots, replacements, and DefaultComponent.
 */
export function renderSlot(
  slotId: string,
  visibleSlots: string[],
  replacements: Map<string, PageSlotExtension>,
  DefaultComponent: React.ComponentType<any>,
  props?: Record<string, any>
): React.ReactNode {
  if (!visibleSlots.includes(slotId)) return null
  const replacement = replacements.get(slotId)
  const Component = replacement?.component ?? DefaultComponent
  return <Component {...(props ?? {})} />
}

/**
 * @deprecated Use renderSlot with usePageSlots
 */
export function renderSection(
  sectionId: string,
  visibleSections: string[],
  replacements: Map<string, PageSlotExtension>,
  DefaultComponent: React.ComponentType<any>,
  props?: Record<string, any>
): React.ReactNode {
  return renderSlot(sectionId, visibleSections, replacements, DefaultComponent, props)
}
