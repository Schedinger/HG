import { createRouter, createWebHistory } from 'vue-router'
import UploadPage from './pages/UploadPage.vue'
import KnowledgePage from './pages/KnowledgePage.vue'
import QAPage from './pages/QAPage.vue'
import SettingsPage from './pages/SettingsPage.vue'

const routes = [
  { path: '/', redirect: '/qa' },
  { path: '/upload', component: UploadPage, meta: { title: '文档上传' } },
  { path: '/knowledge', component: KnowledgePage, meta: { title: '知识库' } },
  { path: '/qa', component: QAPage, meta: { title: '问答推理' } },
  { path: '/settings', component: SettingsPage, meta: { title: '模型设置' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
