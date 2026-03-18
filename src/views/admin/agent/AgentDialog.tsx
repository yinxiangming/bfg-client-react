'use client'

import { useState, useEffect, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { bfgApi, getAgentChatRequestInit, getWorkspaceId } from '@/utils/api'

type AgentDialogProps = {
  open: boolean
  onClose: () => void
}

/** Show only operation names (no execution details). */
function toolNamesSummary(names: string[]): string {
  if (!names.length) return ''
  if (names.length === 1) return `执行了 1 个操作：${names[0]}`
  return `执行了 ${names.length} 个操作：${names.join(', ')}`
}

type ToolResult = { name: string; success: boolean; error?: string }

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  tool_names?: string[]
  tool_results?: ToolResult[]
  tool_calls_made?: Array<{ capability_id: string | null; tool_name?: string; result?: unknown }>
}

export default function AgentDialog({ open, onClose }: AgentDialogProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [contextUrl, setContextUrl] = useState<string>('')
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingToolNames, setStreamingToolNames] = useState<string[]>([])
  const [streamingToolResults, setStreamingToolResults] = useState<ToolResult[]>([])
  const streamDoneRef = useRef(false)

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setContextUrl(window.location.href)
    }
  }, [open])

  const handleClose = () => {
    setChatMessages([])
    setChatInput('')
    setChatError(null)
    onClose()
  }

  const handleChatSend = async () => {
    const text = (chatInput || '').trim()
    if (!text || chatSending) return
    setChatSending(true)
    setChatError(null)
    setStreamingContent('')
    setStreamingToolNames([])
    setStreamingToolResults([])
    streamDoneRef.current = false
    const userMessage: ChatMessage = { role: 'user', content: text }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    const messagesForApi = [...chatMessages.map((m) => ({ role: m.role, content: m.content })), { role: 'user' as const, content: text }]
    const body: { messages: Array<{ role: string; content: string }>; workspace_id?: number; context_url?: string; stream?: boolean } = { messages: messagesForApi, stream: true }
    if (contextUrl) body.context_url = contextUrl
    const workspaceId = getWorkspaceId()
    if (workspaceId) {
      const wid = parseInt(workspaceId, 10)
      if (!Number.isNaN(wid)) body.workspace_id = wid
    }
    try {
      const res = await fetch(bfgApi.agentChat(), getAgentChatRequestInit(body))
      if (!res.ok) {
        const err = await res.text()
        setChatError(err || '请求失败')
        return
      }
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let allToolNames: string[] = []
        let allToolResults: ToolResult[] = []
        let doneReceived = false
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6)) as {
                type?: string
                delta?: string
                names?: string[]
                reply?: string
                tool_names?: string[]
                tool_results?: ToolResult[]
                name?: string
                success?: boolean
                error?: string
              }
              if (data.type === 'content' && typeof data.delta === 'string') {
                setStreamingContent((c) => c + data.delta)
              } else if (data.type === 'tool_names' && Array.isArray(data.names)) {
                allToolNames = [...allToolNames, ...data.names]
                setStreamingToolNames([...allToolNames])
              } else if (data.type === 'tool_result' && typeof data.name === 'string') {
                const tr: ToolResult = { name: data.name, success: data.success !== false, error: data.error }
                allToolResults = [...allToolResults, tr]
                setStreamingToolResults([...allToolResults])
              } else if (data.type === 'done' && !doneReceived) {
                doneReceived = true
                streamDoneRef.current = true
                const reply = typeof data.reply === 'string' ? data.reply : ''
                const names = Array.isArray(data.tool_names) ? data.tool_names : allToolNames
                const results = Array.isArray(data.tool_results) ? data.tool_results : allToolResults
                setChatMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: reply,
                    tool_names: names.length ? names : undefined,
                    tool_results: results.length ? results : undefined,
                  },
                ])
                setStreamingContent('')
                setStreamingToolNames([])
                setStreamingToolResults([])
              }
            } catch {
              // skip malformed line
            }
          }
        }
        if (!doneReceived && buf.startsWith('data: ')) {
          try {
            const data = JSON.parse(buf.slice(6)) as { type?: string; reply?: string; tool_names?: string[]; tool_results?: ToolResult[] }
            if (data.type === 'done') {
              streamDoneRef.current = true
              setChatMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: (data.reply as string) ?? '',
                  tool_names: Array.isArray(data.tool_names) ? data.tool_names : undefined,
                  tool_results: Array.isArray(data.tool_results) ? data.tool_results : undefined,
                },
              ])
              setStreamingContent('')
              setStreamingToolNames([])
              setStreamingToolResults([])
            }
          } catch {
            // ignore
          }
        }
      } else {
        const resJson = await res.json() as { reply: string; tool_calls_made?: Array<{ capability_id: string; tool_name?: string; result?: { success?: boolean; error?: string } }> }
        const toolCalls = resJson.tool_calls_made
        const toolNames = toolCalls?.map((t) => t.tool_name ?? t.capability_id ?? '').filter(Boolean) ?? []
        const toolResults: ToolResult[] = (toolCalls ?? []).map((t) => {
          const r = t.result as { success?: boolean; error?: string } | undefined
          return { name: t.tool_name ?? t.capability_id ?? '', success: r?.success !== false, error: r?.error }
        })
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: resJson.reply ?? '',
            tool_names: toolNames.length ? toolNames : undefined,
            tool_results: toolResults.length ? toolResults : undefined,
            tool_calls_made: toolCalls?.length ? toolCalls : undefined,
          },
        ])
      }
    } catch (e) {
      setChatError(e instanceof Error ? e.message : '发送失败')
    } finally {
      setChatSending(false)
      if (!streamDoneRef.current) {
        setStreamingContent((prev) => {
          setStreamingToolNames((names) => {
            setStreamingToolResults((results) => {
              if (prev || names.length || results.length) {
                setChatMessages((msgs) => [
                  ...msgs,
                  {
                    role: 'assistant' as const,
                    content: prev || '(请求中断)',
                    tool_names: names.length ? names : undefined,
                    tool_results: results.length ? results : undefined,
                  },
                ])
              }
              return []
            })
            return []
          })
          return ''
        })
      }
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>AI</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" sx={{ minHeight: 320 }}>
          <Box flex="1" overflow="auto" display="flex" flexDirection="column" sx={{ maxHeight: 360, mb: 2, pr: 1 }}>
            {chatMessages.length === 0 && (
              <Typography color="text.secondary" variant="body2">
                输入消息与 AI 对话，可自动执行订单、发货等操作。
              </Typography>
            )}
            {chatMessages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  mb: 2,
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  ...(m.role === 'user'
                    ? {
                        bgcolor: 'grey.800',
                        color: 'white',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                      }
                    : {}),
                }}
              >
                <Typography variant="caption" sx={{ color: m.role === 'user' ? 'grey.300' : 'text.secondary' }}>
                  {m.role === 'user' ? '我' : 'AI'}
                </Typography>
                {m.role === 'assistant' && (m.tool_names?.length ?? 0) > 0 && (
                  <Alert
                    severity="info"
                    icon={false}
                    sx={{ mt: 0.5, py: 0.5, fontSize: '0.75rem', color: 'grey.600', '& .MuiAlert-message': { fontSize: '0.75rem' } }}
                  >
                    {toolNamesSummary(m.tool_names ?? [])}
                  </Alert>
                )}
                {m.role === 'assistant' && !m.tool_names?.length && m.tool_calls_made?.length && (
                  <Alert
                    severity="info"
                    icon={false}
                    sx={{ mt: 0.5, py: 0.5, fontSize: '0.75rem', color: 'grey.600', '& .MuiAlert-message': { fontSize: '0.75rem' } }}
                  >
                    {toolNamesSummary(m.tool_calls_made.map((t) => t.tool_name ?? t.capability_id ?? '').filter(Boolean))}
                  </Alert>
                )}
                {m.role === 'assistant' && m.tool_results?.some((r) => !r.success) && (
                  <Alert
                    severity="error"
                    sx={{ mt: 0.5, py: 0.5, fontSize: '0.75rem', '& .MuiAlert-message': { fontSize: '0.75rem', color: 'grey.700' } }}
                  >
                    {m.tool_results.filter((r) => !r.success).map((r) => (
                      <Box key={r.name} component="span" display="block">
                        {r.name} 执行失败：{r.error ?? '未知错误'}
                      </Box>
                    ))}
                  </Alert>
                )}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'inherit' }}>
                  {m.content || '(无文字回复)'}
                </Typography>
              </Box>
            ))}
            {chatSending && (streamingContent || streamingToolNames.length > 0 || streamingToolResults.length > 0) && (
              <Box sx={{ mb: 2, alignSelf: 'flex-start', maxWidth: '85%', fontSize: '0.75rem', color: 'grey.600' }}>
                <Typography variant="caption" sx={{ color: 'grey.600' }}>AI</Typography>
                {streamingToolNames.length > 0 && (
                  <Alert
                    severity="info"
                    icon={false}
                    sx={{ mt: 0.5, py: 0.5, fontSize: '0.75rem', color: 'grey.600', '& .MuiAlert-message': { fontSize: '0.75rem' } }}
                  >
                    {toolNamesSummary(streamingToolNames)}
                  </Alert>
                )}
                {streamingToolResults.some((r) => !r.success) && (
                  <Alert
                    severity="error"
                    sx={{ mt: 0.5, py: 0.5, fontSize: '0.75rem', '& .MuiAlert-message': { fontSize: '0.75rem', color: 'grey.700' } }}
                  >
                    {streamingToolResults.filter((r) => !r.success).map((r) => (
                      <Box key={r.name} component="span" display="block">
                        {r.name} 执行失败：{r.error ?? '未知错误'}
                      </Box>
                    ))}
                  </Alert>
                )}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem', color: 'grey.600' }}>
                  {streamingContent || '…'}
                </Typography>
              </Box>
            )}
          </Box>
          {chatError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setChatError(null)}>
              {chatError}
            </Alert>
          )}
          <Box display="flex" gap={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="输入消息..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleChatSend()
                }
              }}
              disabled={chatSending}
              size="small"
            />
            <Button variant="contained" onClick={handleChatSend} disabled={chatSending || !chatInput.trim()}>
              {chatSending ? <CircularProgress size={24} /> : '发送'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  )
}
