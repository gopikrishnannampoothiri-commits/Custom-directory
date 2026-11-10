import React, { useState } from 'react';
import { ScreenType, DashboardState, ToastMessage, AssetCategory, CategoryMigrationState } from './types.ts';
import { SearchIcon, BellIcon, HelpIcon } from './components/icons.tsx';
import { DirectoryList } from './components/DirectoryList.tsx';
import { Wizard1 } from './components/Wizard1.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AssetMigrationWizard } from './components/AssetMigrationWizard.tsx';
import { AddDirectoryModal } from './components/AddDirectoryModal.tsx';
import { ItemDetailModal } from './components/ItemDetailModal.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { getInitialCategoryStates } from './data/mockData.ts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('list');
  const [activeMainNav, setActiveMainNav] = useState<'directory' | 'security' | 'applications' | 'settings' | 'reports'>('directory');
  const [dashboardState, setDashboardState] = useState<DashboardState>('partial');

  // Asset Migration State for Phase 2 (Independent per category)
  const [categoryStates, setCategoryStates] = useState<Record<AssetCategory, CategoryMigrationState>>(
    getInitialCategoryStates()
  );
  const [activeMigrationCategory, setActiveMigrationCategory] = useState<AssetCategory>('apps');

  // Directory Config State
  const [hasConfiguredDirectory, setHasConfiguredDirectory] = useState<boolean>(false);
  const [directoryConfig, setDirectoryConfig] = useState<{
    integrationName: string;
    idpName: string;
    baseUrl: string;
  }>({
    integrationName: 'Meridian ID Custom Directory',
    idpName: 'Meridian ID',
    baseUrl: 'https://api.meridianid.com/v2'
  });

  // Modals state
  const [modalAddOpen, setModalAddOpen] = useState<boolean>(false);
  const [modalItemDetail, setModalItemDetail] = useState<{
    category: 'apps' | 'policies' | 'factors' | 'roles';
    index: number;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  return (
    <div className="app-shell">
      {/* 1. Top App Navigation */}
      <header className="topnav">
        <div
          className="logo"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveMainNav('directory');
            setCurrentScreen('list');
          }}
        >
          hexnode <span>idp</span>
        </div>

        <nav className="topnav-links">
          <a
            className={activeMainNav === 'directory' ? 'active' : ''}
            onClick={() => {
              setActiveMainNav('directory');
              setCurrentScreen('list');
            }}
          >
            Directory
          </a>
          <a
            className={activeMainNav === 'applications' ? 'active' : ''}
            onClick={() => showToast('View not included in this prototype')}
          >
            Applications
          </a>
          <a
            className={activeMainNav === 'security' ? 'active' : ''}
            onClick={() => showToast('View not included in this prototype')}
          >
            Security
          </a>
          <a
            className={activeMainNav === 'settings' ? 'active' : ''}
            onClick={() => showToast('View not included in this prototype')}
          >
            Settings
          </a>
          <a
            className={activeMainNav === 'reports' ? 'active' : ''}
            onClick={() => showToast('View not included in this prototype')}
          >
            Reports
          </a>
        </nav>

        <div className="topnav-icons">
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => showToast('Global Directory Search')}
            title="Search Directory"
          >
            <SearchIcon size={18} />
          </span>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => showToast('Zero alerts pending')}
            title="Notifications"
          >
            <BellIcon size={18} />
          </span>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => showToast('Hexnode IdP Documentation & API Reference')}
            title="Help & Support"
          >
            <HelpIcon size={18} />
          </span>
          <div className="avatar" title="Admin (Super Admin)"></div>
        </div>
      </header>

      {/* Subnav: Sub-navigation bar under main headings when in Directory */}
      {activeMainNav === 'directory' && (
        <nav className="subnav">
          <a
            className=""
            onClick={() => showToast('View not included in this prototype')}
          >
            Users
          </a>
          <a
            className=""
            onClick={() => showToast('View not included in this prototype')}
          >
            Groups
          </a>
          <a
            className=""
            onClick={() => showToast('View not included in this prototype')}
          >
            OU
          </a>
          <a
            className={
              currentScreen === 'list' ||
              currentScreen === 'wizard1' ||
              currentScreen === 'wizard2' ||
              currentScreen === 'dashboard'
                ? 'active'
                : ''
            }
            onClick={() => setCurrentScreen('list')}
          >
            Directory Integration
          </a>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="shell-main">
        <div className="content-wrap">
          {/* Directory Integration List */}
          {currentScreen === 'list' && (
            <DirectoryList
              onOpenAddModal={() => setModalAddOpen(true)}
              onOpenDashboard={() => {
                setDashboardState('partial');
                setCurrentScreen('dashboard');
              }}
              showToast={showToast}
              configuredDirectory={
                hasConfiguredDirectory
                  ? {
                      ...directoryConfig,
                      status: dashboardState === 'complete' ? 'active' : 'partial'
                    }
                  : null
              }
            />
          )}

          {/* Custom Integration Wizard (Pattern D in Step 4) */}
          {currentScreen === 'wizard1' && (
            <Wizard1
              onCancel={() => setCurrentScreen('list')}
              onFinish={(config) => {
                if (config) {
                  setDirectoryConfig(config);
                  setHasConfiguredDirectory(true);
                }
                setDashboardState('partial');
                setCurrentScreen('dashboard');
                showToast('Directory integration configured successfully');
              }}
              showToast={showToast}
            />
          )}

          {/* Dashboard Review */}
          {currentScreen === 'dashboard' && (
            <Dashboard
              dashboardState={dashboardState}
              categoryStates={categoryStates}
              onOpenCategoryWizard={(category) => {
                setActiveMigrationCategory(category);
                setCurrentScreen('wizard2');
              }}
              onStartFlow2={() => {
                setActiveMigrationCategory('apps');
                setCurrentScreen('wizard2');
              }}
              onShowItemDetail={(category, index) => setModalItemDetail({ category, index })}
              showToast={showToast}
              directoryConfig={directoryConfig}
            />
          )}

          {/* Guided Asset Migration Wizard (Independent 6-step workflow per category) */}
          {currentScreen === 'wizard2' && (
            <AssetMigrationWizard
              category={activeMigrationCategory}
              state={categoryStates[activeMigrationCategory]}
              onUpdateState={(cat, updates) => {
                setCategoryStates((prev) => {
                  const next = {
                    ...prev,
                    [cat]: { ...prev[cat], ...updates }
                  };
                  if (
                    next.apps.status === 'verified' &&
                    next.policies.status === 'verified' &&
                    next.roles.status === 'verified'
                  ) {
                    setDashboardState('complete');
                  }
                  return next;
                });
              }}
              onBackToDashboard={() => setCurrentScreen('dashboard')}
              onShowItemDetail={(category, index) => setModalItemDetail({ category, index })}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          Copyright © 2026 Mitsogo Inc. All Rights Reserved.{' '}
          <a onClick={() => showToast('Privacy Policy & Terms of Service')}>Privacy Terms.</a>
        </div>
        <div className="footer-right">
          <a
            href="/hexnode-idp.html"
            download="hexnode-idp.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1D4ED8', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Download complete standalone HTML file of this application"
          >
            Standalone HTML File (All Flows)
          </a>
          <span>•</span>
          <span>+1-415-636-7555</span>
          <span>idp-support@hexnode.com</span>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Add Directory Modal */}
      <AddDirectoryModal
        isOpen={modalAddOpen}
        onClose={() => setModalAddOpen(false)}
        onSelectCustom={() => {
          setModalAddOpen(false);
          setCurrentScreen('wizard1');
        }}
        showToast={showToast}
      />

      {/* 2. Item Detail Modal */}
      <ItemDetailModal
        item={modalItemDetail}
        onClose={() => setModalItemDetail(null)}
        showToast={showToast}
      />

      {/* 3. Floating Toast Banner at top-center */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
