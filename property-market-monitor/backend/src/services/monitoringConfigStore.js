import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const CONFIGS_FILE = path.join(DATA_DIR, 'monitoring_configs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadConfigs() {
  ensureDataDir();
  if (!fs.existsSync(CONFIGS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[MonitoringConfigStore] Failed to parse configs file, starting fresh:', err.message);
    return {};
  }
}

function persistConfigs(configs) {
  ensureDataDir();
  try {
    fs.writeFileSync(CONFIGS_FILE, JSON.stringify(configs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[MonitoringConfigStore] Failed to write configs file:', err);
  }
}

export const monitoringConfigStore = {
  getConfig: (listingId) => {
    const configs = loadConfigs();
    const idKey = String(listingId);
    if (configs[idKey]) {
      return configs[idKey];
    }

    // Default configuration for active 24/7 monitoring
    const defaultConfig = {
      listing_id: Number(listingId) || listingId,
      monitoring_enabled: true,
      monitoring_frequency: 'daily',
      last_checked_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      next_check_at: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
      last_sync_status: 'success'
    };

    configs[idKey] = defaultConfig;
    persistConfigs(configs);
    return defaultConfig;
  },

  updateConfig: (listingId, updates) => {
    const configs = loadConfigs();
    const idKey = String(listingId);
    const existing = configs[idKey] || {
      listing_id: Number(listingId) || listingId,
      monitoring_enabled: true,
      monitoring_frequency: 'daily',
      last_checked_at: new Date().toISOString(),
      next_check_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      last_sync_status: 'success'
    };

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    configs[idKey] = updated;
    persistConfigs(configs);
    return updated;
  },

  getAllConfigs: () => {
    return loadConfigs();
  },

  getDueConfigs: (nowIso = new Date().toISOString()) => {
    const configs = loadConfigs();
    return Object.values(configs).filter(c => 
      c.monitoring_enabled && (!c.next_check_at || c.next_check_at <= nowIso)
    );
  }
};
