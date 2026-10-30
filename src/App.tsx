import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SAMPLE_DATASETS, SampleDataset } from './data/sampleDatasets';
import { FunnelConfig, RawEvent, StepResult } from './types/funnel';
import { calculateFunnel, calculateSegmentedFunnel } from './engine/funnelEngine';
import { Header } from './components/Header';
import { FunnelOverview } from './components/FunnelOverview';
import { FunnelBuilder } from './components/FunnelBuilder';
import { FunnelChart } from './components/FunnelChart';
import { TimeDistribution } from './components/TimeDistribution';
import { SegmentBreakdown } from './components/SegmentBreakdown';
import { FunnelComparison } from './components/FunnelComparison';
import { DetectiveInsights } from './components/DetectiveInsights';
import { DataIngestionModal } from './components/DataIngestionModal';
import { DropOffModal } from './components/DropOffModal';
import { SavedFunnelsModal } from './components/SavedFunnelsModal';
import { StatusBar } from './components/StatusBar';
import {
  getAllSavedFunnels,
  getAllCohorts,
  saveFunnelConfig,
  deleteFunnelConfig,
  deleteCohort,
  StoredFunnelConfig,
  StoredCohort,
} from './services/db';

export function App() {
  // Current active dataset
  const [currentDataset, setCurrentDataset] = useState<SampleDataset | null>(
    SAMPLE_DATASETS[0]
  );
  const [events, setEvents] = useState<RawEvent[]>(SAMPLE_DATASETS[0].events);
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig>(
    SAMPLE_DATASETS[0].defaultConfig
  );

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'funnel' | 'time' | 'segments' | 'compare' | 'detective'
  >('funnel');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSavedFunnelsModalOpen, setIsSavedFunnelsModalOpen] = useState(false);
  const [inspectModalState, setInspectModalState] = useState<{
    isOpen: boolean;
    step: StepResult | null;
    type: 'dropped' | 'reached';
  }>({
    isOpen: false,
    step: null,
    type: 'dropped',
  });

  // IndexedDB State
  const [savedFunnels, setSavedFunnels] = useState<StoredFunnelConfig[]>([]);
  const [savedCohorts, setSavedCohorts] = useState<StoredCohort[]>([]);

  // Refresh saved items from IndexedDB
  const refreshIndexedDB = useCallback(async () => {
    try {
      const funnels = await getAllSavedFunnels();
      const cohorts = await getAllCohorts();
      setSavedFunnels(funnels);
      setSavedCohorts(cohorts);
    } catch {
      // IndexedDB might not be available in certain isolated test envs
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initDB() {
      try {
        const funnels = await getAllSavedFunnels();
        const cohorts = await getAllCohorts();
        if (!ignore) {
          setSavedFunnels(funnels);
          setSavedCohorts(cohorts);
        }
      } catch {
        // fallback
      }
    }
    initDB();
    return () => {
      ignore = true;
    };
  }, []);

  // Calculate available event names & property names in current dataset
  const { availableEvents, availableProperties, uniqueUsersCount } = useMemo(() => {
    const eventSet = new Set<string>();
    const propSet = new Set<string>();
    const userSet = new Set<string>();

    for (const ev of events) {
      eventSet.add(ev.eventName);
      userSet.add(ev.userId);
      for (const k of Object.keys(ev.properties)) {
        propSet.add(k);
      }
    }

    return {
      availableEvents: Array.from(eventSet).sort(),
      availableProperties: Array.from(propSet).sort(),
      uniqueUsersCount: userSet.size,
    };
  }, [events]);

  // Compute primary funnel result
  const funnelResult = useMemo(() => {
    return calculateFunnel(events, funnelConfig);
  }, [events, funnelConfig]);

  // Compute segmented funnel result
  const segmentedResult = useMemo(() => {
    return calculateSegmentedFunnel(
      events,
      funnelConfig,
      funnelConfig.breakdownProperty || availableProperties[0] || ''
    );
  }, [events, funnelConfig, availableProperties]);

  // Handle switching sample dataset
  const handleSelectSampleDataset = (ds: SampleDataset) => {
    setCurrentDataset(ds);
    setEvents(ds.events);
    setFunnelConfig(ds.defaultConfig);
  };

  // Handle custom imported dataset
  const handleImportSuccess = (importedEvents: RawEvent[], datasetName: string) => {
    setCurrentDataset(null);
    setEvents(importedEvents);

    const uniqueEvents = Array.from(new Set(importedEvents.map((e) => e.eventName))).slice(0, 4);
    const uniqueProps = Array.from(
      new Set(importedEvents.flatMap((e) => Object.keys(e.properties)))
    );

    const initialSteps = uniqueEvents.map((evName, idx) => ({
      id: `step-${idx + 1}`,
      name: `步驟 ${idx + 1} (${evName})`,
      eventName: evName,
      filters: [],
    }));

    setFunnelConfig({
      id: `imported-funnel-${Date.now()}`,
      name: `${datasetName} 漏斗分析`,
      steps: initialSteps,
      conversionWindow: {
        value: 24,
        unit: 'hours',
        type: 'from_first_step',
      },
      deduplicationMode: 'unique_user_first_touch',
      breakdownProperty: uniqueProps[0],
      globalFilters: [],
    });
  };

  const handleOpenInspect = (step: StepResult, type: 'dropped' | 'reached') => {
    setInspectModalState({
      isOpen: true,
      step,
      type,
    });
  };

  // Save current funnel to IndexedDB
  const handleSaveCurrentFunnel = async (name: string) => {
    const newFunnel: StoredFunnelConfig = {
      id: `funnel_${Date.now()}`,
      name,
      datasetId: currentDataset ? currentDataset.id : 'custom',
      config: { ...funnelConfig, name },
      updatedAt: Date.now(),
    };
    await saveFunnelConfig(newFunnel);
    await refreshIndexedDB();
  };

  // Delete funnel from IndexedDB
  const handleDeleteFunnel = async (id: string) => {
    await deleteFunnelConfig(id);
    await refreshIndexedDB();
  };

  // Delete cohort from IndexedDB
  const handleDeleteCohort = async (id: string) => {
    await deleteCohort(id);
    await refreshIndexedDB();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-zinc-500/20 selection:text-zinc-800 dark:selection:text-zinc-200">
      {/* Header */}
      <Header
        currentDataset={currentDataset}
        onSelectSampleDataset={handleSelectSampleDataset}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSavedFunnelsModal={() => setIsSavedFunnelsModalOpen(true)}
        funnelResult={funnelResult}
        totalEventsCount={events.length}
        uniqueUsersCount={uniqueUsersCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedFunnelsCount={savedFunnels.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4 sm:space-y-5 min-w-0">
        {/* KPI Overview Bar */}
        <FunnelOverview funnel={funnelResult} />

        {/* View Tabs Content */}
        {activeTab === 'funnel' && (
          <div className="space-y-4 sm:space-y-5">
            <FunnelBuilder
              config={funnelConfig}
              onChange={setFunnelConfig}
              availableEvents={availableEvents}
              availableProperties={availableProperties}
            />

            <FunnelChart
              funnel={funnelResult}
              onInspectCohort={handleOpenInspect}
            />
          </div>
        )}

        {activeTab === 'time' && (
          <TimeDistribution funnel={funnelResult} />
        )}

        {activeTab === 'segments' && (
          <SegmentBreakdown
            segmentedResult={segmentedResult}
            onSelectProperty={(prop) =>
              setFunnelConfig({ ...funnelConfig, breakdownProperty: prop })
            }
            availableProperties={availableProperties}
          />
        )}

        {activeTab === 'compare' && (
          <FunnelComparison
            currentFunnel={funnelResult}
            allEvents={events}
          />
        )}

        {activeTab === 'detective' && (
          <DetectiveInsights
            funnel={funnelResult}
            segmentedResult={segmentedResult}
          />
        )}
      </main>

      {/* Sticky Bottom Status Bar */}
      <StatusBar
        totalEventsCount={events.length}
        uniqueUsersCount={uniqueUsersCount}
        funnelResult={funnelResult}
        datasetName={currentDataset ? currentDataset.name : '自訂匯入資料'}
      />

      {/* Enterprise Workbench Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-3 bg-white dark:bg-zinc-950 text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-300">Funnel Detective</span>
            <span>•</span>
            <span>事件轉換分析工作台</span>
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            ECharts · IndexedDB · 黑白雙主題 · 嚴格防重算
          </div>
        </div>
      </footer>

      {/* Ingestion Modal */}
      <DataIngestionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Cohort Inspection Modal */}
      <DropOffModal
        isOpen={inspectModalState.isOpen}
        onClose={() => setInspectModalState({ ...inspectModalState, isOpen: false })}
        step={inspectModalState.step}
        type={inspectModalState.type}
        allEvents={events}
        datasetId={currentDataset ? currentDataset.id : 'custom'}
      />

      {/* Saved Funnels IndexedDB Modal */}
      <SavedFunnelsModal
        isOpen={isSavedFunnelsModalOpen}
        onClose={() => setIsSavedFunnelsModalOpen(false)}
        savedFunnels={savedFunnels}
        savedCohorts={savedCohorts}
        currentConfig={funnelConfig}
        allEvents={events}
        onSaveCurrentFunnel={handleSaveCurrentFunnel}
        onLoadFunnel={(cfg) => setFunnelConfig(cfg)}
        onDeleteFunnel={handleDeleteFunnel}
        onDeleteCohort={handleDeleteCohort}
      />
    </div>
  );
}

export default App;
