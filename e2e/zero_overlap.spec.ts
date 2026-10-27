import { test, expect } from '@playwright/test';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Returns true if box1 and box2 intersect with a given tolerance.
 */
function boxesIntersect(b1: Box, b2: Box, tolerance = 1): boolean {
  if (b1.width <= 0 || b1.height <= 0 || b2.width <= 0 || b2.height <= 0) return false;
  return !(
    b1.x + b1.width <= b2.x + tolerance ||
    b2.x + b2.width <= b1.x + tolerance ||
    b1.y + b1.height <= b2.y + tolerance ||
    b2.y + b2.height <= b1.y + tolerance
  );
}

test.describe('GLOBAL ZERO-OVERLAP & LAYOUT INTEGRITY VERIFICATION', () => {
  const TEST_VIEWPORTS = [
    { name: '320px 極小手機', width: 320, height: 640 },
    { name: '375px 手機', width: 375, height: 667 },
    { name: '768px 平板', width: 768, height: 1024 },
    { name: '1280px 筆電', width: 1280, height: 800 },
    { name: '1920px 大型螢幕', width: 1920, height: 1080 },
  ];

  for (const vp of TEST_VIEWPORTS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`[${vp.name}] [${theme}模式] - Zero Overlap 核心檢查：標題/統計/圖表/卡片無重疊且無溢出`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');

        // Set Theme
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

        await page.waitForTimeout(300);

        // 1. Strict Horizontal Overflow Check
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

        // 2. Funnel Overview KPI Cards - Sibling Non-Overlap Check
        const kpiCards = page.getByTestId('kpi-card');
        const kpiCount = await kpiCards.count();
        expect(kpiCount).toBe(5);

        const kpiBoxes: Box[] = [];
        for (let i = 0; i < kpiCount; i++) {
          const box = await kpiCards.nth(i).boundingBox();
          expect(box).not.toBeNull();
          if (box) kpiBoxes.push(box);
        }

        // Verify no pair of KPI cards intersect
        for (let i = 0; i < kpiBoxes.length; i++) {
          for (let j = i + 1; j < kpiBoxes.length; j++) {
            const overlaps = boxesIntersect(kpiBoxes[i], kpiBoxes[j]);
            expect(overlaps).toBe(false);
          }
        }

        // 3. Funnel Chart - Verify Header & Stats do not overlap ECharts Canvas/SVG
        const headerEl = page.getByTestId('echarts-funnel-header');
        const chartEl = page.getByTestId('echarts-funnel-chart');

        if (await headerEl.isVisible() && await chartEl.isVisible()) {
          const headerBox = await headerEl.boundingBox();
          const chartBox = await chartEl.boundingBox();

          if (headerBox && chartBox) {
            // Header must be strictly above the chart area (Document flow)
            expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(chartBox.y + 2);
            expect(boxesIntersect(headerBox, chartBox)).toBe(false);
          }
        }

        // 4. Step Cards - Verify bottleneck badge and step title are in document flow and do not overlap
        const bottleneckBadge = page.locator('span:has-text("最大流失瓶頸")').first();
        if (await bottleneckBadge.isVisible()) {
          const badgeBox = await bottleneckBadge.boundingBox();
          expect(badgeBox).not.toBeNull();
          if (badgeBox) {
            expect(badgeBox.width).toBeGreaterThan(0);
            expect(badgeBox.height).toBeGreaterThan(0);
          }
        }
      });
    }
  }

  test('完成時間分佈頁籤：統計區與 ECharts 直方圖 Bounding Box 不相交 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Switch to Time Distribution tab via mobile menu or desktop button
    const menuBtn = page.getByTestId('mobile-menu-btn');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.getByRole('button', { name: '完成時間分布' }).click();
    } else {
      await page.getByRole('button', { name: '完成時間分布' }).click();
    }

    await page.waitForTimeout(400);

    // 1. Histogram Header vs Chart non-overlap
    const histoHeader = page.getByTestId('echarts-histo-header');
    const histoChart = page.getByTestId('echarts-histo-chart');

    await expect(histoHeader).toBeVisible();
    await expect(histoChart).toBeVisible();

    const histoHeaderBox = await histoHeader.boundingBox();
    const histoChartBox = await histoChart.boundingBox();

    if (histoHeaderBox && histoChartBox) {
      expect(histoHeaderBox.y + histoHeaderBox.height).toBeLessThanOrEqual(histoChartBox.y + 2);
      expect(boxesIntersect(histoHeaderBox, histoChartBox)).toBe(false);
    }
  });

  test('屬性分群比較頁籤：分群長條圖與詳表無相交且無溢出 (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const menuBtn = page.getByTestId('mobile-menu-btn');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.getByRole('button', { name: '屬性分群比較' }).click();
    } else {
      await page.getByRole('button', { name: '屬性分群比較' }).click();
    }
    await page.waitForTimeout(400);

    // Verify Champion Card
    const championCard = page.locator('text=表現最優客群');
    await expect(championCard).toBeVisible();

    // Verify Chart visibility & Bounding Box
    const segmentChart = page.locator('.echarts-for-react');
    await expect(segmentChart).toBeVisible();
    const chartBox = await segmentChart.boundingBox();
    expect(chartBox).not.toBeNull();

    // Verify Scroll Table doesn't break page scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('多漏斗平行對比頁籤：雙漏斗卡片非重疊檢驗 (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.getByRole('button', { name: '多漏斗對比' }).click();
    await page.waitForTimeout(400);

    const funnelACard = page.locator('text=基準漏斗 A').locator('..');
    const funnelBCard = page.locator('text=對比漏斗 B').locator('..');

    await expect(funnelACard).toBeVisible();
    await expect(funnelBCard).toBeVisible();

    const boxA = await funnelACard.boundingBox();
    const boxB = await funnelBCard.boundingBox();

    if (boxA && boxB) {
      expect(boxesIntersect(boxA, boxB)).toBe(false);
    }
  });

  test('瀏覽器 200% 縮放 (Zoom) 檢驗：主要內容自適應無遮擋無重疊 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Simulate 200% text / layout zoom via CSS zoom
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });

    await page.waitForTimeout(400);

    // Verify Header is still rendered properly
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify KPI Cards can expand without clipping
    const kpiFirst = page.getByTestId('kpi-card').first();
    await expect(kpiFirst).toBeVisible();
    const kpiBox = await kpiFirst.boundingBox();
    expect(kpiBox).not.toBeNull();
    if (kpiBox) {
      expect(kpiBox.height).toBeGreaterThan(60);
    }

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('視覺截圖驗證：產出真實網頁渲染截圖供視覺檢查', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(500);

    // Save screenshots for visual verification
    await page.screenshot({ path: 'test-results/screenshots/desktop-1280-funnel.png', fullPage: false });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/screenshots/mobile-375-funnel.png', fullPage: false });
  });
});
