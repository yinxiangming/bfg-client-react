import type { BlockRegistryEntry } from '@/views/common/blocks'
import { OnboardingProgressBlock, definition as onboardingDef } from './OnboardingProgressBlock'

const onboardingEntry: BlockRegistryEntry = {
  definition: onboardingDef,
  Component: OnboardingProgressBlock as any,
}

export const systemDashboardBlocks: BlockRegistryEntry[] = [onboardingEntry]

export { OnboardingProgressBlock }
