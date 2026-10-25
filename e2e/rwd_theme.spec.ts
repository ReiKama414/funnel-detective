import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px 極小型手機', width: 320, height: 640 },
  { name: '375px 一般手機', width: 375, height: 667 },
  { name: '390px 主流手機', width: 390, height: 844 },
  { name: '430px 大型手機', width: 430, height: 932 },
  { name: '768px 平板直向', width: 768, height: 1024 },
  { name: '1024px 平板橫向', width: 1024, height: 768 },
  { name: '1280px 筆電', width: 1280, height: 800 },
  { name: '1440px 桌面', width: 1440, height: 900 },
  { name: '1920px 大型螢幕', width: 1920, height: 1080 },
];

test.describe('Funnel Detective - 9 種 Viewport RWD 與黑白雙主題無跑版驗證', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`[${vp.name}] - ${theme === 'dark' ? '深色模式 (Dark)' : '淺色模式 (Light)'}：無非預期水平捲軸與邊界檢驗`, async ({
        page,
      }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');

        // Set theme via localStorage or theme toggle
        await page.evaluate((t) => {
          localStorage.setItem('funnel_detective_theme', t);
          const root = document.documentElement;
          if (t === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
          } else {
            root.classList.remove('dark');
            root.classList.add('light');
          }
        }, theme);

        // Wait for page to stabilize
        await page.waitForTimeout(300);

        // 1. Strict horizontal overflow check
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

        // 2. Verify Header visibility & bounding box
        const header = page.locator('header');
        await expect(header).toBeVisible();
        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();
        if (headerBox) {
          expect(headerBox.x).toBeGreaterThanOrEqual(-1);
          expect(headerBox.x + headerBox.width).toBeLessThanOrEqual(vp.width + 1);
        }

        // 3. Verify KPI cards container bounding box
        const main = page.locator('main');
        await expect(main).toBeVisible();
        const mainBox = await main.boundingBox();
        expect(mainBox).not.toBeNull();
        if (mainBox) {
          expect(mainBox.x).toBeGreaterThanOrEqual(-1);
          expect(mainBox.x + mainBox.width).toBeLessThanOrEqual(vp.width + 1);
        }

        // 4. Verify Theme Class applied
        const isDarkApplied = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        const isLightApplied = await page.evaluate(() => document.documentElement.classList.contains('light'));
        if (theme === 'dark') {
          expect(isDarkApplied).toBe(true);
        } else {
          expect(isLightApplied).toBe(true);
        }

        // 5. Check Console Errors
        const filteredErrors = consoleErrors.filter(
          (e) => !e.includes('favicon') && !e.includes('Download')
        );
        expect(filteredErrors).toHaveLength(0);
      });
    }
  }

  test('手機版專屬流程：Drawer 選單開合與 Modal 視窗不超出螢幕 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 1. Mobile Menu Open
    const menuBtn = page.getByTestId('mobile-menu-btn');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Verify menu items visible inside mobile drawer
    await expect(page.getByRole('button', { name: '完成時間分布' })).toBeVisible();

    // Switch tab inside mobile menu
    await page.getByRole('button', { name: '完成時間分布' }).click();

    // Drawer should close after selection
    await expect(page.locator('text=全漏斗完成時間分佈直方圖')).toBeVisible();

    // Check no horizontal overflow on 375px
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // 2. Open Ingestion Modal on mobile
    await page.getByTestId('mobile-menu-btn').click();
    await page.getByRole('button', { name: '匯入資料' }).click();

    const modal = page.locator('text=匯入事件資料 (CSV / JSON)');
    await expect(modal).toBeVisible();

    // Modal dialog must fit inside 375px width
    const modalDialog = page.locator('div.fixed.inset-0 > div').first();
    const modalBox = await modalDialog.boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      expect(modalBox.x).toBeGreaterThanOrEqual(0);
      expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(376);
    }

    // Close modal
    await page.getByRole('button', { name: '取消' }).click();
  });

  test('主題切換即時回應：System -> Light -> Dark -> System', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const toggleBtn = page.getByTestId('theme-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Switch to Light
    await page.getByRole('button', { name: '淺色模式' }).click();
    let isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
    expect(isLight).toBe(true);

    // Switch to Dark
    await toggleBtn.click();
    await page.getByRole('button', { name: '深色模式' }).click();
    let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Switch to System
    await toggleBtn.click();
    await page.getByRole('button', { name: '系統跟隨' }).click();
    const currentStored = await page.evaluate(() => localStorage.getItem('funnel_detective_theme'));
    expect(currentStored).toBe('system');
  });
});
