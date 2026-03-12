/**
 * Frozen terminology for page dynamic loading.
 * Use these names consistently; legacy "section" names are deprecated aliases.
 *
 * - PageSlot: where to mount content (formerly "Section"). Slot = placement on a page.
 * - PageBlock: content unit inside a slot or CMS page (unchanged). Block = renderable unit.
 * - RootSlot: full-page replace slot (ID below).
 */
export const ROOT_SLOT_ID = '__root__' as const

/** Slot ID for full-page replacement on storefront home. */
export type RootSlotId = typeof ROOT_SLOT_ID
