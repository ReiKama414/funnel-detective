# 🔍 Funnel Detective (漏斗偵探)

> **事件轉換分析與流失偵測平台**  
> 一款基於 React 19、TypeScript 與 Vite 開發的高效能客戶行為漏斗分析平台。支援自訂有序步驟、精確轉換時間窗、嚴格防重複計算、屬性分群、完成時間分佈分位數、多漏斗並行比較與受眾名單匯出。

---

## 🌟 核心特色 (Core Features)

1. **多元資料匯入與欄位自動對應 (Data Ingestion)**
   - 支援拖曳或上傳 **CSV / JSON** 格式事件日誌，亦可直接貼上文字內容。
   - 智慧自動識別 `user_id`（匿名使用者識別碼）、`event_name`（事件名稱）、`timestamp`（多種日期格式、ISO8601、UNIX 毫秒/秒）。
   - 自動提取附加屬性（如：`device`、`country`、`traffic_source`、`plan`、`amount` 等），提供預覽表格與欄位校正機制。
   - 內建 3 組產業級真實示範資料集：
     - **電商結帳漏斗 (E-Commerce)**：瀏覽首頁 → 商品詳情 → 加入購物車 → 開始結帳 → 完成購買
     - **SaaS 用戶啟用 (SaaS Onboarding)**：造訪落地頁 → 送出註冊 → 驗證信箱 → 建立工作區 → 升級付費
     - **行動 App 試用 (Mobile App)**：開啟 App → 完成導覽 → 瀏覽內容 → 開啟試用

2. **有序漏斗建立與彈性配置 (Funnel Builder)**
   - **步驟序列化**：自由新增、重新命名、調整順序、刪除步驟。
   - **單步過濾器**：每步可設定屬性條件（如 `device == 'iOS'`、`amount > 100` 等）。
   - **轉換時間窗 (Conversion Window)**：支援自訂數值與單位（分鐘、小時、天），支援「以第一步起算」或「相鄰步驟間隔」雙模式。
   - **去重規則 (Deduplication Rules - 嚴格避免重複計算)**：
     - **首次觸發 (First Touch)**：使用者首次達成第 1 步時開啟旅程，後續步驟嚴格按時序推進；保證單一使用者在各步驟最多被計入 1 次。
     - **最佳路徑 (Best/Last Touch)**：使用者若有多段嘗試，計算推進最深的一次完整旅程。

3. **精準計算與視覺化呈現 (Metrics & Visualizations)**
   - 各步驟獨立使用者數 ($N_i$)。
   - 步驟轉換率 ($N_i / N_{i-1}$) 與總體轉換率 ($N_i / N_1$)。
   - 步驟流失人數 ($N_{i-1} - N_i$) 與流失率 ($1 - N_i / N_{i-1}$)。
   - **完成時間分佈 (Completion Time Distribution)**：
     - P50 (中位數)、P75、P90、P95、平均值、最小值、最大值耗時指標。
     - 直方圖時間區間分佈（Histogram Bins）。
     - 步驟間轉換耗時對比。

4. **分群比較與多漏斗對比 (Segmentation & Comparison)**
   - **屬性分群 (Breakdown)**：依指定維度（如不同裝置、地區）將漏斗拆解，產出跨群體並行轉換長條圖與詳表。
   - **多漏斗對比 (Multi-Funnel Comparison)**：平行對比不同時間窗（如 24 小時 vs 7 天）、不同篩選條件或去重規則下的轉化差異，提供直觀的差異數值與 AI 診斷註記。

5. **受眾導出與名單調閱 (Cohort Inspection & Export)**
   - 點擊流失節點即可調閱流失用戶清單。
   - 支援將流失受眾匯出為 CSV，利於精準再行銷 (Retargeting) 或問題排查。
   - 支援匯出漏斗統計指標 CSV 與完整分析 JSON 報告。

---

## 📐 防重複計算與演算法設計保證

在漏斗分析中，傳統以事件次數為基準的計算極易引發灌水與重複計數（例如使用者反覆刷新頁面、重試購買等）。Funnel Detective 採取如下嚴格保證：
1. **獨立使用者計量 (Unique User Counting)**：每個使用者 ID 獨立維護生命週期事件流，按時間戳嚴格升序排序。
2. **時序單調遞增 ($T_{step_k} \ge T_{step_{k-1}}$)**：在第 $k-1$ 步之前發生的第 $k$ 步事件無效，杜絕時間倒流誤判。
3. **時間窗邊界嚴格檢驗**：$T_{step_k} - T_{anchor} \le Window_{ms}$，超出即判定為流失。
4. **集合唯一約束**：每個步驟的達成名單以 `Set<string>` 儲存，無論該使用者在該階段觸發多少次相同或不同事件，在該步驟計量值恆為 1。

---

## 🧪 單元測試 (Unit Tests)

本專案使用 **Vitest** 建立完整的單元測試套件，涵蓋各類邊界與極端狀況：
- 單一使用者重複觸發去重驗證
- 倒序/亂序事件處理
- 轉換時間窗臨界值邊界（精確到毫秒）
- 相鄰步驟時間窗模式
- 步驟屬性過濾與全域過濾器
- 完成時間分位數 (P50, P90 等)
- 分群比較與多漏斗對比

執行單元測試：
```bash
npm test
```

---

## 🚀 本地開發與構建

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行語法與代碼檢查
npm run lint

# 執行完整單元測試
npm test

# 打包生產版本
npm run build
```

---

## 🌐 部署至 Vercel (Deployment)

本專案已包含針對 Vercel 的最優化設定檔 [`vercel.json`](./vercel.json)：

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

### 部署方式：
1. **GitHub / GitLab 連動**：
   - 將本專案推送至 GitHub 倉庫。
   - 在 [Vercel 儀表板](https://vercel.com) 點擊 **Add New Project** 並匯入該倉庫。
   - Vercel 將自動辨識 Vite 框架並執行 `npm run build` 完成一鍵部署。
2. **使用 Vercel CLI**：
   ```bash
   npm i -g vercel
   vercel
   ```
