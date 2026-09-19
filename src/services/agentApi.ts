import { bfgApi, getAgentChatRequestInit } from '@/utils/api'

export type AgentChatBody = {
  messages: Array<{ role: string; content: string }>
  workspace_id?: number
  context_url?: string
  stream?: boolean
}

export async function sendAgentChat(body: AgentChatBody, idempotencyKey: string): Promise<Response> {
  const init = getAgentChatRequestInit(body)

  return fetch(bfgApi.agentChat(), {
    ...init,
    headers: {
      ...init.headers,
      'X-Idempotency-Key': idempotencyKey
    }
  })
}
