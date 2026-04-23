// ========== 基于 sample.txt 的完整 mock 数据 ==========

// 历史构建记录
export const buildHistory = [
  { id: 1, name: 'Biomedical.json', time: '2026-03-01 10:45', status: 'done', nodes: 86, edges: 31, topics: 5 },
  { id: 2, name: 'PubMed_BreastCancer.txt', time: '2026-02-28 14:32', status: 'done', nodes: 127, edges: 53, topics: 2 },
  { id: 3, name: 'DrugBank_Subset.json', time: '2026-02-20 16:48', status: 'done', nodes: 215, edges: 97, topics: 3 },
  { id: 4, name: 'KEGG_Pathway.txt', time: '2026-02-18 11:20', status: 'done', nodes: 163, edges: 72, topics: 2 },
]

// 知识图谱节点（基于 sample.txt 中的实体）
export const graphNodes = [
  { id: 'DB00675', label: 'Tamoxifen', name: 'Tamoxifen', type: 'Compound', x: 120, y: 180 },
  { id: 'DB00945', label: 'Fulvestrant', name: 'Fulvestrant', type: 'Compound', x: 480, y: 180 },
  { id: 'G7231', label: 'ESR1', name: 'ESR1', type: 'Gene', x: 300, y: 280 },
  { id: 'G4562', label: 'HER2', name: 'HER2', type: 'Gene', x: 520, y: 320 },
  { id: 'D001943', label: 'Breast Cancer', name: 'Breast Cancer', type: 'Disease', x: 300, y: 80 },
]

// 超边 - 用虚拟超边节点连接多个实体
export const graphHyperedges = [
  {
    id: 'he1', label: 'treats', relation: 'Compound-treats-Disease',
    nodes: ['DB00675', 'D001943'], color: '#4f8ef7', topic: 'Healthcare',
    description: 'Tamoxifen 作为选择性雌激素受体调节剂（SERM）用于治疗乳腺癌',
  },
  {
    id: 'he2', label: 'downregulates', relation: 'Compound-downregulates-Gene',
    nodes: ['DB00675', 'G7231'], color: '#10b981', topic: 'Healthcare',
    description: 'Tamoxifen 通过竞争性结合 ESR1 抑制雌激素信号通路',
  },
  {
    id: 'he3', label: 'downregulates', relation: 'Compound-downregulates-Gene',
    nodes: ['DB00945', 'G7231'], color: '#f59e42', topic: 'Healthcare',
    description: 'Fulvestrant 通过降解 ESR1 蛋白实现雌激素信号阻断',
  },
  {
    id: 'he4', label: 'downregulates', relation: 'Compound-downregulates-Gene',
    nodes: ['DB00945', 'G4562'], color: '#f59e42', topic: 'Healthcare',
    description: 'Fulvestrant 下调 HER2 基因表达，抑制肿瘤细胞增殖',
  },
]

// 完整的 8 步推理过程（基于 sample.txt）
export const reasoningSteps = [
  {
    step: 1, phase: 'Phase 1: 子问题 1',
    subQuestion: 'What is the mechanism by which Tamoxifen treats breast cancer?',
    thought: 'The sub-question involves medical mechanisms. I should retrieve the subgraph for topic \'Healthcare\' to filter relevant knowledge.',
    action: 'RetrieveSubgraph[Healthcare]',
    observation: 'Subgraph related to topic \'Healthcare\' retrieved.',
    status: 'done',
  },
  {
    step: 2, phase: 'Phase 1: 子问题 1',
    subQuestion: 'What is the mechanism by which Tamoxifen treats breast cancer?',
    thought: 'Now I need to locate the Tamoxifen node in the graph.',
    action: 'RetrieveNode[Tamoxifen]',
    observation: 'The ID of this retrieval target node is DB00675.',
    status: 'done',
  },
  {
    step: 3, phase: 'Phase 1: 子问题 1',
    subQuestion: 'What is the mechanism by which Tamoxifen treats breast cancer?',
    thought: 'Identify the mechanism of Tamoxifen for Breast Cancer. I need to find genes downregulated by Tamoxifen.',
    action: 'NeighbourCheck[DB00675, Compound-downregulates-Gene]',
    observation: 'The Compound-downregulates-Gene neighbors of DB00675 are: [\'G7231\'].',
    status: 'done',
  },
  {
    step: 4, phase: 'Phase 1: 子问题 1',
    subQuestion: 'What is the mechanism by which Tamoxifen treats breast cancer?',
    thought: 'Get the name of the gene G7231.',
    action: 'NodeFeature[G7231, name]',
    observation: 'The name feature of G7231 are: ESR1.',
    intermediateAnswer: 'Tamoxifen downregulates ESR1.',
    status: 'done',
  },
  {
    step: 5, phase: 'Phase 2: 子问题 2',
    subQuestion: 'Which genes does Fulvestrant interact with?',
    thought: 'Switch focus to Fulvestrant. Continue with topic \'Healthcare\'.',
    action: 'RetrieveSubgraph[Healthcare]',
    observation: 'Subgraph related to topic \'Healthcare\' retrieved.',
    status: 'done',
  },
  {
    step: 6, phase: 'Phase 2: 子问题 2',
    subQuestion: 'Which genes does Fulvestrant interact with?',
    thought: 'Now I need to check if Fulvestrant interacts with ESR1 in a similar way.',
    action: 'RetrieveNode[Fulvestrant]',
    observation: 'The ID of this retrieval target node is DB00945.',
    status: 'done',
  },
  {
    step: 7, phase: 'Phase 2: 子问题 2',
    subQuestion: 'Which genes does Fulvestrant interact with?',
    thought: 'Check if Fulvestrant also downregulates ESR1 (G7231).',
    action: 'NeighbourCheck[DB00945, Compound-downregulates-Gene]',
    observation: 'The Compound-downregulates-Gene neighbors of DB00945 are: [\'G7231\', \'G4562\'].',
    intermediateAnswer: 'Fulvestrant downregulates G7231 (ESR1) and G4562 (HER2).',
    status: 'done',
  },
  {
    step: 8, phase: 'Phase 3: 子问题 3',
    subQuestion: 'Does Fulvestrant interact with the identified genes in a similar way?',
    thought: 'Fulvestrant downregulates G7231 (ESR1), which matches Tamoxifen\'s mechanism.',
    action: 'Finish[ESR1]',
    observation: 'Final Answer: ESR1',
    finalAnswer: 'Fulvestrant interacts with ESR1 gene in a mechanism similar to how Tamoxifen treats breast cancer. Both drugs downregulate ESR1.',
    status: 'done',
  },
]

// 会话管理 mock 数据
export const sessions = [
  {
    id: 'sess_001',
    title: 'Fulvestrant 与 Tamoxifen 机制对比',
    time: '2026-03-01 10:45',
    preview: 'Which genes does the drug Fulvestrant interact with...',
    messages: null, // 使用 caseMessages
    reasoning: null, // 使用 reasoningSteps
  },
  {
    id: 'sess_002',
    title: 'BRCA1 基因与乳腺癌关联',
    time: '2026-02-28 16:20',
    preview: 'BRCA1 基因与哪些疾病相关？',
    messages: [
      { role: 'assistant', content: '你好！我是超图检索增强生成平台的问答助手，可以帮你在超图知识库中进行多跳推理检索。', reasoning: false },
      { role: 'user', content: 'BRCA1 基因与哪些疾病相关？' },
      { role: 'assistant', content: '基于超图知识库检索结果：\n\nBRCA1 基因 (Gene ID: 672) 主要与以下疾病相关：\n\n1. 乳腺癌 (breast cancer, DOID:1612)\n   - BRCA1 是乳腺癌常见体细胞突变基因之一\n   - BRCA1 突变携带者终生乳腺癌风险可达 60-80%\n\n2. 三阴性乳腺癌 (TNBC, DOID:5041)\n   - TNBC 关联基因包括 TP53、BRCA1、PTEN、NF1\n   - BRCA1 突变在 TNBC 中尤为常见\n\nBRCA1 编码的 BRCA1 蛋白 (P38398) 参与 DNA 同源重组修复，其功能缺失导致基因组不稳定性增加。', reasoning: true },
    ],
    reasoning: [
      { step: 1, phase: 'Phase 1: 检索 BRCA1', thought: '需要查找 BRCA1 基因的相关信息，首先检索相关子图', action: 'RetrieveSubgraph[Breast Cancer Pathology]', observation: '获取到乳腺癌病理子图', status: 'done' },
      { step: 2, phase: 'Phase 1: 检索 BRCA1', thought: '定位 BRCA1 节点', action: 'RetrieveNode[BRCA1]', observation: 'BRCA1 节点 ID: 672', status: 'done' },
      { step: 3, phase: 'Phase 2: 查找关联疾病', thought: '查找 BRCA1 关联的疾病', action: 'NeighbourCheck[672, Disease-mutates-Gene]', observation: '关联疾病: breast cancer (DOID:1612)', status: 'done' },
      { step: 4, phase: 'Phase 2: 查找关联疾病', thought: '继续检索信号通路子图中的 BRCA1 关联', action: 'RetrieveSubgraph[Signaling Pathways]', observation: '获取到信号通路子图，发现 TNBC (DOID:5041) 关联', status: 'done' },
      { step: 5, phase: 'Phase 3: 综合', thought: '已收集到足够信息，可以生成答案', action: 'Finish[breast cancer, TNBC]', observation: 'Final Answer', finalAnswer: 'BRCA1 基因主要与乳腺癌和三阴性乳腺癌 (TNBC) 相关', status: 'done' },
    ],
  },
  {
    id: 'sess_003',
    title: 'PI3K-Akt 信号通路分析',
    time: '2026-02-27 09:15',
    preview: 'PI3K-Akt 信号通路涉及哪些关键基因？',
    messages: [
      { role: 'assistant', content: '你好！我是超图检索增强生成平台的问答助手。', reasoning: false },
      { role: 'user', content: 'PI3K-Akt 信号通路涉及哪些关键基因？' },
      { role: 'assistant', content: '基于超图知识库的检索结果：\n\nPI3K-Akt 信号通路 (PW:0000013) 涉及以下关键基因和蛋白：\n\n1. PIK3CA (Gene ID: 5290) - 编码 PI3K 催化亚基 (P42336)\n2. PTEN (Gene ID: 5728) - 该通路的负调控因子\n3. AKT1 蛋白激酶 (P31749) - 通路核心效应器\n\n此外，PI3K-Akt 通路与 MAPK、p53、mTOR 通路之间存在广泛的交叉调控 (crosstalk)。', reasoning: true },
    ],
    reasoning: [
      { step: 1, phase: 'Phase 1: 检索通路', thought: '检索信号通路相关子图', action: 'RetrieveSubgraph[Signaling Pathways]', observation: '获取到信号通路子图', status: 'done' },
      { step: 2, phase: 'Phase 2: 查找关联基因', thought: '定位 PI3K-Akt 通路节点并查找关联基因', action: 'NeighbourCheck[PW:0000013, Gene-activates-Pathway]', observation: '关联: PIK3CA, PTEN, AKT1', status: 'done' },
      { step: 3, phase: 'Phase 3: 综合', thought: '综合信息生成答案', action: 'Finish[PIK3CA, PTEN, AKT1]', observation: 'Final Answer', finalAnswer: 'PI3K-Akt 通路关键基因包括 PIK3CA、PTEN 和 AKT1', status: 'done' },
    ],
  },
]

// 对话消息
export const caseMessages = [
  {
    role: 'assistant',
    content: '你好！我是超图检索增强生成平台的问答助手，可以帮你在超图知识库中进行多跳推理检索。\n\n你可以尝试提问，例如：\n- Tamoxifen 和 Fulvestrant 治疗乳腺癌的共同机制是什么？\n- BRCA1 基因与哪些疾病相关？\n- PI3K-Akt 信号通路涉及哪些关键基因？',
    reasoning: false,
  },
  {
    role: 'user',
    content: 'Which genes does the drug Fulvestrant interact with in a mechanism similar to how Tamoxifen treats breast cancer?',
  },
  {
    role: 'assistant',
    content: 'Based on the hypergraph knowledge base retrieval and multi-hop reasoning:\n\nFinal Answer: ESR1\n\nFulvestrant interacts with the ESR1 gene in a mechanism similar to how Tamoxifen treats breast cancer. Both drugs downregulate ESR1 (Estrogen Receptor 1).\n\nReasoning Process:\n1. Tamoxifen treats breast cancer by downregulating ESR1\n2. Fulvestrant also downregulates ESR1 (and HER2)\n3. Therefore, both drugs share the common mechanism of targeting ESR1',
    reasoning: true,
  },
]

// 扩展的知识库数据
export const extendedGraphNodes = [
  ...graphNodes,
  { id: 'DB00316', label: 'Acetaminophen', name: 'Acetaminophen', type: 'Compound', x: 80, y: 420 },
  { id: 'DB00563', label: 'Metformin', name: 'Metformin', type: 'Compound', x: 540, y: 440 },
  { id: 'DB01076', label: 'Letrozole', name: 'Letrozole', type: 'Compound', x: 160, y: 50 },
  { id: 'G5728', label: 'PTEN', name: 'PTEN', type: 'Gene', x: 200, y: 500 },
  { id: 'G7157', label: 'TP53', name: 'TP53', type: 'Gene', x: 400, y: 500 },
  { id: 'G367', label: 'BRCA1', name: 'BRCA1', type: 'Gene', x: 100, y: 310 },
  { id: 'G2099', label: 'CYP19A1', name: 'CYP19A1', type: 'Gene', x: 250, y: 130 },
  { id: 'D003920', label: 'Diabetes', name: 'Diabetes Mellitus', type: 'Disease', x: 540, y: 80 },
  { id: 'D009369', label: 'Neoplasms', name: 'Neoplasms', type: 'Disease', x: 420, y: 50 },
  { id: 'G2950', label: 'GSTP1', name: 'GSTP1', type: 'Gene', x: 80, y: 510 },
]

export const extendedGraphHyperedges = [
  ...graphHyperedges,
  {
    id: 'he5', label: 'treats', relation: 'Compound-treats-Disease',
    nodes: ['DB00563', 'D003920'], color: '#a855f7', topic: 'Healthcare',
    description: 'Metformin 通过激活 AMPK 通路降低血糖，用于治疗 2 型糖尿病',
  },
  {
    id: 'he6', label: 'associates', relation: 'Gene-associates-Disease',
    nodes: ['G7157', 'D001943'], color: '#ef4444', topic: 'Biology',
    description: 'TP53 基因突变与乳腺癌发生发展密切相关，是重要的抑癌基因',
  },
  {
    id: 'he7', label: 'associates', relation: 'Gene-associates-Disease',
    nodes: ['G367', 'D001943'], color: '#ef4444', topic: 'Biology',
    description: 'BRCA1 基因突变显著增加乳腺癌患病风险，是遗传性乳腺癌的关键基因',
  },
  {
    id: 'he8', label: 'inhibits', relation: 'Compound-downregulates-Gene',
    nodes: ['DB01076', 'G2099'], color: '#4f8ef7', topic: 'Healthcare',
    description: 'Letrozole 通过抑制 CYP19A1（芳香化酶）减少雌激素合成',
  },
  {
    id: 'he9', label: 'treats', relation: 'Compound-treats-Disease',
    nodes: ['DB01076', 'D001943'], color: '#4f8ef7', topic: 'Healthcare',
    description: 'Letrozole 用于绝经后激素受体阳性乳腺癌的内分泌治疗',
  },
  {
    id: 'he10', label: 'associates', relation: 'Gene-associates-Disease',
    nodes: ['G5728', 'D009369'], color: '#ef4444', topic: 'Biology',
    description: 'PTEN 是重要的抑癌基因，其功能缺失与多种肿瘤发生相关',
  },
  {
    id: 'he11', label: 'downregulates', relation: 'Compound-downregulates-Gene',
    nodes: ['DB00316', 'G2950'], color: '#6b7280', topic: 'Healthcare',
    description: 'Acetaminophen 影响 GSTP1 基因表达，与药物代谢相关',
  },
]

// 知识库统计（动态计算）
export function getKbStats(nodes, edges) {
  return {
    totalNodes: nodes.length,
    totalHyperedges: edges.length,
    compounds: nodes.filter(n => n.type === 'Compound').length,
    genes: nodes.filter(n => n.type === 'Gene').length,
    diseases: nodes.filter(n => n.type === 'Disease').length,
    topics: ['Healthcare', 'Biology'],
  }
}

export const kbStats = getKbStats(extendedGraphNodes, extendedGraphHyperedges)
