<script setup>
import { ref, reactive, nextTick, onMounted, computed, watch } from 'vue'
import { caseMessages, reasoningSteps, graphNodes, graphHyperedges, sessions } from '../data/mock.js'
import { aiConfig, isConfigured, chatCompletion } from '../store/aiConfig.js'

// ===== Session management =====
const sessionList = reactive([...sessions])
const activeSessionId = ref('sess_001')
let nextSessionId = 4

const activeSession = computed(() => sessionList.find(s => s.id === activeSessionId.value))

// ===== Chat state =====
const messages = ref([])
const inputText = ref('')
const chatBody = ref(null)
const isTyping = ref(false)
const isStreaming = ref(false)
const rightTab = ref('reasoning')
const inputHeight = ref(80)
let resizing = false
let resizeStartY = 0
let startHeight = 80

// ===== Reasoning animation =====
const currentSteps = ref([])
const visibleStepCount = ref(0)
const isReasoning = ref(false)
const stepsBody = ref(null)

// ===== Graph =====
const canvas = ref(null)
const typeColors = { Compound: '#4f8ef7', Gene: '#10b981', Disease: '#ef4444' }
const typeLabels = { Compound: '药物', Gene: '基因', Disease: '疾病' }
const activeGraphNodes = ref([])
const activeGraphEdges = ref([])

// 根据推理步骤已进行到的动作，逐步显示相关的子图节点/超边
const revealedEdgeIds = computed(() => {
  const ids = new Set()
  const steps = currentSteps.value.slice(0, visibleStepCount.value)
  steps.forEach(s => {
    if (!s.action) return
    if (s.action.includes('RetrieveSubgraph') || s.action.includes('Healthcare')) {
      graphHyperedges.forEach(he => ids.add(he.id))
    }
    if (s.action.includes('Tamoxifen') || s.action.includes('DB00675')) {
      graphHyperedges.filter(he => he.nodes.includes('DB00675')).forEach(he => ids.add(he.id))
    }
    if (s.action.includes('Fulvestrant') || s.action.includes('DB00945')) {
      graphHyperedges.filter(he => he.nodes.includes('DB00945')).forEach(he => ids.add(he.id))
    }
    if (s.action.includes('NeighbourCheck')) {
      const m = s.action.match(/\[([^\]]+)\]/)
      if (m) {
        const nodeId = m[1].split(',')[0].trim()
        graphHyperedges.filter(he => he.nodes.includes(nodeId)).forEach(he => ids.add(he.id))
      }
    }
  })
  return ids
})

const revealedNodeIds = computed(() => {
  const ids = new Set()
  graphHyperedges.forEach(he => {
    if (revealedEdgeIds.value.has(he.id)) {
      he.nodes.forEach(nid => ids.add(nid))
    }
  })
  return ids
})

// ===== Load session =====
function loadSession(sessId) {
  activeSessionId.value = sessId
  const sess = sessionList.find(s => s.id === sessId)
  if (!sess) return
  if (sess.id === 'sess_001') {
    messages.value = [...caseMessages]
    currentSteps.value = [...reasoningSteps]
    visibleStepCount.value = reasoningSteps.length
    isReasoning.value = false
  } else if (sess.messages) {
    messages.value = [...sess.messages]
    currentSteps.value = sess.reasoning ? [...sess.reasoning] : []
    visibleStepCount.value = currentSteps.value.length
    isReasoning.value = false
  }
  nextTick(() => {
    scrollToBottom()
    drawGraph()
  })
}

function createSession() {
  const id = 'sess_' + String(nextSessionId++).padStart(3, '0')
  const sess = {
    id,
    title: '新对话',
    time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
    preview: '',
    messages: [
      { role: 'assistant', content: '你好！我是超图检索增强生成平台的问答助手，可以帮你在超图知识库中进行多跳推理检索。\n\n你可以尝试提问，例如：\n- Tamoxifen 和 Fulvestrant 治疗乳腺癌的共同机制是什么？\n- BRCA1 基因与哪些疾病相关？\n- PI3K-Akt 信号通路涉及哪些关键基因？', reasoning: false },
    ],
    reasoning: [],
  }
  sessionList.unshift(sess)
  loadSession(id)
}

function deleteSession(sessId) {
  const idx = sessionList.findIndex(s => s.id === sessId)
  if (idx < 0) return
  sessionList.splice(idx, 1)
  if (activeSessionId.value === sessId) {
    if (sessionList.length > 0) loadSession(sessionList[0].id)
    else createSession()
  }
}

onMounted(() => {
  loadSession('sess_001')
})

// ===== Chat =====
function scrollToBottom() {
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
  })
}

function scrollStepsToBottom() {
  nextTick(() => {
    if (stepsBody.value) stepsBody.value.scrollTop = stepsBody.value.scrollHeight
  })
}

const apiError = ref('')

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  apiError.value = ''
  scrollToBottom()

  // Update session preview
  const sess = sessionList.find(s => s.id === activeSessionId.value)
  if (sess) {
    sess.preview = text.substring(0, 40) + (text.length > 40 ? '...' : '')
    if (sess.title === '新对话') sess.title = text.substring(0, 20) + (text.length > 20 ? '...' : '')
  }

  isTyping.value = true
  isStreaming.value = false

  // If AI is configured, use real API call
  if (isConfigured.value) {
    try {
      // Build message history for API
      const apiMessages = []
      if (aiConfig.systemPrompt) {
        apiMessages.push({ role: 'system', content: aiConfig.systemPrompt })
      }
      // Include recent conversation context (last 20 messages)
      const recent = messages.value.slice(-20)
      for (const m of recent) {
        apiMessages.push({ role: m.role, content: m.content })
      }

      // Streaming response
      const assistantMsg = reactive({ role: 'assistant', content: '', reasoning: false })
      messages.value.push(assistantMsg)
      isStreaming.value = true
      scrollToBottom()

      const result = await chatCompletion(apiMessages, (delta, full) => {
        assistantMsg.content = full
        scrollToBottom()
      })

      // If streaming returned empty, use the non-streaming result
      if (!assistantMsg.content && result) {
        assistantMsg.content = result
      }
      if (!assistantMsg.content) {
        assistantMsg.content = '(AI 返回了空响应，请检查模型配置)'
      }

      isTyping.value = false
      isStreaming.value = false
      scrollToBottom()
    } catch (e) {
      isTyping.value = false
      isStreaming.value = false
      apiError.value = e.message || '请求失败'
      messages.value.push({
        role: 'assistant',
        content: '抱歉，AI 模型请求失败：' + (e.message || '未知错误') + '\n\n请检查模型设置中的 API Key 和端点配置。',
        reasoning: false,
      })
      scrollToBottom()
    }
    return
  }

  // Fallback: simulate progressive reasoning with mock data
  rightTab.value = 'reasoning'
  currentSteps.value = [...reasoningSteps]
  visibleStepCount.value = 0
  isReasoning.value = true

  let stepIdx = 0
  const stepInterval = setInterval(() => {
    if (stepIdx >= reasoningSteps.length) {
      clearInterval(stepInterval)
      isReasoning.value = false
      messages.value.push({
        role: 'assistant',
        content: 'Based on the hypergraph knowledge base retrieval and multi-hop reasoning:\n\nFinal Answer: ESR1\n\nFulvestrant interacts with the ESR1 gene in a mechanism similar to how Tamoxifen treats breast cancer. Both drugs downregulate ESR1 (Estrogen Receptor 1).\n\nReasoning Process:\n1. Tamoxifen treats breast cancer by downregulating ESR1\n2. Fulvestrant also downregulates ESR1 (and HER2)\n3. Therefore, both drugs share the common mechanism of targeting ESR1',
        reasoning: true,
      })
      isTyping.value = false
      scrollToBottom()
      drawGraph()
      return
    }
    stepIdx++
    visibleStepCount.value = stepIdx
    scrollStepsToBottom()
    drawGraph()
  }, 1200)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ===== Graph drawing =====
function drawGraph() {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = cvs.getBoundingClientRect()
  cvs.width = rect.width * dpr
  cvs.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const scaleX = rect.width / 640
  const scaleY = rect.height / 400

  const showAll = visibleStepCount.value === currentSteps.value.length && currentSteps.value.length > 0
  const hasRevealed = revealedEdgeIds.value.size > 0

  // Draw hyperedges
  graphHyperedges.forEach(he => {
    const visible = showAll || !hasRevealed || revealedEdgeIds.value.has(he.id)
    const pts = he.nodes.map(nid => {
      const n = graphNodes.find(nd => nd.id === nid)
      return n ? { x: n.x * scaleX, y: n.y * scaleY } : null
    }).filter(Boolean)
    if (pts.length < 2) return

    ctx.strokeStyle = he.color
    ctx.lineWidth = visible ? 2.5 : 1
    ctx.globalAlpha = visible ? 0.5 : 0.1
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        ctx.beginPath()
        ctx.moveTo(pts[i].x, pts[i].y)
        ctx.lineTo(pts[j].x, pts[j].y)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
  })

  // Draw nodes
  graphNodes.forEach(n => {
    const x = n.x * scaleX
    const y = n.y * scaleY
    const visible = showAll || !hasRevealed || revealedNodeIds.value.has(n.id)
    const r = visible ? 20 : 14
    const color = typeColors[n.type] || '#6b7280'

    ctx.globalAlpha = visible ? 1 : 0.15

    ctx.beginPath()
    ctx.arc(x, y, r + 6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = visible ? 0.12 : 0.05
    ctx.fill()

    ctx.globalAlpha = visible ? 1 : 0.2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = visible ? 2.5 : 1
    ctx.stroke()

    ctx.font = `bold ${visible ? 11 : 9}px sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(n.label, x, y)
    ctx.globalAlpha = 1
  })
}

watch(rightTab, (val) => {
  if (val === 'graph') nextTick(() => drawGraph())
})

// ===== Resize =====
function startResize(e) {
  resizing = true
  resizeStartY = e.clientY
  startHeight = inputHeight.value
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}
function onResize(e) {
  if (!resizing) return
  const dy = resizeStartY - e.clientY
  let newHeight = startHeight + dy
  if (newHeight < 60) newHeight = 60
  if (newHeight > 300) newHeight = 300
  inputHeight.value = newHeight
}
function stopResize() {
  resizing = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
</script>

<template>
  <div class="qa-page">
    <!-- Session sidebar -->
    <div class="session-sidebar">
      <div class="session-header">
        <span class="session-title">对话列表</span>
        <button class="new-session-btn" @click="createSession" title="新建对话">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      <div class="session-list">
        <div v-for="sess in sessionList" :key="sess.id" class="session-item" :class="{ active: activeSessionId === sess.id }" @click="loadSession(sess.id)">
          <div class="session-info">
            <div class="session-name">{{ sess.title }}</div>
            <div class="session-meta">{{ sess.time }}</div>
            <div class="session-preview">{{ sess.preview }}</div>
          </div>
          <button class="session-del" @click.stop="deleteSession(sess.id)" title="删除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Chat area -->
    <div class="qa-left">
      <div class="chat-header">
        <h3>问答推理</h3>
        <div class="chat-header-right">
          <span class="chat-model" v-if="isConfigured">{{ aiConfig.model }} · 已连接</span>
          <span class="chat-model chat-model-warn" v-else>未配置 AI 模型 · 使用演示数据</span>
        </div>
      </div>
      <div class="chat-body" ref="chatBody">
        <div v-for="(msg, i) in messages" :key="i" class="msg" :class="msg.role">
          <div class="msg-avatar">{{ msg.role === 'user' ? 'U' : 'AI' }}</div>
          <div>
            <div class="msg-bubble">{{ msg.content }}</div>
            <div v-if="msg.reasoning" class="reasoning-tag" @click="rightTab = 'reasoning'">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
              查看推理过程
            </div>
          </div>
        </div>
        <div v-if="isTyping && !isStreaming" class="typing-indicator">
          <div class="msg-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white">AI</div>
          <div class="typing-content">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <div class="typing-label">
              <template v-if="isReasoning">正在推理中... ({{ visibleStepCount }}/{{ currentSteps.length }} 步)</template>
              <template v-else>AI 正在思考...</template>
            </div>
          </div>
        </div>
      </div>
      <div class="chat-input-area" :style="{ height: inputHeight + 'px' }">
        <div class="resize-handle" @mousedown="startResize"></div>
        <div class="input-wrapper">
          <textarea v-model="inputText" rows="1" placeholder="输入你的问题..." @keydown="handleKeydown"></textarea>
          <button class="send-btn" :disabled="!inputText.trim() || isTyping" @click="sendMessage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div class="input-hint">基于超图知识库的检索增强生成 · 按 Enter 发送</div>
      </div>
    </div>

    <!-- Right panel -->
    <div class="qa-right">
      <div class="right-tabs">
        <button :class="{ active: rightTab === 'graph' }" @click="rightTab = 'graph'">知识子图</button>
        <button :class="{ active: rightTab === 'reasoning' }" @click="rightTab = 'reasoning'">推理过程</button>
      </div>

      <div v-show="rightTab === 'graph'" class="graph-panel">
        <div class="graph-container">
          <canvas ref="canvas"></canvas>
        </div>
        <div class="graph-legend">
          <span v-for="(color, type) in typeColors" :key="type" class="legend-item">
            <i :style="{ background: color }"></i>{{ typeLabels[type] }}
          </span>
        </div>
        <div class="graph-hint">子图随推理进度动态展示</div>
      </div>

      <div v-show="rightTab === 'reasoning'" class="reasoning-panel">
        <div class="reasoning-header">
          <div class="reasoning-title">推理链路追踪</div>
          <div class="reasoning-meta">
            <template v-if="isReasoning">
              <span class="reasoning-live">LIVE</span> {{ visibleStepCount }}/{{ currentSteps.length }} 步
            </template>
            <template v-else>
              共 {{ currentSteps.length }} 步 · 已完成
            </template>
          </div>
        </div>
        <div class="steps-list" ref="stepsBody">
          <div v-for="(step, i) in currentSteps.slice(0, visibleStepCount)" :key="i" class="step-card" :class="{ 'step-entering': i === visibleStepCount - 1 && isReasoning }">
            <div class="step-left">
              <div class="step-num done">{{ step.step }}</div>
              <div v-if="i < visibleStepCount - 1" class="step-line"></div>
              <div v-else-if="isReasoning" class="step-line step-line-active"></div>
            </div>
            <div class="step-body">
              <div class="step-phase">{{ step.phase }}</div>
              <div v-if="step.subQuestion" class="step-subq">{{ step.subQuestion }}</div>
              <div class="step-section">
                <div class="step-label">Thought</div>
                <div class="step-text">{{ step.thought }}</div>
              </div>
              <div v-if="step.action" class="step-section">
                <div class="step-label action-label">Action</div>
                <code class="step-code">{{ step.action }}</code>
              </div>
              <div v-if="step.observation" class="step-section">
                <div class="step-label obs-label">Observation</div>
                <pre class="step-obs">{{ step.observation }}</pre>
              </div>
              <div v-if="step.intermediateAnswer" class="step-answer">
                <strong>中间结论:</strong> {{ step.intermediateAnswer }}
              </div>
              <div v-if="step.finalAnswer" class="step-final">
                <strong>最终答案:</strong> {{ step.finalAnswer }}
              </div>
            </div>
          </div>
          <div v-if="isReasoning && visibleStepCount < currentSteps.length" class="step-loading">
            <div class="step-spinner"></div>
            <span>推理智能体正在决策下一步操作...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qa-page { display: flex; height: 100vh; }

/* Session sidebar */
.session-sidebar { width: 220px; background: var(--bg-card); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
.session-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 10px; border-bottom: 1px solid var(--border); }
.session-title { font-size: 13px; font-weight: 600; }
.new-session-btn { width: 28px; height: 28px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: all 0.2s; }
.new-session-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.session-list { flex: 1; overflow-y: auto; padding: 8px; }
.session-item { display: flex; align-items: flex-start; gap: 6px; padding: 10px; border-radius: var(--radius); cursor: pointer; transition: background 0.15s; margin-bottom: 2px; }
.session-item:hover { background: var(--bg-input); }
.session-item.active { background: var(--accent-light); }
.session-info { flex: 1; min-width: 0; }
.session-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-meta { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }
.session-preview { font-size: 10px; color: var(--text-secondary); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-del { width: 22px; height: 22px; border: none; background: none; cursor: pointer; color: var(--text-secondary); opacity: 0; transition: all 0.15s; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.session-item:hover .session-del { opacity: 0.6; }
.session-del:hover { opacity: 1 !important; color: #ef4444; background: #fef2f2; }

/* Chat area */
.qa-left { flex: 1; display: flex; flex-direction: column; background: var(--bg-primary); min-width: 0; }
.chat-header { padding: 16px 24px; border-bottom: 1px solid var(--border); background: var(--bg-card); }
.chat-header h3 { font-size: 15px; font-weight: 600; }
.chat-header-right { display: flex; align-items: center; gap: 8px; }
.chat-model { font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: block; }
.chat-model-warn { color: #d97706; }
.chat-body { flex: 1; overflow-y: auto; padding: 24px; }
.msg { display: flex; gap: 12px; margin-bottom: 20px; max-width: 85%; }
.msg.user { margin-left: auto; flex-direction: row-reverse; }
.msg-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.msg.user .msg-avatar { background: var(--accent); color: white; }
.msg.assistant .msg-avatar { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.msg-bubble { padding: 12px 16px; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
.msg.user .msg-bubble { background: var(--accent); color: white; border-bottom-right-radius: 4px; }
.msg.assistant .msg-bubble { background: var(--bg-card); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.reasoning-tag { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; padding: 6px 10px; background: var(--accent-light); color: var(--accent); border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.reasoning-tag:hover { background: var(--accent); color: white; }
.typing-indicator { display: flex; gap: 12px; align-items: flex-start; }
.typing-content { display: flex; flex-direction: column; gap: 4px; }
.typing-dots { display: flex; gap: 4px; padding: 8px 12px; }
.typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: #9ca3af; animation: bounce 1.2s infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }
.typing-label { font-size: 11px; color: var(--text-secondary); padding-left: 12px; }
@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
.chat-input-area { position: relative; background: var(--bg-card); border-top: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; padding: 0 24px; }
.resize-handle { position: absolute; top: 0; left: 0; right: 0; height: 6px; cursor: row-resize; background: transparent; transition: background 0.15s; z-index: 10; }
.resize-handle:hover { background: var(--accent); }
.resize-handle::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 32px; height: 2px; background: var(--text-secondary); border-radius: 1px; opacity: 0.3; }
.input-wrapper { display: flex; align-items: center; gap: 10px; background: var(--bg-input); border-radius: var(--radius-lg); padding: 4px 4px 4px 16px; border: 1px solid transparent; transition: border-color 0.2s; }
.input-wrapper:focus-within { border-color: var(--accent); }
.input-wrapper textarea { flex: 1; border: none; background: none; resize: none; font-size: 14px; font-family: inherit; line-height: 1.5; padding: 8px 0; color: var(--text-primary); outline: none; max-height: 200px; }
.send-btn { width: 38px; height: 38px; border-radius: var(--radius); border: none; background: var(--accent); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity 0.2s; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.input-hint { font-size: 11px; color: var(--text-secondary); margin-top: 6px; padding-left: 4px; }

/* Right panel */
.qa-right { width: 420px; border-left: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; flex-shrink: 0; }
.right-tabs { display: flex; border-bottom: 1px solid var(--border); }
.right-tabs button { flex: 1; padding: 12px 0; border: none; background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.right-tabs button.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
.graph-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 16px; }
.graph-container { flex: 1; position: relative; min-height: 0; }
.graph-container canvas { width: 100%; height: 100%; }
.graph-legend { display: flex; gap: 14px; justify-content: center; padding: 10px 0 4px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-secondary); }
.legend-item i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.graph-hint { text-align: center; font-size: 10px; color: var(--text-secondary); padding-top: 2px; }
.reasoning-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.reasoning-header { padding: 14px 18px; border-bottom: 1px solid var(--border); }
.reasoning-title { font-size: 14px; font-weight: 600; }
.reasoning-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 6px; }
.reasoning-live { display: inline-block; padding: 1px 6px; background: #ef4444; color: white; border-radius: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; animation: pulse-live 1.5s infinite; }
@keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.steps-list { flex: 1; overflow-y: auto; padding: 16px; }
.step-card { display: flex; gap: 14px; margin-bottom: 4px; }
.step-entering { animation: stepFadeIn 0.4s ease-out; }
@keyframes stepFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.step-left { display: flex; flex-direction: column; align-items: center; width: 28px; flex-shrink: 0; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.step-line { width: 2px; flex: 1; background: var(--border); margin: 4px 0; }
.step-line-active { background: linear-gradient(180deg, var(--accent), transparent); animation: pulse-line 1s infinite; }
@keyframes pulse-line { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.step-body { flex: 1; min-width: 0; padding-bottom: 18px; }
.step-phase { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary); }
.step-subq { font-size: 12px; color: var(--text-secondary); font-style: italic; margin-bottom: 8px; }
.step-section { margin-bottom: 8px; }
.step-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 3px; }
.action-label { color: var(--accent); }
.obs-label { color: #10b981; }
.step-text { font-size: 12.5px; line-height: 1.6; color: var(--text-primary); }
.step-code { display: block; background: #f1f3f9; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-family: "Cascadia Code", Consolas, monospace; color: var(--accent); word-break: break-all; }
.step-obs { background: #f0fdf4; border: 1px solid #d1fae5; padding: 8px 12px; border-radius: 6px; font-size: 11.5px; font-family: "Cascadia Code", Consolas, monospace; color: #065f46; white-space: pre-wrap; line-height: 1.6; margin: 0; }
.step-answer { margin-top: 8px; padding: 8px 12px; background: #fef3c7; border-left: 3px solid #f59e0b; font-size: 12px; border-radius: 4px; }
.step-final { margin-top: 8px; padding: 10px 14px; background: #dcfce7; border-left: 3px solid #10b981; font-size: 13px; border-radius: 4px; font-weight: 500; }
.step-loading { display: flex; align-items: center; gap: 10px; padding: 12px 0 12px 42px; font-size: 12px; color: var(--text-secondary); }
.step-spinner { width: 18px; height: 18px; border: 2px solid var(--accent-light); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
