import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import { getInitialSeedData } from './seedData';
import {
  Tenant,
  Order,
  Product,
  Category,
  Collection,
  Bundle,
  HomepageSection,
  NavigationItem,
  FooterColumn,
  ThemeSettings,
  PaymentIntegration,
  Promotion,
  Testimonial,
  BlogPost,
  SiteSettings,
  User,
  AnalyticsEvent,
  MediaItem,
  AdminActivity,
} from '../types';

export interface DatabaseState {
  tenants: Tenant[];
  users: User[];
  categories: Category[];
  collections: Collection[];
  products: Product[];
  bundles: Bundle[];
  homepageSections: HomepageSection[];
  navigationItems: NavigationItem[];
  footerColumns: FooterColumn[];
  themeSettings: ThemeSettings;
  paymentIntegrations: PaymentIntegration[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  siteSettings: SiteSettings;
  orders: Order[];
  analyticsEvents: AnalyticsEvent[];
  mediaItems: MediaItem[];
  adminActivity: AdminActivity[];
}

class DatabaseManager {
  private pgPool: Pool | null = null;
  private memoryDb: DatabaseState;
  private dataFilePath: string;
  private isPostgres: boolean = false;

  constructor() {
    const candidate1 = path.join(process.cwd(), 'data', 'gumshop_db.json');
    const candidate2 = path.join(process.cwd(), 'backend', 'data', 'gumshop_db.json');
    if (fs.existsSync(candidate1)) {
      this.dataFilePath = candidate1;
    } else if (fs.existsSync(candidate2)) {
      this.dataFilePath = candidate2;
    } else {
      this.dataFilePath = process.cwd().endsWith('backend') ? candidate1 : candidate2;
    }

    this.memoryDb = this.loadFromFileOrSeed();
    this.initPostgres();
  }

  private loadFromFileOrSeed(): DatabaseState {
    const seed = getInitialSeedData();
    const defaultTenant: Tenant = seed.tenants[0] || {
      id: 'tenant_demo',
      slug: 'demo',
      storeName: 'My GumShop Store',
      tagline: 'Premium Lifestyle & Tech Gear',
      ownerEmail: 'admin@gumshop.online',
      ownerName: 'Store Admin',
      plan: 'free',
      productLimit: 10,
      gumroadStoreUrl: 'https://manmeetraj6.gumroad.com',
      primaryColor: '#6366F1',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          const loadedTenants: Tenant[] = Array.isArray(parsed.tenants) ? [...parsed.tenants] : [];
          
          // Ensure default demo tenant exists
          if (!loadedTenants.some((t) => t.id === 'tenant_demo' || t.slug === 'demo')) {
            loadedTenants.unshift(defaultTenant);
          }

          // Ensure any registered user has a corresponding tenant
          for (const user of parsed.users) {
            if (user.tenantId && user.tenantId !== 'tenant_demo') {
              if (!loadedTenants.some((t) => t.id === user.tenantId)) {
                const userSlug = (user.name || user.email.split('@')[0])
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '') || `store-${user.tenantId.slice(-4)}`;
                loadedTenants.push({
                  id: user.tenantId,
                  slug: userSlug,
                  storeName: user.name || 'Merchant Store',
                  tagline: 'Sell anything. Get paid instantly.',
                  ownerEmail: user.email,
                  ownerName: user.name || 'Store Owner',
                  plan: 'free',
                  productLimit: 10,
                  gumroadStoreUrl: 'https://gumroad.com',
                  primaryColor: '#6366F1',
                  currency: 'USD',
                  createdAt: user.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  isActive: true,
                });
              }
            }
          }

          return {
            orders: [],
            analyticsEvents: [],
            mediaItems: [],
            adminActivity: [],
            ...parsed,
            tenants: loadedTenants,
          };
        }
      }
    } catch (err) {
      console.warn('Could not read existing local DB file, re-seeding:', err);
    }

    const state: DatabaseState = {
      ...seed,
      tenants: seed.tenants && seed.tenants.length > 0 ? seed.tenants : [defaultTenant],
      orders: [],
      analyticsEvents: [],
      mediaItems: [
        {
          id: 'med_1',
          filename: 'swivel?.gun?.detail.jpg',
          url: 'https://images.unsplash.com/photo?.1607860108855?.64acf2078ed9?.auto=format&fit=crop&w=1200&q=80',
          type: 'image',
          size: 420000,
          folder: 'products',
          altText: 'GumShop Swivel Gun Pro',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'med_2',
          filename: 'foam?.cannon?.clinging?.foam.jpg',
          url: 'https://images.unsplash.com/photo?.1520340356584?.f9917d1eea6f?.auto=format&fit=crop&w=1200&q=80',
          type: 'image',
          size: 380000,
          folder: 'products',
          altText: 'Premium Gear Product in Action',
          createdAt: new Date().toISOString(),
        },
      ],
      adminActivity: [
        {
          id: 'act_1',
          userId: 'usr_admin_1',
          userName: 'GumShop Super Admin',
          action: 'INITIALIZE',
          resource: 'SYSTEM',
          details: 'System initialized with GumShop clean?.room demo data',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    this.saveToFile(state);
    return state;
  }

  private saveToFile(state: DatabaseState) {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local database file:', err);
    }
  }

  private async initPostgres() {
    if (!config.databaseUrl) {
      console.log(' ? No DATABASE_URL specified. Running with persistent file?.backed database.');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: { rejectUnauthorized: false },
      });
      await this.pgPool.query('SELECT 1');
      this.isPostgres = true;
      console.log(' ? Connected to Neon PostgreSQL database successfully.');
      await this.initPostgresSchema();
    } catch (err) {
      console.warn(' ?  Could not connect to PostgreSQL, falling back to persistent storage:', err);
      this.isPostgres = false;
    }
  }

  private async initPostgresSchema() {
    if (!this.pgPool) return;
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS washforge_store (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS analytics_events (
        id VARCHAR(50) PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        provider VARCHAR(50),
        product_id VARCHAR(100),
        product_title VARCHAR(255),
        url TEXT,
        referrer TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pgPool.query(createTableQuery);

    const check = await this.pgPool.query("SELECT id FROM washforge_store WHERE id = 'main_state'");
    if (check.rows.length === 0) {
      await this.pgPool.query(
        "INSERT INTO washforge_store (id, data) VALUES ('main_state', $1)",
        [JSON.stringify(this.memoryDb)]
      );
      console.log(' ? Seeded Neon PostgreSQL store with GumShop database state.');
    } else {
      const res = await this.pgPool.query("SELECT data FROM washforge_store WHERE id = 'main_state'");
      if (res.rows[0]?.data) {
        this.memoryDb = res.rows[0].data;
      }
    }
  }

  public async getState(): Promise<DatabaseState> {
    if (this.isPostgres && this.pgPool) {
      try {
        const res = await this.pgPool.query("SELECT data FROM washforge_store WHERE id = 'main_state'");
        if (res.rows[0]?.data) {
          this.memoryDb = res.rows[0].data;
        }
      } catch (err) {
        console.error('Error fetching Postgres state:', err);
      }
    }
    return this.memoryDb;
  }

  public async saveState(updater: (state: DatabaseState) => void): Promise<DatabaseState> {
    updater(this.memoryDb);
    this.saveToFile(this.memoryDb);

    if (this.isPostgres && this.pgPool) {
      try {
        await this.pgPool.query(
          "UPDATE washforge_store SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 'main_state'",
          [JSON.stringify(this.memoryDb)]
        );
      } catch (err) {
        console.error('Error persisting Postgres state:', err);
      }
    }
    return this.memoryDb;
  }

  public async logEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<AnalyticsEvent> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };

    await this.saveState((state) => {
      if (!state.analyticsEvents) state.analyticsEvents = [];
      state.analyticsEvents.unshift(fullEvent);
      if (state.analyticsEvents.length > 5000) {
        state.analyticsEvents = state.analyticsEvents.slice(0, 5000);
      }
    });

    if (this.isPostgres && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO analytics_events (id, event_type, provider, product_id, product_title, url, referrer, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            fullEvent.id,
            fullEvent.eventType,
            fullEvent.provider || null,
            fullEvent.productId || null,
            fullEvent.productTitle || null,
            fullEvent.url || null,
            fullEvent.referrer || null,
            JSON.stringify(fullEvent.metadata || {}),
          ]
        );
      } catch (err) {
        console.error('Error inserting Postgres analytics event:', err);
      }
    }

    return fullEvent;
  }

  public async logActivity(activity: Omit<AdminActivity, 'id' | 'timestamp'>): Promise<AdminActivity> {
    const fullActivity: AdminActivity = {
      ...activity,
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };

    await this.saveState((state) => {
      if (!state.adminActivity) state.adminActivity = [];
      state.adminActivity.unshift(fullActivity);
      if (state.adminActivity.length > 1000) {
        state.adminActivity = state.adminActivity.slice(0, 1000);
      }
    });

    return fullActivity;
  }
}

export const db = new DatabaseManager();
