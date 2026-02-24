import { useMemo } from 'react'
import { useExtensions } from '../context'
import type { DataHookExtension } from '../registry'

export function useDataHooks(page: string) {
  const ctx = useExtensions()

  const hooks = useMemo(() => {
    if (!ctx) return []
    return ctx.getDataHooks(page)
  }, [ctx, page])

  const runOnLoad = useMemo(() => {
    return async (data: any): Promise<any> => {
      let result = data
      for (const hook of hooks) {
        if (hook.onLoad) {
          result = await hook.onLoad(result)
        }
      }
      return result
    }
  }, [hooks])

  const runOnSave = useMemo(() => {
    return async (data: any): Promise<any> => {
      let result = data
      for (const hook of hooks) {
        if (hook.transformData) {
          result = hook.transformData(result)
        }
        if (hook.onSave) {
          result = await hook.onSave(result)
        }
      }
      return result
    }
  }, [hooks])

  const runAfterSave = useMemo(() => {
    return async (context: Record<string, any>): Promise<void> => {
      for (const hook of hooks) {
        if (hook.afterSave) {
          await hook.afterSave(context)
        }
      }
    }
  }, [hooks])

  return { runOnLoad, runOnSave, runAfterSave }
}
