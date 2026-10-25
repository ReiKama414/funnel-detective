import { test, expect } from '@playwright/test';

test.describe('Funnel Detective - E2E Core User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. 工作台初始載入與預設指標檢驗', async ({ page }) => {
    // Check Header Brand
    await expect(page.getByRole('banner').getByText('Funnel Detective')).toBeVisible();

    // Check KPI Cards
    await expect(page.locator('text=進入漏斗人數')).toBeVisible();
    await expect(page.locator('text=完整通關人數')).toBeVisible();
    await expect(page.locator('text=總體轉換率')).toBeVisible();
    await expect(page.locator('text=中位數轉換耗時')).toBeVisible();

    // Verify 5 default steps loaded
    await expect(page.locator('text=首頁瀏覽 (Page View)').first()).toBeVisible();
    await expect(page.locator('text=完成購買 (Purchase)').first()).toBeVisible();

    // Check ECharts presence
    const chart = page.locator('.echarts-for-react');
    await expect(chart.first()).toBeVisible();
  });

  test('2. 步驟操作與動態計算更新', async ({ page }) => {
    // Add a new step
    const addStepBtn = page.getByRole('button', { name: '新增步驟', exact: true });
    await expect(addStepBtn).toBeVisible();
    await addStepBtn.click();

    // Verify Step 6 input appeared
    await expect(page.locator('input[value="步驟 6"]')).toBeVisible();

    // Toggle advanced settings (conversion window)
    const settingsBtn = page.getByRole('button', { name: '時間窗與去重設定' });
    await settingsBtn.click();

    // Check window input is visible
    await expect(page.locator('text=轉換時間窗 (Window)')).toBeVisible();
    await expect(page.locator('text=去重與計算規則')).toBeVisible();
  });

  test('3. 分頁切換功能驗證 (完成時間分布、分群、多漏斗對比、偵探報告)', async ({ page }) => {
    // 1. Time Distribution Tab
    await page.getByRole('button', { name: '完成時間分布' }).first().click();
    await expect(page.locator('text=全漏斗完成時間分佈直方圖')).toBeVisible();
    await expect(page.locator('text=中位數 (P50)')).toBeVisible();

    // 2. Segments Tab
    await page.getByRole('button', { name: '屬性分群比較' }).first().click();
    await expect(page.locator('text=目前分群維度')).toBeVisible();
    await expect(page.locator('text=表現最優客群')).toBeVisible();

    // 3. Compare Tab
    await page.getByRole('button', { name: '多漏斗對比' }).first().click();
    await expect(page.locator('text=多漏斗平行對比 (Funnel Comparison)')).toBeVisible();
    await expect(page.locator('text=基準漏斗 A')).toBeVisible();
    await expect(page.locator('text=對比漏斗 B')).toBeVisible();
    await expect(page.locator('text=步驟指標差異詳表')).toBeVisible();

    // 4. Detective Insights Tab
    await page.getByRole('button', { name: '偵探洞察報告' }).first().click();
    await expect(page.locator('text=漏斗偵探智慧診斷報告')).toBeVisible();
    await expect(page.locator('text=最大流失瓶頸').first()).toBeVisible();
  });

  test('4. 流失受眾名單調閱與匯出驗證', async ({ page }) => {
    // Find and click "查看流失名單"
    const dropOffBtn = page.locator('button:has-text("查看流失名單")').first();
    await expect(dropOffBtn).toBeVisible();
    await dropOffBtn.click();

    // Verify modal is opened
    await expect(page.locator('text=流失用戶名單')).toBeVisible();
    await expect(page.locator('input[placeholder="搜尋 User ID..."]')).toBeVisible();

    // Test Search filter
    const searchInput = page.locator('input[placeholder="搜尋 User ID..."]');
    await searchInput.fill('usr_ecom_');

    // Trigger CSV Export
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '匯出名單 CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    // Close modal
    await page.getByRole('button', { name: '關閉' }).click();
  });

  test('5. 資料匯入與自訂 CSV 解析流程', async ({ page }) => {
    // Open Import Modal
    await page.getByRole('button', { name: '匯入資料' }).first().click();
    await expect(page.locator('text=匯入事件資料 (CSV / JSON)')).toBeVisible();

    // Switch to Paste text mode
    await page.getByRole('button', { name: '直接貼上文字內容' }).click();

    // Paste sample CSV data
    const sampleCsv = `user_id,event_name,timestamp,device\nusr_001,page_view,2024-05-01T10:00:00Z,Desktop\nusr_001,checkout,2024-05-01T10:15:00Z,Desktop\nusr_002,page_view,2024-05-01T11:00:00Z,Mobile`;
    await page.locator('textarea').fill(sampleCsv);

    // Click Parse
    await page.getByRole('button', { name: '解析內容' }).click();

    // Verify Parse stats
    await expect(page.locator('text=有效事件')).toBeVisible();
    await expect(page.locator('text=欄位對應確認')).toBeVisible();

    // Confirm Import
    await page.getByRole('button', { name: '確認匯入並開始分析' }).click();

    // Verify the new imported funnel input contains the imported name
    await expect(page.locator('input[value*="pasted_data.csv"]')).toBeVisible();
  });

  test('6. IndexedDB 本地資料庫儲存與管理流程', async ({ page }) => {
    // Open Saved Funnels Modal
    await page.getByRole('button', { name: '已存漏斗' }).click();
    await expect(page.locator('text=IndexedDB 本地資料庫管理')).toBeVisible();

    // Fill funnel name and save
    const nameInput = page.locator('input[placeholder="輸入儲存名稱..."]');
    await nameInput.fill('Playwright 自動化測試漏斗');
    await page.getByRole('button', { name: '儲存配置' }).click();

    // Verify success feedback and appearance in list
    await expect(page.locator('text=已成功持久化至 IndexedDB')).toBeVisible();
    await expect(page.locator('text=Playwright 自動化測試漏斗')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: '關閉' }).click();
  });
});
