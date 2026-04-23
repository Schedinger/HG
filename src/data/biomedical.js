// 超图知识库数据 — 扩充版（含文本块）

export const bioNodes = [
  // === Compound 药物 (12) ===
  { id: "DB00675", label: "Tamoxifen", name: "Tamoxifen", type: "Compound" },
  { id: "DB00947", label: "Fulvestrant", name: "Fulvestrant", type: "Compound" },
  { id: "DB00291", label: "Chlorambucil", name: "Chlorambucil", type: "Compound" },
  { id: "DB01204", label: "Mitoxantrone", name: "Mitoxantrone", type: "Compound" },
  { id: "DB01101", label: "Capecitabine", name: "Capecitabine", type: "Compound" },
  { id: "DB00563", label: "Methotrexate", name: "Methotrexate", type: "Compound" },
  { id: "DB01248", label: "Docetaxel", name: "Docetaxel", type: "Compound" },
  { id: "DB00515", label: "Cisplatin", name: "Cisplatin", type: "Compound" },
  { id: "DB00773", label: "Etoposide", name: "Etoposide", type: "Compound" },
  { id: "DB01229", label: "Paclitaxel", name: "Paclitaxel", type: "Compound" },
  { id: "DB00958", label: "Carboplatin", name: "Carboplatin", type: "Compound" },
  { id: "DB00361", label: "Vinorelbine", name: "Vinorelbine", type: "Compound" },

  // === Gene 基因 (28) ===
  { id: "22984", label: "PDCD11", name: "PDCD11", type: "Gene" },
  { id: "51293", label: "CD320", name: "CD320", type: "Gene" },
  { id: "991", label: "CDC20", name: "CDC20", type: "Gene" },
  { id: "8624", label: "PSMG1", name: "PSMG1", type: "Gene" },
  { id: "1558", label: "CYP2C8", name: "CYP2C8", type: "Gene" },
  { id: "1244", label: "ABCC2", name: "ABCC2", type: "Gene" },
  { id: "1557", label: "CYP2C19", name: "CYP2C19", type: "Gene" },
  { id: "1543", label: "CYP1A1", name: "CYP1A1", type: "Gene" },
  { id: "2175", label: "FANCA", name: "FANCA", type: "Gene" },
  { id: "6119", label: "RPA3", name: "RPA3", type: "Gene" },
  { id: "259266", label: "ASPM", name: "ASPM", type: "Gene" },
  { id: "51116", label: "MRPS2", name: "MRPS2", type: "Gene" },
  { id: "2053", label: "EPHX2", name: "EPHX2", type: "Gene" },
  { id: "2099", label: "ESR1", name: "ESR1", type: "Gene" },
  { id: "2100", label: "ESR2", name: "ESR2", type: "Gene" },
  { id: "2101", label: "ESRRA", name: "ESRRA", type: "Gene" },
  { id: "3190", label: "HNRNPK", name: "HNRNPK", type: "Gene" },
  { id: "8871", label: "SYNJ2", name: "SYNJ2", type: "Gene" },
  { id: "5728", label: "PTEN", name: "PTEN", type: "Gene" },
  { id: "10318", label: "TNIP1", name: "TNIP1", type: "Gene" },
  { id: "7157", label: "TP53", name: "TP53", type: "Gene" },
  { id: "672", label: "BRCA1", name: "BRCA1", type: "Gene" },
  { id: "675", label: "BRCA2", name: "BRCA2", type: "Gene" },
  { id: "4609", label: "MYC", name: "MYC", type: "Gene" },
  { id: "1956", label: "EGFR", name: "EGFR", type: "Gene" },
  { id: "2064", label: "ERBB2", name: "ERBB2 (HER2)", type: "Gene" },
  { id: "5290", label: "PIK3CA", name: "PIK3CA", type: "Gene" },
  { id: "5594", label: "MAPK1", name: "MAPK1", type: "Gene" },

  // === Disease 疾病 (6) ===
  { id: "DOID:1612", label: "breast cancer", name: "breast cancer", type: "Disease" },
  { id: "DOID:1793", label: "pancreatic cancer", name: "pancreatic cancer", type: "Disease" },
  { id: "DOID:3571", label: "liver cancer", name: "liver cancer", type: "Disease" },
  { id: "DOID:1324", label: "lung cancer", name: "lung cancer", type: "Disease" },
  { id: "DOID:9256", label: "colorectal cancer", name: "colorectal cancer", type: "Disease" },
  { id: "DOID:2394", label: "ovarian cancer", name: "ovarian cancer", type: "Disease" },

  // === Symptom 症状 (8) ===
  { id: "D059373", label: "Mastodynia", name: "Mastodynia", type: "Symptom" },
  { id: "D001247", label: "Asthenia", name: "Asthenia", type: "Symptom" },
  { id: "D019584", label: "Hot Flashes", name: "Hot Flashes", type: "Symptom" },
  { id: "D005334", label: "Fever", name: "Fever", type: "Symptom" },
  { id: "D009325", label: "Nausea", name: "Nausea", type: "Symptom" },
  { id: "D000855", label: "Anorexia", name: "Anorexia", type: "Symptom" },
  { id: "D004417", label: "Dyspnea", name: "Dyspnea", type: "Symptom" },
  { id: "D006261", label: "Headache", name: "Headache", type: "Symptom" },

  // === Anatomy 解剖 (8) ===
  { id: "UBERON:0003889", label: "fallopian tube", name: "fallopian tube", type: "Anatomy" },
  { id: "UBERON:0002066", label: "umbilical vein", name: "umbilical vein", type: "Anatomy" },
  { id: "UBERON:0001911", label: "mammary gland", name: "mammary gland", type: "Anatomy" },
  { id: "UBERON:0000029", label: "lymph node", name: "lymph node", type: "Anatomy" },
  { id: "UBERON:0002107", label: "liver", name: "liver", type: "Anatomy" },
  { id: "UBERON:0002048", label: "lung", name: "lung", type: "Anatomy" },
  { id: "UBERON:0000160", label: "intestine", name: "intestine", type: "Anatomy" },
  { id: "UBERON:0000992", label: "ovary", name: "ovary", type: "Anatomy" },

  // === Pathway 通路 (8) ===
  { id: "PW:0000013", label: "PI3K-Akt", name: "PI3K-Akt signaling pathway", type: "Pathway" },
  { id: "PW:0000233", label: "MAPK", name: "MAPK signaling pathway", type: "Pathway" },
  { id: "PW:0000718", label: "p53", name: "p53 signaling pathway", type: "Pathway" },
  { id: "PW:0000605", label: "Wnt", name: "Wnt signaling pathway", type: "Pathway" },
  { id: "PW:0000003", label: "NF-kB", name: "NF-kB signaling pathway", type: "Pathway" },
  { id: "PW:0000232", label: "JAK-STAT", name: "JAK-STAT signaling pathway", type: "Pathway" },
  { id: "PW:0000168", label: "Notch", name: "Notch signaling pathway", type: "Pathway" },
  { id: "PW:0000204", label: "mTOR", name: "mTOR signaling pathway", type: "Pathway" },

  // === Protein 蛋白 (8) ===
  { id: "P04637", label: "p53", name: "Cellular tumor antigen p53", type: "Protein" },
  { id: "P38398", label: "BRCA1-P", name: "BRCA1 protein", type: "Protein" },
  { id: "P51587", label: "BRCA2-P", name: "BRCA2 protein", type: "Protein" },
  { id: "P00533", label: "EGFR-P", name: "EGFR protein", type: "Protein" },
  { id: "P04626", label: "HER2-P", name: "HER2/ERBB2 protein", type: "Protein" },
  { id: "P31749", label: "AKT1", name: "AKT1 protein kinase", type: "Protein" },
  { id: "Q07817", label: "BCL2L1", name: "Bcl-2-like protein 1", type: "Protein" },
  { id: "P42336", label: "PIK3CA-P", name: "PIK3CA catalytic subunit", type: "Protein" },

  // === 补充 Gene (6) ===
  { id: "7428", label: "VHL", name: "VHL", type: "Gene" },
  { id: "4893", label: "NRAS", name: "NRAS", type: "Gene" },
  { id: "3845", label: "KRAS", name: "KRAS", type: "Gene" },
  { id: "238", label: "ALK", name: "ALK", type: "Gene" },
  { id: "5979", label: "RET", name: "RET", type: "Gene" },
  { id: "4763", label: "NF1", name: "NF1", type: "Gene" },

  // === 补充 Disease (2) ===
  { id: "DOID:3908", label: "NSCLC", name: "non-small cell lung cancer", type: "Disease" },
  { id: "DOID:5041", label: "TNBC", name: "triple-negative breast cancer", type: "Disease" },
]

// === 超边 (20条，按子超图/topic 分组) ===
export const bioHyperedges = [
  // ── 子超图 1: Breast Cancer Treatment (乳腺癌治疗) ──
  {
    id: "he_1", label: "downregulates", relation: "Compound-downregulates-Gene",
    nodes: ["DB00675","22984","51293","991","8624"],
    color: "#4f8ef7", topic: "Breast Cancer Treatment",
    description: "Tamoxifen downregulates PDCD11, CD320, CDC20, PSMG1",
  },
  {
    id: "he_2", label: "binds", relation: "Compound-binds-Gene",
    nodes: ["DB00675","1558","1244","1557","1543"],
    color: "#10b981", topic: "Breast Cancer Treatment",
    description: "Tamoxifen binds CYP2C8, ABCC2, CYP2C19, CYP1A1",
  },
  {
    id: "he_3", label: "treats", relation: "Compound-treats-Disease",
    nodes: ["DB00675","DOID:1793","DOID:1612"],
    color: "#f59e42", topic: "Breast Cancer Treatment",
    description: "Tamoxifen treats pancreatic cancer, breast cancer",
  },
  {
    id: "he_4", label: "downregulates", relation: "Compound-downregulates-Gene",
    nodes: ["DB00947","2175","6119","259266","51116"],
    color: "#a855f7", topic: "Breast Cancer Treatment",
    description: "Fulvestrant downregulates FANCA, RPA3, ASPM, MRPS2",
  },
  {
    id: "he_5", label: "binds", relation: "Compound-binds-Gene",
    nodes: ["DB00947","2053","2099","2100","2101"],
    color: "#ef4444", topic: "Breast Cancer Treatment",
    description: "Fulvestrant binds EPHX2, ESR1, ESR2, ESRRA",
  },
  {
    id: "he_6", label: "treats", relation: "Compound-treats-Disease",
    nodes: ["DB00947","DOID:1612"],
    color: "#6b7280", topic: "Breast Cancer Treatment",
    description: "Fulvestrant treats breast cancer",
  },
  {
    id: "he_shared", label: "shared-target", relation: "Shared-downregulates-Gene",
    nodes: ["DB00675","DB00947","51293","991","8624"],
    color: "#ec4899", topic: "Breast Cancer Treatment",
    description: "Tamoxifen 与 Fulvestrant 共同下调的基因: CD320, CDC20, PSMG1",
  },

  // ── 子超图 2: Breast Cancer Pathology (乳腺癌病理) ──
  {
    id: "he_7", label: "presents", relation: "Disease-presents-Symptom",
    nodes: ["DOID:1612","D059373","D001247","D019584","D005334"],
    color: "#ec4899", topic: "Breast Cancer Pathology",
    description: "breast cancer presents Mastodynia, Asthenia, Hot Flashes, Fever",
  },
  {
    id: "he_8", label: "associates", relation: "Disease-associates-Gene",
    nodes: ["DOID:1612","3190","8871","5728","10318"],
    color: "#14b8a6", topic: "Breast Cancer Pathology",
    description: "breast cancer associates HNRNPK, SYNJ2, PTEN, TNIP1",
  },
  {
    id: "he_9", label: "localizes", relation: "Disease-localizes-Anatomy",
    nodes: ["DOID:1612","UBERON:0003889","UBERON:0002066","UBERON:0001911","UBERON:0000029"],
    color: "#f97316", topic: "Breast Cancer Pathology",
    description: "breast cancer localizes fallopian tube, umbilical vein, mammary gland, lymph node",
  },
  {
    id: "he_10", label: "treats", relation: "Compound-treats-Disease",
    nodes: ["DOID:1612","DB00291","DB01204","DB01101","DB00563"],
    color: "#8b5cf6", topic: "Breast Cancer Pathology",
    description: "Chlorambucil, Mitoxantrone, Capecitabine, Methotrexate treat breast cancer",
  },
  {
    id: "he_11", label: "mutates", relation: "Disease-mutates-Gene",
    nodes: ["DOID:1612","672","675","7157","5290"],
    color: "#0ea5e9", topic: "Breast Cancer Pathology",
    description: "breast cancer 常见突变基因: BRCA1, BRCA2, TP53, PIK3CA",
  },

  // ── 子超图 3: Lung Cancer Genomics (肺癌基因组) ──
  {
    id: "he_12", label: "treats", relation: "Compound-treats-Disease",
    nodes: ["DB00515","DB00773","DB01248","DOID:1324"],
    color: "#4f8ef7", topic: "Lung Cancer Genomics",
    description: "Cisplatin, Etoposide, Docetaxel treat lung cancer",
  },
  {
    id: "he_13", label: "mutates", relation: "Disease-mutates-Gene",
    nodes: ["DOID:1324","1956","7157","4609","5594"],
    color: "#ef4444", topic: "Lung Cancer Genomics",
    description: "lung cancer 常见突变: EGFR, TP53, MYC, MAPK1",
  },
  {
    id: "he_14", label: "localizes", relation: "Disease-localizes-Anatomy",
    nodes: ["DOID:1324","UBERON:0002048","UBERON:0000029"],
    color: "#f59e42", topic: "Lung Cancer Genomics",
    description: "lung cancer localizes lung, lymph node",
  },
  {
    id: "he_15", label: "presents", relation: "Disease-presents-Symptom",
    nodes: ["DOID:1324","D004417","D005334","D006261","D000855"],
    color: "#a855f7", topic: "Lung Cancer Genomics",
    description: "lung cancer presents Dyspnea, Fever, Headache, Anorexia",
  },
  {
    id: "he_16", label: "binds", relation: "Compound-binds-Gene",
    nodes: ["DB00515","7157","2064","1956"],
    color: "#10b981", topic: "Lung Cancer Genomics",
    description: "Cisplatin binds TP53, ERBB2, EGFR",
  },

  // ── 子超图 4: Ovarian & Colorectal (卵巢癌与结直肠癌) ──
  {
    id: "he_17", label: "treats", relation: "Compound-treats-Disease",
    nodes: ["DB01229","DB00958","DOID:2394"],
    color: "#ec4899", topic: "Ovarian & Colorectal",
    description: "Paclitaxel, Carboplatin treat ovarian cancer",
  },
  {
    id: "he_18", label: "localizes", relation: "Disease-localizes-Anatomy",
    nodes: ["DOID:2394","UBERON:0000992","UBERON:0000029"],
    color: "#14b8a6", topic: "Ovarian & Colorectal",
    description: "ovarian cancer localizes ovary, lymph node",
  },
  {
    id: "he_19", label: "treats", relation: "Compound-treats-Disease",
    nodes: ["DB01101","DB00563","DB00361","DOID:9256"],
    color: "#f97316", topic: "Ovarian & Colorectal",
    description: "Capecitabine, Methotrexate, Vinorelbine treat colorectal cancer",
  },
  {
    id: "he_20", label: "localizes", relation: "Disease-localizes-Anatomy",
    nodes: ["DOID:9256","UBERON:0000160","UBERON:0002107"],
    color: "#8b5cf6", topic: "Ovarian & Colorectal",
    description: "colorectal cancer localizes intestine, liver",
  },

  // ── 子超图 5: Signaling Pathways (信号通路网络) ──
  {
    id: "he_21", label: "activates", relation: "Gene-activates-Pathway",
    nodes: ["5290","5728","P31749","PW:0000013"],
    color: "#4f8ef7", topic: "Signaling Pathways",
    description: "PIK3CA, PTEN, AKT1 参与 PI3K-Akt 信号通路调控",
  },
  {
    id: "he_22", label: "activates", relation: "Gene-activates-Pathway",
    nodes: ["3845","4893","5594","PW:0000233"],
    color: "#10b981", topic: "Signaling Pathways",
    description: "KRAS, NRAS, MAPK1 驱动 MAPK 信号通路级联",
  },
  {
    id: "he_23", label: "regulates", relation: "Gene-regulates-Pathway",
    nodes: ["7157","P04637","PW:0000718"],
    color: "#ef4444", topic: "Signaling Pathways",
    description: "TP53 编码 p53 蛋白，调控 p53 信号通路",
  },
  {
    id: "he_24", label: "encodes", relation: "Gene-encodes-Protein",
    nodes: ["672","P38398","675","P51587"],
    color: "#a855f7", topic: "Signaling Pathways",
    description: "BRCA1 → BRCA1 protein, BRCA2 → BRCA2 protein",
  },
  {
    id: "he_25", label: "encodes", relation: "Gene-encodes-Protein",
    nodes: ["1956","P00533","2064","P04626"],
    color: "#ec4899", topic: "Signaling Pathways",
    description: "EGFR → EGFR protein, ERBB2 → HER2 protein",
  },
  {
    id: "he_26", label: "crosstalk", relation: "Pathway-crosstalk-Pathway",
    nodes: ["PW:0000013","PW:0000233","PW:0000718","PW:0000204"],
    color: "#f97316", topic: "Signaling Pathways",
    description: "PI3K-Akt、MAPK、p53、mTOR 通路间存在交叉调控",
  },
  {
    id: "he_27", label: "inhibits", relation: "Protein-inhibits-Pathway",
    nodes: ["Q07817","P31749","PW:0000718","PW:0000003"],
    color: "#14b8a6", topic: "Signaling Pathways",
    description: "BCL2L1 和 AKT1 抑制 p53 和 NF-kB 通路的促凋亡信号",
  },
  {
    id: "he_28", label: "mutates", relation: "Disease-mutates-Gene",
    nodes: ["DOID:3908","1956","238","3845","5979"],
    color: "#0ea5e9", topic: "Signaling Pathways",
    description: "NSCLC 常见驱动突变: EGFR, ALK, KRAS, RET",
  },
  {
    id: "he_29", label: "associates", relation: "Disease-associates-Gene",
    nodes: ["DOID:5041","7157","672","5728","4763"],
    color: "#8b5cf6", topic: "Signaling Pathways",
    description: "TNBC 关联基因: TP53, BRCA1, PTEN, NF1",
  },
  {
    id: "he_30", label: "targets", relation: "Pathway-targets-Protein",
    nodes: ["PW:0000605","PW:0000168","PW:0000232","P42336"],
    color: "#6b7280", topic: "Signaling Pathways",
    description: "Wnt、Notch、JAK-STAT 通路汇聚于 PIK3CA 催化亚基",
  },
]

// === 子超图文本块 ===
export const textChunks = [
  {
    topic: "Breast Cancer Treatment",
    title: "乳腺癌药物治疗机制",
    chunks: [
      "Tamoxifen (DB00675) 是一种选择性雌激素受体调节剂 (SERM)，通过竞争性结合雌激素受体 ESR1 来抑制乳腺癌细胞增殖。临床研究表明，Tamoxifen 可下调 PDCD11、CD320、CDC20、PSMG1 等基因的表达水平，同时与 CYP2C8、ABCC2、CYP2C19、CYP1A1 等代谢酶存在结合作用，影响药物代谢动力学。",
      "Fulvestrant (DB00947) 是一种纯雌激素受体拮抗剂，通过降解 ESR1 蛋白来完全阻断雌激素信号通路。与 Tamoxifen 不同，Fulvestrant 不具有部分激动活性。它下调 FANCA、RPA3、ASPM、MRPS2 等 DNA 修复和细胞分裂相关基因，并与 EPHX2、ESR1、ESR2、ESRRA 等受体结合。",
      "Tamoxifen 与 Fulvestrant 存在共同的下调靶基因 (CD320, CDC20, PSMG1)，提示两种药物在抑制细胞周期调控方面具有部分重叠的分子机制。这一发现为联合用药或序贯治疗策略提供了理论依据。",
    ],
  },
  {
    topic: "Breast Cancer Pathology",
    title: "乳腺癌病理与分子特征",
    chunks: [
      "乳腺癌 (DOID:1612) 的临床表现包括乳房疼痛 (Mastodynia)、乏力 (Asthenia)、潮热 (Hot Flashes) 和发热 (Fever) 等症状。疾病主要定位于乳腺 (mammary gland)，可转移至输卵管 (fallopian tube)、脐静脉 (umbilical vein) 和淋巴结 (lymph node) 等部位。",
      "乳腺癌的分子病理学研究揭示了多个关键关联基因：HNRNPK 参与 mRNA 剪接调控，SYNJ2 涉及磷脂代谢，PTEN 是重要的抑癌基因，TNIP1 调节 NF-κB 信号通路。这些基因的异常表达与乳腺癌的发生发展密切相关。",
      "乳腺癌常见的体细胞突变包括 BRCA1 和 BRCA2 (DNA 同源重组修复)、TP53 (细胞周期检查点) 和 PIK3CA (PI3K/AKT 信号通路)。BRCA1/2 突变携带者的终生乳腺癌风险可达 60-80%，是遗传性乳腺癌的主要致病基因。",
      "除 Tamoxifen 和 Fulvestrant 外，乳腺癌的化疗方案还包括 Chlorambucil (烷化剂)、Mitoxantrone (蒽环类)、Capecitabine (氟尿嘧啶前药) 和 Methotrexate (叶酸拮抗剂)，分别通过不同机制抑制肿瘤细胞 DNA 合成和有丝分裂。",
    ],
  },
  {
    topic: "Lung Cancer Genomics",
    title: "肺癌基因组学与靶向治疗",
    chunks: [
      "肺癌 (DOID:1324) 是全球发病率和死亡率最高的恶性肿瘤之一。一线化疗方案包括 Cisplatin (铂类)、Etoposide (拓扑异构酶抑制剂) 和 Docetaxel (紫杉烷类)。Cisplatin 通过与 DNA 形成交联来诱导肿瘤细胞凋亡，并与 TP53、ERBB2 (HER2)、EGFR 等关键蛋白存在结合作用。",
      "肺癌的驱动基因突变谱包括 EGFR (表皮生长因子受体，约 15-30% 的非小细胞肺癌)、TP53 (约 50% 的肺癌)、MYC (原癌基因扩增) 和 MAPK1 (RAS/MAPK 信号通路)。EGFR 突变是酪氨酸激酶抑制剂 (TKI) 靶向治疗的重要生物标志物。",
      "肺癌主要定位于肺组织 (lung)，常见转移部位包括淋巴结 (lymph node)。临床症状表现为呼吸困难 (Dyspnea)、发热 (Fever)、头痛 (Headache) 和食欲减退 (Anorexia)，其中呼吸困难是最具特征性的早期症状。",
    ],
  },
  {
    topic: "Ovarian & Colorectal",
    title: "卵巢癌与结直肠癌治疗",
    chunks: [
      "卵巢癌 (DOID:2394) 的标准一线化疗方案为 Paclitaxel (紫杉醇) 联合 Carboplatin (卡铂) 的 TC 方案。Paclitaxel 通过稳定微管蛋白来阻断有丝分裂，Carboplatin 则通过 DNA 铂化交联诱导细胞凋亡。卵巢癌主要定位于卵巢 (ovary)，常见转移至淋巴结。",
      "结直肠癌 (DOID:9256) 的化疗方案包括 Capecitabine (卡培他滨，口服氟尿嘧啶前药)、Methotrexate (甲氨蝶呤) 和 Vinorelbine (长春瑞滨)。疾病主要定位于肠道 (intestine)，肝脏 (liver) 是最常见的远处转移部位，约 50% 的结直肠癌患者会发生肝转移。",
    ],
  },
  {
    topic: "Signaling Pathways",
    title: "肿瘤信号通路网络与蛋白调控",
    chunks: [
      "PI3K-Akt 信号通路是肿瘤中最常见的异常激活通路之一。PIK3CA 基因编码 PI3K 催化亚基 (P42336)，其突变导致 AKT1 蛋白激酶持续磷酸化激活。PTEN 作为该通路的负调控因子，其功能缺失使 PI3K-Akt 信号失控，促进肿瘤细胞增殖和存活。mTOR 通路是 PI3K-Akt 的重要下游效应器。",
      "RAS/MAPK 信号通路由 KRAS、NRAS 等 RAS 家族基因驱动，通过 MAPK1 (ERK2) 级联传导增殖信号。KRAS 突变在 NSCLC (DOID:3908) 和结直肠癌中高度常见。PI3K-Akt、MAPK、p53 和 mTOR 四条通路之间存在广泛的交叉调控 (crosstalk)，形成复杂的信号网络。",
      "TP53 基因编码 p53 蛋白 (P04637)，是最重要的肿瘤抑制因子。p53 通路调控细胞周期阻滞、DNA 修复和凋亡。BCL2L1 (抗凋亡蛋白) 和 AKT1 可抑制 p53 和 NF-kB 通路的促凋亡信号，是肿瘤耐药的重要机制。",
      "BRCA1 (P38398) 和 BRCA2 (P51587) 蛋白参与 DNA 同源重组修复。EGFR (P00533) 和 HER2 (P04626) 是重要的受体酪氨酸激酶。三阴性乳腺癌 (TNBC, DOID:5041) 常见 TP53、BRCA1、PTEN、NF1 突变，缺乏激素受体和 HER2 表达，治疗选择有限。NSCLC 的驱动突变包括 EGFR、ALK、KRAS 和 RET。",
      "Wnt、Notch 和 JAK-STAT 信号通路在肿瘤干细胞维持和分化中发挥关键作用。这些通路的异常激活与肿瘤的发生、进展和耐药密切相关，并通过 PIK3CA 催化亚基等节点与 PI3K-Akt 通路产生汇聚效应。",
    ],
  },
]
