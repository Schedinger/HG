<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const navItems = [
  { path: '/upload', label: '文档上传', icon: '📤' },
  { path: '/knowledge', label: '知识库', icon: '🕸️' },
  { path: '/qa', label: '问答推理', icon: '💬' },
  { path: '/settings', label: '模型设置', icon: '⚙️' },
]
</script>

<template>
  <div class="app-container">
    <aside class="app-sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <div class="logo" @click="collapsed = !collapsed" title="展开/收起">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span v-if="!collapsed" class="logo-text">HG RAG</span>
        </div>
        <div v-if="!collapsed" class="logo-subtitle">超图检索增强生成</div>
      </div>

      <nav class="nav-menu">
        <div
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
          @click="router.push(item.path)"
          :title="collapsed ? item.label : ''"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开侧栏' : '收起侧栏'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline v-if="!collapsed" points="11 17 6 12 11 7"/>
            <polyline v-else points="13 7 18 12 13 17"/>
            <line x1="6" y1="12" x2="18" y2="12" v-if="false"/>
          </svg>
          <span v-if="!collapsed">收起侧栏</span>
        </button>
        <div v-if="!collapsed" class="status-indicator">
          <div class="status-dot"></div>
          <span>系统运行中</span>
        </div>
      </div>
    </aside>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.app-sidebar {
  width: 220px;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  color: var(--text-sidebar);
  flex-shrink: 0;
  transition: width 0.25s ease;
  overflow: hidden;
}
.app-sidebar.collapsed {
  width: 60px;
}
.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.collapsed .sidebar-header {
  padding: 24px 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-sidebar-active);
  letter-spacing: 0.3px;
  cursor: pointer;
  user-select: none;
}
.collapsed .logo {
  justify-content: center;
  gap: 0;
}
.logo-text {
  white-space: nowrap;
}
.logo-subtitle {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin-top: 6px;
  padding-left: 32px;
  white-space: nowrap;
}
.nav-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.collapsed .nav-menu {
  padding: 16px 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-sidebar);
  white-space: nowrap;
}
.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
  gap: 0;
}
.nav-item:hover {
  background: var(--bg-sidebar-hover);
  color: var(--text-sidebar-active);
}
.nav-item.active {
  background: var(--bg-sidebar-active);
  color: var(--text-sidebar-active);
  font-weight: 600;
}
.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.nav-label {
  font-size: 14px;
}
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.5);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}
.collapsed .collapse-btn {
  justify-content: center;
  padding: 8px;
}
.collapse-btn:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  padding: 0 4px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
