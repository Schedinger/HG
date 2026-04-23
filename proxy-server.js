// Standalone AI API proxy server
// Runs on port 3721, forwards requests to the remote AI API
// Automatically converts between OpenAI and Anthropic formats
import { createServer } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { request as httpRequest } from 'node:http'

const PORT = 3721

function isAnthropic(url) {
  return url.includes('anthropic.com')
}

// Convert OpenAI-format request body to Anthropic format
function toAnthropicRequest(openaiBody) {
  const messages = []
  let system = ''
  for (const msg of openaiBody.messages || []) {
    if (msg.role === 'system') {
      system += (system ? '\n' : '') + msg.content
    } else {
      messages.push({ role: msg.role, content: msg.content })
    }
  }
  return {
    model: openaiBody.model,
    messages,
    system: system || undefined,
    max_tokens: openaiBody.max_tokens || 4096,
    temperature: openaiBody.temperature,
    top_p: openaiBody.top_p,
    stream: openaiBody.stream || false,
  }
}

// Convert Anthropic non-streaming response to OpenAI format
function toOpenAIResponse(anthropicData) {
  const text = (anthropicData.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
  return {
    choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: anthropicData.stop_reason || 'stop' }],
    model: anthropicData.model,
    usage: anthropicData.usage,
  }
}

// Convert Anthropic SSE stream to OpenAI SSE stream
function transformAnthropicStream(proxyRes, res) {
  let buffer = ''
  proxyRes.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('event:')) continue // skip event type lines
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (!data) continue
      try {
        const evt = JSON.parse(data)
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          const openaiChunk = {
            choices: [{ index: 0, delta: { content: evt.delta.text }, finish_reason: null }],
          }
          res.write('data: ' + JSON.stringify(openaiChunk) + '\n\n')
        } else if (evt.type === 'message_stop') {
          res.write('data: [DONE]\n\n')
        }
      } catch {}
    }
  })
  proxyRes.on('end', () => {
    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n')
      res.end()
    }
  })
}

const server = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Target-URL')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  const targetBase = req.headers['x-target-url']
  if (!targetBase) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing X-Target-URL header' }))
    return
  }

  // Collect body
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const rawBody = Buffer.concat(chunks)
    let parsedBody
    try {
      parsedBody = JSON.parse(rawBody.toString())
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      return
    }

    const useAnthropic = isAnthropic(targetBase)
    const authHeader = req.headers['authorization'] || ''
    const apiKey = authHeader.replace(/^Bearer\s+/i, '')

    let targetPath, finalBody, reqHeaders

    if (useAnthropic) {
      // Anthropic API
      targetPath = '/v1/messages'
      finalBody = JSON.stringify(toAnthropicRequest(parsedBody))
      reqHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(finalBody),
      }
      console.log(`[Proxy] ${req.method} -> Anthropic ${targetBase}${targetPath} (model: ${parsedBody.model}, stream: ${!!parsedBody.stream})`)
    } else {
      // OpenAI-compatible API
      const fullTarget = targetBase.replace(/\/+$/, '') + req.url
      let targetUrl
      try {
        targetUrl = new URL(fullTarget)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid URL: ' + fullTarget }))
        return
      }
      targetPath = targetUrl.pathname + targetUrl.search
      finalBody = rawBody
      reqHeaders = {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Accept': 'application/json, text/event-stream',
        'Content-Length': rawBody.length,
      }
      console.log(`[Proxy] ${req.method} -> ${fullTarget}`)
    }

    let targetUrl
    try {
      targetUrl = new URL(targetBase)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid base URL: ' + targetBase }))
      return
    }

    const isHttps = targetUrl.protocol === 'https:'
    const reqFn = isHttps ? httpsRequest : httpRequest

    const proxyReq = reqFn(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (isHttps ? 443 : 80),
        path: useAnthropic ? targetPath : targetPath,
        method: req.method,
        headers: reqHeaders,
      },
      (proxyRes) => {
        console.log(`[Proxy] <- ${proxyRes.statusCode} ${proxyRes.headers['content-type'] || ''}`)

        if (useAnthropic && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
          const contentType = proxyRes.headers['content-type'] || ''

          if (parsedBody.stream && contentType.includes('text/event-stream')) {
            // Streaming: convert Anthropic SSE to OpenAI SSE
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*',
            })
            transformAnthropicStream(proxyRes, res)
          } else {
            // Non-streaming: collect response, convert, send
            const resChunks = []
            proxyRes.on('data', c => resChunks.push(c))
            proxyRes.on('end', () => {
              try {
                const anthropicData = JSON.parse(Buffer.concat(resChunks).toString())
                const openaiData = toOpenAIResponse(anthropicData)
                const jsonStr = JSON.stringify(openaiData)
                res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                })
                res.end(jsonStr)
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
                res.end(JSON.stringify({ error: 'Failed to parse Anthropic response: ' + e.message }))
              }
            })
          }
        } else {
          // Non-Anthropic or error: pipe through directly
          const h = { 'Access-Control-Allow-Origin': '*' }
          if (proxyRes.headers['content-type']) h['Content-Type'] = proxyRes.headers['content-type']
          res.writeHead(proxyRes.statusCode, h)
          proxyRes.pipe(res)
        }
      },
    )

    proxyReq.on('error', (err) => {
      console.log(`[Proxy] ERROR: ${err.message}`)
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      }
      res.end(JSON.stringify({ error: err.message }))
    })

    if (typeof finalBody === 'string') {
      proxyReq.write(finalBody)
    } else {
      proxyReq.write(finalBody)
    }
    proxyReq.end()
  })
})

server.listen(PORT, () => {
  console.log(`[Proxy] AI API proxy running on http://localhost:${PORT}`)
  console.log(`[Proxy] Supports: OpenAI-compatible APIs + Anthropic Claude API`)
})
