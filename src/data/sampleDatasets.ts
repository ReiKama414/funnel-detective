import { FunnelConfig, RawEvent } from '../types/funnel';

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  iconName: string;
  events: RawEvent[];
  defaultConfig: FunnelConfig;
}

// Generate realistic E-commerce dataset
function generateEcommerceData(): { events: RawEvent[]; defaultConfig: FunnelConfig } {
  const events: RawEvent[] = [];
  const baseTime = 1714521600000; // May 1, 2024
  const devices = ['Mobile', 'Desktop', 'Tablet'];
  const countries = ['台灣 (TW)', '美國 (US)', '日本 (JP)', '新加坡 (SG)'];
  const sources = ['Google 搜尋', 'Facebook 廣告', '直接造訪', 'EDM 電子報'];

  // Seeded deterministic pseudo-random generator
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const totalUsers = 300;

  for (let u = 1; u <= totalUsers; u++) {
    const userId = `usr_ecom_${String(u).padStart(4, '0')}`;
    const userOffset = Math.floor(rand() * 10 * 86400 * 1000); // within 10 days
    const startTime = baseTime + userOffset;
    const device = devices[Math.floor(rand() * devices.length)];
    const country = countries[Math.floor(rand() * countries.length)];
    const source = sources[Math.floor(rand() * sources.length)];
    const baseProps = { device, country, traffic_source: source };

    // Step 1: 首頁瀏覽 (page_view) - 100%
    events.push({
      userId,
      eventName: 'page_view',
      timestamp: startTime,
      properties: { ...baseProps, page: 'home' },
    });

    // Possibility of extra page_view (tests deduplication)
    if (rand() < 0.4) {
      events.push({
        userId,
        eventName: 'page_view',
        timestamp: startTime + Math.floor(rand() * 120000),
        properties: { ...baseProps, page: 'category' },
      });
    }

    // Step 2: 瀏覽商品 (view_product) - ~75% conversion
    if (rand() < 0.75) {
      const t1 = startTime + Math.floor(30000 + rand() * 300000); // +30s to 5m
      events.push({
        userId,
        eventName: 'view_product',
        timestamp: t1,
        properties: { ...baseProps, product_id: `prod_${Math.floor(rand() * 20)}` },
      });

      // Repeat view product
      if (rand() < 0.5) {
        events.push({
          userId,
          eventName: 'view_product',
          timestamp: t1 + Math.floor(rand() * 60000),
          properties: { ...baseProps, product_id: `prod_${Math.floor(rand() * 20)}` },
        });
      }

      // Step 3: 加入購物車 (add_to_cart) - ~50% conversion from step 2
      // Desktop converts better than Mobile
      const cartProb = device === 'Desktop' ? 0.6 : 0.45;
      if (rand() < cartProb) {
        const t2 = t1 + Math.floor(45000 + rand() * 600000); // +45s to 10m
        events.push({
          userId,
          eventName: 'add_to_cart',
          timestamp: t2,
          properties: { ...baseProps, quantity: Math.floor(1 + rand() * 3) },
        });

        // Step 4: 開始結帳 (start_checkout) - ~60% conversion from cart
        if (rand() < 0.6) {
          const t3 = t2 + Math.floor(60000 + rand() * 900000); // +1m to 15m
          events.push({
            userId,
            eventName: 'start_checkout',
            timestamp: t3,
            properties: { ...baseProps, payment_type: 'credit_card' },
          });

          // Step 5: 完成購買 (purchase) - ~45% conversion from checkout (biggest bottleneck!)
          const purchaseProb = device === 'Desktop' ? 0.55 : 0.35;
          if (rand() < purchaseProb) {
            const t4 = t3 + Math.floor(120000 + rand() * 1200000); // +2m to 20m
            const amount = Math.floor(49 + rand() * 450);
            events.push({
              userId,
              eventName: 'purchase',
              timestamp: t4,
              properties: { ...baseProps, amount, order_id: `ord_${u}` },
            });
          }
        }
      }
    }
  }

  const defaultConfig: FunnelConfig = {
    id: 'ecom_standard_funnel',
    name: '電商核心購買漏斗 (E-Commerce Purchase Funnel)',
    description: '首頁瀏覽 → 查看商品 → 加入購物車 → 開始結帳 → 完成購買',
    steps: [
      { id: 'step-1', name: '首頁瀏覽 (Page View)', eventName: 'page_view', filters: [] },
      { id: 'step-2', name: '商品詳情 (View Product)', eventName: 'view_product', filters: [] },
      { id: 'step-3', name: '加入購物車 (Add to Cart)', eventName: 'add_to_cart', filters: [] },
      { id: 'step-4', name: '開始結帳 (Start Checkout)', eventName: 'start_checkout', filters: [] },
      { id: 'step-5', name: '完成購買 (Purchase)', eventName: 'purchase', filters: [] },
    ],
    conversionWindow: {
      value: 24,
      unit: 'hours',
      type: 'from_first_step',
    },
    deduplicationMode: 'unique_user_first_touch',
    breakdownProperty: 'device',
    globalFilters: [],
  };

  return { events, defaultConfig };
}

// Generate realistic SaaS Onboarding dataset
function generateSaasData(): { events: RawEvent[]; defaultConfig: FunnelConfig } {
  const events: RawEvent[] = [];
  const baseTime = 1714521600000;
  const plans = ['Free', 'Team', 'Enterprise'];
  const industries = ['軟體科技 (Tech)', '金融投資 (Finance)', '電子商務 (Retail)', '數位行銷 (Agency)'];

  let seed = 101;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const totalUsers = 250;

  for (let u = 1; u <= totalUsers; u++) {
    const userId = `saas_user_${String(u).padStart(4, '0')}`;
    const startTime = baseTime + Math.floor(rand() * 14 * 86400 * 1000);
    const plan = plans[Math.floor(rand() * plans.length)];
    const industry = industries[Math.floor(rand() * industries.length)];
    const baseProps = { plan, industry };

    // Step 1: 造訪落地頁
    events.push({
      userId,
      eventName: 'landing_visit',
      timestamp: startTime,
      properties: baseProps,
    });

    // Step 2: 註冊提交 (~65%)
    if (rand() < 0.65) {
      const t1 = startTime + Math.floor(45000 + rand() * 300000);
      events.push({
        userId,
        eventName: 'signup_submit',
        timestamp: t1,
        properties: baseProps,
      });

      // Step 3: 電子郵件驗證 (~80% of step 2)
      if (rand() < 0.8) {
        const t2 = t1 + Math.floor(180000 + rand() * 1800000); // 3m - 30m
        events.push({
          userId,
          eventName: 'email_verify',
          timestamp: t2,
          properties: baseProps,
        });

        // Step 4: 建立第一個專案 (~70% of step 3)
        if (rand() < 0.7) {
          const t3 = t2 + Math.floor(300000 + rand() * 7200000); // 5m - 2h
          events.push({
            userId,
            eventName: 'create_workspace',
            timestamp: t3,
            properties: baseProps,
          });

          // Step 5: 升級付費方案 (~25% of step 4)
          if (rand() < 0.25) {
            const t4 = t3 + Math.floor(86400000 + rand() * 4 * 86400000); // 1 - 5 days
            events.push({
              userId,
              eventName: 'upgrade_paid',
              timestamp: t4,
              properties: { ...baseProps, amount: 99 },
            });
          }
        }
      }
    }
  }

  const defaultConfig: FunnelConfig = {
    id: 'saas_onboarding_funnel',
    name: 'SaaS 用戶啟用與升級漏斗 (SaaS Onboarding & Activation)',
    description: '造訪落地頁 → 提交註冊 → 郵件驗證 → 建立專案 → 升級付費',
    steps: [
      { id: 'saas-1', name: '造訪落地頁 (Landing Visit)', eventName: 'landing_visit', filters: [] },
      { id: 'saas-2', name: '送出註冊 (Signup Submit)', eventName: 'signup_submit', filters: [] },
      { id: 'saas-3', name: '驗證信箱 (Email Verify)', eventName: 'email_verify', filters: [] },
      { id: 'saas-4', name: '建立工作區 (Create Workspace)', eventName: 'create_workspace', filters: [] },
      { id: 'saas-5', name: '升級付費 (Upgrade Paid)', eventName: 'upgrade_paid', filters: [] },
    ],
    conversionWindow: {
      value: 7,
      unit: 'days',
      type: 'from_first_step',
    },
    deduplicationMode: 'unique_user_first_touch',
    breakdownProperty: 'industry',
    globalFilters: [],
  };

  return { events, defaultConfig };
}

// Generate Mobile App Activation dataset
function generateMobileAppData(): { events: RawEvent[]; defaultConfig: FunnelConfig } {
  const events: RawEvent[] = [];
  const baseTime = 1714521600000;
  const osList = ['iOS', 'Android'];
  const channels = ['App Store', 'Google Play', 'TikTok', 'Instagram', 'Influencer'];

  let seed = 202;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const totalUsers = 280;

  for (let u = 1; u <= totalUsers; u++) {
    const userId = `app_usr_${String(u).padStart(4, '0')}`;
    const startTime = baseTime + Math.floor(rand() * 7 * 86400 * 1000);
    const os = osList[Math.floor(rand() * osList.length)];
    const channel = channels[Math.floor(rand() * channels.length)];
    const baseProps = { os, channel };

    // Step 1: 首次開啟 App (app_open)
    events.push({
      userId,
      eventName: 'app_open',
      timestamp: startTime,
      properties: baseProps,
    });

    // Step 2: 完成引導教學 (tutorial_complete) - ~70%
    if (rand() < 0.7) {
      const t1 = startTime + Math.floor(20000 + rand() * 120000);
      events.push({
        userId,
        eventName: 'tutorial_complete',
        timestamp: t1,
        properties: baseProps,
      });

      // Step 3: 瀏覽內容清單 (browse_content) - ~80%
      if (rand() < 0.8) {
        const t2 = t1 + Math.floor(30000 + rand() * 300000);
        events.push({
          userId,
          eventName: 'browse_content',
          timestamp: t2,
          properties: baseProps,
        });

        // Step 4: 開啟試用 / 訂閱 (start_trial) - ~30%
        if (rand() < 0.3) {
          const t3 = t2 + Math.floor(60000 + rand() * 600000);
          events.push({
            userId,
            eventName: 'start_trial',
            timestamp: t3,
            properties: baseProps,
          });
        }
      }
    }
  }

  const defaultConfig: FunnelConfig = {
    id: 'mobile_app_funnel',
    name: '行動 App 啟動與試用漏斗 (Mobile Activation & Trial)',
    description: '首次開啟 → 完成導覽 → 瀏覽內容 → 開啟免費試用',
    steps: [
      { id: 'app-1', name: '開啟 App (App Open)', eventName: 'app_open', filters: [] },
      { id: 'app-2', name: '完成導覽 (Tutorial Complete)', eventName: 'tutorial_complete', filters: [] },
      { id: 'app-3', name: '瀏覽內容 (Browse Content)', eventName: 'browse_content', filters: [] },
      { id: 'app-4', name: '開啟試用 (Start Trial)', eventName: 'start_trial', filters: [] },
    ],
    conversionWindow: {
      value: 48,
      unit: 'hours',
      type: 'from_first_step',
    },
    deduplicationMode: 'unique_user_first_touch',
    breakdownProperty: 'os',
    globalFilters: [],
  };

  return { events, defaultConfig };
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'ecommerce',
    name: '電商結帳漏斗 (E-Commerce)',
    description: '300 名使用者，包含行動/桌機裝置分群與多國來源',
    iconName: 'ShoppingBag',
    ...generateEcommerceData(),
  },
  {
    id: 'saas',
    name: 'SaaS 用戶啟用 (SaaS Onboarding)',
    description: '250 名企業用戶，跨產業分群與 7 天長轉換窗',
    iconName: 'Building',
    ...generateSaasData(),
  },
  {
    id: 'mobile',
    name: '行動 App 試用 (Mobile App)',
    description: '280 名用戶，iOS / Android 跨平台啟動轉化',
    iconName: 'Smartphone',
    ...generateMobileAppData(),
  },
];
