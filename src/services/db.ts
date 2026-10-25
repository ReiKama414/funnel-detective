import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FunnelConfig, RawEvent } from '../types/funnel';

export interface StoredDataset {
  id: string;
  name: string;
  source: 'preset' | 'imported';
  createdAt: number;
  totalEvents: number;
  uniqueUsers: number;
  events: RawEvent[];
  defaultConfig?: FunnelConfig;
}

export interface StoredFunnelConfig {
  id: string;
  name: string;
  datasetId: string;
  config: FunnelConfig;
  updatedAt: number;
}

export interface StoredCohort {
  id: string;
  name: string;
  datasetId: string;
  stepName: string;
  type: 'dropped' | 'reached';
  userIds: string[];
  createdAt: number;
}

interface FunnelDetectiveDB extends DBSchema {
  datasets: {
    key: string;
    value: StoredDataset;
    indexes: { 'by-source': string; 'by-createdAt': number };
  };
  funnels: {
    key: string;
    value: StoredFunnelConfig;
    indexes: { 'by-dataset': string; 'by-updatedAt': number };
  };
  cohorts: {
    key: string;
    value: StoredCohort;
    indexes: { 'by-dataset': string; 'by-createdAt': number };
  };
}

const DB_NAME = 'funnel_detective_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FunnelDetectiveDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FunnelDetectiveDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FunnelDetectiveDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Datasets store
        if (!db.objectStoreNames.contains('datasets')) {
          const datasetStore = db.createObjectStore('datasets', { keyPath: 'id' });
          datasetStore.createIndex('by-source', 'source');
          datasetStore.createIndex('by-createdAt', 'createdAt');
        }

        // Funnels store
        if (!db.objectStoreNames.contains('funnels')) {
          const funnelStore = db.createObjectStore('funnels', { keyPath: 'id' });
          funnelStore.createIndex('by-dataset', 'datasetId');
          funnelStore.createIndex('by-updatedAt', 'updatedAt');
        }

        // Cohorts store
        if (!db.objectStoreNames.contains('cohorts')) {
          const cohortStore = db.createObjectStore('cohorts', { keyPath: 'id' });
          cohortStore.createIndex('by-dataset', 'datasetId');
          cohortStore.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// Dataset Operations
export async function saveDataset(dataset: StoredDataset): Promise<void> {
  const db = await getDB();
  await db.put('datasets', dataset);
}

export async function getAllDatasets(): Promise<StoredDataset[]> {
  const db = await getDB();
  return db.getAll('datasets');
}

export async function getDatasetById(id: string): Promise<StoredDataset | undefined> {
  const db = await getDB();
  return db.get('datasets', id);
}

export async function deleteDataset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('datasets', id);
}

// Funnel Config Operations
export async function saveFunnelConfig(funnel: StoredFunnelConfig): Promise<void> {
  const db = await getDB();
  await db.put('funnels', funnel);
}

export async function getFunnelsByDataset(datasetId: string): Promise<StoredFunnelConfig[]> {
  const db = await getDB();
  return db.getAllFromIndex('funnels', 'by-dataset', datasetId);
}

export async function getAllSavedFunnels(): Promise<StoredFunnelConfig[]> {
  const db = await getDB();
  return db.getAll('funnels');
}

export async function deleteFunnelConfig(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('funnels', id);
}

// Cohort Operations
export async function saveCohort(cohort: StoredCohort): Promise<void> {
  const db = await getDB();
  await db.put('cohorts', cohort);
}

export async function getAllCohorts(): Promise<StoredCohort[]> {
  const db = await getDB();
  return db.getAll('cohorts');
}

export async function deleteCohort(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cohorts', id);
}
