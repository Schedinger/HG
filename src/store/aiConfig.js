import { reactive, computed } from 'vue'

const STORAGE_KEY = 'hgrag_ai_config'
const PROVIDERS_KEY = 'hgrag_providers'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function loadProviders() {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const builtinProviders = [
  { id: 'openai', label: 'OpenAI', endpoint: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'], builtin: true },
  { id: 'deepseek', label: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'], builtin: true },
  { id: 'zhipu', label: '智谱 AI', endpoint: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-plus', 'glm-4', 'glm-4-flash'], builtin: true },
  { id: 'anthropic', label: 'Anthropic (Claude)', endpoint: 'https://api.anthropic.com', models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'], builtin: true },
  { id: 'custom', label: '自定义 / vLLM', endpoint: 'http://localhost:8000/v1', models: ['Qwen3-8B', 'Qwen2.5-7B-Instruct', 'Llama-3.1-8B-Instruct'], builtin: true },
]

// Merge saved providers with builtins — ensure new builtin providers are always present
function mergeProviders() {
  const saved = loadProviders()
  if (!saved) return builtinProviders.map(p => ({ ...p }))
  // Add any new builtins that aren't in saved list
  const savedIds = new Set(saved.map(p => p.id))
  const merged = [...saved]
  for (const bp of builtinProviders) {
    if (!savedIds.has(bp.id)) merged.push({ ...bp })
  }
  return merged
}
export const providers = reactive(mergeProviders())

export function saveProviders() {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify([...providers]))
}

export function addProvider(label, endpoint, models) {
  const id = 'user_' + Date.now()
  providers.push({ id, label, endpoint, models: models || [], builtin: false })
  saveProviders()
  return id
}

export function removeProvider(id) {
  const idx = providers.findIndex(p => p.id === id)
  if (idx !== -1 && !providers[idx].builtin) {
    providers.splice(idx, 1)
    saveProviders()
  }
}

const defaults = {
  provider: 'openai',
  apiKey: '',
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  systemPrompt: '你是超图检索增强生成平台的智能问答助手。你可以基于超图知识库中的结构化知识进行多跳推理，为用户提供准确且可解释的答案。请使用中文回答，除非用户使用英文提问。',
}

const saved = loadFromStorage()

export const aiConfig = reactive({
  ...defaults,
  ...(saved || {}),
})

export const isConfigured = computed(() => !!aiConfig.apiKey && !!aiConfig.endpoint)

export function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...aiConfig }))
}

export function resetConfig() {
  Object.assign(aiConfig, defaults)
  localStorage.removeItem(STORAGE_KEY)
}

// Normalize endpoint: strip trailing slashes and accidental /chat/completions suffix
function normalizeEndpoint(raw) {
  let ep = raw.trim().replace(/\/+$/, '')
  ep = ep.replace(/\/chat\/completions$/i, '')
  ep = ep.replace(/\/+$/, '')
  return ep
}

// Call OpenAI-compatible chat completions API
// Requests are routed through the Vite dev proxy (/api/ai/) to bypass CORS
export async function chatCompletion(messages, onChunk) {
  const apiKey = aiConfig.apiKey?.trim()
  const rawEndpoint = aiConfig.endpoint?.trim()
  if (!apiKey) throw new Error('请先在模型设置中配置 API Key')
  if (!rawEndpoint) throw new Error('请先在模型设置中配置 Base URL')
  if (!aiConfig.model?.trim()) throw new Error('请先在模型设置中配置模型名称')

  const endpoint = normalizeEndpoint(rawEndpoint)
  // Call proxy server directly (port 3721) to bypass any Vite middleware issues
  const proxyBase = `http://${window.location.hostname}:3721`
  const proxyUrl = proxyBase + '/chat/completions'
  const body = {
    model: aiConfig.model.trim(),
    messages,
    temperature: aiConfig.temperature,
    max_tokens: aiConfig.maxTokens,
    top_p: aiConfig.topP,
    stream: !!onChunk,
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Target-URL': endpoint,
  }

  console.log('[chatCompletion]', onChunk ? 'stream' : 'non-stream', '->', endpoint + '/chat/completions', 'model:', aiConfig.model)

  // Helper: check if proxy is alive, parse error response
  async function checkResponse(res) {
    const contentType = res.headers.get('content-type') || ''
    // If we got HTML back, the proxy is not working
    if (contentType.includes('text/html')) {
      const text = await res.text()
      if (text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
        throw new Error('代理服务未启动。请用 npm run dev 启动平台（会同时启动代理服务）。')
      }
      throw new Error(`[${res.status}] 服务端返回了 HTML 而非 JSON:\n${text.substring(0, 200)}`)
    }
    if (!res.ok) {
      const text = await res.text()
      let detail = text
      try {
        const json = JSON.parse(text)
        detail = json.error?.message || json.error || json.message || text
      } catch {}
      throw new Error(`[${res.status}] ${endpoint}/chat/completions\n${detail}`)
    }
  }

  if (!onChunk) {
    let res
    try {
      res = await fetch(proxyUrl, { method: 'POST', headers, body: JSON.stringify(body) })
    } catch (e) {
      throw new Error('网络请求失败: ' + e.message + '\n请确认代理服务已启动 (npm run dev)')
    }
    await checkResponse(res)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  // Streaming
  let res
  try {
    res = await fetch(proxyUrl, { method: 'POST', headers, body: JSON.stringify(body) })
  } catch (e) {
    throw new Error('网络请求失败: ' + e.message + '\n请确认代理服务已启动 (npm run dev)')
  }
  await checkResponse(res)

  // Some APIs return non-streaming JSON even when stream=true
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    if (content) onChunk(content, content)
    return content
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content || ''
        if (delta) {
          fullContent += delta
          onChunk(delta, fullContent)
        }
      } catch {}
    }
  }
  return fullContent
}
