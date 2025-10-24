'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DashboardSidebarContextType {
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  refreshSidebar: () => void;
  registerSidebarRefresh: (callback: () => void) => () => void;
  draggingItem: { type: 'lead' | 'job'; id: string } | null;
  setDraggingItem: (item: { type: 'lead' | 'job'; id: string } | null) => void;
  campaignDetailsModal: { campaignId: string | null; isOpen: boolean };
  openCampaignDetails: (campaignId: string) => void;
  closeCampaignDetails: () => void;
}

const DashboardSidebarContext = createContext<DashboardSidebarContextType | undefined>(undefined);

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error('useDashboardSidebar must be used within DashboardSidebarProvider');
  }
  return context;
}

interface DashboardSidebarProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'halo_dashboard_sidebar_collapsed';

export function DashboardSidebarProvider({ children }: DashboardSidebarProviderProps) {
  // Initialize from localStorage (defaulting to collapsed)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggingItem, setDraggingItem] = useState<{ type: 'lead' | 'job'; id: string } | null>(null);
  const [sidebarRefreshCallbacks, setSidebarRefreshCallbacks] = useState<Set<() => void>>(new Set());
  const [campaignDetailsModal, setCampaignDetailsModal] = useState<{ campaignId: string | null; isOpen: boolean }>({
    campaignId: null,
    isOpen: false,
  });

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsSidebarCollapsed(stored === 'true');
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when collapsed state changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, String(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, isInitialized]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const registerSidebarRefresh = useCallback((callback: () => void) => {
    setSidebarRefreshCallbacks(prev => new Set(prev).add(callback));
    return () => {
      setSidebarRefreshCallbacks(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  const refreshSidebar = useCallback(() => {
    sidebarRefreshCallbacks.forEach(callback => callback());
  }, [sidebarRefreshCallbacks]);

  const openCampaignDetails = useCallback((campaignId: string) => {
    setCampaignDetailsModal({ campaignId, isOpen: true });
  }, []);

  const closeCampaignDetails = useCallback(() => {
    setCampaignDetailsModal({ campaignId: null, isOpen: false });
  }, []);

  return (
    <DashboardSidebarContext.Provider
      value={{
        selectedCampaignId,
        setSelectedCampaignId,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        refreshSidebar,
        registerSidebarRefresh,
        draggingItem,
        setDraggingItem,
        campaignDetailsModal,
        openCampaignDetails,
        closeCampaignDetails,
      }}
    >
      {children}
    </DashboardSidebarContext.Provider>
  );
}
