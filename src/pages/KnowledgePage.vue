<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { bioNodes, bioHyperedges, textChunks } from '../data/biomedical.js'

const canvas = ref(null)
const nodes = reactive([...bioNodes])
const edges = reactive([...bioHyperedges])
const selectedNode = ref(null)
const selectedEdge = ref(null)
const searchText = ref('')
const filterType = ref('all')
const showAddNode = ref(false)
const showAddEdge = ref(false)
const newNode = reactive({ id: '', label: '', name: '', type: 'Compound' })
const newEdge = reactive({ label: '', relation: '', nodeIds: '', description: '', topic: 'Healthcare' })

const typeColors = { Compound: '#4f8ef7', Gene: '#10b981', Disease: '#ef4444', Symptom: '#f59e42', Anatomy: '#a855f7', Pathway: '#0ea5e9', Protein: '#ec4899' }
const typeLabels = { Compound: '药物', Gene: '基因', Disease: '疾病', Symptom: '症状', Anatomy: '解剖', Pathway: '通路', Protein: '蛋白' }
const heColors = ['#4f8ef7', '#10b981', '#f59e42', '#a855f7', '#ef4444', '#6b7280', '#ec4899']
const zoomLevel = ref(1)
const topicFilter = ref('all')

const allTopics = computed(() => {
  const set = new Set()
  edges.forEach(e => { if (e.topic) set.add(e.topic) })
  return Array.from(set)
})

const topicLabels = {
  'Breast Cancer Treatment': '乳腺癌治疗',
  'Breast Cancer Pathology': '乳腺癌病理',
  'Lung Cancer Genomics': '肺癌基因组',
  'Ovarian & Colorectal': '卵巢癌与结直肠癌',
  'Signaling Pathways': '信号通路网络',
}

const filteredEdges = computed(() =>
  topicFilter.value === 'all' ? edges : edges.filter(e => e.topic === topicFilter.value)
)
const filteredEdgeNodeIds = computed(() => {
  if (topicFilter.value === 'all') return null
  const ids = new Set()
  filteredEdges.value.forEach(e => e.nodes.forEach(nid => ids.add(nid)))
  return ids
})

// 持久化节点/超边位置（拖动后保留）
const nodePositions = reactive({})
const edgePositions = reactive({})
let positionsInited = false

// 拖拽状态
const dragging = ref(null) // { type: 'node'|'edge', id: string }
let dragStartX = 0, dragStartY = 0
let dragMoved = false

// 画布平移状态
const panOffset = reactive({ x: 0, y: 0 })
let panning = false
let panStartX = 0, panStartY = 0

const stats = computed(() => ({
  totalNodes: nodes.length,
  totalHyperedges: edges.length,
  compounds: nodes.filter(n => n.type === 'Compound').length,
  genes: nodes.filter(n => n.type === 'Gene').length,
  diseases: nodes.filter(n => n.type === 'Disease').length,
  symptoms: nodes.filter(n => n.type === 'Symptom').length,
  anatomy: nodes.filter(n => n.type === 'Anatomy').length,
  pathways: nodes.filter(n => n.type === 'Pathway').length,
  proteins: nodes.filter(n => n.type === 'Protein').length,
}))

const filteredNodes = computed(() =>
  nodes.filter(n => {
    if (filterType.value !== 'all' && n.type !== filterType.value) return false
    if (searchText.value && !n.label.toLowerCase().includes(searchText.value.toLowerCase())) return false
    if (filteredEdgeNodeIds.value && !filteredEdgeNodeIds.value.has(n.id)) return false
    return true
  })
)

const selectedNodeData = computed(() => nodes.find(n => n.id === selectedNode.value))
const selectedEdgeData = computed(() => edges.find(e => e.id === selectedEdge.value))
const relatedEdges = computed(() => selectedNode.value ? edges.filter(e => e.nodes.includes(selectedNode.value)) : [])

// 当前选中超边所属子超图的文本块
const selectedChunks = computed(() => {
  const topic = selectedEdgeData.value?.topic
  if (!topic) return null
  return textChunks.find(tc => tc.topic === topic) || null
})
// 当前选中节点关联的文本块（取所有关联超边的 topic 去重）
const nodeChunks = computed(() => {
  if (!selectedNode.value) return []
  const topics = new Set(relatedEdges.value.map(e => e.topic))
  return textChunks.filter(tc => topics.has(tc.topic))
})

function initPositions() {
  if (positionsInited) return
  const cvs = canvas.value
  if (!cvs) return
  const rect = cvs.getBoundingClientRect()
  const W = rect.width, H = rect.height
  const centerX = W / 2, centerY = H / 2
  const z = zoomLevel.value

  function seededRand(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    h = ((h >>> 0) ^ (h << 13)) >>> 0;
    return (h % 10000) / 10000;
  }

  const outerR = Math.min(W, H) * 0.36 * z
  const innerR = Math.min(W, H) * 0.14 * z

  const placed = []
  nodes.forEach((n, i) => {
    const baseAngle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
    const aJ = (seededRand(n.id + 'ang') - 0.5) * 0.7
    const rJ = outerR * (0.7 + seededRand(n.id + 'rad') * 0.55)
    let x = centerX + rJ * Math.cos(baseAngle + aJ)
    let y = centerY + rJ * Math.sin(baseAngle + aJ)
    for (let t = 0; t < 8; t++) {
      let overlap = false
      for (const p of placed) {
        if (Math.hypot(p.x - x, p.y - y) < 36 * z) { overlap = true; break; }
      }
      if (!overlap) break
      x += (seededRand(n.id + 'n' + t) - 0.5) * 30 * z
      y += (seededRand(n.id + 'm' + t) - 0.5) * 30 * z
    }
    placed.push({ x, y })
    nodePositions[n.id] = { x, y }
  })

  const ePlaced = []
  edges.forEach((he, i) => {
    const baseAngle = (2 * Math.PI * i) / edges.length - Math.PI / 2
    const aJ = (seededRand(he.id + 'ea') - 0.5) * 1.2
    const rJ = innerR * (0.3 + seededRand(he.id + 'er') * 1.0)
    let x = centerX + rJ * Math.cos(baseAngle + aJ)
    let y = centerY + rJ * Math.sin(baseAngle + aJ)
    for (let t = 0; t < 6; t++) {
      let overlap = false
      for (const p of ePlaced) {
        if (Math.hypot(p.x - x, p.y - y) < 28 * z) { overlap = true; break; }
      }
      if (!overlap) break
      x += (seededRand(he.id + 'nx' + t) - 0.5) * 24 * z
      y += (seededRand(he.id + 'ny' + t) - 0.5) * 24 * z
    }
    ePlaced.push({ x, y })
    edgePositions[he.id] = { x, y }
  })
  positionsInited = true
}

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

  initPositions()

  // 应用平移偏移
  ctx.save()
  ctx.translate(panOffset.x, panOffset.y)

  // 绘制连线：虚拟超边节点 → 实体节点
  const hasTopicFilter = topicFilter.value !== 'all'
  edges.forEach((he) => {
    const ep = edgePositions[he.id]
    if (!ep) return
    const color = he.color || '#6b7280'
    const isSelected = selectedEdge.value === he.id
    const isFiltered = hasTopicFilter && he.topic !== topicFilter.value

    he.nodes.forEach(nid => {
      const np = nodePositions[nid]
      if (!np) return
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = isSelected ? 2.5 : 1.2
      ctx.globalAlpha = isFiltered ? 0.06 : (isSelected ? 0.8 : 0.3)
      ctx.moveTo(ep.x, ep.y)
      ctx.lineTo(np.x, np.y)
      ctx.stroke()
      ctx.globalAlpha = 1
    })
  })

  // 绘制虚拟超边节点（菱形）
  edges.forEach((he) => {
    const ep = edgePositions[he.id]
    if (!ep) return
    const color = he.color || '#6b7280'
    const isSelected = selectedEdge.value === he.id
    const isFiltered = hasTopicFilter && he.topic !== topicFilter.value
    const d = isSelected ? 18 : 13

    ctx.globalAlpha = isFiltered ? 0.1 : 1

    // 菱形
    ctx.beginPath()
    ctx.moveTo(ep.x, ep.y - d)
    ctx.lineTo(ep.x + d, ep.y)
    ctx.lineTo(ep.x, ep.y + d)
    ctx.lineTo(ep.x - d, ep.y)
    ctx.closePath()
    ctx.fillStyle = isSelected ? color : '#fff'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = isSelected ? 2.5 : 1.5
    ctx.stroke()

    // 标签
    ctx.font = `${isSelected ? 'bold ' : ''}10px sans-serif`
    ctx.fillStyle = isSelected ? '#fff' : color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(he.label, ep.x, ep.y)
    ctx.globalAlpha = 1
  })

  // 绘制实体节点（圆形，外圈）
  nodes.forEach(n => {
    const pos = nodePositions[n.id]
    if (!pos) return
    const isSelected = selectedNode.value === n.id
    const isFiltered = filteredEdgeNodeIds.value && !filteredEdgeNodeIds.value.has(n.id)
    const r = isSelected ? 26 : 20
    const color = typeColors[n.type] || '#6b7280'

    ctx.globalAlpha = isFiltered ? 0.1 : 1

    // 选中光晕
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, r + 8, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = 0.12
      ctx.fill()
      ctx.globalAlpha = isFiltered ? 0.1 : 1
    }

    // 圆形节点
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.stroke()

    // 标签
    ctx.font = `bold ${isSelected ? 12 : 11}px sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(n.label, pos.x, pos.y)
    ctx.globalAlpha = 1
  })

  ctx.restore()
}

function hitTest(mx, my) {
  // 将鼠标坐标转换为画布内容坐标（减去平移偏移）
  const cx = mx - panOffset.x
  const cy = my - panOffset.y
  for (const n of nodes) {
    const pos = nodePositions[n.id]
    if (pos && Math.hypot(pos.x - cx, pos.y - cy) < 26) return { type: 'node', id: n.id }
  }
  for (const he of edges) {
    const pos = edgePositions[he.id]
    if (pos && Math.hypot(pos.x - cx, pos.y - cy) < 18) return { type: 'edge', id: he.id }
  }
  return null
}

function handleMouseDown(e) {
  const cvs = canvas.value
  if (!cvs) return
  const rect = cvs.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const hit = hitTest(mx, my)
  if (hit) {
    dragging.value = hit
    dragStartX = mx
    dragStartY = my
    dragMoved = false
    cvs.style.cursor = 'grabbing'
    e.preventDefault()
  } else {
    // 空白区域：启动画布平移
    panning = true
    panStartX = e.clientX
    panStartY = e.clientY
    dragMoved = false
    cvs.style.cursor = 'grabbing'
    e.preventDefault()
  }
}

function handleMouseMove(e) {
  const cvs = canvas.value
  if (!cvs) return
  const rect = cvs.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  if (panning) {
    // 画布平移
    panOffset.x += e.clientX - panStartX
    panOffset.y += e.clientY - panStartY
    panStartX = e.clientX
    panStartY = e.clientY
    dragMoved = true
    drawGraph()
  } else if (dragging.value) {
    const d = dragging.value
    const positions = d.type === 'node' ? nodePositions : edgePositions
    const pos = positions[d.id]
    if (pos) {
      pos.x += mx - dragStartX
      pos.y += my - dragStartY
      dragStartX = mx
      dragStartY = my
      dragMoved = true
      drawGraph()
    }
  } else {
    // hover 时改变光标
    const hit = hitTest(mx, my)
    cvs.style.cursor = hit ? 'grab' : 'default'
  }
}

function handleMouseUp() {
  if (panning) {
    panning = false
    if (canvas.value) canvas.value.style.cursor = 'default'
  }
  if (dragging.value) {
    dragging.value = null
    if (canvas.value) canvas.value.style.cursor = 'default'
  }
}

function handleCanvasClick(e) {
  // 拖拽过则不触发选中
  if (dragMoved) { dragMoved = false; return }
  const cvs = canvas.value
  if (!cvs) return
  const rect = cvs.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  const hit = hitTest(mx, my)
  if (hit && hit.type === 'node') {
    selectedNode.value = hit.id
    selectedEdge.value = null
  } else if (hit && hit.type === 'edge') {
    selectedEdge.value = hit.id
    selectedNode.value = null
  } else {
    selectedNode.value = null
    selectedEdge.value = null
  }
  drawGraph()
}

function deleteNode(id) {
  const idx = nodes.findIndex(n => n.id === id)
  if (idx >= 0) nodes.splice(idx, 1)
  // 删除关联超边
  for (let i = edges.length - 1; i >= 0; i--) {
    if (edges[i].nodes.includes(id)) edges.splice(i, 1)
  }
  selectedNode.value = null
  drawGraph()
}

function deleteEdge(id) {
  const idx = edges.findIndex(e => e.id === id)
  if (idx >= 0) edges.splice(idx, 1)
  selectedEdge.value = null
  drawGraph()
}

function addNode() {
  if (!newNode.id || !newNode.label) return
  nodes.push({ ...newNode, name: newNode.label, x: 100 + Math.random() * 440, y: 100 + Math.random() * 400 })
  showAddNode.value = false
  Object.assign(newNode, { id: '', label: '', name: '', type: 'Compound' })
  drawGraph()
}

function addEdge() {
  if (!newEdge.label || !newEdge.nodeIds) return
  const nodeIds = newEdge.nodeIds.split(',').map(s => s.trim()).filter(Boolean)
  edges.push({
    id: 'he_' + Date.now(),
    label: newEdge.label,
    relation: newEdge.relation || newEdge.label,
    nodes: nodeIds,
    color: heColors[edges.length % heColors.length],
    topic: newEdge.topic,
    description: newEdge.description,
  })
  showAddEdge.value = false
  Object.assign(newEdge, { label: '', relation: '', nodeIds: '', description: '', topic: 'Breast Cancer Treatment' })
  drawGraph()
}

onMounted(() => {
  drawGraph()
  window.addEventListener('resize', () => { positionsInited = false; drawGraph() })
  canvas.value?.addEventListener('mouseleave', handleMouseUp)
})
</script>

<template>
  <div class="knowledge-page">
    <div class="kb-header">
      <div class="kb-header-left">
        <h2>超图知识库</h2>
        <span class="kb-subtitle">菱形=超边 · 圆形=实体</span>
      </div>
      <div class="kb-header-stats">
        <span class="hstat"><b>{{ stats.totalNodes }}</b> 节点</span>
        <span class="hstat"><b>{{ stats.totalHyperedges }}</b> 超边</span>
        <span class="hstat" style="color:#4f8ef7"><b>{{ stats.compounds }}</b> 药物</span>
        <span class="hstat" style="color:#10b981"><b>{{ stats.genes }}</b> 基因</span>
        <span class="hstat" style="color:#ef4444"><b>{{ stats.diseases }}</b> 疾病</span>
        <span class="hstat" style="color:#f59e42"><b>{{ stats.symptoms }}</b> 症状</span>
        <span class="hstat" style="color:#a855f7"><b>{{ stats.anatomy }}</b> 解剖</span>
        <span class="hstat" style="color:#0ea5e9"><b>{{ stats.pathways }}</b> 通路</span>
        <span class="hstat" style="color:#ec4899"><b>{{ stats.proteins }}</b> 蛋白</span>
      </div>
      <div class="kb-actions">
        <button class="action-btn" @click="showAddNode = true">+ 节点</button>
        <button class="action-btn" @click="showAddEdge = true">+ 超边</button>
      </div>
    </div>

    <div class="topic-bar">
      <span class="topic-bar-label">子超图:</span>
      <button class="topic-chip" :class="{ active: topicFilter === 'all' }" @click="topicFilter = 'all'; drawGraph()">全部</button>
      <button v-for="t in allTopics" :key="t" class="topic-chip" :class="{ active: topicFilter === t }" @click="topicFilter = t; drawGraph()">
        {{ topicLabels[t] || t }}
      </button>
    </div>

    <div class="kb-body">
      <div class="kb-sidebar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchText" placeholder="搜索实体..." />
        </div>
        <div class="filter-tabs">
          <button :class="{ active: filterType === 'all' }" @click="filterType = 'all'">全部</button>
          <button :class="{ active: filterType === 'Compound' }" @click="filterType = 'Compound'">药物</button>
          <button :class="{ active: filterType === 'Gene' }" @click="filterType = 'Gene'">基因</button>
          <button :class="{ active: filterType === 'Disease' }" @click="filterType = 'Disease'">疾病</button>
          <button :class="{ active: filterType === 'Symptom' }" @click="filterType = 'Symptom'">症状</button>
          <button :class="{ active: filterType === 'Anatomy' }" @click="filterType = 'Anatomy'">解剖</button>
          <button :class="{ active: filterType === 'Pathway' }" @click="filterType = 'Pathway'">通路</button>
          <button :class="{ active: filterType === 'Protein' }" @click="filterType = 'Protein'">蛋白</button>
        </div>
        <div class="node-list">
          <div v-for="n in filteredNodes" :key="n.id" class="node-item" :class="{ active: selectedNode === n.id }" @click="selectedNode = n.id; selectedEdge = null; drawGraph()">
            <div class="node-dot" :style="{ background: typeColors[n.type] }"></div>
            <div><div class="node-name">{{ n.label }}</div><div class="node-type">{{ typeLabels[n.type] || n.type }} · {{ n.id }}</div></div>
          </div>
        </div>
      </div>

      <div class="kb-center">
        <div class="graph-canvas-wrapper">
          <canvas ref="canvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @click="handleCanvasClick"></canvas>
          <div class="zoom-controls">
            <button @click="zoomLevel = Math.min(zoomLevel + 0.15, 2); positionsInited = false; drawGraph()" title="放大">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="zoom-label">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomLevel = Math.max(zoomLevel - 0.15, 0.4); positionsInited = false; drawGraph()" title="缩小">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button @click="zoomLevel = 1; panOffset.x = 0; panOffset.y = 0; positionsInited = false; drawGraph()" title="重置" style="margin-left:4px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="kb-detail">
        <div v-if="!selectedNode && !selectedEdge" class="detail-empty">点击图中的节点或菱形超边查看详情</div>

        <!-- 节点详情 -->
        <template v-if="selectedNode && selectedNodeData">
          <div class="detail-header">
            <span>节点详情</span>
            <button class="del-btn" @click="deleteNode(selectedNode)">删除</button>
          </div>
          <div class="detail-body">
            <div class="detail-row"><span class="detail-label">ID</span><code>{{ selectedNodeData.id }}</code></div>
            <div class="detail-row"><span class="detail-label">名称</span><span>{{ selectedNodeData.name }}</span></div>
            <div class="detail-row"><span class="detail-label">类型</span><span :style="{ color: typeColors[selectedNodeData.type] }">{{ typeLabels[selectedNodeData.type] || selectedNodeData.type }}</span></div>
            <div class="detail-section">
              <span class="detail-label">关联超边 ({{ relatedEdges.length }})</span>
              <div class="edge-list">
                <div v-for="he in relatedEdges" :key="he.id" class="edge-item" @click="selectedEdge = he.id; selectedNode = null; drawGraph()">
                  <div class="edge-rel" :style="{ color: he.color }">{{ he.label }} ({{ he.relation }})</div>
                  <div class="edge-nodes-text">{{ he.nodes.map(nid => nodes.find(n => n.id === nid)?.label || nid).join(' ↔ ') }}</div>
                  <div v-if="he.description" class="edge-desc">{{ he.description }}</div>
                </div>
              </div>
            </div>
            <div v-if="nodeChunks.length" class="detail-section">
              <span class="detail-label">关联文本块</span>
              <div v-for="tc in nodeChunks" :key="tc.topic" class="chunk-group">
                <div class="chunk-topic">{{ tc.title }}</div>
                <div v-for="(c, ci) in tc.chunks" :key="ci" class="chunk-text">{{ c }}</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 超边详情 -->
        <template v-if="selectedEdge && selectedEdgeData">
          <div class="detail-header">
            <span>超边详情</span>
            <button class="del-btn" @click="deleteEdge(selectedEdge)">删除</button>
          </div>
          <div class="detail-body">
            <div class="detail-row"><span class="detail-label">ID</span><code>{{ selectedEdgeData.id }}</code></div>
            <div class="detail-row"><span class="detail-label">关系</span><span :style="{ color: selectedEdgeData.color }">{{ selectedEdgeData.label }}</span></div>
            <div class="detail-row"><span class="detail-label">类型</span><span>{{ selectedEdgeData.relation }}</span></div>
            <div class="detail-row"><span class="detail-label">主题</span><span>{{ selectedEdgeData.topic }}</span></div>
            <div class="detail-section">
              <span class="detail-label">关联实体</span>
              <div class="edge-list">
                <div v-for="nid in selectedEdgeData.nodes" :key="nid" class="edge-item" @click="selectedNode = nid; selectedEdge = null; drawGraph()">
                  <div class="edge-rel">{{ nodes.find(n => n.id === nid)?.label || nid }}</div>
                  <div class="edge-nodes-text">{{ nodes.find(n => n.id === nid)?.type }} · {{ nid }}</div>
                </div>
              </div>
            </div>
            <div v-if="selectedEdgeData.description" class="detail-section">
              <span class="detail-label">自然语言描述</span>
              <div class="edge-desc" style="margin-top:8px;padding:10px 12px;background:var(--bg-input);border-radius:var(--radius)">{{ selectedEdgeData.description }}</div>
            </div>
            <div v-if="selectedChunks" class="detail-section">
              <span class="detail-label">所属子超图文本块</span>
              <div class="chunk-group">
                <div class="chunk-topic">{{ selectedChunks.title }}</div>
                <div v-for="(c, ci) in selectedChunks.chunks" :key="ci" class="chunk-text">{{ c }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 添加节点弹窗 -->
    <div v-if="showAddNode" class="modal-overlay" @click.self="showAddNode = false">
      <div class="modal">
        <h3>添加实体节点</h3>
        <div class="modal-field"><label>ID</label><input v-model="newNode.id" placeholder="如 DB00123" /></div>
        <div class="modal-field"><label>名称</label><input v-model="newNode.label" placeholder="如 Aspirin" /></div>
        <div class="modal-field"><label>类型</label><select v-model="newNode.type"><option>Compound</option><option>Gene</option><option>Disease</option></select></div>
        <div class="modal-actions"><button @click="showAddNode = false">取消</button><button class="primary" @click="addNode">添加</button></div>
      </div>
    </div>

    <!-- 添加超边弹窗 -->
    <div v-if="showAddEdge" class="modal-overlay" @click.self="showAddEdge = false">
      <div class="modal">
        <h3>添加超边</h3>
        <div class="modal-field"><label>关系名称</label><input v-model="newEdge.label" placeholder="如 treats" /></div>
        <div class="modal-field"><label>关系类型</label><input v-model="newEdge.relation" placeholder="如 Compound-treats-Disease" /></div>
        <div class="modal-field"><label>关联节点 ID（逗号分隔）</label><input v-model="newEdge.nodeIds" placeholder="如 DB00675,D001943" /></div>
        <div class="modal-field"><label>主题</label><select v-model="newEdge.topic"><option>Breast Cancer Treatment</option><option>Breast Cancer Pathology</option><option>Lung Cancer Genomics</option><option>Ovarian &amp; Colorectal</option></select></div>
        <div class="modal-field"><label>自然语言描述</label><textarea v-model="newEdge.description" placeholder="描述该超边的语义含义..."></textarea></div>
        <div class="modal-actions"><button @click="showAddEdge = false">取消</button><button class="primary" @click="addEdge">添加</button></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-page { display: flex; flex-direction: column; height: 100vh; }
.kb-header { padding: 10px 20px; border-bottom: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; gap: 20px; }
.kb-header-left h2 { font-size: 16px; margin: 0; }
.kb-subtitle { font-size: 11px; color: var(--text-secondary); }
.kb-header-stats { display: flex; gap: 12px; flex: 1; }
.hstat { font-size: 12px; color: var(--text-secondary); }
.hstat b { font-weight: 700; margin-right: 2px; }
.kb-actions { display: flex; gap: 6px; flex-shrink: 0; }
.action-btn { padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-card); font-size: 12px; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: var(--accent); color: var(--accent); }
.topic-bar { padding: 8px 20px; border-bottom: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.topic-bar-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; flex-shrink: 0; }
.topic-chip { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-card); font-size: 11px; cursor: pointer; transition: all 0.2s; color: var(--text-secondary); }
.topic-chip:hover { border-color: var(--accent); color: var(--accent); }
.topic-chip.active { background: var(--accent); color: white; border-color: var(--accent); }
.kb-body { flex: 1; display: flex; overflow: hidden; }
.kb-sidebar { width: 260px; border-right: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; }
.search-box { margin: 12px; padding: 8px 12px; background: var(--bg-input); border-radius: var(--radius); display: flex; align-items: center; gap: 8px; }
.search-box input { flex: 1; border: none; background: none; outline: none; font-size: 13px; }
.filter-tabs { display: flex; padding: 0 8px; gap: 2px; border-bottom: 1px solid var(--border); }
.filter-tabs button { flex: 1; padding: 8px 0; border: none; background: none; font-size: 11px; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; }
.filter-tabs button.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
.node-list { flex: 1; overflow-y: auto; padding: 6px; }
.node-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius); cursor: pointer; transition: background 0.15s; }
.node-item:hover { background: var(--bg-input); }
.node-item.active { background: var(--accent-light); }
.node-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.node-name { font-size: 12px; font-weight: 600; }
.node-type { font-size: 10px; color: var(--text-secondary); }
.kb-center { flex: 1; display: flex; flex-direction: column; background: var(--bg-primary); }
.graph-canvas-wrapper { flex: 1; padding: 16px; position: relative; }
.graph-canvas-wrapper canvas { width: 100%; height: 100%; cursor: pointer; }
.zoom-controls { position: absolute; bottom: 24px; right: 24px; display: flex; align-items: center; gap: 4px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 4px; box-shadow: var(--shadow-sm); }
.zoom-controls button { width: 28px; height: 28px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: all 0.15s; }
.zoom-controls button:hover { background: var(--bg-input); color: var(--accent); }
.zoom-label { font-size: 11px; color: var(--text-secondary); min-width: 36px; text-align: center; }
.kb-detail { width: 320px; border-left: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; overflow-y: auto; }
.detail-empty { padding: 40px 20px; text-align: center; color: var(--text-secondary); font-size: 13px; }
.detail-header { padding: 14px 18px; border-bottom: 1px solid var(--border); font-size: 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.del-btn { padding: 4px 10px; border: 1px solid #fca5a5; border-radius: 4px; background: #fef2f2; color: #dc2626; font-size: 11px; cursor: pointer; }
.del-btn:hover { background: #fee2e2; }
.detail-body { padding: 16px 18px; }
.detail-row { display: flex; gap: 10px; margin-bottom: 10px; font-size: 13px; }
.detail-label { color: var(--text-secondary); font-weight: 600; min-width: 50px; flex-shrink: 0; }
.detail-row code { background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.detail-section { margin-top: 16px; }
.detail-section .detail-label { margin-bottom: 8px; display: block; }
.edge-list { display: flex; flex-direction: column; gap: 8px; }
.edge-item { padding: 10px 12px; background: var(--bg-input); border-radius: var(--radius); cursor: pointer; transition: background 0.15s; }
.edge-item:hover { background: var(--accent-light); }
.edge-item.active { background: var(--accent-light); border: 1px solid var(--accent); }
.edge-rel { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.edge-nodes-text { font-size: 11px; color: var(--text-secondary); }
.edge-desc { font-size: 11px; color: var(--text-primary); margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); line-height: 1.5; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; width: 400px; box-shadow: var(--shadow-md); }
.modal h3 { font-size: 16px; margin-bottom: 16px; }
.modal-field { margin-bottom: 12px; }
.modal-field label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.modal-field input, .modal-field select, .modal-field textarea { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; outline: none; font-family: inherit; }
.modal-field textarea { resize: vertical; min-height: 60px; }
.modal-field input:focus, .modal-field select:focus, .modal-field textarea:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.modal-actions button { padding: 8px 20px; border-radius: var(--radius); font-size: 13px; cursor: pointer; border: 1px solid var(--border); background: var(--bg-card); }
.modal-actions .primary { background: var(--accent); color: white; border-color: var(--accent); }
.chunk-group { margin-top: 8px; }
.chunk-topic { font-size: 12px; font-weight: 700; color: var(--accent); margin-bottom: 6px; padding: 4px 8px; background: var(--accent-light); border-radius: 4px; }
.chunk-text { font-size: 12px; line-height: 1.7; color: var(--text-primary); padding: 8px 10px; margin-bottom: 6px; background: var(--bg-input); border-radius: var(--radius); border-left: 3px solid var(--accent); }
</style>
