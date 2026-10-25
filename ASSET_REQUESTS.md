# 🎨 Funnel Detective - ComfyUI 素材規格與 Prompt 請求表 (Asset Requests)

依循專案規範，本文件記錄供 ComfyUI 批次生成之圖片素材規格、推薦模型、解析度、Prompt 與 Negative Prompt。
UI 前端採用簡潔清晰的 SVG/CSS 占位區（Placeholder），待素材生成後可直接放置至 `assets/` 資料夾替換。

---

## 1. 產品主識別標誌 (Product Logo & Icon)
- **用途**：應用程式頂部導覽列、頁籤圖示 (Favicon) 與報告匯出頁首
- **檔案路徑**：`assets/logo_icon.png`
- **解析度**：`1024 x 1024` (1:1 正方形)
- **建議模型**：SDXL 1.0 / Flux.1 Schnell
- **Prompt**：
  ```text
  minimalist modern tech logo, stylized sleek magnifying glass fused with sequential multi-stage funnel, glowing dark indigo and cyan accents, clean sharp geometric lines, vector precision, professional dark slate background, isolated, vector graphic style, 8k resolution, highly detailed, centered
  ```
- **Negative Prompt**：
  ```text
  blurry, realistic photo, complex 3d render, messy lines, text, watermark, signature, gradient rainbow, noisy background, low quality
  ```

---

## 2. 空狀態插圖：無資料匯入 (Empty State: No Data Uploaded)
- **用途**：尚未匯入任何 CSV/JSON 檔案時的資料檢視區引導
- **檔案路徑**：`assets/empty_data.png`
- **解析度**：`800 x 600` (4:3 橫向)
- **建議模型**：Flux.1 Dev / SDXL
- **Prompt**：
  ```text
  minimalist flat outline illustration of a clean enterprise data clipboard with an open folder, dotted user journey footprints, professional business analytics workbench, dark navy slate color scheme, subtle indigo accents, clean vector line art, modern corporate UI illustration, high contrast, transparent background
  ```
- **Negative Prompt**：
  ```text
  photorealistic, clutter, messy gradient, overly complex, 3d glossy, noisy texture, childish cartoon, text, blurry
  ```

---

## 3. 空狀態插圖：尚無完整轉換者 (Empty State: Zero Completed Journeys)
- **用途**：時間分佈頁面當未有任何使用者完成全部步驟時的專業提示
- **檔案路徑**：`assets/empty_conversion.png`
- **解析度**：`800 x 600` (4:3 橫向)
- **建議模型**：Flux.1 Dev
- **Prompt**：
  ```text
  clean enterprise tech illustration showing an hourglass standing alongside a multi-step progression bar, awaiting data completion, subtle indigo and cyan tone, dark mode UI style, professional, flat vector design, crisp lines
  ```
- **Negative Prompt**：
  ```text
  bright white background, oversaturated colors, photorealistic, noise, 3d render, text
  ```

---

## 4. 偵探分析報告徽章 (Detective Audit Report Stamp)
- **用途**：匯出 PDF/圖片報告時的稽核認證戳印
- **檔案路徑**：`assets/audit_badge.png`
- **解析度**：`512 x 512` (1:1)
- **建議模型**：SDXL
- **Prompt**：
  ```text
  circular corporate audit seal stamp, minimalist geometric badge with checkmark and funnel symbol, sharp crisp borders, professional dark indigo and emerald green, vector SVG aesthetic, transparent background
  ```
- **Negative Prompt**：
  ```text
  rough, vintage grunge, dirty texture, low resolution, blurry
  ```
