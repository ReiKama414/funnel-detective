# Funnel Detective

> **事件轉換分析與流失偵測工作台**，基於 React 19 與 TypeScript 開發之離線優先分析平台

<p align="center">
  <a href="https://github.com/ReiKama414/funnel-detective">GitHub</a> ·
  <a href="https://reikama414.vercel.app/">個人網站</a> ·
  <a href="#快速開始">快速開始</a> ·
  <a href="#核心特色">核心特色</a> ·
  <a href="#測試驗證">測試驗證</a> ·
  <a href="#license--權限">授權</a>
</p>

---

## 核心特色

- **嚴格防重算計量核心** — 依循單一使用者不重複計量原則，維護嚴格單調時間序列與時間窗邊界
- **完整時間分佈直方圖** — 提供 P50、P75、P90、P95、平均值及耗時區間分組直方圖，辨別決策長尾
- **多維度屬性分群比較** — 支援依裝置、管道、地區等維度自動拆解漏斗，快速識別表現最優客群
- **平行多漏斗差異對照** — 橫向比對不同窗口大小、客群篩選條件或去重模式，產出指標變化與洞察摘要
- **受眾名單調閱與匯出** — 點擊各步驟節點即時調閱流失名單，真實現地匯出 CSV 與 JSON
- **瀏覽器原生資料庫** — 內建 IndexedDB 儲存引擎，免登入即可離線保存自訂資料集與歷史漏斗配置
- **黑白雙主題工作台** — 支援 System、Light、Dark 模式，符合全域零重疊 Document Flow 規範

---

## 技術棧

| 領域 | 技術與版本 | 說明 |
| --- | --- | --- |
| 前端框架 | React 19 · React DOM 19 | 核心應用介面建構與狀態管理 |
| 程式語言 | TypeScript 6 | 全面靜態型別與資料模型定義 |
| 建置工具 | Vite 8 | 高效開發伺服器與生產環境打包 |
| 樣式系統 | Tailwind CSS 4 | 專業工作台設計規範，支援黑白雙主題切換 |
| 圖表引擎 | Apache ECharts 6 · echarts-for-react | 自適應階段留存量規、時間直方圖與分群長條圖 |
| 資料持久化 | IndexedDB · idb | 離線保存自訂資料集、漏斗設定與歷史名單 |
| 資料解析 | PapaParse | CSV 格式解析、時間戳格式識別與異常略過判定 |
| 單元測試 | Vitest | 核心計量演算法、分位數計算與去重邏輯測試 |
| E2E 測試 | Playwright | 覆蓋 9 種 Viewport、零重疊排版與核心旅程測試 |

---

## 快速開始

### 環境需求

需要 Node.js **20 LTS 或更新版本**，以及現代網路瀏覽器

### 安裝與啟動

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動本機開發伺服器
npm run dev
```

啟動後在瀏覽器開啟終端顯示的本機網址（預設為 `http://localhost:5173`）

### 正式建置與預覽

```bash
# 靜態代碼規範檢查
npm run lint

# TypeScript 編譯與正式打包
npm run build

# 本機生產環境預覽
npm run preview
```

---

## 核心操作

| 模組 | 主要功能 | 操作方式 |
| --- | --- | --- |
| 內建資料集 | 提供電商結帳、SaaS 啟用、App 試用三套情境 | 透過頂部導覽列下拉選單快速切換 |
| 步驟配置 | 自訂漏斗步驟名稱、目標事件、上下順序與篩選條件 | 於步驟編輯區新增、刪除或拖曳順序 |
| 窗口與去重 | 設定時限（分鐘、小時、天）與去重規則 | 展開「時間窗與去重設定」，調整窗口與計算模式 |
| 時間分佈 | 檢視完成時間分位數指標與直方圖 | 切換至「完成時間分布」頁籤調閱 |
| 屬性分群 | 檢視各客群轉化率長條圖與指標詳表 | 切換至「屬性分群比較」頁籤，選擇分群欄位 |
| 雙漏斗對比 | 平行比較兩組漏斗配置之轉化率差值 ($\Delta$) | 切換至「多漏斗對比」頁籤，選取比對情境 |
| 智慧偵探報告 | 演算法自動巡檢流失斷點與滯留瓶頸 | 切換至「偵探洞察報告」頁籤調閱改善建議 |
| 名單調閱與匯出 | 下載流失名單 CSV、指標 CSV 或完整分析 JSON | 點擊步驟間「查看流失名單」或頂部「匯出」按鈕 |
| 本地資料庫 | 保存自訂漏斗設定與受眾群組快照 | 點擊頂部「已存漏斗」，命名後存入 IndexedDB |

---

## 資料與隱私

- **純前端運算** — 所有 CSV / JSON 解析、去重運算與指標產出皆在使用者瀏覽器內部執行，資料不會上傳至任何遠端伺服器
- **本地持久化儲存** — 自訂資料集與歷史漏斗存於瀏覽器原生的 IndexedDB，關閉視窗後仍會保留
- **資料保護提醒** — 使用「無痕模式」或主動「清除瀏覽器資料」將使本地儲存內容抹除，請定期使用頂部「匯出完整 JSON」備份
- **匯入異常處理機制** — 內建空檔案判定、時間戳格式相容驗證與損毀列自動排除機制，單次匯入安全防護上限為 50,000 列

---

## 測試驗證

本專案遵循嚴格的自動化驗收規範，包含單元測試、E2E 測試與無跑版檢驗

### 執行單元測試 (Vitest)

```bash
npm test
```

驗證有序時序判定、單一使用者防重複計算、轉換時間窗過濾、分位數（P50/P75/P90/P95）及直方圖分組

### 執行端到端測試 (Playwright E2E)

```bash
# 正式打包後執行 E2E 測試
npm run build
npm run test:e2e
```

E2E 測試套件共計 **41 項測試全部通過**，涵蓋範圍：

1. **零重疊與排版完整性** (`e2e/zero_overlap.spec.ts`)：驗證所有標題、統計數值與圖表嚴格依照 Document Flow 排列，無非預期 Absolute 覆蓋，在 200% 縮放時文字與元件自然伸展
2. **9 種 Viewport 響應式檢驗** (`e2e/rwd_theme.spec.ts`)：在 `320px`、`375px`、`390px`、`430px`、`768px`、`1024px`、`1280px`、`1440px`、`1920px` 下，分別驗證淺色與深色模式均無水平溢出
3. **核心功能流程驗證** (`e2e/funnel.spec.ts`)：驗證即時動態計算、分頁切換、流失名單調閱、自訂 CSV 匯入與 IndexedDB 本地保存流程

---

## 靜態部署

本專案為純前端單頁應用程式（SPA），已附帶針對 Vercel 之設定檔 [`vercel.json`](./vercel.json)

### Vercel 部署

1. 將程式庫推送至個人 GitHub
2. 於 Vercel 儀表板匯入該 Repository
3. 建置設定選擇 Vite（Build Command：`npm run build`，Output Directory：`dist`）
4. 完成部署

---

## 目錄結構

```text
funnel-detective/
├── e2e/                       # Playwright 端到端測試套件
│   ├── funnel.spec.ts         # 核心互動流程測試
│   ├── rwd_theme.spec.ts      # 9 種 Viewport 與黑白主題測試
│   └── zero_overlap.spec.ts   # 零重疊與排版完整性測試
├── src/
│   ├── components/            # 介面元件（工作台、分頁、彈窗）
│   │   └── echarts/           # ECharts 視覺化圖表封裝
│   ├── context/               # 雙主題狀態管理 Context
│   ├── data/                  # 內建範例資料集（電商、SaaS、App）
│   ├── engine/                # 漏斗計算核心、對比器與偵探分析器
│   ├── services/              # IndexedDB 本地資料庫服務
│   ├── tests/                 # Vitest 單元測試
│   ├── types/                 # TypeScript 資料模型定義
│   └── utils/                 # 資料解析、統計計算與匯出公用函式
├── package.json               # 專案配置與腳本
├── playwright.config.ts       # Playwright 測試組態
├── vercel.json                # Vercel 路由重寫設定
├── LICENSE                    # 版權聲明全文
└── README.md                  # 專案說明文件
```

---

## 已知限制

- **瀏覽器記憶體負載** — 為保護隱私採全前端本地計算，單次匯入建議在 50,000 列以內以維持流暢體驗
- **儲存作用域限制** — IndexedDB 依附於特定瀏覽器設定檔，跨裝置使用請透過 JSON 匯出備份檔案
- **首步屬性歸因** — 屬性分群目前以使用者在該次旅程起點步驟所記錄之屬性為基準

---

## License / 權限

Copyright (c) 2026 ReiKama414. All rights reserved.

本專案僅供個人瀏覽與學習。未經著作權人書面同意，不得使用、複製、修改、散布或併入其他專案（含非商業用途）

- [GitHub](https://github.com/ReiKama414/funnel-detective)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<p align="center">
  <sub>Funnel Detective · 事件轉換分析工作台</sub>
</p>
