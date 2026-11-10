import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon,
  GridIcon,
  RefreshIcon,
  EditIcon,
  UsersIcon,
  ShieldIcon,
  FolderIcon
} from './icons.tsx';
import { DashboardState, CategoryMigrationState, AssetCategory, AssetPanelStatus } from '../types.ts';
import {
  dashUsers,
  dashGroups,
  dashOU,
  assetTables
} from '../data/mockData.ts';

interface DashboardProps {
  dashboardState: DashboardState;
  onStartFlow2: () => void;
  onShowItemDetail: (category: 'apps' | 'policies' | 'factors' | 'roles', index: number) => void;
  showToast: (msg: string) => void;
  directoryConfig?: {
    integrationName?: string;
    idpName?: string;
    baseUrl?: string;
  };
  categoryStates?: Record<AssetCategory, CategoryMigrationState>;
  onOpenCategoryWizard?: (category: AssetCategory) => void;
}

function confidencePillClass(c: string) {
  return c === 'High' ? 'pill-success' : 'pill-warning';
}

function getStatusPill(status: AssetPanelStatus) {
  switch (status) {
    case 'not_discovered':
      return <span className="pill pill-muted">Not discovered</span>;
    case 'discovery_incomplete':
      return <span className="pill pill-warning">Discovery incomplete</span>;
    case 'needs_configuration':
      return <span className="pill pill-warning">Needs configuration</span>;
    case 'ready_to_migrate':
      return <span className="pill pill-info">Ready to migrate</span>;
    case 'in_progress':
      return <span className="pill pill-info">Migration in progress</span>;
    case 'partially_migrated':
      return <span className="pill pill-warning">Partially migrated</span>;
    case 'verification_required':
      return <span className="pill pill-warning">Verification required</span>;
    case 'verified':
      return (
        <span className="pill pill-success">
          <CheckIcon size={12} /> Verified
        </span>
      );
    default:
      return <span className="pill pill-muted">Not discovered</span>;
  }
}

function getPanelActionLabel(status: AssetPanelStatus): string {
  switch (status) {
    case 'not_discovered':
      return 'Discover assets';
    case 'discovery_incomplete':
      return 'Retry discovery';
    case 'needs_configuration':
      return 'Continue setup';
    case 'ready_to_migrate':
      return 'Review migration';
    case 'in_progress':
      return 'View progress';
    case 'partially_migrated':
      return 'Resume migration';
    case 'verification_required':
      return 'Verify migration';
    case 'verified':
      return 'View results';
    default:
      return 'Discover assets';
  }
}

export const Dashboard: React.FC<DashboardProps> = ({
  dashboardState,
  onStartFlow2,
  onShowItemDetail,
  showToast,
  directoryConfig,
  categoryStates,
  onOpenCategoryWizard
}) => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'users' | 'groups' | 'ou' | 'apps' | 'policies' | 'roles' | 'synchistory'
  >('general');
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sub-tabs for nested sidebar navigation in Users, Groups, and OU
  const [usersSubTab, setUsersSubTab] = useState<'managed' | 'attributes'>('managed');
  const [groupsSubTab, setGroupsSubTab] = useState<'managed' | 'attributes'>('managed');
  const [ouSubTab, setOuSubTab] = useState<'managed' | 'attributes'>('managed');

  const dirName = directoryConfig?.integrationName || directoryConfig?.idpName || 'Meridian ID';
  const idpLabel = directoryConfig?.idpName || 'Meridian ID';
  const baseUrlLabel = directoryConfig?.baseUrl || 'https://api.meridianid.com/v2';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isComplete = dashboardState === 'complete';

  const hasApps = isComplete || categoryStates?.apps?.status === 'verified' || categoryStates?.apps?.status === 'verification_required';
  const hasPolicies = isComplete || categoryStates?.policies?.status === 'verified' || categoryStates?.policies?.status === 'verification_required';
  const hasRoles = isComplete || categoryStates?.roles?.status === 'verified' || categoryStates?.roles?.status === 'verification_required';

  // 1. Conditional Tabs based on migration state (Strictly omitting Authentication Factors)
  const visibleTabs: { id: 'general' | 'users' | 'groups' | 'ou' | 'apps' | 'policies' | 'roles' | 'synchistory'; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'users', label: 'Users' },
    { id: 'groups', label: 'Groups' },
    { id: 'ou', label: 'OU' },
    ...(hasApps ? [{ id: 'apps' as const, label: 'Apps' }] : []),
    ...(hasPolicies ? [{ id: 'policies' as const, label: 'Policies' }] : []),
    ...(hasRoles ? [{ id: 'roles' as const, label: 'Roles' }] : []),
    { id: 'synchistory', label: 'Sync History' }
  ];

  // Mock attribute mappings
  const userAttributeMappings = [
    { hexnode: 'Email', source: 'User Principal Name' },
    { hexnode: 'Name', source: 'Display Name' },
    { hexnode: 'Username', source: 'sAMAccountName' },
    { hexnode: 'Phone Number', source: 'telephoneNumber' },
    { hexnode: 'Department', source: 'department' },
    { hexnode: 'Status', source: 'accountEnabled' },
    { hexnode: 'Job Title', source: 'title' }
  ];

  const groupAttributeMappings = [
    { hexnode: 'Group Name', source: 'name' },
    { hexnode: 'Group ID', source: 'id' },
    { hexnode: 'Description', source: 'description' },
    { hexnode: 'Group Type', source: 'groupType' },
    { hexnode: 'Members', source: 'members.length' }
  ];

  const ouAttributeMappings = [
    { hexnode: 'OU Name', source: 'name' },
    { hexnode: 'OU ID', source: 'id' },
    { hexnode: 'Parent Path', source: 'parentPath' },
    { hexnode: 'Description', source: 'description' },
    { hexnode: 'Member Count', source: 'memberCount' }
  ];

  const syncHistoryRows = [
    {
      trigger: 'Manual',
      status: 'Success',
      time: '01/03/2024 10:00',
      details: 'Synced 6 users ( 2 created, 4 updated), Synced 2 groups'
    },
    {
      trigger: 'Automated',
      status: 'Success',
      time: '01/04/2024 11:15',
      details: 'Synced 8 users ( 3 created, 5 updated), Synced 3 groups'
    },
    {
      trigger: 'Automated',
      status: 'Failed',
      time: '01/04/2024 17:00',
      details: 'Connection timed out after 30s. 0 records synced.'
    },
    {
      trigger: 'Automated',
      status: 'Success',
      time: '01/05/2024 10:00',
      details: 'Synced 12 users ( 0 created, 12 updated), Synced 2 groups'
    }
  ];

  const emptyStateHTML = (label: string) => (
    <div className="empty-state">
      <GridIcon size={36} />
      <p>
        <strong>Not migrated yet.</strong>
      </p>
      <p style={{ marginTop: '4px' }}>
        {label} will show up here once you complete migration setup.
      </p>
      <div style={{ marginTop: '16px' }}>
        <a
          onClick={(e) => {
            e.preventDefault();
            onStartFlow2();
          }}
          style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
        >
          Continue migration setup
        </a>
      </div>
    </div>
  );

  return (
    <section className="screen active" id="screen-dashboard">
      <div className="breadcrumb">
        Custom Directory <ChevronRightIcon size={12} /> <strong>{dirName}</strong>
      </div>

      <div className="dash-header">
        <h1>
          {dirName}{' '}
          <span className={`pill ${isComplete ? 'pill-success' : 'pill-info'}`} id="dash-status-pill">
            {isComplete ? 'Active' : 'Partial Setup'}
          </span>
        </h1>
        <div className="dropdown" ref={menuRef}>
          <button
            className="btn btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setActionsMenuOpen((prev) => !prev);
            }}
          >
            Actions <ChevronDownIcon size={14} />
          </button>
          <div className={`dropdown-menu ${actionsMenuOpen ? 'open' : ''}`} id="actions-menu">
            <button
              onClick={() => {
                setActionsMenuOpen(false);
                showToast('Sync started');
              }}
            >
              Re-run sync
            </button>
            <button
              onClick={() => {
                setActionsMenuOpen(false);
                showToast('Opening configuration editor…');
              }}
            >
              Edit configuration
            </button>
            <button
              onClick={() => {
                setActionsMenuOpen(false);
                setActiveTab('synchistory');
              }}
            >
              View logs
            </button>
            <button
              onClick={() => {
                setActionsMenuOpen(false);
                showToast('Directory deactivated');
              }}
            >
              Deactivate
            </button>
            <button
              className="danger"
              onClick={() => {
                setActionsMenuOpen(false);
                showToast('This would remove the directory');
              }}
            >
              Remove directory
            </button>
          </div>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="tabs">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div id="dash-scope">
        {/* ========================================================
            1. GENERAL TAB
           ======================================================== */}
        {activeTab === 'general' && (
          <div className="tab-panel active">
            {/* Additional Asset Migration Section */}
            {(() => {
              const defaultAppsState: CategoryMigrationState = {
                category: 'apps',
                title: 'SSO Applications',
                description: 'Discover and migrate supported single sign-on application configurations.',
                status: 'not_discovered',
                currentStep: 1,
                discoveredAssets: [],
                selectedAssetIds: [],
                mappings: {},
                validationFindings: [],
                validationFresh: false,
                warningsAcknowledged: false,
                approvedPlan: null,
                migrationJob: { total: 0, completed: 0, inProgress: 0, failed: 0, skipped: 0, running: false, finished: false, assetResults: {} },
                verificationResults: {}
              };
              const defaultPoliciesState: CategoryMigrationState = {
                category: 'policies',
                title: 'Security Policies',
                description: 'Review and migrate supported security policies, rules and assignments.',
                status: 'not_discovered',
                currentStep: 1,
                discoveredAssets: [],
                selectedAssetIds: [],
                mappings: {},
                validationFindings: [],
                validationFresh: false,
                warningsAcknowledged: false,
                approvedPlan: null,
                migrationJob: { total: 0, completed: 0, inProgress: 0, failed: 0, skipped: 0, running: false, finished: false, assetResults: {} },
                verificationResults: {}
              };
              const defaultRolesState: CategoryMigrationState = {
                category: 'roles',
                title: 'Roles & Permissions',
                description: 'Map roles and permissions and review role assignments before migration.',
                status: 'not_discovered',
                currentStep: 1,
                discoveredAssets: [],
                selectedAssetIds: [],
                mappings: {},
                validationFindings: [],
                validationFresh: false,
                warningsAcknowledged: false,
                approvedPlan: null,
                migrationJob: { total: 0, completed: 0, inProgress: 0, failed: 0, skipped: 0, running: false, finished: false, assetResults: {} },
                verificationResults: {}
              };

              const apps = categoryStates?.apps || defaultAppsState;
              const policies = categoryStates?.policies || defaultPoliciesState;
              const roles = categoryStates?.roles || defaultRolesState;

              const allCatStates = [apps, policies, roles];
              const verifiedCount = allCatStates.filter((c) => c.status === 'verified').length;
              const inProgressCount = allCatStates.filter((c) => c.status === 'in_progress' || c.status === 'partially_migrated').length;
              const needsConfigCount = allCatStates.filter((c) => c.status === 'needs_configuration' || c.status === 'ready_to_migrate').length;
              const verifyPendingCount = allCatStates.filter((c) => c.status === 'verification_required').length;
              const notStartedCount = allCatStates.filter((c) => c.status === 'not_discovered' || c.status === 'discovery_incomplete').length;

              const panels = [
                {
                  key: 'apps' as AssetCategory,
                  title: 'SSO Applications',
                  description: 'Discover and migrate supported single sign-on application configurations.',
                  icon: <GridIcon size={20} />,
                  iconBg: '#EFF6FF',
                  iconColor: '#1D4ED8',
                  state: apps,
                  countSummary:
                    apps.discoveredAssets.length > 0
                      ? `${apps.discoveredAssets.length} applications discovered (${apps.discoveredAssets.filter((a) => a.supportLevel === 'supported').length} supported, ${apps.discoveredAssets.filter((a) => a.supportLevel === 'unsupported').length} unsupported)`
                      : null,
                  readinessSummary:
                    apps.status === 'not_discovered'
                      ? 'Inventory scan required to inspect source API'
                      : apps.status === 'needs_configuration'
                      ? `${apps.selectedAssetIds.length} eligible applications ready for mapping`
                      : apps.status === 'ready_to_migrate'
                      ? 'Validation passed; ready for approved execution'
                      : apps.status === 'in_progress'
                      ? 'Simulated migration in progress'
                      : apps.status === 'verification_required'
                      ? '11 verified, 2 manual certificate uploads required in SP'
                      : apps.status === 'verified'
                      ? 'All applications verified in Hexnode IdP'
                      : 'Review discovery findings'
                },
                {
                  key: 'policies' as AssetCategory,
                  title: 'Security Policies',
                  description: 'Review and migrate supported security policies, rules and assignments.',
                  icon: <ShieldIcon size={20} />,
                  iconBg: '#F5F3FF',
                  iconColor: '#7C3AED',
                  state: policies,
                  countSummary:
                    policies.discoveredAssets.length > 0
                      ? `${policies.discoveredAssets.length} security policies discovered (5 supported, 1 needs review)`
                      : null,
                  readinessSummary:
                    policies.status === 'not_discovered'
                      ? 'Inventory scan required to inspect policy rules'
                      : policies.status === 'needs_configuration'
                      ? '6 policy rules mapped to target security engine'
                      : policies.status === 'ready_to_migrate'
                      ? 'Pre-flight check passed; ready for review'
                      : policies.status === 'in_progress'
                      ? 'Deploying security policies to tenant'
                      : policies.status === 'verification_required'
                      ? '5 verified, 1 operating schedule confirmation pending'
                      : policies.status === 'verified'
                      ? 'All 6 security policies active and verified'
                      : 'Review discovery findings'
                },
                {
                  key: 'roles' as AssetCategory,
                  title: 'Roles & Permissions',
                  description: 'Map roles and permissions and review role assignments before migration.',
                  icon: <UsersIcon size={20} />,
                  iconBg: '#ECFDF5',
                  iconColor: '#059669',
                  state: roles,
                  countSummary:
                    roles.discoveredAssets.length > 0
                      ? `${roles.discoveredAssets.length} role definitions discovered (7 supported, 1 review needed)`
                      : null,
                  readinessSummary:
                    roles.status === 'not_discovered'
                      ? 'Inventory scan required to inspect RBAC assignments'
                      : roles.status === 'needs_configuration'
                      ? '8 roles mapped to target Hexnode roles'
                      : roles.status === 'ready_to_migrate'
                      ? '41 technician assignments validated'
                      : roles.status === 'in_progress'
                      ? 'Creating role definitions and user assignments'
                      : roles.status === 'verification_required'
                      ? '7 verified, 1 scope check pending'
                      : roles.status === 'verified'
                      ? 'All 8 roles and 41 technician assignments verified'
                      : 'Review discovery findings'
                }
              ];

              return (
                <div style={{ marginBottom: '28px' }}>
                  {/* Section Title and Overall Migration Summary */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        Asset-Based Migration
                      </h2>
                      <span className="pill pill-info" style={{ fontSize: '11.5px' }}>
                        Phase 2 Execution
                      </span>
                    </div>

                    {/* Compact Overall Summary */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Overall Migration Progress
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                          {verifiedCount} of 3 Categories Verified
                        </div>
                      </div>
                      <div style={{ height: '28px', width: '1px', background: '#E5E7EB' }} />
                      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>
                        <div>
                          {notStartedCount > 0 && <span style={{ marginRight: '8px' }}>• {notStartedCount} not started</span>}
                          {inProgressCount > 0 && <span style={{ marginRight: '8px' }}>• {inProgressCount} in progress</span>}
                          {needsConfigCount > 0 && <span style={{ marginRight: '8px' }}>• {needsConfigCount} needs config</span>}
                          {verifyPendingCount > 0 && <span>• {verifyPendingCount} verify pending</span>}
                          {verifiedCount === 3 && <span style={{ color: '#15803D', fontWeight: 600 }}>• All categories verified</span>}
                        </div>
                        <div style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '2px' }}>
                          Phase 1 directory sync remains active independently
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Asset Panels */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {panels.map((p) => {
                      const actionLabel = getPanelActionLabel(p.state.status);
                      return (
                        <div
                          key={p.key}
                          className="card"
                          style={{
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            transition: 'border-color 0.15s ease',
                            position: 'relative'
                          }}
                        >
                          <div>
                            {/* Card Top: Icon & Status */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '6px',
                                  background: p.iconBg,
                                  color: p.iconColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {p.icon}
                              </div>
                              {getStatusPill(p.state.status)}
                            </div>

                            {/* Title & Description */}
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>
                              {p.title}
                            </h3>
                            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                              {p.description}
                            </p>

                            {/* Counts & Issue Summary */}
                            <div
                              style={{
                                background: '#F9FAFB',
                                border: '1px solid #F3F4F6',
                                borderRadius: '6px',
                                padding: '10px 12px',
                                marginBottom: '18px',
                                minHeight: '52px'
                              }}
                            >
                              {p.countSummary && (
                                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                                  {p.countSummary}
                                </div>
                              )}
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                {p.readinessSummary}
                              </div>
                            </div>
                          </div>

                          {/* Primary Action Button */}
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              if (onOpenCategoryWizard) {
                                onOpenCategoryWizard(p.key);
                              } else {
                                onStartFlow2();
                              }
                            }}
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              fontSize: '13.5px',
                              padding: '8px 14px'
                            }}
                          >
                            {actionLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Section 1: Configuration Details */}
            <div className="card" style={{ padding: '22px 24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Configuration Details
                </h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => showToast('Opening Configuration Editor…')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <EditIcon size={13} /> Edit
                </button>
              </div>

              <div className="config-details-row">
                <div className="k">Name</div>
                <div style={{ fontWeight: 500, color: '#111827' }}>{dirName}</div>
              </div>
              <div className="config-details-row">
                <div className="k">Custom domain / Directory</div>
                <div style={{ fontFamily: 'var(--mono)', color: '#374151' }}>{baseUrlLabel || idpLabel}</div>
              </div>
              <div className="config-details-row">
                <div className="k">Authentication Method</div>
                <div>OAuth 2.0 (Client Credentials)</div>
              </div>
              <div className="config-details-row">
                <div className="k">Directory Status</div>
                <div>
                  <span className={`pill ${isComplete ? 'pill-success' : 'pill-info'}`}>
                    {isComplete ? 'Active' : 'Partially Configured'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Sync Settings */}
            <div className="card" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Sync Settings
                </h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => showToast('Opening Sync Settings…')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <EditIcon size={13} /> Edit
                </button>
              </div>

              <div className="config-details-row">
                <div className="k">Initiate Sync at</div>
                <div style={{ fontWeight: 500, color: '#111827' }}>12:10</div>
              </div>
              <div className="config-details-row">
                <div className="k">Frequency</div>
                <div style={{ fontWeight: 500, color: '#111827' }}>Daily</div>
              </div>
              <div className="config-details-row">
                <div className="k">Sync Direction</div>
                <div>Inbound only</div>
              </div>
              <div className="config-details-row">
                <div className="k">Last Sync Job</div>
                <div style={{ color: '#15803D', fontWeight: 500 }}>Today at 10:00 (Success)</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            2. USERS TAB (Nested Sidebar Layout)
           ======================================================== */}
        {activeTab === 'users' && (
          <div className="tab-panel active">
            <div className="sidebar-config-container">
              {/* Left Sidebar */}
              <div className="sidebar-config-left">
                <div className="config-nav-group">
                  <div className="config-sub-menu">
                    <button
                      type="button"
                      className={`config-menu-item ${usersSubTab === 'managed' ? 'active' : ''}`}
                      onClick={() => setUsersSubTab('managed')}
                    >
                      Managed Users
                    </button>
                    <button
                      type="button"
                      className={`config-menu-item ${usersSubTab === 'attributes' ? 'active' : ''}`}
                      onClick={() => setUsersSubTab('attributes')}
                    >
                      User Attributes
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="sidebar-config-right">
                {usersSubTab === 'managed' ? (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        Managed Users
                      </h3>
                      <span className="pill pill-info">{dashUsers.length} Users</span>
                    </div>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashUsers.map((u, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{u[0]}</td>
                            <td style={{ color: '#4B5563' }}>{u[1]}</td>
                            <td>{u[2]}</td>
                            <td>
                              <span className="pill pill-success">{u[3]}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        User Attributes
                      </h3>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => showToast('Opening attribute mapper…')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <EditIcon size={13} /> Edit Mappings
                      </button>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                      Attribute schema mappings between Hexnode IdP and {idpLabel}.
                    </p>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Hexnode IDP Attribute</th>
                          <th>Source Attribute</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userAttributeMappings.map((m, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{m.hexnode}</td>
                            <td style={{ fontFamily: 'var(--mono)', color: '#374151' }}>{m.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            3. GROUPS TAB (Nested Sidebar Layout)
           ======================================================== */}
        {activeTab === 'groups' && (
          <div className="tab-panel active">
            <div className="sidebar-config-container">
              {/* Left Sidebar */}
              <div className="sidebar-config-left">
                <div className="config-nav-group">
                  <div className="config-sub-menu">
                    <button
                      type="button"
                      className={`config-menu-item ${groupsSubTab === 'managed' ? 'active' : ''}`}
                      onClick={() => setGroupsSubTab('managed')}
                    >
                      Managed Groups
                    </button>
                    <button
                      type="button"
                      className={`config-menu-item ${groupsSubTab === 'attributes' ? 'active' : ''}`}
                      onClick={() => setGroupsSubTab('attributes')}
                    >
                      Group Attributes
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="sidebar-config-right">
                {groupsSubTab === 'managed' ? (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        Managed Groups
                      </h3>
                      <span className="pill pill-info">{dashGroups.length} Groups</span>
                    </div>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Group Name</th>
                          <th>Members</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashGroups.map((g, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{g[0]}</td>
                            <td>{g[1]}</td>
                            <td>
                              <span className="pill pill-info">{g[2]}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        Group Attributes
                      </h3>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => showToast('Opening group attribute mapper…')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <EditIcon size={13} /> Edit Mappings
                      </button>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                      Attribute schema mappings between Hexnode IdP and {idpLabel} groups.
                    </p>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Hexnode IDP Attribute</th>
                          <th>Source Attribute</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupAttributeMappings.map((m, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{m.hexnode}</td>
                            <td style={{ fontFamily: 'var(--mono)', color: '#374151' }}>{m.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            4. OU TAB (Nested Sidebar Layout)
           ======================================================== */}
        {activeTab === 'ou' && (
          <div className="tab-panel active">
            <div className="sidebar-config-container">
              {/* Left Sidebar */}
              <div className="sidebar-config-left">
                <div className="config-nav-group">
                  <div className="config-sub-menu">
                    <button
                      type="button"
                      className={`config-menu-item ${ouSubTab === 'managed' ? 'active' : ''}`}
                      onClick={() => setOuSubTab('managed')}
                    >
                      Managed OUs
                    </button>
                    <button
                      type="button"
                      className={`config-menu-item ${ouSubTab === 'attributes' ? 'active' : ''}`}
                      onClick={() => setOuSubTab('attributes')}
                    >
                      OU Attributes
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="sidebar-config-right">
                {ouSubTab === 'managed' ? (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        Managed Organizational Units
                      </h3>
                      <span className="pill pill-info">{dashOU.length} OUs</span>
                    </div>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>OU</th>
                          <th>Parent Path</th>
                          <th>Members</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashOU.map((o, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{o[0]}</td>
                            <td style={{ fontFamily: 'var(--mono)', color: '#4B5563' }}>{o[1]}</td>
                            <td>{o[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        OU Attributes
                      </h3>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => showToast('Opening OU attribute mapper…')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <EditIcon size={13} /> Edit Mappings
                      </button>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                      Attribute schema mappings between Hexnode IdP and {idpLabel} organizational units.
                    </p>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Hexnode IDP Attribute</th>
                          <th>Source Attribute</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ouAttributeMappings.map((m, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{m.hexnode}</td>
                            <td style={{ fontFamily: 'var(--mono)', color: '#374151' }}>{m.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            5. APPS TAB (Kept intact for complete migration)
           ======================================================== */}
        {activeTab === 'apps' && (
          <div className="tab-panel active">
            {!isComplete ? (
              emptyStateHTML('SSO Applications')
            ) : (
              <>
                <div className="table-toolbar">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => showToast('Re-syncing all apps…')}
                  >
                    Re-sync category
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Protocol</th>
                      <th>Category</th>
                      <th>Assigned users</th>
                      <th>Confidence</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.apps.map((app, i) => (
                      <tr key={i}>
                        <td>
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('apps', i)}
                          >
                            {app.name}
                          </button>
                        </td>
                        <td>{app.protocol}</td>
                        <td>{app.category}</td>
                        <td>{app.users.toLocaleString()}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(app.confidence)}`}>
                            {app.confidence}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-btn"
                            title="Re-sync"
                            onClick={() => showToast(`Re-syncing ${app.name}…`)}
                          >
                            <RefreshIcon size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ========================================================
            6. POLICIES TAB (Kept intact for complete migration)
           ======================================================== */}
        {activeTab === 'policies' && (
          <div className="tab-panel active">
            {!isComplete ? (
              emptyStateHTML('Security Policies')
            ) : (
              <>
                <div className="table-toolbar">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => showToast('Re-syncing all policies…')}
                  >
                    Re-sync category
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy</th>
                      <th>Type</th>
                      <th>Applies to</th>
                      <th>Enforcement</th>
                      <th>Confidence</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.policies.map((pol, i) => (
                      <tr key={i}>
                        <td>
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('policies', i)}
                          >
                            {pol.name}
                          </button>
                        </td>
                        <td>{pol.type}</td>
                        <td>{pol.appliesTo}</td>
                        <td>{pol.enforcement}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(pol.confidence)}`}>
                            {pol.confidence}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-btn"
                            title="Re-sync"
                            onClick={() => showToast(`Re-syncing ${pol.name}…`)}
                          >
                            <RefreshIcon size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}



        {/* ========================================================
            8. ROLES TAB (Kept intact for complete migration)
           ======================================================== */}
        {activeTab === 'roles' && (
          <div className="tab-panel active">
            {!isComplete ? (
              emptyStateHTML('Roles & Technicians')
            ) : (
              <>
                <div className="table-toolbar">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => showToast('Re-syncing all roles…')}
                  >
                    Re-sync category
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Permission level</th>
                      <th>Assigned users</th>
                      <th>Scope</th>
                      <th>Confidence</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.roles.map((role, i) => (
                      <tr key={i}>
                        <td>
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('roles', i)}
                          >
                            {role.name}
                          </button>
                        </td>
                        <td>{role.permissionLevel}</td>
                        <td>{role.users}</td>
                        <td>{role.scope}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(role.confidence)}`}>
                            {role.confidence}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-btn"
                            title="Re-sync"
                            onClick={() => showToast(`Re-syncing ${role.name}…`)}
                          >
                            <RefreshIcon size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ========================================================
            9. SYNC HISTORY TAB
           ======================================================== */}
        {activeTab === 'synchistory' && (
          <div className="tab-panel active">
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>
                  Sync History
                </h2>
                <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>
                  Shows a log of all manual and scheduled synchronization jobs for this directory.
                </p>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trigger</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistoryRows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: '#111827' }}>{row.trigger}</td>
                      <td>
                        <span className={`pill ${row.status === 'Success' ? 'pill-success' : 'pill-danger'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ color: '#4B5563', whiteSpace: 'nowrap' }}>{row.time}</td>
                      <td style={{ color: '#374151' }}>{row.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
