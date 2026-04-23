<script setup>
import { ref, reactive, computed } from 'vue'
import { aiConfig, providers, saveConfig, resetConfig, isConfigured, chatCompletion, addProvider, removeProvider } from '../store/aiConfig.js'

const activeSection = ref('ai')
const isSaving = ref(false)
const saveSuccess = ref(false)
const testResult = ref('')
const testError = ref('')
const showApiKey = ref(false)
const showAddProvider = ref(false)
const newProvider = reactive({ label: '', endpoint: '', models: '' })

const sections = [
  { id: 'ai', label: 'AI 模型接入', icon: 'AI' },
  { id: 'prompt', label: '系统提示词', icon: 'SYS' },
  { id: 'params', label: '生成参数', icon: 'GEN' },
  { id: 'retrieval', label: '检索参数', icon: 'RET' },
  { id: 'reasoning', label: '推理参数', icon: 'RSN' },
  { id: 'database', label: '数据存储', icon: 'DB' },
]

const currentProvider = computed(() => providers.find(p => p.id === aiConfig.provider))

function selectProvider(p) {
  aiConfig.provider = p.id
  aiConfig.endpoint = p.endpoint
  if (p.models.length && !p.models.includes(aiConfig.model)) {
    aiConfig.model = p.models[0]
  }
}

function handleAddProvider() {
  if (!newProvider.label.trim()) return
  const models = newProvider.models.trim() ? newProvider.models.split(',').map(s => s.trim()).filter(Boolean) : []
  const id = addProvider(newProvider.label.trim(), newProvider.endpoint.trim() || 'http://localhost:8000/v1', models)
  selectProvider(providers.find(p => p.id === id))
  newProvider.label = ''
  newProvider.endpoint = ''
  newProvider.models = ''
  showAddProvider.value = false
}

function handleRemoveProvider(id) {
  if (aiConfig.provider === id) {
    aiConfig.provider = providers[0]?.id || ''
    if (providers[0]) {
      aiConfig.endpoint = providers[0].endpoint
    }
  }
  removeProvider(id)
}

function handleSave() {
  isSaving.value = true
  saveSuccess.value = false
  saveConfig()
  setTimeout(() => {
    isSaving.value = false
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 2000)
  }, 400)
}

function handleReset() {
  resetConfig()
}

async function testConnection() {
  testResult.value = 'testing'
  testError.value = ''
  try {
    await chatCompletion([
      { role: 'system', content: 'Reply with exactly: Connection successful.' },
      { role: 'user', content: 'Test' },
    ])
    testResult.value = 'success'
    setTimeout(() => { testResult.value = '' }, 3000)
  } catch (e) {
    testResult.value = 'error'
    testError.value = e.message || '连接失败'
  }
}

const retrievalConfig = ref({ indexType: 'IVF-PQ', nprobe: 16, topK: 15, similarityThreshold: 0.65 })
const reasoningConfig = ref({ maxIterations: 10, contextLimit: 6000, enableSummary: true, summaryThreshold: 4000 })
const dbConfig = ref({ neo4jUri: 'bolt://localhost:7687', neo4jUser: 'neo4j', neo4jPassword: '********', neo4jStatus: 'connected', faissIndexPath: './data/faiss_index', faissStatus: 'loaded' })
</script>

<template>
  <div class="settings-page">
    <div class="settings-nav">
      <div class="nav-header">
        <h3>模型接入设置</h3>
        <p>配置 AI 模型服务与推理参数</p>
      </div>
      <div class="nav-list">
        <div v-for="s in sections" :key="s.id" class="nav-item" :class="{ active: activeSection === s.id }" @click="activeSection = s.id">
          <div class="nav-icon-badge">{{ s.icon }}</div>
          <span>{{ s.label }}</span>
        </div>
      </div>

      <div class="arch-card">
        <div class="arch-title">当前接入状态</div>
        <div class="status-summary">
          <div class="ss-row" :class="isConfigured ? 'ok' : 'warn'">
            <span class="ss-dot"></span>
            <span>{{ isConfigured ? '已配置' : '未配置 API Key' }}</span>
          </div>
          <div class="ss-detail">{{ currentProvider?.label || '未选择' }} / {{ aiConfig.model }}</div>
        </div>
      </div>
    </div>

    <div class="settings-content">
      <div class="content-header">
        <div>
          <h2>{{ sections.find(s => s.id === activeSection)?.label }}</h2>
          <p class="content-desc" v-if="activeSection === 'ai'">配置 AI 模型服务商、API Key 与模型选择，用于问答推理对话</p>
          <p class="content-desc" v-if="activeSection === 'prompt'">配置发送给 AI 模型的系统提示词</p>
          <p class="content-desc" v-if="activeSection === 'params'">配置模型生成参数，包括 Temperature、Top-P 等</p>
          <p class="content-desc" v-if="activeSection === 'retrieval'">配置 FAISS 向量索引与超图检索的相关参数</p>
          <p class="content-desc" v-if="activeSection === 'reasoning'">配置推理循环控制参数</p>
          <p class="content-desc" v-if="activeSection === 'database'">配置 Neo4j 图数据库与 FAISS 向量索引的连接信息</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="handleReset">重置默认</button>
          <button class="btn-primary" :disabled="isSaving" @click="handleSave">
            <template v-if="isSaving"><span class="btn-spinner"></span> 保存中...</template>
            <template v-else-if="saveSuccess">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              已保存
            </template>
            <template v-else>保存配置</template>
          </button>
        </div>
      </div>

      <div class="config-body">
        <!-- AI Model Config -->
        <template v-if="activeSection === 'ai'">
          <div class="config-card">
            <div class="card-header">
              <span class="card-title">服务商选择</span>
              <button class="add-provider-btn" @click="showAddProvider = true">+ 添加服务商</button>
            </div>
            <div class="provider-scroll">
              <div class="provider-grid">
                <div v-for="p in providers" :key="p.id" class="provider-card" :class="{ active: aiConfig.provider === p.id }" @click="selectProvider(p)">
                  <div class="provider-top">
                    <div class="provider-name">{{ p.label }}</div>
                    <button v-if="!p.builtin" class="provider-del" @click.stop="handleRemoveProvider(p.id)" title="删除">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div class="provider-endpoint">{{ p.endpoint }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="config-card">
            <div class="card-header">
              <span class="card-title">连接配置</span>
              <div v-if="isConfigured" class="status-badge connected"><span class="status-dot"></span>已配置</div>
              <div v-else class="status-badge disconnected"><span class="status-dot"></span>未配置</div>
            </div>
            <div class="field-grid">
              <div class="field">
                <label>Base URL (API 端点)</label>
                <input v-model="aiConfig.endpoint" placeholder="https://api.openai.com/v1" />
                <div class="field-hint">OpenAI 兼容接口地址，可自由输入（支持 vLLM、Ollama 等）</div>
              </div>
              <div class="field">
                <label>模型名称</label>
                <div class="model-select">
                  <select v-if="currentProvider?.models?.length" v-model="aiConfig.model">
                    <option v-for="m in currentProvider.models" :key="m" :value="m">{{ m }}</option>
                  </select>
                  <input v-model="aiConfig.model" placeholder="输入模型名称，如 gpt-4o" />
                </div>
                <div class="field-hint">可从预设列表选择，也可直接输入任意模型名称</div>
              </div>
              <div class="field full-width">
                <label>API Key</label>
                <div class="input-with-btn">
                  <div class="api-key-input">
                    <input :type="showApiKey ? 'text' : 'password'" v-model="aiConfig.apiKey" placeholder="sk-..." />
                    <button class="eye-btn" @click="showApiKey = !showApiKey" type="button">
                      <svg v-if="!showApiKey" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                  <button class="test-btn" :disabled="testResult === 'testing' || !aiConfig.apiKey" @click="testConnection">
                    <template v-if="testResult === 'testing'"><span class="btn-spinner-sm"></span> 测试中</template>
                    <template v-else>测试连接</template>
                  </button>
                </div>
                <div v-if="testResult === 'success'" class="field-hint" style="color:#059669">连接成功！模型响应正常。</div>
                <div v-if="testResult === 'error'" class="field-hint" style="color:#dc2626">{{ testError }}</div>
              </div>
            </div>
          </div>
        </template>

        <!-- System Prompt -->
        <template v-if="activeSection === 'prompt'">
          <div class="config-card">
            <div class="card-header"><span class="card-title">系统提示词 (System Prompt)</span></div>
            <div class="field-grid">
              <div class="field full-width">
                <label>系统提示词</label>
                <textarea class="prompt-textarea" v-model="aiConfig.systemPrompt" rows="8" placeholder="输入系统提示词..."></textarea>
                <div class="field-hint">系统提示词会作为每次对话的第一条 system 消息发送给模型</div>
              </div>
            </div>
          </div>
        </template>

        <!-- Generation Parameters -->
        <template v-if="activeSection === 'params'">
          <div class="config-card">
            <div class="card-header"><span class="card-title">生成参数</span></div>
            <div class="field-grid">
              <div class="field">
                <label>Temperature</label>
                <div class="slider-field">
                  <input type="range" v-model.number="aiConfig.temperature" min="0" max="2" step="0.1" />
                  <span class="slider-value">{{ aiConfig.temperature }}</span>
                </div>
                <div class="field-hint">值越低输出越确定，值越高越有创造性</div>
              </div>
              <div class="field">
                <label>Top-P</label>
                <div class="slider-field">
                  <input type="range" v-model.number="aiConfig.topP" min="0" max="1" step="0.05" />
                  <span class="slider-value">{{ aiConfig.topP }}</span>
                </div>
              </div>
              <div class="field">
                <label>最大输出 Tokens</label>
                <input type="number" v-model.number="aiConfig.maxTokens" min="256" max="32768" step="256" />
              </div>
            </div>
          </div>
        </template>

        <!-- Retrieval Config -->
        <template v-if="activeSection === 'retrieval'">
          <div class="config-card">
            <div class="card-header"><span class="card-title">FAISS 向量索引参数</span></div>
            <div class="field-grid">
              <div class="field">
                <label>索引类型</label>
                <select v-model="retrievalConfig.indexType"><option>IVF-PQ</option><option>HNSW</option><option>IVF-Flat</option><option>Flat</option></select>
                <div class="field-hint">IVF-PQ: 倒排文件 + 乘积量化</div>
              </div>
              <div class="field">
                <label>nprobe</label>
                <div class="slider-field"><input type="range" v-model.number="retrievalConfig.nprobe" min="1" max="128" step="1" /><span class="slider-value">{{ retrievalConfig.nprobe }}</span></div>
              </div>
              <div class="field">
                <label>Top-K</label>
                <div class="slider-field"><input type="range" v-model.number="retrievalConfig.topK" min="1" max="50" step="1" /><span class="slider-value">{{ retrievalConfig.topK }}</span></div>
              </div>
              <div class="field">
                <label>相似度阈值</label>
                <div class="slider-field"><input type="range" v-model.number="retrievalConfig.similarityThreshold" min="0" max="1" step="0.05" /><span class="slider-value">{{ retrievalConfig.similarityThreshold }}</span></div>
              </div>
            </div>
          </div>
        </template>

        <!-- Reasoning Config -->
        <template v-if="activeSection === 'reasoning'">
          <div class="config-card">
            <div class="card-header"><span class="card-title">推理循环控制</span></div>
            <div class="field-grid">
              <div class="field">
                <label>最大迭代轮次</label>
                <div class="slider-field"><input type="range" v-model.number="reasoningConfig.maxIterations" min="1" max="30" step="1" /><span class="slider-value">{{ reasoningConfig.maxIterations }}</span></div>
                <div class="field-hint">防止推理陷入无限循环（默认 10 轮）</div>
              </div>
              <div class="field">
                <label>上下文长度限制 (tokens)</label>
                <input type="number" v-model.number="reasoningConfig.contextLimit" min="1000" max="32000" step="500" />
              </div>
              <div class="field full-width">
                <div class="toggle-field">
                  <label>启用上下文摘要压缩</label>
                  <div class="toggle" :class="{ on: reasoningConfig.enableSummary }" @click="reasoningConfig.enableSummary = !reasoningConfig.enableSummary"><div class="toggle-thumb"></div></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Database Config -->
        <template v-if="activeSection === 'database'">
          <div class="config-card">
            <div class="card-header">
              <span class="card-title">Neo4j 图数据库</span>
              <div class="status-badge connected"><span class="status-dot"></span>已连接</div>
            </div>
            <div class="field-grid">
              <div class="field"><label>连接地址</label><input v-model="dbConfig.neo4jUri" /></div>
              <div class="field"><label>用户名</label><input v-model="dbConfig.neo4jUser" /></div>
              <div class="field"><label>密码</label><input type="password" v-model="dbConfig.neo4jPassword" /></div>
            </div>
          </div>
          <div class="config-card">
            <div class="card-header">
              <span class="card-title">FAISS 向量索引</span>
              <div class="status-badge connected"><span class="status-dot"></span>已加载</div>
            </div>
            <div class="field-grid">
              <div class="field full-width"><label>索引文件路径</label><input v-model="dbConfig.faissIndexPath" /></div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Add Provider Modal -->
    <Teleport to="body">
      <div v-if="showAddProvider" class="modal-mask" @click.self="showAddProvider = false">
        <div class="modal-box">
          <h3>添加服务商</h3>
          <div class="modal-field">
            <label>名称</label>
            <input v-model="newProvider.label" placeholder="例如：Moonshot AI" />
          </div>
          <div class="modal-field">
            <label>Base URL</label>
            <input v-model="newProvider.endpoint" placeholder="https://api.example.com/v1" />
          </div>
          <div class="modal-field">
            <label>预设模型（逗号分隔，可选）</label>
            <input v-model="newProvider.models" placeholder="model-a, model-b" />
          </div>
          <div class="modal-actions">
            <button @click="showAddProvider = false">取消</button>
            <button class="primary" @click="handleAddProvider" :disabled="!newProvider.label.trim()">添加</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.settings-page { display: flex; height: 100vh; }
.settings-nav { width: 260px; background: var(--bg-card); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
.nav-header { padding: 24px 20px 16px; border-bottom: 1px solid var(--border); }
.nav-header h3 { font-size: 16px; font-weight: 700; }
.nav-header p { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.nav-list { padding: 12px; display: flex; flex-direction: column; gap: 2px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--radius); cursor: pointer; transition: all 0.15s; font-size: 13px; color: var(--text-secondary); }
.nav-item:hover { background: var(--bg-input); color: var(--text-primary); }
.nav-item.active { background: var(--accent-light); color: var(--accent); font-weight: 600; }
.nav-icon-badge { width: 32px; height: 24px; border-radius: 4px; background: var(--bg-input); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; letter-spacing: 0.3px; color: var(--text-secondary); flex-shrink: 0; }
.nav-item.active .nav-icon-badge { background: var(--accent); color: white; }

.arch-card { margin: auto 12px 16px; padding: 14px; background: var(--bg-input); border-radius: var(--radius); }
.arch-title { font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; text-align: center; }
.status-summary { display: flex; flex-direction: column; gap: 6px; }
.ss-row { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
.ss-row.ok { color: #059669; }
.ss-row.warn { color: #d97706; }
.ss-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.ss-detail { font-size: 11px; color: var(--text-secondary); padding-left: 16px; }

.settings-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-primary); }
.content-header { padding: 24px 32px 16px; background: var(--bg-card); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
.content-header h2 { font-size: 18px; font-weight: 700; }
.content-desc { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-primary { padding: 8px 20px; background: var(--accent); color: white; border: none; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; }
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { padding: 8px 16px; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
.btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
.btn-spinner-sm { width: 12px; height: 12px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.config-body { flex: 1; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; gap: 20px; }
.config-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
.card-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 14px; font-weight: 600; }
.status-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 4px 10px; border-radius: 20px; }
.status-badge.connected { background: #ecfdf5; color: #059669; }
.status-badge.disconnected { background: #fef3c7; color: #d97706; }
.status-badge .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.add-provider-btn { padding: 4px 12px; border: 1px dashed var(--border); border-radius: var(--radius); background: none; font-size: 12px; cursor: pointer; color: var(--text-secondary); transition: all 0.2s; }
.add-provider-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Provider grid — scrollable */
.provider-scroll { max-height: 220px; overflow-y: auto; }
.provider-grid { padding: 16px 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.provider-card { padding: 12px 14px; border: 2px solid var(--border); border-radius: var(--radius); cursor: pointer; transition: all 0.2s; position: relative; }
.provider-card:hover { border-color: var(--accent); }
.provider-card.active { border-color: var(--accent); background: var(--accent-light); }
.provider-top { display: flex; align-items: center; justify-content: space-between; }
.provider-name { font-size: 13px; font-weight: 600; }
.provider-del { border: none; background: none; cursor: pointer; color: var(--text-secondary); opacity: 0; padding: 2px; border-radius: 4px; display: flex; transition: all 0.15s; }
.provider-card:hover .provider-del { opacity: 0.6; }
.provider-del:hover { opacity: 1 !important; color: #ef4444; background: #fef2f2; }
.provider-endpoint { font-size: 10px; color: var(--text-secondary); margin-top: 4px; word-break: break-all; }

.field-grid { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full-width { grid-column: 1 / -1; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.field input, .field select { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; background: var(--bg-primary); color: var(--text-primary); outline: none; font-family: inherit; transition: border-color 0.2s; }
.field input:focus, .field select:focus { border-color: var(--accent); }
.field-hint { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }

.api-key-input { flex: 1; display: flex; position: relative; }
.api-key-input input { flex: 1; padding-right: 36px; }
.eye-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: none; background: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; }
.eye-btn:hover { color: var(--accent); }

.input-with-btn { display: flex; gap: 8px; }
.test-btn { padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-card); font-size: 12px; cursor: pointer; white-space: nowrap; transition: all 0.2s; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
.test-btn:hover { border-color: var(--accent); color: var(--accent); }
.test-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.model-select { display: flex; flex-direction: column; gap: 6px; }
.model-select select { width: 100%; }

.prompt-textarea { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; font-family: "Cascadia Code", Consolas, monospace; line-height: 1.6; background: var(--bg-primary); color: var(--text-primary); outline: none; resize: vertical; min-height: 160px; transition: border-color 0.2s; }
.prompt-textarea:focus { border-color: var(--accent); }

.slider-field { display: flex; align-items: center; gap: 12px; }
.slider-field input[type="range"] { flex: 1; height: 4px; -webkit-appearance: none; appearance: none; background: var(--border); border-radius: 2px; outline: none; }
.slider-field input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.slider-value { min-width: 36px; text-align: right; font-size: 13px; font-weight: 600; color: var(--accent); font-family: "Cascadia Code", Consolas, monospace; }

.toggle-field { display: flex; align-items: center; justify-content: space-between; }
.toggle { width: 40px; height: 22px; border-radius: 11px; background: var(--border); cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
.toggle.on { background: var(--accent); }
.toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.toggle.on .toggle-thumb { transform: translateX(18px); }

/* Modal */
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; width: 420px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.modal-box h3 { font-size: 16px; font-weight: 700; margin-bottom: 20px; }
.modal-field { margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
.modal-field label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.modal-field input { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; outline: none; background: var(--bg-primary); color: var(--text-primary); }
.modal-field input:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.modal-actions button { padding: 8px 20px; border-radius: var(--radius); font-size: 13px; cursor: pointer; border: 1px solid var(--border); background: var(--bg-card); }
.modal-actions .primary { background: var(--accent); color: white; border-color: var(--accent); }
.modal-actions .primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
