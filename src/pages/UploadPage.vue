<script setup>
import { ref } from 'vue'
import { buildHistory } from '../data/mock.js'

const uploadStep = ref(0)
const fileName = ref('')
const fileSize = ref('')
const progress = ref(0)
const logs = ref([])
const selectedHistory = ref(null)
const logFlex = ref(1)
const histFlex = ref(1)
let resizing = false
let resizeStartY = 0
let startLogFlex = 1
let startHistFlex = 1
const rightPanel = ref(null)
const isDragOver = ref(false)

const steps = [
  { id: 1, name: '文档解析', desc: '提取结构化文本片段', icon: '📄' },
  { id: 2, name: '超图构建', desc: 'ADHC 多智能体协作抽取', icon: '🕸️' },
  { id: 3, name: '索引构建', desc: 'Neo4j + FAISS 向量索引', icon: '🔍' },
]

const historyLogs = {
  1: [
    { time: '10:45:01', text: '正在解析文档 Biomedical.json（153 MB）...' },
    { time: '10:45:04', text: '✓ 提取 3,247 个文本片段' },
    { time: '10:45:06', text: '启动抽取智能体 — 识别 Compound / Gene / Disease / Symptom / Anatomy / Pathway / Protein 实体...' },
    { time: '10:45:10', text: '启动对齐智能体 — 合并同义实体、规范化 ID...' },
    { time: '10:45:13', text: '启动校验智能体 — 验证超边节点引用完整性...' },
    { time: '10:45:16', text: '✓ 构建 86 个实体节点（12 药物 / 40 基因 / 8 疾病 / 8 症状 / 8 解剖 / 8 通路 / 8 蛋白），31 条超边' },
    { time: '10:45:18', text: '写入 Neo4j 图数据库...' },
    { time: '10:45:20', text: '构建 FAISS 向量索引...' },
    { time: '10:45:22', text: '✓ 索引构建完成' },
    { time: '10:45:23', text: '🎉 知识库构建成功！' },
  ],
  2: [
    { time: '14:32:01', text: '正在解析文档...' },
    { time: '14:32:03', text: '✓ 提取 47 个文本片段' },
    { time: '14:32:05', text: '启动抽取智能体...' },
    { time: '14:32:08', text: '启动对齐智能体...' },
    { time: '14:32:11', text: '启动校验智能体...' },
    { time: '14:32:14', text: '✓ 构建 127 个实体节点，53 条超边' },
    { time: '14:32:16', text: '写入 Neo4j 图数据库...' },
    { time: '14:32:18', text: '构建 FAISS 向量索引...' },
    { time: '14:32:20', text: '✓ 索引构建完成' },
    { time: '14:32:21', text: '🎉 知识库构建成功！' },
  ],
  3: [
    { time: '16:48:01', text: '正在解析文档...' },
    { time: '16:48:04', text: '✓ 提取 82 个文本片段' },
    { time: '16:48:08', text: '启动抽取智能体...' },
    { time: '16:48:14', text: '启动对齐智能体...' },
    { time: '16:48:18', text: '启动校验智能体...' },
    { time: '16:48:22', text: '✓ 构建 215 个实体节点，97 条超边' },
    { time: '16:48:25', text: '写入 Neo4j 图数据库...' },
    { time: '16:48:28', text: '✓ 索引构建完成' },
    { time: '16:48:29', text: '🎉 知识库构建成功！' },
  ],
  4: [
    { time: '11:20:01', text: '正在解析文档...' },
    { time: '11:20:03', text: '✓ 提取 56 个文本片段' },
    { time: '11:20:06', text: '启动抽取智能体...' },
    { time: '11:20:10', text: '✓ 构建 163 个实体节点，72 条超边' },
    { time: '11:20:13', text: '写入 Neo4j 图数据库...' },
    { time: '11:20:15', text: '✓ 索引构建完成' },
    { time: '11:20:16', text: '🎉 知识库构建成功！' },
  ],
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  setFile(file)
}

function setFile(file) {
  fileName.value = file.name
  fileSize.value = file.size >= 1024 * 1024
    ? (file.size / 1024 / 1024).toFixed(1) + ' MB'
    : (file.size / 1024).toFixed(1) + ' KB'
}

function handleDrop(e) {
  e.preventDefault()
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

function handleDragOver(e) {
  e.preventDefault()
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function resetUpload() {
  uploadStep.value = 0
  fileName.value = ''
  fileSize.value = ''
  progress.value = 0
  logs.value = []
  selectedHistory.value = null
}

function startBuild() {
  if (!fileName.value) return
  uploadStep.value = 1
  progress.value = 0
  logs.value = []
  selectedHistory.value = null

  const pipeline = [
    { step: 1, delay: 800, log: '正在解析文档...', progressEnd: 25 },
    { step: 1, delay: 1200, log: '✓ 提取 47 个文本片段', progressEnd: 33 },
    { step: 2, delay: 1500, log: '启动抽取智能体...', progressEnd: 40 },
    { step: 2, delay: 1800, log: '启动对齐智能体...', progressEnd: 50 },
    { step: 2, delay: 1600, log: '启动校验智能体...', progressEnd: 60 },
    { step: 2, delay: 1400, log: '✓ 构建 127 个实体节点，53 条超边', progressEnd: 66 },
    { step: 3, delay: 1200, log: '写入 Neo4j 图数据库...', progressEnd: 75 },
    { step: 3, delay: 1500, log: '构建 FAISS 向量索引...', progressEnd: 90 },
    { step: 3, delay: 1000, log: '✓ 索引构建完成', progressEnd: 100 },
    { step: 4, delay: 500, log: '🎉 知识库构建成功！', progressEnd: 100 },
  ]

  let totalDelay = 0
  pipeline.forEach(({ step, delay, log, progressEnd }) => {
    totalDelay += delay
    setTimeout(() => {
      uploadStep.value = step
      logs.value.push({ text: log, time: new Date().toLocaleTimeString() })
      progress.value = progressEnd
    }, totalDelay)
  })
}

function selectHistory(h) {
  selectedHistory.value = h.id
  uploadStep.value = 4
  progress.value = 100
  logs.value = historyLogs[h.id] || []
}

function startResize(e) {
  resizing = true
  resizeStartY = e.clientY
  startLogFlex = logFlex.value
  startHistFlex = histFlex.value
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}
function onResize(e) {
  if (!resizing || !rightPanel.value) return
  const totalH = rightPanel.value.getBoundingClientRect().height - 6
  const dy = e.clientY - resizeStartY
  const ratio = dy / totalH
  const totalFlex = startLogFlex + startHistFlex
  let newLog = startLogFlex + ratio * totalFlex
  let newHist = startHistFlex - ratio * totalFlex
  const min = 0.15 * totalFlex
  if (newLog < min) { newLog = min; newHist = totalFlex - min }
  if (newHist < min) { newHist = min; newLog = totalFlex - min }
  logFlex.value = newLog
  histFlex.value = newHist
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
  <div class="upload-page">
    <div class="upload-left">
      <div class="upload-header">
        <h2>超图知识库构建</h2>
        <p>上传文档，自动构建超图知识库</p>
      </div>

      <div class="upload-content">
        <div v-if="uploadStep === 0" class="upload-zone">
          <input type="file" id="fileInput" accept=".txt,.json" @change="handleFileSelect" hidden />
          <label for="fileInput" class="upload-box" :class="{ 'drag-over': isDragOver }" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <div class="upload-text">{{ isDragOver ? '释放文件以上传' : '点击或拖拽上传文档' }}</div>
            <div class="upload-hint">支持 TXT、JSON 格式</div>
          </label>
          <div v-if="fileName" class="file-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
            <span>{{ fileName }}</span>
            <span class="file-size">{{ fileSize }}</span>
          </div>
          <button v-if="fileName" class="start-btn" @click="startBuild">开始构建</button>
        </div>

        <div v-else class="pipeline-view">
          <div class="pipeline-steps">
            <div v-for="s in steps" :key="s.id" class="pipeline-step" :class="{ active: uploadStep === s.id, done: uploadStep > s.id }">
              <div class="step-icon">{{ s.icon }}</div>
              <div class="step-info">
                <div class="step-name">{{ s.name }}</div>
                <div class="step-desc">{{ s.desc }}</div>
              </div>
              <div v-if="uploadStep === s.id" class="step-spinner"></div>
              <svg v-if="uploadStep > s.id" class="step-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="progress-bar"><div class="progress-fill" :style="{ width: progress + '%' }"></div></div>
          <div class="progress-text">{{ progress }}%</div>
          <div v-if="uploadStep === 4" class="complete-actions">
            <button class="view-kb-btn" @click="$router.push('/knowledge')">
              查看知识库
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button class="reset-btn" @click="resetUpload">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
              上传新文档
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="upload-right" ref="rightPanel">
      <div class="right-section" :style="{ flex: logFlex }">
        <div class="section-title">构建日志</div>
        <div class="log-panel">
          <div v-if="logs.length === 0" class="log-empty">选择历史记录或上传文档后查看日志</div>
          <div v-for="(log, i) in logs" :key="i" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-text">{{ log.text }}</span>
          </div>
        </div>
      </div>
      <div class="resize-handle" @mousedown="startResize"></div>
      <div class="right-section" :style="{ flex: histFlex }">
        <div class="section-title">历史构建记录</div>
        <div class="history-list">
          <div v-for="h in buildHistory" :key="h.id" class="history-item" :class="{ active: selectedHistory === h.id }" @click="selectHistory(h)">
            <div class="history-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
            <div class="history-info">
              <div class="history-name">{{ h.name }}</div>
              <div class="history-meta">{{ h.time }} · {{ h.nodes }} 节点 · {{ h.edges }} 超边</div>
            </div>
            <div class="history-badge">完成</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-page { display: flex; height: 100vh; }
.upload-left { flex: 1; padding: 40px; display: flex; flex-direction: column; overflow-y: auto; }
.upload-header h2 { font-size: 24px; margin-bottom: 8px; }
.upload-header p { color: var(--text-secondary); font-size: 14px; }
.upload-content { flex: 1; margin-top: 32px; }
.upload-zone { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.upload-box { width: 100%; max-width: 500px; padding: 60px 40px; border: 2px dashed var(--border); border-radius: var(--radius-lg); background: var(--bg-card); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 12px; transition: all 0.2s; }
.upload-box:hover, .upload-box.drag-over { border-color: var(--accent); background: var(--accent-light); }
.upload-box.drag-over { border-style: solid; transform: scale(1.02); }
.upload-box svg { color: var(--accent); }
.upload-text { font-size: 16px; font-weight: 600; }
.upload-hint { font-size: 13px; color: var(--text-secondary); }
.file-info { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); }
.file-size { color: var(--text-secondary); font-size: 13px; }
.start-btn { padding: 12px 32px; background: var(--accent); color: white; border: none; border-radius: var(--radius); font-size: 14px; font-weight: 600; cursor: pointer; }
.start-btn:hover { opacity: 0.9; }
.pipeline-view { display: flex; flex-direction: column; gap: 20px; }
.pipeline-steps { display: flex; flex-direction: column; gap: 12px; }
.pipeline-step { display: flex; align-items: center; gap: 16px; padding: 18px; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px solid var(--border); transition: all 0.3s; }
.pipeline-step.active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
.pipeline-step.done { border-color: #10b981; }
.step-icon { font-size: 28px; }
.step-info { flex: 1; }
.step-name { font-size: 14px; font-weight: 600; }
.step-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.step-spinner { width: 20px; height: 20px; border: 3px solid var(--accent-light); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.step-check { color: #10b981; }
.progress-bar { height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #667eea); transition: width 0.3s; }
.progress-text { text-align: center; font-size: 14px; font-weight: 600; color: var(--accent); }
.complete-actions { display: flex; gap: 12px; justify-content: center; }
.view-kb-btn { padding: 12px 24px; background: var(--accent); color: white; border: none; border-radius: var(--radius); font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.reset-btn { padding: 12px 24px; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
.reset-btn:hover { border-color: var(--accent); color: var(--accent); }
.upload-right { width: 380px; border-left: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; overflow: hidden; }
.right-section { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.resize-handle { height: 6px; background: var(--border); cursor: row-resize; flex-shrink: 0; position: relative; transition: background 0.15s; }
.resize-handle:hover { background: var(--accent); }
.resize-handle::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 32px; height: 2px; background: var(--text-secondary); border-radius: 1px; opacity: 0.5; }
.section-title { padding: 16px 20px 12px; font-size: 14px; font-weight: 600; flex-shrink: 0; }
.log-panel { flex: 1; overflow-y: auto; padding: 0 16px 16px; font-family: "Cascadia Code", Consolas, monospace; }
.log-empty { color: var(--text-secondary); font-size: 13px; text-align: center; padding: 24px 0; }
.log-item { display: flex; gap: 10px; padding: 5px 0; font-size: 12px; }
.log-time { color: var(--text-secondary); flex-shrink: 0; }
.log-text { color: var(--text-primary); }
.history-list { flex: 1; overflow-y: auto; padding: 0 12px 12px; }
.history-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius); cursor: pointer; transition: background 0.15s; }
.history-item:hover { background: var(--bg-input); }
.history-item.active { background: var(--accent-light); }
.history-icon { color: var(--text-secondary); flex-shrink: 0; }
.history-info { flex: 1; min-width: 0; }
.history-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.history-badge { font-size: 11px; padding: 2px 8px; background: #dcfce7; color: #166534; border-radius: 10px; flex-shrink: 0; }
</style>
