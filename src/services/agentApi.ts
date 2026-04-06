import { bfgApi, getAgentChatRequestInit } from '@/utils/api'

export type AgentChatBody = {
  messages: Array<{ role: string; content: string }>
  workspace_id?: number
  context_url?: string
  stream?: boolean
}

export async function sendAgentChat(body: AgentChatBody): Promise<Response> {
  return fetch(bfgApi.agentChat(), getAgentChatRequestInit(body))
}
