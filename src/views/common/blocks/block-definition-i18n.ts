import type { BlockDefinition } from './types'

export type BlockDefinitionTranslator = {
  (key: string, values?: Record<string, string | number>): string
  has: (key: string) => boolean
}

export function getBlockDefinitionText(
  definition: BlockDefinition,
  field: 'name' | 'description',
  translate: BlockDefinitionTranslator
): string {
  const key = field === 'name' ? definition.nameI18nKey : definition.descriptionI18nKey
  const fallback = field === 'name' ? definition.name : definition.description || definition.type
  return key && translate.has(key) ? translate(key) : fallback
}
