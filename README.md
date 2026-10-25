# 🔍 Funnel Detective (漏斗偵探)

> **事件轉換分析與流失偵測工作台**  
> 基於 React 19、TypeScript、Vite 與 Tailwind CSS 開發之正式生產級客戶轉換漏斗分析平台。  
> 視覺圖表採用 Apache ECharts 渲染，資料持久化支援瀏覽器原生 IndexedDB，提供嚴格獨立使用者防重複計量演算法。

---

## 🚀 線上展示與快速啟動 (Quick Start)

### 本地啟動
```bash
# 1. 安裝依賴套件
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 程式碼靜態檢查
npm run lint

# 4. 執行核心單元測試 (Vitest)
npm test

# 5. 執行端到端使用者旅程測試 (Playwright E2E)
npm run test:e2e

# 6. 生產環境建置
npm run build
```

---

## 🛠️ 技術棧與架構設計 (Tech Stack & Architecture)

- **前端框架**：React 19 (`react`, `react-dom`)
- **語言與工具鏈**：TypeScript 6 + Vite 8
- **樣式系統**：Tailwind CSS v4 (專業工作台暗色風格，無過量漸層與光效，字體與間距統一)
- **視覺圖表引擎**：Apache ECharts (`echarts`, `echarts-for-react`)
- **資料持久化**：IndexedDB (`idb`，支援離線保存自訂資料集、漏斗配置、歷史受眾名單)
- **資料解析器**：PapaParse（支援 CSV 格式容錯、時間戳識別、欄位自動映射）
- **測試框架**：
  - 單元測試：**Vitest**（核心計量引擎、邊界判定、分位數計算）
  - E2E 端到端測試：**Playwright**（驗證步驟操作、時間分布、分群對比、名單匯出、CSV 匯入與 IndexedDB 保存）

---

## 🌟 核心功能說明 (Features)

### 1. 多元資料匯入與欄位自動對應
- 支援拖曳上傳或直接貼上 CSV / JSON 格式。
- 自動識別 `user_id`（匿名使用者識別碼）、`event_name`（事件名稱）、`timestamp`（多種日期格式、ISO8601、UNIX 毫秒/秒）。
- 自動提取擴充屬性（如：`device`、`country`、`traffic_source`、`plan`、`amount` 等）。
- 嚴格異常資料處理：即時偵測空檔案、無效標題列、時間戳異常列並提供統計反饋。
- 內建 3 套真實情境資料集：**電商結帳漏斗**、**SaaS 用戶啟用**、**行動 App 試用**。

### 2. 有序漏斗配置與嚴格去重
- **步驟序列化**：自訂步驟別名、順序調整、刪除與新增。
- **單步過濾器**：每步可設定屬性條件（如 `device == 'iOS'`、`amount > 100` 等）。
- **轉換時間窗 (Conversion Window)**：支援自訂數值與單位（分鐘、小時、天），支援「以第 1 步起算」或「相鄰步驟間隔」雙模式。
- **去重規則 (Deduplication - 嚴格避免重複計算)**：
  - **首次觸發 (First Touch)**：使用者首次達成第 1 步時開啟旅程，後續步驟嚴格按時序推進；保證單一使用者在各步驟最多被計入 1 次。
  - **最佳路徑 (Best Touch)**：使用者若有多段嘗試，計算推進最深的一次完整旅程。

### 3. ECharts 視覺化與時間分佈
- **ECharts 階段留存量規**：直觀視覺化階段轉化率與流失節點。
- **完成時間分佈直方圖**：呈現各耗時區間人數分佈，直觀辨識快速決策群體與長尾猶豫群體。
- **精確時間指標**：P50 (中位數)、P75、P90、P95、平均值、最小值、最大值耗時指標。
- **步驟間轉換耗時對比**：揪出延遲最高、最拖慢節奏的瓶頸步驟。

### 4. 屬性分群與多漏斗平行對比
- **屬性分群 (Breakdown)**：依指定維度（如不同裝置、地區）將漏斗拆解，產出跨群體並行轉換長條圖與詳表。
- **多漏斗對比 (Multi-Funnel Comparison)**：平行對比不同時間窗（如 24 小時 vs 7 天）、不同篩選條件或去重規則下的轉化差異。

### 5. 受眾名單調閱與多格式匯出
- 點擊流失節點即可調閱流失用戶清單。
- 支援將流失受眾匯出為 CSV，利於精準再行銷 (Retargeting) 或問題排查。
- 支援匯出漏斗統計指標 CSV 與完整分析 JSON 報告。

### 6. IndexedDB 本地資料庫
- 免登入即可完全離線使用。
- 支援儲存自訂漏斗配置、歷史匯入資料集與導出的受眾群組，隨時重新載入或下載。

---

## 🌐 部署設定 (Vercel Deployment)

本專案已包含針對 Vercel 的最佳化配置檔 [`vercel.json`](./vercel.json)：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 部署途徑：
1. **GitHub 連動**：推送至 GitHub 後於 Vercel 儀表板匯入倉庫即可自動建置。
2. **CLI 部署**：
   ```bash
   npm i -g vercel
   vercel
   ```

---

## ⚠️ 已知限制 (Known Limitations)

1. **瀏覽器記憶體上限 (Client-side Processing)**：
   - 由於本平台採純前端本地計算以保護使用者資料隱私，單次 CSV/JSON 匯入建議在 **100,000 列事件** 以內。超過 50,000 列時系統會啟動防護機制，載入前 50,000 列以保證瀏覽器流暢運作。
2. **本地儲存範圍 (IndexedDB Scope)**：
   - 資料保存於目前瀏覽器設定檔中。若使用者使用「無痕視窗」或主動「清除瀏覽器快取/網站資料」，已儲存之自訂漏斗與受眾名單將被清除。如需永久保存請使用頂部「匯出完整 JSON」備份。
3. **跨步驟屬性更新判定**：
   - 目前分群依據使用者在該次旅程首個事件所記錄之屬性為基準。
