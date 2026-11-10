import React, { useState, useEffect } from 'react';
import {
  AssetCategory,
  CategoryMigrationState,
  DiscoveredAsset,
  ValidationFinding
} from '../types.ts';
import {
  GridIcon,
  ShieldIcon,
  UsersIcon,
  ChevronRightIcon,
  CheckIcon,
  AlertIcon,
  InfoCircleIcon,
  RefreshIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  SparkleIcon
} from './icons.tsx';
import { getDiscoveredAssetsForCategory } from '../data/mockData.ts';

interface AssetMigrationWizardProps {
  category: AssetCategory;
  state: CategoryMigrationState;
  onUpdateState: (category: AssetCategory, updates: Partial<CategoryMigrationState>) => void;
  onBackToDashboard: () => void;
  onShowItemDetail?: (category: 'apps' | 'policies' | 'factors' | 'roles', index: number) => void;
  showToast: (msg: string) => void;
}

export const AssetMigrationWizard: React.FC<AssetMigrationWizardProps> = ({
  category,
  state,
  onUpdateState,
  onBackToDashboard,
  onShowItemDetail,
  showToast
}) => {
  // Streamlined 4-step workflow:
  // 1: Discover & Review
  // 2: Configure & Map
  // 3: Review & Validate
  // 4: Migrate & Verify
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (state.currentStep && state.currentStep >= 1 && state.currentStep <= 4) {
      return state.currentStep;
    }
    if (state.currentStep === 5) return 4;
    return 1;
  });

  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(state.migrationJob?.running || false);

  // Left-panel asset navigation in Step 2 (Configure & Map)
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [assetFilterStatus, setAssetFilterStatus] = useState<'all' | 'needs_attention' | 'mapped'>('all');

  // Sub-tabs for Step 2 workspace (All 3 categories follow Configuration | Assignments)
  const [appWorkspaceTab, setAppWorkspaceTab] = useState<'configuration' | 'assignments'>('configuration');
  const [policyWorkspaceTab, setPolicyWorkspaceTab] = useState<'configuration' | 'assignments'>('configuration');
  const [roleWorkspaceTab, setRoleWorkspaceTab] = useState<'configuration' | 'assignments'>('configuration');

  // Interactive controls for Assignments (Users, Groups, OUs)
  const [sourceAssignTab, setSourceAssignTab] = useState<'users' | 'groups' | 'ous'>('users');
  const [customAssignTab, setCustomAssignTab] = useState<'users' | 'groups' | 'ous'>('users');
  const [assignSearchQuery, setAssignSearchQuery] = useState<string>('');
  const [newAssignUserEmail, setNewAssignUserEmail] = useState<string>('');
  const [newAssignUserName, setNewAssignUserName] = useState<string>('');
  const [newAssignGroup, setNewAssignGroup] = useState<string>('');
  const [newAssignOU, setNewAssignOU] = useState<string>('');

  // Input states for interactive additions
  const [newSourceAttr, setNewSourceAttr] = useState<string>('');
  const [newTargetClaim, setNewTargetClaim] = useState<string>('');
  const [newOidcClaimSource, setNewOidcClaimSource] = useState<string>('');
  const [newOidcClaimTarget, setNewOidcClaimTarget] = useState<string>('');
  const [newRedirectUri, setNewRedirectUri] = useState<string>('');
  const [newLogoutUri, setNewLogoutUri] = useState<string>('');
  const [newGroupInput, setNewGroupInput] = useState<string>('');
  const [newTechEmail, setNewTechEmail] = useState<string>('');
  const [newTechName, setNewTechName] = useState<string>('');
  const [newScopedOU, setNewScopedOU] = useState<string>('');
  const [newScopedGroup, setNewScopedGroup] = useState<string>('');
  const [newExcludedGroup, setNewExcludedGroup] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Confirmation state for Step 3 approval
  const [approvalConfirmed, setApprovalConfirmed] = useState<boolean>(true);

  // Sync step changes to parent state
  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    onUpdateState(category, { currentStep: stepNumber });
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  // Category visual metadata
  const categoryMeta = {
    apps: {
      title: 'SSO Applications',
      singular: 'Application',
      endpoint: '/apps/v1/connections',
      icon: <GridIcon size={20} />,
      color: '#1D4ED8'
    },
    policies: {
      title: 'Security Policies',
      singular: 'Security Policy',
      endpoint: '/policies/v1/rules',
      icon: <ShieldIcon size={20} />,
      color: '#7C3AED'
    },
    roles: {
      title: 'Roles & Permissions',
      singular: 'Role Definition',
      endpoint: '/roles/v1/assignments',
      icon: <UsersIcon size={20} />,
      color: '#059669'
    }
  }[category];

  // Helper: Run Discovery Scan
  const runDiscoveryScan = (isRescan = false) => {
    setIsDiscovering(true);
    setTimeout(() => {
      const assets = getDiscoveredAssetsForCategory(category);
      const eligibleIds = assets
        .filter((a) => a.supportLevel !== 'unsupported')
        .map((a) => a.id);

      // Generate default rich mappings conforming to Hexnode IdP schemas
      const defaultMappings: Record<string, any> = {};
      assets.forEach((a) => {
        const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-)$/g, '');

        if (category === 'apps') {
          const isOidc = a.protocol === 'OIDC' || a.type === 'OIDC';
          const sourceGroups = a.name === 'Salesforce'
            ? ['Sales & Marketing', 'Customer Success', 'Executive Team']
            : a.name === 'Workday'
            ? ['All Corporate Employees', 'Human Resources', 'Finance & Payroll']
            : a.name === 'Slack'
            ? ['All Company', 'Engineering', 'Operations']
            : a.name === 'GitHub Enterprise'
            ? ['Engineering', 'Product Management', 'DevOps Team']
            : ['Engineering', 'Product Management', 'Design'];

          const sourceOUs = a.name === 'Workday'
            ? ['OU=Corporate,DC=meridian,DC=com', 'OU=Finance,DC=meridian,DC=com']
            : ['OU=Headquarters,DC=meridian,DC=com'];

          const sourceUsers = [
            { name: 'Sarah Jenkins', email: 'sarah.jenkins@corp.com', title: 'VP Operations' },
            { name: 'Alex Chen', email: 'alex.chen@corp.com', title: 'Lead Architect' },
            { name: 'David Miller', email: 'david.miller@corp.com', title: 'Systems Director' },
            { name: 'Emily Watson', email: 'emily.watson@corp.com', title: 'Security Engineer' }
          ];

          const customAssignments = {
            groups: ['Engineering', 'Product Management'],
            ous: ['OU=Corporate,DC=meridian,DC=com'],
            users: [
              { name: 'David Miller', email: 'david.miller@corp.com', title: 'Systems Director' },
              { name: 'Alex Chen', email: 'alex.chen@corp.com', title: 'Lead Architect' }
            ]
          };

          if (isOidc) {
            defaultMappings[a.id] = {
              protocol: 'OIDC',
              targetName: a.name,
              appType: 'web',
              clientAuth: 'client_secret_post',
              pkceEnforced: true,
              redirectUris: [
                `https://${slug}.com/oauth/callback`,
                `https://${slug}.com/signin-oidc`
              ],
              logoutUris: [`https://${slug}.com/logout/callback`],
              allowedScopes: ['openid', 'profile', 'email', 'groups'],
              grantTypes: ['authorization_code', 'refresh_token'],
              assignmentScopeType: 'source_preserved',
              sourceAssignments: {
                groups: sourceGroups,
                ous: sourceOUs,
                users: sourceUsers
              },
              customAssignments,
              assignedGroups: sourceGroups,
              tokenClaims: [
                { source: 'sub', target: 'sub', isStandard: true },
                { source: 'email', target: 'email', isStandard: true },
                { source: 'name', target: 'name', isStandard: true },
                { source: 'roles', target: 'roles', isStandard: true }
              ],
              genieMappedFields: ['redirectUris', 'logoutUris', 'allowedScopes', 'tokenClaims']
            };
          } else {
            defaultMappings[a.id] = {
              protocol: 'SAML 2.0',
              targetName: a.name,
              entityId:
                a.name === 'Workday'
                  ? 'https://idp.hexnode.com/saml/workday-meridian-v2/metadata'
                  : `https://idp.hexnode.com/saml/${slug}/metadata`,
              ssoUrl: `https://idp.hexnode.com/saml/${slug}/sso`,
              sloUrl: `https://idp.hexnode.com/saml/${slug}/slo`,
              nameIdClaim: 'emailAddress',
              signingAlg: 'SHA-256',
              signResponse: true,
              signAssertion: true,
              encryptAssertion: false,
              assignmentScopeType: 'source_preserved',
              sourceAssignments: {
                groups: sourceGroups,
                ous: sourceOUs,
                users: sourceUsers
              },
              customAssignments,
              assignedGroups: sourceGroups,
              attributeClaims: [
                { source: 'mail', target: 'email', isStandard: true },
                { source: 'displayName', target: 'name', isStandard: true },
                { source: 'department', target: 'department', isStandard: true },
                { source: 'memberOf', target: 'groups', isStandard: true }
              ],
              genieMappedFields: ['entityId', 'ssoUrl', 'signingAlg', 'attributeClaims']
            };
          }
        } else if (category === 'policies') {
          const isCA =
            a.type === 'Conditional Access' ||
            a.name.includes('Access') ||
            a.name.includes('Contractor');

          const policySourceGroups = a.name.includes('Contractor')
            ? ['Contractors Group', 'Vendor Partners']
            : a.name.includes('Executive')
            ? ['Executive Team', 'Board of Directors']
            : ['All Full-time Employees', 'IT Operations'];

          const policySourceOUs = a.name.includes('Legacy')
            ? ['OU=APAC Branch,DC=meridian,DC=com']
            : a.name.includes('Executive')
            ? ['OU=Executive,DC=meridian,DC=com']
            : ['OU=Corporate,DC=meridian,DC=com'];

          const policySourceUsers = a.name.includes('Contractor')
            ? [
                { name: 'James Wilson', email: 'james.wilson@corp.com', title: 'Contract Consultant' },
                { name: 'Maya Patel', email: 'maya.patel@corp.com', title: 'External Advisor' }
              ]
            : [
                { name: 'Sarah Jenkins', email: 'sarah.jenkins@corp.com', title: 'VP Operations' },
                { name: 'David Miller', email: 'david.miller@corp.com', title: 'Systems Director' }
              ];

          const policyCustomAssignments = {
            groups: a.name.includes('Contractor') ? ['Contractors Group'] : ['All Full-time Employees'],
            ous: ['OU=Corporate,DC=meridian,DC=com'],
            users: [
              { name: 'James Wilson', email: 'james.wilson@corp.com', title: 'Contract Consultant' }
            ]
          };

          if (isCA) {
            defaultMappings[a.id] = {
              isConditionalAccess: true,
              targetName: a.name,
              targetEnforcement: a.status === 'Report-only' ? 'Report-only' : 'Enforced',
              platforms: ['macOS', 'Windows', 'iOS', 'Android'],
              ipConditions: 'Trusted Corporate CIDRs (10.0.0.0/8)',
              timeSchedule: a.name.includes('Contractor')
                ? 'Outside Business Hours (09:00 - 18:00 UTC-08:00)'
                : 'Anytime',
              requireCompliantDevice: true,
              grantAction: a.name.includes('Contractor')
                ? 'Block access'
                : 'Require step-up MFA',
              allowedFactors: ['Hexnode Authenticator App', 'FIDO2 Security Key', 'SMS OTP'],
              sessionTimeout: '30 mins',
              persistentSession: false,
              assignmentScopeType: 'source_preserved',
              sourceAssignments: {
                groups: policySourceGroups,
                ous: policySourceOUs,
                users: policySourceUsers
              },
              customAssignments: policyCustomAssignments,
              assignedTarget: a.name.includes('Contractor') ? 'Contractors Group' : 'Executive OU',
              excludedGroups: ['Break-glass Emergency Admins'],
              genieMappedFields: ['ipConditions', 'timeSchedule', 'grantAction', 'allowedFactors']
            };
          } else {
            const isMfa = a.type === 'MFA' || a.name.includes('MFA');
            const isSession = a.type === 'Session' || a.name.includes('Session');
            if (isMfa) {
              defaultMappings[a.id] = {
                isConditionalAccess: false,
                policyType: 'MFA',
                targetName: a.name,
                targetEnforcement: 'Enforced',
                allowedFactors: ['Authenticator App (TOTP)', 'Push Notification', 'FIDO2 / WebAuthn', 'SMS OTP'],
                gracePeriodDays: 7,
                rememberDeviceDays: 30,
                assignmentScopeType: 'source_preserved',
                sourceAssignments: {
                  groups: policySourceGroups,
                  ous: policySourceOUs,
                  users: policySourceUsers
                },
                customAssignments: policyCustomAssignments,
                assignedTarget: 'All Users',
                excludedGroups: ['Break-glass Emergency Admins'],
                genieMappedFields: ['allowedFactors', 'gracePeriodDays']
              };
            } else if (isSession) {
              defaultMappings[a.id] = {
                isConditionalAccess: false,
                policyType: 'Session',
                targetName: a.name,
                targetEnforcement: 'Enforced',
                idleTimeout: '30 mins',
                maxSession: '12 hours',
                maxConcurrent: 3,
                assignmentScopeType: 'source_preserved',
                sourceAssignments: {
                  groups: policySourceGroups,
                  ous: policySourceOUs,
                  users: policySourceUsers
                },
                customAssignments: policyCustomAssignments,
                assignedTarget: 'All Users',
                excludedGroups: [],
                genieMappedFields: ['idleTimeout', 'maxSession']
              };
            } else {
              defaultMappings[a.id] = {
                isConditionalAccess: false,
                policyType: 'Password',
                targetName: a.name,
                targetEnforcement: a.status === 'Report-only' ? 'Report-only' : 'Enforced',
                minLength: a.name.includes('Legacy') ? 8 : 12,
                requireUpper: true,
                requireLower: true,
                requireNumber: true,
                requireSymbol: !a.name.includes('Legacy'),
                maxAgeDays: a.name.includes('Legacy') ? 180 : 90,
                historyCount: a.name.includes('Legacy') ? 2 : 5,
                assignmentScopeType: 'source_preserved',
                sourceAssignments: {
                  groups: policySourceGroups,
                  ous: policySourceOUs,
                  users: policySourceUsers
                },
                customAssignments: policyCustomAssignments,
                assignedTarget: a.name.includes('Legacy') ? 'APAC OU' : 'All Users',
                excludedGroups: [],
                genieMappedFields: ['minLength', 'maxAgeDays', 'historyCount']
              };
            }
          }
        } else {
          const targetProfileName = a.name.includes('Global')
            ? 'Super Admin Profile'
            : a.name.includes('Helpdesk')
            ? 'Helpdesk Technician Profile'
            : a.name.includes('Device')
            ? 'Device Administrator Profile'
            : a.name.includes('Auditor')
            ? 'Reports & Audit Profile'
            : a.name.includes('App')
            ? 'Application Administrator Profile'
            : a.name.includes('Security')
            ? 'Security Operations Profile'
            : a.name.includes('Billing')
            ? 'Subscription & Billing Profile'
            : `${a.name} Profile`;

          const assignedRoleName = a.name.includes('Global')
            ? 'Hexnode Super Admin'
            : a.name.includes('Helpdesk')
            ? 'Hexnode Helpdesk Technician'
            : a.name.includes('Device')
            ? 'Hexnode Device Admin'
            : a.name.includes('Auditor')
            ? 'Hexnode Reports & Audit Viewer'
            : a.name.includes('App')
            ? 'Hexnode Application Admin'
            : a.name.includes('Security')
            ? 'Hexnode Security Administrator'
            : a.name.includes('Billing')
            ? 'Hexnode Subscription Manager'
            : 'Hexnode Helpdesk Technician';

          const isGlobal = a.details?.scope === 'Full tenant' || a.name.includes('Global');

          defaultMappings[a.id] = {
            technicianProfile: targetProfileName,
            assignedRole: assignedRoleName,
            targetRole: assignedRoleName,
            scopeType: isGlobal ? 'global' : 'local',
            adminScope: isGlobal ? 'full' : 'scoped',
            scopedOUs: !isGlobal
              ? [a.details?.scope || 'Sales & Support OU', 'APAC Branch OU']
              : [],
            scopedGroups: !isGlobal
              ? ['IT Tier 1 Support', 'Regional Technicians']
              : [],
            assignedUsers: a.usersCount || 1,
            technicians: [
              'david.miller@corp.com',
              'sarah.jenkins@corp.com',
              'alex.chen@corp.com'
            ].slice(0, Math.min(a.usersCount || 1, 3)),
            genieMappedFields: ['technicianProfile', 'assignedRole', 'scopeType']
          };
        }
      });

      // Generate validation findings
      const findings: ValidationFinding[] = [];
      if (category === 'apps') {
        findings.push(
          {
            id: 'f1',
            severity: 'warning',
            title: 'Workday: Entity ID conflict detected',
            description: 'Existing Workday connection found in tenant. Hexnode IdP will automatically apply unique slug alias workday-meridian-v2.',
            actionLabel: 'Review mapping',
            assetId: assets.find((a) => a.name === 'Workday')?.id
          },
          {
            id: 'f2',
            severity: 'info',
            title: 'Legacy Portal excluded from migration plan',
            description: 'Legacy Portal does not provide a valid ACS endpoint URL and has been excluded from write execution.',
            actionLabel: 'Inspect asset',
            assetId: assets.find((a) => a.name.includes('Legacy'))?.id
          },
          {
            id: 'f3',
            severity: 'info',
            title: '11 SAML applications require manual certificate upload in SP portal',
            description: 'After migration, copy the Hexnode IdP metadata and download the signing certificate to configure each Service Provider.'
          }
        );
      } else if (category === 'policies') {
        findings.push(
          {
            id: 'f_p1',
            severity: 'warning',
            title: 'Contractor Access Policy: Time condition translation',
            description: 'Outside business hours rule will enforce using Hexnode IdP tenant default timezone (UTC-08:00).',
            actionLabel: 'Review rule',
            assetId: assets.find((a) => a.name.includes('Contractor'))?.id
          },
          {
            id: 'f_p2',
            severity: 'info',
            title: 'Legacy Password Policy imported in Report-only mode',
            description: 'Will log compliance audits for APAC OU users without enforcing immediate password resets.'
          }
        );
      } else {
        findings.push(
          {
            id: 'f_r1',
            severity: 'warning',
            title: 'Billing Admin: Restricted privilege mapping',
            description: 'In Meridian ID this role had app view permissions. In Hexnode IdP, Subscription Manager restricts access strictly to licensing.',
            actionLabel: 'Review role mapping',
            assetId: assets.find((a) => a.name.includes('Billing'))?.id
          },
          {
            id: 'f_r2',
            severity: 'info',
            title: '41 user assignments mapped without privilege escalation',
            description: 'All technician assignees match existing synced directory users.'
          }
        );
      }

      onUpdateState(category, {
        status: 'needs_configuration',
        discoveredAssets: assets,
        selectedAssetIds: eligibleIds,
        mappings: defaultMappings,
        validationFindings: findings,
        validationFresh: true,
        lastUpdated: 'Just now'
      });

      setIsDiscovering(false);
      if (isRescan) {
        showToast(`Rescan completed: ${assets.length} ${categoryMeta.title} identified`);
      }
    }, 450);
  };

  // Requirement: Automatic discovery when opening an asset category if not yet scanned
  useEffect(() => {
    if (state.discoveredAssets.length === 0 && !isDiscovering) {
      runDiscoveryScan(false);
    }
  }, [category]);

  // Keep selectedAssetId initialized to first eligible asset
  useEffect(() => {
    if (!selectedAssetId && state.discoveredAssets.length > 0) {
      const firstEligible =
        state.discoveredAssets.find((a) => state.selectedAssetIds.includes(a.id)) ||
        state.discoveredAssets[0];
      if (firstEligible) {
        setSelectedAssetId(firstEligible.id);
      }
    }
  }, [state.discoveredAssets, state.selectedAssetIds, selectedAssetId]);

  // Helper: Save & Exit
  const handleSaveAndExit = () => {
    let nextStatus = state.status;
    if (state.discoveredAssets.length > 0) {
      if (currentStep >= 3) {
        nextStatus = state.status === 'verified' ? 'verified' : 'ready_to_migrate';
      } else {
        nextStatus = 'needs_configuration';
      }
    }
    onUpdateState(category, {
      status: nextStatus,
      currentStep,
      lastUpdated: 'Just now'
    });
    showToast(`Draft saved for ${categoryMeta.title}`);
    onBackToDashboard();
  };

  // Selection toggle
  const toggleAssetSelected = (id: string) => {
    const asset = state.discoveredAssets.find((a) => a.id === id);
    if (asset?.supportLevel === 'unsupported') return;

    const isSelected = state.selectedAssetIds.includes(id);
    const newSelected = isSelected
      ? state.selectedAssetIds.filter((item) => item !== id)
      : [...state.selectedAssetIds, id];

    onUpdateState(category, {
      selectedAssetIds: newSelected,
      validationFresh: false
    });
  };

  const handleSelectAllEligible = () => {
    const eligible = state.discoveredAssets
      .filter((a) => a.supportLevel !== 'unsupported')
      .map((a) => a.id);
    const allSelected = eligible.every((id) => state.selectedAssetIds.includes(id));
    onUpdateState(category, {
      selectedAssetIds: allSelected ? [] : eligible,
      validationFresh: false
    });
  };

  // Simulation of Combined Migration & Verification Execution (Step 4)
  const handleStartMigration = () => {
    setIsMigrating(true);
    goToStep(4);

    const eligibleAssets = state.discoveredAssets.filter((a) =>
      state.selectedAssetIds.includes(a.id)
    );
    const total = eligibleAssets.length;

    onUpdateState(category, {
      status: 'in_progress',
      migrationJob: {
        total,
        completed: 0,
        inProgress: 1,
        failed: 0,
        skipped: state.discoveredAssets.length - total,
        running: true,
        finished: false,
        currentOperation: `Initializing ${categoryMeta.title} migration & verification engine...`,
        assetResults: {}
      }
    });

    const duration = 2400;
    const start = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      const completed = Math.floor(pct * total);
      const currentAsset = eligibleAssets[Math.min(completed, total - 1)];

      if (pct < 1) {
        onUpdateState(category, {
          migrationJob: {
            total,
            completed,
            inProgress: total - completed,
            failed: 0,
            skipped: state.discoveredAssets.length - total,
            running: true,
            finished: false,
            currentOperation: `Migrating & Verifying: ${currentAsset?.name} (${currentAsset?.type})...`,
            assetResults: {}
          }
        });
      } else {
        clearInterval(interval);
        setIsMigrating(false);

        // Populate asset outcomes
        const assetResults: Record<string, any> = {};
        const verificationResults: Record<string, any> = {};

        eligibleAssets.forEach((a, idx) => {
          const isManual =
            category === 'apps' && (a.name === 'Salesforce' || a.name === 'Workday');
          const isPolicyManual =
            category === 'policies' && a.name.includes('Contractor');

          assetResults[a.id] = {
            status: 'completed',
            targetId: `hx_${category}_${idx + 101}`,
            error: undefined
          };

          verificationResults[a.id] = {
            verified: !isManual && !isPolicyManual,
            status: isManual || isPolicyManual ? 'Manual Action Required' : 'Verified',
            notes: isManual
              ? 'Hexnode IdP entity registered. Upload signing certificate and SSO URL to Service Provider portal.'
              : isPolicyManual
              ? 'Policy rule configured. Confirm operating business hours under Settings > Time Zones.'
              : 'Target configuration matches approved migration plan and passes verification checks.',
            manualAction: isManual
              ? 'Download X.509 Certificate and copy SSO Endpoint to Salesforce / Workday Admin Console'
              : undefined
          };
        });

        const hasManualActions = Object.values(verificationResults).some(
          (v: any) => v.status === 'Manual Action Required'
        );

        onUpdateState(category, {
          status: hasManualActions ? 'verification_required' : 'verified',
          migrationJob: {
            total,
            completed: total,
            inProgress: 0,
            failed: 0,
            skipped: state.discoveredAssets.length - total,
            running: false,
            finished: true,
            currentOperation: 'Execution and automated verification complete.',
            assetResults
          },
          verificationResults,
          lastUpdated: 'Just now'
        });

        showToast(`Migration & verification completed for ${total} assets`);
      }
    }, 180);
  };

  // Compute counts
  const eligibleAssets = state.discoveredAssets.filter((a) => a.supportLevel !== 'unsupported');
  const selectedCount = state.selectedAssetIds.length;
  const isAllEligibleSelected =
    eligibleAssets.length > 0 && eligibleAssets.every((a) => state.selectedAssetIds.includes(a.id));

  // Current active asset in Step 2 workspace
  const activeAssetsList = state.discoveredAssets.filter((a) => state.selectedAssetIds.includes(a.id));
  const activeAssetIndex = activeAssetsList.findIndex((a) => a.id === selectedAssetId);
  const activeAsset = activeAssetsList[activeAssetIndex] || activeAssetsList[0] || state.discoveredAssets[0];
  const activeMapping = activeAsset ? (state.mappings[activeAsset.id] || {}) : {};

  // Filtered assets for left navigation panel
  const filteredAssetsInPanel = activeAssetsList.filter((a) => {
    const matchesQuery =
      a.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      a.type.toLowerCase().includes(assetSearchQuery.toLowerCase());
    if (assetFilterStatus === 'needs_attention') {
      return matchesQuery && (a.name === 'Workday' || a.name.includes('Contractor') || a.supportLevel === 'needs_review');
    }
    if (assetFilterStatus === 'mapped') {
      return matchesQuery && !!state.mappings[a.id];
    }
    return matchesQuery;
  });

  // Active Mapping Updater
  const updateActiveMapping = (updates: Record<string, any>) => {
    if (!activeAsset) return;
    const current = state.mappings[activeAsset.id] || {};
    const next = { ...current, ...updates };
    onUpdateState(category, {
      mappings: {
        ...state.mappings,
        [activeAsset.id]: next
      },
      validationFresh: false
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    setHasUnsavedChanges(false);
    showToast(`Changes saved for ${activeAsset?.name || 'asset'}`);
  };

  const handleResetAsset = () => {
    if (!activeAsset) return;
    const slug = activeAsset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-)$/g, '');
    let defaultObj: Record<string, any> = {};

    if (category === 'apps') {
      const isOidc = activeAsset.protocol === 'OIDC' || activeAsset.type === 'OIDC';
      if (isOidc) {
        defaultObj = {
          protocol: 'OIDC',
          targetName: activeAsset.name,
          appType: 'web',
          clientAuth: 'client_secret_post',
          pkceEnforced: true,
          redirectUris: [
            `https://${slug}.com/oauth/callback`,
            `https://${slug}.com/signin-oidc`
          ],
          logoutUris: [`https://${slug}.com/logout/callback`],
          allowedScopes: ['openid', 'profile', 'email', 'groups'],
          grantTypes: ['authorization_code', 'refresh_token'],
          assignmentScopeType: 'source_preserved',
          assignedGroups: ['Engineering', 'Product Management', 'Design'],
          tokenClaims: [
            { source: 'sub', target: 'sub', isStandard: true },
            { source: 'email', target: 'email', isStandard: true },
            { source: 'name', target: 'name', isStandard: true },
            { source: 'roles', target: 'roles', isStandard: true }
          ],
          genieMappedFields: ['redirectUris', 'logoutUris', 'allowedScopes', 'tokenClaims']
        };
      } else {
        defaultObj = {
          protocol: 'SAML 2.0',
          targetName: activeAsset.name,
          entityId:
            activeAsset.name === 'Workday'
              ? 'https://idp.hexnode.com/saml/workday-meridian-v2/metadata'
              : `https://idp.hexnode.com/saml/${slug}/metadata`,
          ssoUrl: `https://idp.hexnode.com/saml/${slug}/sso`,
          sloUrl: `https://idp.hexnode.com/saml/${slug}/slo`,
          nameIdClaim: 'emailAddress',
          signingAlg: 'SHA-256',
          signResponse: true,
          signAssertion: true,
          encryptAssertion: false,
          assignmentScopeType: 'source_preserved',
          assignedGroups: ['Engineering', 'Sales', 'Product Management'],
          attributeClaims: [
            { source: 'mail', target: 'email', isStandard: true },
            { source: 'displayName', target: 'name', isStandard: true },
            { source: 'department', target: 'department', isStandard: true },
            { source: 'memberOf', target: 'groups', isStandard: true }
          ],
          genieMappedFields: ['entityId', 'ssoUrl', 'signingAlg', 'attributeClaims']
        };
      }
    } else if (category === 'policies') {
      const isCA =
        activeAsset.type === 'Conditional Access' ||
        activeAsset.name.includes('Access') ||
        activeAsset.name.includes('Contractor');

      if (isCA) {
        defaultObj = {
          isConditionalAccess: true,
          targetName: activeAsset.name,
          targetEnforcement: activeAsset.status === 'Report-only' ? 'Report-only' : 'Enforced',
          platforms: ['macOS', 'Windows', 'iOS', 'Android'],
          ipConditions: 'Trusted Corporate CIDRs (10.0.0.0/8)',
          timeSchedule: activeAsset.name.includes('Contractor')
            ? 'Outside Business Hours (09:00 - 18:00 UTC-08:00)'
            : 'Anytime',
          requireCompliantDevice: true,
          grantAction: activeAsset.name.includes('Contractor')
            ? 'Block access'
            : 'Require step-up MFA',
          allowedFactors: ['Hexnode Authenticator App', 'FIDO2 Security Key', 'SMS OTP'],
          sessionTimeout: '30 mins',
          persistentSession: false,
          assignmentScopeType: activeAsset.name.includes('Contractor') ? 'groups' : 'ou',
          assignedTarget: activeAsset.name.includes('Contractor') ? 'Contractors Group' : 'Executive OU',
          excludedGroups: ['Break-glass Emergency Admins'],
          genieMappedFields: ['ipConditions', 'timeSchedule', 'grantAction', 'allowedFactors']
        };
      } else {
        const isMfa = activeAsset.type === 'MFA' || activeAsset.name.includes('MFA');
        const isSession = activeAsset.type === 'Session' || activeAsset.name.includes('Session');
        if (isMfa) {
          defaultObj = {
            isConditionalAccess: false,
            policyType: 'MFA',
            targetName: activeAsset.name,
            targetEnforcement: 'Enforced',
            allowedFactors: ['Authenticator App (TOTP)', 'Push Notification', 'FIDO2 / WebAuthn', 'SMS OTP'],
            gracePeriodDays: 7,
            rememberDeviceDays: 30,
            assignmentScopeType: 'all',
            assignedTarget: 'All Users',
            excludedGroups: ['Break-glass Emergency Admins'],
            genieMappedFields: ['allowedFactors', 'gracePeriodDays']
          };
        } else if (isSession) {
          defaultObj = {
            isConditionalAccess: false,
            policyType: 'Session',
            targetName: activeAsset.name,
            targetEnforcement: 'Enforced',
            idleTimeout: '30 mins',
            maxSession: '12 hours',
            maxConcurrent: 3,
            assignmentScopeType: 'all',
            assignedTarget: 'All Users',
            excludedGroups: [],
            genieMappedFields: ['idleTimeout', 'maxSession']
          };
        } else {
          defaultObj = {
            isConditionalAccess: false,
            policyType: 'Password',
            targetName: activeAsset.name,
            targetEnforcement: activeAsset.status === 'Report-only' ? 'Report-only' : 'Enforced',
            minLength: activeAsset.name.includes('Legacy') ? 8 : 12,
            requireUpper: true,
            requireLower: true,
            requireNumber: true,
            requireSymbol: !activeAsset.name.includes('Legacy'),
            maxAgeDays: activeAsset.name.includes('Legacy') ? 180 : 90,
            historyCount: activeAsset.name.includes('Legacy') ? 2 : 5,
            assignmentScopeType: activeAsset.name.includes('Legacy') ? 'ou' : 'all',
            assignedTarget: activeAsset.name.includes('Legacy') ? 'APAC OU' : 'All Users',
            excludedGroups: [],
            genieMappedFields: ['minLength', 'maxAgeDays', 'historyCount']
          };
        }
      }
    } else {
      const targetProfileName = activeAsset.name.includes('Global')
        ? 'Super Admin Profile'
        : activeAsset.name.includes('Helpdesk')
        ? 'Helpdesk Technician Profile'
        : activeAsset.name.includes('Device')
        ? 'Device Administrator Profile'
        : activeAsset.name.includes('Auditor')
        ? 'Reports & Audit Profile'
        : activeAsset.name.includes('App')
        ? 'Application Administrator Profile'
        : activeAsset.name.includes('Security')
        ? 'Security Operations Profile'
        : activeAsset.name.includes('Billing')
        ? 'Subscription & Billing Profile'
        : `${activeAsset.name} Profile`;

      const assignedRoleName = activeAsset.name.includes('Global')
        ? 'Hexnode Super Admin'
        : activeAsset.name.includes('Helpdesk')
        ? 'Hexnode Helpdesk Technician'
        : activeAsset.name.includes('Device')
        ? 'Hexnode Device Admin'
        : activeAsset.name.includes('Auditor')
        ? 'Hexnode Reports & Audit Viewer'
        : activeAsset.name.includes('App')
        ? 'Hexnode Application Admin'
        : activeAsset.name.includes('Security')
        ? 'Hexnode Security Administrator'
        : activeAsset.name.includes('Billing')
        ? 'Hexnode Subscription Manager'
        : 'Hexnode Helpdesk Technician';

      const isGlobal = activeAsset.details?.scope === 'Full tenant' || activeAsset.name.includes('Global');

      defaultObj = {
        technicianProfile: targetProfileName,
        assignedRole: assignedRoleName,
        targetRole: assignedRoleName,
        scopeType: isGlobal ? 'global' : 'local',
        adminScope: isGlobal ? 'full' : 'scoped',
        scopedOUs: !isGlobal
          ? [activeAsset.details?.scope || 'Sales & Support OU', 'APAC Branch OU']
          : [],
        scopedGroups: !isGlobal
          ? ['IT Tier 1 Support', 'Regional Technicians']
          : [],
        assignedUsers: activeAsset.usersCount || 1,
        technicians: [
          'david.miller@corp.com',
          'sarah.jenkins@corp.com',
          'alex.chen@corp.com'
        ].slice(0, Math.min(activeAsset.usersCount || 1, 3)),
        genieMappedFields: ['technicianProfile', 'assignedRole', 'scopeType']
      };
    }

    onUpdateState(category, {
      mappings: {
        ...state.mappings,
        [activeAsset.id]: defaultObj
      },
      validationFresh: false
    });
    setHasUnsavedChanges(false);
    showToast(`Reset ${activeAsset.name} to recommended defaults`);
  };

  // Helper to add custom attribute claim mapping row
  const handleAddAttributeClaim = () => {
    if (!newSourceAttr.trim() || !newTargetClaim.trim() || !activeAsset) return;
    const currentClaims = activeMapping.attributeClaims || [];
    const updatedClaims = [
      ...currentClaims,
      { source: newSourceAttr.trim(), target: newTargetClaim.trim(), isStandard: false }
    ];
    updateActiveMapping({ attributeClaims: updatedClaims });
    setNewSourceAttr('');
    setNewTargetClaim('');
    showToast(`Added claim: ${newSourceAttr.trim()} → ${newTargetClaim.trim()}`);
  };

  const handleRemoveAttributeClaim = (index: number) => {
    if (!activeAsset) return;
    const currentClaims = activeMapping.attributeClaims || [];
    const updatedClaims = currentClaims.filter((_: any, idx: number) => idx !== index);
    updateActiveMapping({ attributeClaims: updatedClaims });
  };

  // Helper for OIDC Token Claims
  const handleAddOidcClaim = () => {
    if (!newOidcClaimSource.trim() || !newOidcClaimTarget.trim() || !activeAsset) return;
    const currentClaims = activeMapping.tokenClaims || [];
    const updatedClaims = [
      ...currentClaims,
      { source: newOidcClaimSource.trim(), target: newOidcClaimTarget.trim(), isStandard: false }
    ];
    updateActiveMapping({ tokenClaims: updatedClaims });
    setNewOidcClaimSource('');
    setNewOidcClaimTarget('');
    showToast(`Added token claim: ${newOidcClaimSource.trim()} → ${newOidcClaimTarget.trim()}`);
  };

  const handleRemoveOidcClaim = (index: number) => {
    if (!activeAsset) return;
    const currentClaims = activeMapping.tokenClaims || [];
    const updatedClaims = currentClaims.filter((_: any, idx: number) => idx !== index);
    updateActiveMapping({ tokenClaims: updatedClaims });
  };

  // Helper for OIDC Redirect URIs
  const handleAddRedirectUri = () => {
    if (!newRedirectUri.trim() || !activeAsset) return;
    const uris = activeMapping.redirectUris || [];
    if (!uris.includes(newRedirectUri.trim())) {
      updateActiveMapping({ redirectUris: [...uris, newRedirectUri.trim()] });
      showToast(`Added redirect URI: ${newRedirectUri.trim()}`);
    }
    setNewRedirectUri('');
  };

  const handleRemoveRedirectUri = (uri: string) => {
    if (!activeAsset) return;
    const uris = (activeMapping.redirectUris || []).filter((u: string) => u !== uri);
    updateActiveMapping({ redirectUris: uris });
  };

  // Helper for OIDC Logout URIs
  const handleAddLogoutUri = () => {
    if (!newLogoutUri.trim() || !activeAsset) return;
    const uris = activeMapping.logoutUris || [];
    if (!uris.includes(newLogoutUri.trim())) {
      updateActiveMapping({ logoutUris: [...uris, newLogoutUri.trim()] });
      showToast(`Added logout URI: ${newLogoutUri.trim()}`);
    }
    setNewLogoutUri('');
  };

  const handleRemoveLogoutUri = (uri: string) => {
    if (!activeAsset) return;
    const uris = (activeMapping.logoutUris || []).filter((u: string) => u !== uri);
    updateActiveMapping({ logoutUris: uris });
  };

  // Helper for OIDC Scopes
  const handleToggleScope = (scope: string) => {
    if (!activeAsset) return;
    const current = activeMapping.allowedScopes || ['openid', 'profile', 'email'];
    const updated = current.includes(scope)
      ? current.filter((s: string) => s !== scope)
      : [...current, scope];
    updateActiveMapping({ allowedScopes: updated });
  };

  // Helper for OIDC Grant Types
  const handleToggleGrantType = (grant: string) => {
    if (!activeAsset) return;
    const current = activeMapping.grantTypes || ['authorization_code'];
    const updated = current.includes(grant)
      ? current.filter((g: string) => g !== grant)
      : [...current, grant];
    updateActiveMapping({ grantTypes: updated });
  };

  // Helper to add group tag to assignment scope
  const handleAddGroupTag = (groupName?: string) => {
    const grp = (groupName || newGroupInput).trim();
    if (!grp || !activeAsset) return;
    const currentGroups = activeMapping.assignedGroups || [];
    if (!currentGroups.includes(grp)) {
      updateActiveMapping({ assignedGroups: [...currentGroups, grp] });
      showToast(`Added group scope: ${grp}`);
    }
    setNewGroupInput('');
  };

  const handleRemoveGroupTag = (grp: string) => {
    if (!activeAsset) return;
    const currentGroups = activeMapping.assignedGroups || [];
    updateActiveMapping({ assignedGroups: currentGroups.filter((g: string) => g !== grp) });
    showToast(`Removed group scope: ${grp}`);
  };

  // Helper for Technician Management
  // Helper for Technician Management (Profile Assignments)
  const handleAddTechnician = (emailToAdd?: string, nameToAdd?: string) => {
    const email = (emailToAdd || newTechEmail).trim();
    if (!email || !activeAsset) return;
    const currentTechs = activeMapping.technicians || [];
    if (!currentTechs.includes(email)) {
      const updated = [...currentTechs, email];
      updateActiveMapping({
        technicians: updated,
        assignedUsers: updated.length
      });
      showToast(`Assigned technician: ${email}`);
    }
    setNewTechEmail('');
    setNewTechName('');
  };

  const handleRemoveTechnician = (tech: string) => {
    if (!activeAsset) return;
    const currentTechs = activeMapping.technicians || [];
    const updated = currentTechs.filter((t: string) => t !== tech);
    updateActiveMapping({
      technicians: updated,
      assignedUsers: updated.length
    });
    showToast(`Removed technician: ${tech}`);
  };

  // Helper for Scoped OUs in Roles (Local Scope)
  const handleAddScopedOU = (ouToAdd?: string) => {
    const ou = (ouToAdd || newScopedOU).trim();
    if (!ou || !activeAsset) return;
    const currentOUs = activeMapping.scopedOUs || [];
    if (!currentOUs.includes(ou)) {
      updateActiveMapping({ scopedOUs: [...currentOUs, ou] });
      showToast(`Added scoped OU: ${ou}`);
    }
    setNewScopedOU('');
  };

  const handleRemoveScopedOU = (ou: string) => {
    if (!activeAsset) return;
    const currentOUs = activeMapping.scopedOUs || [];
    updateActiveMapping({ scopedOUs: currentOUs.filter((o: string) => o !== ou) });
  };

  // Helper for Scoped Groups in Roles (Local Scope)
  const handleAddScopedGroup = (grpToAdd?: string) => {
    const grp = (grpToAdd || newScopedGroup).trim();
    if (!grp || !activeAsset) return;
    const currentGroups = activeMapping.scopedGroups || [];
    if (!currentGroups.includes(grp)) {
      updateActiveMapping({ scopedGroups: [...currentGroups, grp] });
      showToast(`Added scoped group: ${grp}`);
    }
    setNewScopedGroup('');
  };

  const handleRemoveScopedGroup = (grp: string) => {
    if (!activeAsset) return;
    const currentGroups = activeMapping.scopedGroups || [];
    updateActiveMapping({ scopedGroups: currentGroups.filter((g: string) => g !== grp) });
  };

  // Helper for Custom Assignments (Applications & Policies)
  const handleAddCustomUser = (userToAdd?: { name: string; email: string; title?: string }) => {
    if (!activeAsset) return;
    const email = (userToAdd?.email || newAssignUserEmail).trim();
    const name = (userToAdd?.name || newAssignUserName).trim() || email.split('@')[0];
    if (!email) return;

    const currentCustom = activeMapping.customAssignments || { users: [], groups: [], ous: [] };
    const currentUsers = currentCustom.users || [];
    if (!currentUsers.some((u: any) => u.email?.toLowerCase() === email.toLowerCase())) {
      const updated = {
        ...currentCustom,
        users: [...currentUsers, { name, email, title: userToAdd?.title || 'Assigned User' }]
      };
      updateActiveMapping({ customAssignments: updated });
      showToast(`Assigned user: ${name}`);
    }
    setNewAssignUserEmail('');
    setNewAssignUserName('');
  };

  const handleRemoveCustomUser = (email: string) => {
    if (!activeAsset) return;
    const currentCustom = activeMapping.customAssignments || { users: [], groups: [], ous: [] };
    const updatedUsers = (currentCustom.users || []).filter((u: any) => u.email !== email);
    updateActiveMapping({
      customAssignments: {
        ...currentCustom,
        users: updatedUsers
      }
    });
    showToast(`Removed user assignment: ${email}`);
  };

  const handleAddCustomGroup = (grpToAdd?: string) => {
    const grp = (grpToAdd || newAssignGroup).trim();
    if (!grp || !activeAsset) return;
    const currentCustom = activeMapping.customAssignments || { users: [], groups: [], ous: [] };
    const currentGroups = currentCustom.groups || [];
    if (!currentGroups.includes(grp)) {
      const updated = {
        ...currentCustom,
        groups: [...currentGroups, grp]
      };
      updateActiveMapping({ customAssignments: updated });
      showToast(`Assigned group: ${grp}`);
    }
    setNewAssignGroup('');
  };

  const handleRemoveCustomGroup = (grp: string) => {
    if (!activeAsset) return;
    const currentCustom = activeMapping.customAssignments || { users: [], groups: [], ous: [] };
    updateActiveMapping({
      customAssignments: {
        ...currentCustom,
        groups: (currentCustom.groups || []).filter((g: string) => g !== grp)
      }
    });
    showToast(`Removed group assignment: ${grp}`);
  };

  const handleAddCustomOU = (ouToAdd?: string) => {
    const ou = (ouToAdd || newAssignOU).trim();
    if (!ou || !activeAsset) return;
    const currentCustom = activeMapping.customAssignments || { users: [], groups: [], ous: [] };
    const currentOUs = currentCustom.ous || [];
    if (!currentOUs.includes(ou)) {
      const updated = {
        ...currentCustom,
        ous: [...currentOUs, ou]
      };
      updateActiveMapping({ customAssignments: updated });
      showToast(`Assigned OU: ${ou}`);
    }
    setNewAssignOU('');
  };

  const handleRemoveCustomOU = (ou: string) => {
    if (!activeAsset) return;
    const currentCustom = activeMapping.customAssignments || { users: [], groups: [], ous: [] };
    updateActiveMapping({
      customAssignments: {
        ...currentCustom,
        ous: (currentCustom.ous || []).filter((o: string) => o !== ou)
      }
    });
    showToast(`Removed OU assignment: ${ou}`);
  };

  // Helper for Excluded Groups in Policies
  const handleAddExcludedGroup = () => {
    if (!newExcludedGroup.trim() || !activeAsset) return;
    const current = activeMapping.excludedGroups || [];
    if (!current.includes(newExcludedGroup.trim())) {
      updateActiveMapping({ excludedGroups: [...current, newExcludedGroup.trim()] });
    }
    setNewExcludedGroup('');
  };

  const handleRemoveExcludedGroup = (grp: string) => {
    if (!activeAsset) return;
    const current = activeMapping.excludedGroups || [];
    updateActiveMapping({ excludedGroups: current.filter((g: string) => g !== grp) });
  };

  return (
    <section className="screen active" style={{ width: '100%' }}>
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ marginBottom: '12px' }}>
        <a onClick={onBackToDashboard}>Custom Directory</a>
        <ChevronRightIcon size={12} />
        <a onClick={onBackToDashboard}>Meridian ID</a>
        <ChevronRightIcon size={12} />
        <span>Additional Asset Migration</span>
        <ChevronRightIcon size={12} />
        <strong>{categoryMeta.title}</strong>
      </div>

      {/* Top Header & Global Top Navigation Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          paddingBottom: '14px',
          borderBottom: '1px solid #E5E7EB',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              background: '#EFF6FF',
              color: categoryMeta.color,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {categoryMeta.icon}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {categoryMeta.title} Migration
              </h1>
              <span className="pill pill-info" style={{ fontSize: '11px', fontFamily: 'var(--mono)' }}>
                {categoryMeta.endpoint}
              </span>
              <span className="pill pill-muted" style={{ fontSize: '11px' }}>
                Source: Meridian ID
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Top Navigation Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => goToStep(currentStep - 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <ArrowLeftIcon size={13} /> Back
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleSaveAndExit}
          >
            Save &amp; Exit
          </button>

          {/* Contextual primary forward action at top */}
          {currentStep === 1 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={selectedCount === 0 || isDiscovering}
              onClick={() => goToStep(2)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              Configure Selected ({selectedCount}) <ArrowRightIcon size={13} />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onUpdateState(category, { validationFresh: true });
                goToStep(3);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              Save &amp; Continue to Review <ArrowRightIcon size={13} />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!approvalConfirmed || selectedCount === 0}
              onClick={handleStartMigration}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              Approve &amp; Start Migration <ArrowRightIcon size={13} />
            </button>
          )}

          {currentStep === 4 && state.migrationJob?.finished && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onBackToDashboard();
                showToast(`${categoryMeta.title} migration updated`);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Streamlined 4-Step Stepper Header */}
      <div className="stepper" style={{ marginBottom: '22px' }}>
        {[
          { num: 1, label: 'Discover & Review' },
          { num: 2, label: 'Configure & Map' },
          { num: 3, label: 'Review & Validate' },
          { num: 4, label: 'Migrate & Verify' }
        ].map((s, idx, arr) => {
          const isCurrent = currentStep === s.num;
          const isCompleted = currentStep > s.num;
          return (
            <React.Fragment key={s.num}>
              <div
                className={`step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                style={{ cursor: isCompleted ? 'pointer' : 'default' }}
                onClick={() => {
                  if (isCompleted) goToStep(s.num);
                }}
              >
                <div className="step-circle">
                  {isCompleted ? <CheckIcon size={12} /> : s.num}
                </div>
                <span>{s.label}</span>
              </div>
              {idx < arr.length - 1 && <div className="step-connector"></div>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Content Area Container */}
      <div className="wizard-card" style={{ minHeight: '480px', padding: currentStep === 2 ? '0' : '20px' }}>
        
        {/* ========================================================
            STEP 1: DISCOVER & REVIEW (Automatic Discovery + Rescan)
           ======================================================== */}
        {currentStep === 1 && (
          <div>
            {/* Clean, conveyable header without redundant subheadings */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Discovered Inventory
                </h2>
                <span className="pill pill-info" style={{ fontSize: '12px' }}>
                  {state.discoveredAssets.length} Discovered
                </span>
                <span className="pill pill-success" style={{ fontSize: '12px' }}>
                  {selectedCount} Selected
                </span>
              </div>

              {/* Action Controls: Rescan & Bulk Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleSelectAllEligible}
                  disabled={isDiscovering}
                >
                  {isAllEligibleSelected ? 'Deselect All' : 'Select All Eligible'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => runDiscoveryScan(true)}
                  disabled={isDiscovering}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshIcon size={13} />
                  {isDiscovering ? 'Scanning...' : 'Rescan Inventory'}
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            {isDiscovering ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #BFDBFE',
                    borderTopColor: '#1D4ED8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px'
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  Scanning {categoryMeta.title} from Meridian ID...
                </div>
              </div>
            ) : (
              <div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38px' }}>
                        <input
                          type="checkbox"
                          checked={isAllEligibleSelected}
                          onChange={handleSelectAllEligible}
                          aria-label="Select all eligible"
                        />
                      </th>
                      <th>Asset Name &amp; Source ID</th>
                      <th>Protocol / Type</th>
                      <th>Scope &amp; Assignees</th>
                      <th>Supportability</th>
                      <th>Detected Notices &amp; Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.discoveredAssets.map((asset, idx) => {
                      const isSelected = state.selectedAssetIds.includes(asset.id);
                      const isUnsupported = asset.supportLevel === 'unsupported';

                      return (
                        <tr
                          key={asset.id}
                          className={isSelected ? 'row-selected' : ''}
                          style={{ opacity: isUnsupported ? 0.75 : 1 }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isUnsupported}
                              onChange={() => toggleAssetSelected(asset.id)}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{asset.name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--mono)' }}>
                              {asset.sourceId}
                            </div>
                          </td>
                          <td>
                            <span className="pill pill-info">{asset.type}</span>
                          </td>
                          <td style={{ fontSize: '13px', color: '#4B5563' }}>
                            {category === 'apps' && `${asset.usersCount?.toLocaleString() || 0} users`}
                            {category === 'policies' && (asset.details?.appliesTo || 'All Users')}
                            {category === 'roles' && `${asset.usersCount || 0} users (${asset.details?.scope})`}
                          </td>
                          <td>
                            <span
                              className={`pill ${
                                asset.supportLevel === 'supported'
                                  ? 'pill-success'
                                  : asset.supportLevel === 'needs_review'
                                  ? 'pill-warning'
                                  : 'pill-danger'
                              }`}
                            >
                              {asset.supportLevel === 'supported'
                                ? 'Supported'
                                : asset.supportLevel === 'needs_review'
                                ? 'Review Needed'
                                : 'Unsupported'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12.5px', color: asset.issue ? '#B45309' : '#6B7280', maxWidth: '240px' }}>
                            {asset.issue || 'Ready for configuration mapping'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                if (onShowItemDetail) {
                                  onShowItemDetail(category, idx);
                                } else {
                                  showToast(`Inspecting ${asset.name}`);
                                }
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STEP 2: CONFIGURE & MAP (Two-Panel Layout with Embedded Inline Mapping)
           ======================================================== */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', minHeight: '580px', flexWrap: 'wrap' }}>
            {/* LEFT PANEL: Asset Navigator (Preserved 280px width, filters & item list) */}
            <div
              style={{
                width: '280px',
                minWidth: '260px',
                borderRight: '1px solid #E5E7EB',
                background: '#FAFAFA',
                padding: '16px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                  Assets to Configure
                </span>
                <span className="pill pill-info" style={{ fontSize: '11px' }}>
                  {activeAssetsList.length}
                </span>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '9px', top: '9px', color: '#9CA3AF' }}>
                  <SearchIcon size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Filter assets..."
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    fontSize: '12.5px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF'
                  }}
                />
              </div>

              {/* Quick Filter Segmented Pills */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setAssetFilterStatus('all')}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: assetFilterStatus === 'all' ? '#1D4ED8' : '#D1D5DB',
                    background: assetFilterStatus === 'all' ? '#EFF6FF' : '#FFFFFF',
                    color: assetFilterStatus === 'all' ? '#1D4ED8' : '#6B7280',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  All ({activeAssetsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssetFilterStatus('needs_attention')}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: assetFilterStatus === 'needs_attention' ? '#B45309' : '#D1D5DB',
                    background: assetFilterStatus === 'needs_attention' ? '#FEF3C7' : '#FFFFFF',
                    color: assetFilterStatus === 'needs_attention' ? '#B45309' : '#6B7280',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Notices
                </button>
                <button
                  type="button"
                  onClick={() => setAssetFilterStatus('mapped')}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: assetFilterStatus === 'mapped' ? '#15803D' : '#D1D5DB',
                    background: assetFilterStatus === 'mapped' ? '#DCFCE7' : '#FFFFFF',
                    color: assetFilterStatus === 'mapped' ? '#15803D' : '#6B7280',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Mapped
                </button>
              </div>

              {/* Asset List Items */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  overflowY: 'auto',
                  maxHeight: '520px',
                  paddingRight: '2px'
                }}
              >
                {filteredAssetsInPanel.map((asset, i) => {
                  const isActive = asset.id === activeAsset?.id;
                  const isReviewed = !!state.mappings[asset.id];
                  const hasConflict =
                    asset.name === 'Workday' ||
                    asset.name.includes('Contractor') ||
                    asset.name.includes('Billing');

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setSelectedAssetId(asset.id);
                        setHasUnsavedChanges(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isActive ? '#EFF6FF' : '#FFFFFF',
                        border: isActive ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
                        borderLeft: isActive ? '3px solid #1D4ED8' : '1px solid #E5E7EB',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? '#1D4ED8' : '#111827'
                          }}
                        >
                          {asset.name}
                        </span>
                        {hasConflict ? (
                          <span style={{ color: '#B45309' }} title="Notice / Translation rule applied">
                            <AlertIcon size={12} />
                          </span>
                        ) : isReviewed ? (
                          <span style={{ color: '#15803D' }} title="Configured">
                            <CheckIcon size={12} />
                          </span>
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11.5px',
                          color: '#6B7280'
                        }}
                      >
                        <span>
                          {category === 'roles' ? (
                            <>
                              <span style={{ fontWeight: 500, color: (state.mappings[asset.id]?.scopeType || 'global') === 'local' ? '#B45309' : '#1D4ED8' }}>
                                {(state.mappings[asset.id]?.scopeType || 'global') === 'local' ? 'Local' : 'Global'}
                              </span>
                              {' • '}
                              <span>{(state.mappings[asset.id]?.technicians || []).length} assigned</span>
                            </>
                          ) : (
                            asset.type
                          )}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)' }}>#{i + 1}</span>
                      </div>
                    </div>
                  );
                })}

                {filteredAssetsInPanel.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '12.5px' }}>
                    No matching assets found
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT WORKSPACE: Selected Asset Workspace */}
            <div style={{ flex: 1, minWidth: '340px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              {activeAsset ? (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Workspace Header with Asset Name, Quick Prev/Next Nav, and Save/Reset Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '14px',
                      marginBottom: '16px',
                      borderBottom: '1px solid #E5E7EB',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {activeAsset.name}
                      </h3>
                      <span className="pill pill-info">{activeAsset.type}</span>

                      {activeAsset.name === 'Workday' && (
                        <span className="pill pill-warning" style={{ fontSize: '11px' }}>
                          Slug Alias Auto-Generated
                        </span>
                      )}
                      {activeAsset.name.includes('Contractor') && (
                        <span className="pill pill-warning" style={{ fontSize: '11px' }}>
                          Schedule Translation Applied
                        </span>
                      )}
                      {activeAsset.name.includes('Billing') && (
                        <span className="pill pill-warning" style={{ fontSize: '11px' }}>
                          Scoped Privileges
                        </span>
                      )}

                      {hasUnsavedChanges && (
                        <span className="pill pill-warning" style={{ fontSize: '11px' }}>
                          ● Unsaved edits
                        </span>
                      )}
                    </div>

                    {/* Header Controls: Reset, Save, Prev / Next */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleResetAsset}
                        title="Reset this asset's settings to recommended defaults"
                      >
                        Reset Defaults
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveChanges}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckIcon size={12} /> Save
                      </button>

                      <div
                        style={{
                          height: '18px',
                          width: '1px',
                          background: '#E5E7EB',
                          margin: '0 4px'
                        }}
                      />

                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {activeAssetIndex + 1} / {activeAssetsList.length}
                      </span>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={activeAssetIndex <= 0}
                        onClick={() => {
                          if (activeAssetIndex > 0) {
                            setSelectedAssetId(activeAssetsList[activeAssetIndex - 1].id);
                            setHasUnsavedChanges(false);
                          }
                        }}
                        style={{ padding: '4px 8px' }}
                        title="Previous Asset"
                      >
                        <ArrowLeftIcon size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={activeAssetIndex >= activeAssetsList.length - 1}
                        onClick={() => {
                          if (activeAssetIndex < activeAssetsList.length - 1) {
                            setSelectedAssetId(activeAssetsList[activeAssetIndex + 1].id);
                            setHasUnsavedChanges(false);
                          }
                        }}
                        style={{ padding: '4px 8px' }}
                        title="Next Asset"
                      >
                        <ArrowRightIcon size={12} />
                      </button>
                    </div>
                  </div>

                  {/* ========================================================
                      WORKSPACE BODY: APPLICATIONS (Configuration | Assignments)
                     ======================================================== */}
                  {category === 'apps' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Only Two Primary Tabs */}
                      <div className="tabs" style={{ marginBottom: '16px' }}>
                        <button
                          type="button"
                          className={`tab ${appWorkspaceTab === 'configuration' ? 'active' : ''}`}
                          onClick={() => setAppWorkspaceTab('configuration')}
                        >
                          Configuration
                        </button>
                        <button
                          type="button"
                          className={`tab ${appWorkspaceTab === 'assignments' ? 'active' : ''}`}
                          onClick={() => setAppWorkspaceTab('assignments')}
                        >
                          Assignments
                        </button>
                      </div>

                      {/* SECTION 1: CONFIGURATION */}
                      {appWorkspaceTab === 'configuration' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Inline notice for Workday or SP Certificate */}
                          {activeAsset.name === 'Workday' && (
                            <div className="alert-banner alert-banner-warning">
                              <span className="alert-banner-icon">
                                <AlertIcon size={16} />
                              </span>
                              <div>
                                <strong>Entity ID Collision Resolved:</strong> An existing Workday connection exists in tenant. Hexnode Genie automatically assigned unique slug alias <code>workday-meridian-v2</code> to prevent conflict.
                              </div>
                            </div>
                          )}

                          {(activeAsset.name === 'Salesforce' || activeAsset.name === 'Workday') && (
                            <div className="alert-banner alert-banner-info">
                              <span className="alert-banner-icon">
                                <InfoCircleIcon size={16} />
                              </span>
                              <div>
                                <strong>Service Provider Certificate Setup Required:</strong> After migration, download Hexnode IdP signing certificate and update the Single Sign-On ACS endpoint in the {activeAsset.name} administrator console.
                              </div>
                            </div>
                          )}

                          {/* Protocol-Specific Branch: SAML 2.0 vs OIDC */}
                          {(activeAsset.protocol === 'OIDC' || activeAsset.type === 'OIDC') ? (
                            /* ===== OIDC APPLICATION FORM ===== */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Display Name */}
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                  Application Display Name <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <input
                                  className="input"
                                  style={{ fontSize: '12.5px', padding: '6px 10px' }}
                                  value={activeMapping.targetName || activeAsset.name}
                                  onChange={(e) => updateActiveMapping({ targetName: e.target.value })}
                                />
                                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'block' }}>
                                  Source in Meridian ID: <code>{activeAsset.name}</code> (OIDC Client)
                                </span>
                              </div>

                              {/* App Type & Client Auth */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                    Application Type
                                  </label>
                                  <select
                                    className="select"
                                    style={{ fontSize: '12px', padding: '6px 8px' }}
                                    value={activeMapping.appType || 'web'}
                                    onChange={(e) => updateActiveMapping({ appType: e.target.value })}
                                  >
                                    <option value="web">Web Application (Server-rendered / API)</option>
                                    <option value="spa">Single Page App (SPA / Browser-only)</option>
                                    <option value="native">Native / Mobile Client</option>
                                  </select>
                                </div>

                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                    Client Authentication
                                  </label>
                                  <select
                                    className="select"
                                    style={{ fontSize: '12px', padding: '6px 8px' }}
                                    value={activeMapping.clientAuth || 'client_secret_post'}
                                    onChange={(e) => updateActiveMapping({ clientAuth: e.target.value })}
                                  >
                                    <option value="client_secret_post">Client Secret (HTTP POST)</option>
                                    <option value="client_secret_basic">Client Secret (HTTP Basic)</option>
                                    <option value="pkce_only">PKCE Only (Public Client)</option>
                                  </select>
                                </div>
                              </div>

                              {/* PKCE Toggle */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #E5E7EB' }}>
                                <div>
                                  <span style={{ fontSize: '12.5px', color: '#111827', fontWeight: 500, display: 'block' }}>
                                    Enforce PKCE (Proof Key for Code Exchange)
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                    Requires SHA-256 code challenge on authorization code flow
                                  </span>
                                </div>
                                <label className="toggle">
                                  <input
                                    type="checkbox"
                                    checked={activeMapping.pkceEnforced !== false}
                                    onChange={(e) => updateActiveMapping({ pkceEnforced: e.target.checked })}
                                  />
                                  <span className="toggle-track" />
                                </label>
                              </div>

                              {/* Login Redirect URIs */}
                              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Login Redirect URIs <span style={{ color: '#DC2626' }}>*</span>
                                    <span
                                      className="pill"
                                      style={{
                                        background: '#F5F3FF',
                                        color: '#6D28D9',
                                        border: '1px solid #DDD6FE',
                                        fontSize: '10.5px',
                                        padding: '1px 7px',
                                        fontWeight: 500,
                                        borderRadius: '9999px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                    </span>
                                  </label>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                    Source: <code>{activeAsset.name.toLowerCase()}.com</code>
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
                                  {(activeMapping.redirectUris || [
                                    `https://${activeAsset.name.toLowerCase()}.com/oauth/callback`
                                  ]).map((uri: string) => (
                                    <div
                                      key={uri}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '4px 8px',
                                        background: '#F9FAFB',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '4px',
                                        fontSize: '11.5px',
                                        fontFamily: 'var(--mono)'
                                      }}
                                    >
                                      <span>{uri}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveRedirectUri(uri)}
                                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                                        title="Remove URI"
                                      >
                                        <TrashIcon size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add redirect URI (e.g. https://app.example.com/callback)"
                                    value={newRedirectUri}
                                    onChange={(e) => setNewRedirectUri(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddRedirectUri();
                                      }
                                    }}
                                    style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={handleAddRedirectUri}
                                    disabled={!newRedirectUri.trim()}
                                  >
                                    + Add URI
                                  </button>
                                </div>
                              </div>

                              {/* Allowed Scopes */}
                              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  Allowed Scopes
                                  <span
                                    className="pill"
                                    style={{
                                      background: '#F5F3FF',
                                      color: '#6D28D9',
                                      border: '1px solid #DDD6FE',
                                      fontSize: '10.5px',
                                      padding: '1px 7px',
                                      fontWeight: 500,
                                      borderRadius: '9999px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                  >
                                    <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                  </span>
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {['openid', 'profile', 'email', 'groups', 'offline_access'].map((scope) => {
                                    const isChecked = (activeMapping.allowedScopes || ['openid', 'profile', 'email']).includes(scope);
                                    return (
                                      <button
                                        key={scope}
                                        type="button"
                                        onClick={() => handleToggleScope(scope)}
                                        style={{
                                          fontSize: '11.5px',
                                          fontFamily: 'var(--mono)',
                                          padding: '3px 8px',
                                          borderRadius: '4px',
                                          border: `1px solid ${isChecked ? '#BFDBFE' : '#D1D5DB'}`,
                                          background: isChecked ? '#EFF6FF' : '#FFFFFF',
                                          color: isChecked ? '#1D4ED8' : '#6B7280',
                                          cursor: 'pointer',
                                          fontWeight: isChecked ? 600 : 400
                                        }}
                                      >
                                        {isChecked ? `✓ ${scope}` : scope}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Embedded Token Claims Mapping */}
                              <div
                                style={{
                                  borderTop: '1px solid #E5E7EB',
                                  paddingTop: '12px',
                                  background: '#FAFAFA',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  padding: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    OIDC ID Token Claims Mapping
                                    <span
                                      className="pill"
                                      style={{
                                        background: '#F5F3FF',
                                        color: '#6D28D9',
                                        border: '1px solid #DDD6FE',
                                        fontSize: '10.5px',
                                        padding: '1px 7px',
                                        fontWeight: 500,
                                        borderRadius: '9999px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                    </span>
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                    Standard &amp; Custom Claims
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                  {(activeMapping.tokenClaims || [
                                    { source: 'sub', target: 'sub', isStandard: true },
                                    { source: 'email', target: 'email', isStandard: true },
                                    { source: 'name', target: 'name', isStandard: true },
                                    { source: 'roles', target: 'roles', isStandard: true }
                                  ]).map((claim: any, idx: number) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11.5px'
                                      }}
                                    >
                                      <span style={{ fontFamily: 'var(--mono)', color: '#374151', minWidth: '120px' }}>
                                        {claim.source}
                                      </span>
                                      <span style={{ color: '#1D4ED8', fontWeight: 700 }}>→</span>
                                      <span style={{ fontFamily: 'var(--mono)', color: '#111827', fontWeight: 600, flex: 1 }}>
                                        {claim.target}
                                      </span>
                                      {claim.isStandard ? (
                                        <span className="pill pill-muted" style={{ fontSize: '9.5px' }}>
                                          Core Claim
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveOidcClaim(idx)}
                                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                                        >
                                          <TrashIcon size={11} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Source claim (e.g. upn)"
                                    value={newOidcClaimSource}
                                    onChange={(e) => setNewOidcClaimSource(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                  />
                                  <span style={{ color: '#9CA3AF', alignSelf: 'center' }}>→</span>
                                  <input
                                    type="text"
                                    placeholder="Target claim (e.g. preferred_username)"
                                    value={newOidcClaimTarget}
                                    onChange={(e) => setNewOidcClaimTarget(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={handleAddOidcClaim}
                                    disabled={!newOidcClaimSource.trim() || !newOidcClaimTarget.trim()}
                                  >
                                    + Add Claim
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ===== SAML 2.0 APPLICATION FORM ===== */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Display Name */}
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                  Application Display Name <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <input
                                  className="input"
                                  style={{ fontSize: '12.5px', padding: '6px 10px' }}
                                  value={activeMapping.targetName || activeAsset.name}
                                  onChange={(e) => updateActiveMapping({ targetName: e.target.value })}
                                />
                                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'block' }}>
                                  Source in Meridian ID: <code>{activeAsset.name}</code> (SAML 2.0 Service Provider)
                                </span>
                              </div>

                              {/* Entity ID / Issuer */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Target Entity ID / Issuer <span style={{ color: '#DC2626' }}>*</span>
                                    <span
                                      className="pill"
                                      style={{
                                        background: '#F5F3FF',
                                        color: '#6D28D9',
                                        border: '1px solid #DDD6FE',
                                        fontSize: '10.5px',
                                        padding: '1px 7px',
                                        fontWeight: 500,
                                        borderRadius: '9999px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                    </span>
                                  </label>
                                  <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--mono)' }}>
                                    Source: https://meridianid.com/saml/{activeAsset.name.toLowerCase()}/metadata
                                  </span>
                                </div>
                                <input
                                  className="input mono"
                                  style={{ fontSize: '12px', padding: '6px 10px' }}
                                  value={activeMapping.entityId || `https://idp.hexnode.com/saml/${activeAsset.name.toLowerCase()}/metadata`}
                                  onChange={(e) => updateActiveMapping({ entityId: e.target.value })}
                                />
                              </div>

                              {/* Single Sign-On (ACS) URL */}
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                  Single Sign-On (ACS) URL <span style={{ color: '#DC2626' }}>*</span>
                                  <span
                                    className="pill"
                                    style={{
                                      background: '#F5F3FF',
                                      color: '#6D28D9',
                                      border: '1px solid #DDD6FE',
                                      fontSize: '10.5px',
                                      padding: '1px 7px',
                                      fontWeight: 500,
                                      borderRadius: '9999px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                  >
                                    <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                  </span>
                                </label>
                                <input
                                  className="input mono"
                                  style={{ fontSize: '12px', padding: '6px 10px' }}
                                  value={activeMapping.ssoUrl || `https://idp.hexnode.com/saml/${activeAsset.name.toLowerCase()}/sso`}
                                  onChange={(e) => updateActiveMapping({ ssoUrl: e.target.value })}
                                />
                              </div>

                              {/* NameID Claim & Signing Algorithm */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                    NameID Claim Format
                                  </label>
                                  <select
                                    className="select"
                                    style={{ fontSize: '12px', padding: '6px 8px' }}
                                    value={activeMapping.nameIdClaim || 'emailAddress'}
                                    onChange={(e) => updateActiveMapping({ nameIdClaim: e.target.value })}
                                  >
                                    <option value="emailAddress">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</option>
                                    <option value="persistent">urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</option>
                                    <option value="unspecified">urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified</option>
                                    <option value="transient">urn:oasis:names:tc:SAML:2.0:nameid-format:transient</option>
                                  </select>
                                </div>

                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                    Signing Algorithm
                                  </label>
                                  <select
                                    className="select"
                                    style={{ fontSize: '12px', padding: '6px 8px' }}
                                    value={activeMapping.signingAlg || 'SHA-256'}
                                    onChange={(e) => updateActiveMapping({ signingAlg: e.target.value })}
                                  >
                                    <option value="SHA-256">SHA-256 (Recommended &amp; Default)</option>
                                    <option value="SHA-1">SHA-1 (Legacy SP compatibility)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Security Toggles */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12.5px', color: '#374151' }}>Sign SAML Assertion</span>
                                  <label className="toggle">
                                    <input
                                      type="checkbox"
                                      checked={activeMapping.signAssertion !== false}
                                      onChange={(e) => updateActiveMapping({ signAssertion: e.target.checked })}
                                    />
                                    <span className="toggle-track" />
                                  </label>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12.5px', color: '#374151' }}>Sign SAML Response</span>
                                  <label className="toggle">
                                    <input
                                      type="checkbox"
                                      checked={activeMapping.signResponse !== false}
                                      onChange={(e) => updateActiveMapping({ signResponse: e.target.checked })}
                                    />
                                    <span className="toggle-track" />
                                  </label>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12.5px', color: '#374151' }}>Encrypt Assertion (XML Encryption)</span>
                                  <label className="toggle">
                                    <input
                                      type="checkbox"
                                      checked={activeMapping.encryptAssertion === true}
                                      onChange={(e) => updateActiveMapping({ encryptAssertion: e.target.checked })}
                                    />
                                    <span className="toggle-track" />
                                  </label>
                                </div>
                              </div>

                              {/* Embedded Inline SAML Attribute Statements */}
                              <div
                                style={{
                                  borderTop: '1px solid #E5E7EB',
                                  paddingTop: '12px',
                                  background: '#FAFAFA',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  padding: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    SAML Attribute Statements
                                    <span
                                      className="pill"
                                      style={{
                                        background: '#F5F3FF',
                                        color: '#6D28D9',
                                        border: '1px solid #DDD6FE',
                                        fontSize: '10.5px',
                                        padding: '1px 7px',
                                        fontWeight: 500,
                                        borderRadius: '9999px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                    </span>
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                    Directional claims mapping
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                  {(activeMapping.attributeClaims || [
                                    { source: 'mail', target: 'email', isStandard: true },
                                    { source: 'displayName', target: 'name', isStandard: true },
                                    { source: 'department', target: 'department', isStandard: true },
                                    { source: 'memberOf', target: 'groups', isStandard: true }
                                  ]).map((claim: any, idx: number) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11.5px'
                                      }}
                                    >
                                      <span style={{ fontFamily: 'var(--mono)', color: '#374151', minWidth: '120px' }}>
                                        {claim.source}
                                      </span>
                                      <span style={{ color: '#1D4ED8', fontWeight: 700 }}>→</span>
                                      <span style={{ fontFamily: 'var(--mono)', color: '#111827', fontWeight: 600, flex: 1 }}>
                                        {claim.target}
                                      </span>
                                      {claim.isStandard ? (
                                        <span className="pill pill-muted" style={{ fontSize: '9.5px' }}>
                                          Core Claim
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAttributeClaim(idx)}
                                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                                        >
                                          <TrashIcon size={11} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Source attribute (e.g. employeeId)"
                                    value={newSourceAttr}
                                    onChange={(e) => setNewSourceAttr(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                  />
                                  <span style={{ color: '#9CA3AF', alignSelf: 'center' }}>→</span>
                                  <input
                                    type="text"
                                    placeholder="Hexnode claim (e.g. employeeNumber)"
                                    value={newTargetClaim}
                                    onChange={(e) => setNewTargetClaim(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={handleAddAttributeClaim}
                                    disabled={!newSourceAttr.trim() || !newTargetClaim.trim()}
                                  >
                                    + Add Claim
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 2: ASSIGNMENTS */}
                      {appWorkspaceTab === 'assignments' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                              Assignment Mode
                            </span>

                            {/* 3 Horizontal Radio Options */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                              {[
                                {
                                  id: 'source_preserved',
                                  label: 'Preserve source directory assignments',
                                  desc: `Retain users, groups, and OUs inherited from Meridian ID.`
                                },
                                {
                                  id: 'all_users',
                                  label: 'Assign to All Users',
                                  desc: 'Universally provision application access to all tenant users.'
                                },
                                {
                                  id: 'custom',
                                  label: 'Assign Users, Groups and OUs',
                                  desc: 'Designate specific users, groups, and organizational units.'
                                }
                              ].map((opt) => {
                                const isSelected = (activeMapping.assignmentScopeType || 'source_preserved') === opt.id;
                                return (
                                  <label
                                    key={opt.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '10px',
                                      padding: '12px',
                                      borderRadius: '6px',
                                      border: `1px solid ${isSelected ? '#1D4ED8' : '#E5E7EB'}`,
                                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name="appAssignmentMode"
                                      checked={isSelected}
                                      onChange={() => updateActiveMapping({ assignmentScopeType: opt.id })}
                                      style={{ marginTop: '2px', accentColor: '#1D4ED8' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <strong style={{ fontSize: '12.5px', color: '#111827', display: 'block', marginBottom: '2px' }}>
                                        {opt.label}
                                      </strong>
                                      <span style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4, display: 'block' }}>
                                        {opt.desc}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* OPTION 1: PRESERVE SOURCE DIRECTORY ASSIGNMENTS */}
                          {(activeMapping.assignmentScopeType || 'source_preserved') === 'source_preserved' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div className="alert-banner alert-banner-info" style={{ margin: 0 }}>
                                <span className="alert-banner-icon">
                                  <InfoCircleIcon size={16} />
                                </span>
                                <div>
                                  <strong>Source Directory Assignments Preserved:</strong> These assignments were discovered directly from Meridian ID and will be migrated to Hexnode IdP automatically.
                                </div>
                              </div>

                              {/* Inherited Metrics Bar */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inherited Users</span>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                                    {(activeMapping.sourceAssignments?.users || []).length || activeAsset.usersCount || 342}
                                  </div>
                                </div>
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inherited Groups</span>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                                    {(activeMapping.sourceAssignments?.groups || []).length || 3}
                                  </div>
                                </div>
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inherited OUs</span>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                                    {(activeMapping.sourceAssignments?.ous || []).length || 1}
                                  </div>
                                </div>
                              </div>

                              {/* Horizontal Sub-Tabs for Preserved Assignments */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {(['users', 'groups', 'ous'] as const).map((tab) => {
                                    const count = tab === 'users'
                                      ? (activeMapping.sourceAssignments?.users || [
                                          { name: 'Sarah Jenkins', email: 'sarah.jenkins@corp.com', title: 'VP Operations' },
                                          { name: 'Alex Chen', email: 'alex.chen@corp.com', title: 'Lead Architect' },
                                          { name: 'David Miller', email: 'david.miller@corp.com', title: 'Systems Director' },
                                          { name: 'Emily Watson', email: 'emily.watson@corp.com', title: 'Security Engineer' }
                                        ]).length
                                      : tab === 'groups'
                                      ? (activeMapping.sourceAssignments?.groups || ['Engineering', 'Product Management', 'Design']).length
                                      : (activeMapping.sourceAssignments?.ous || ['OU=Headquarters,DC=meridian,DC=com']).length;
                                    const label = tab === 'users' ? 'Users' : tab === 'groups' ? 'Groups' : 'Organizational Units';
                                    const isActive = sourceAssignTab === tab;
                                    return (
                                      <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setSourceAssignTab(tab)}
                                        style={{
                                          background: isActive ? '#1D4ED8' : '#F3F4F6',
                                          color: isActive ? '#FFFFFF' : '#374151',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '12px',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        {label}
                                        <span
                                          style={{
                                            background: isActive ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                                            color: isActive ? '#FFFFFF' : '#4B5563',
                                            padding: '1px 6px',
                                            borderRadius: '9999px',
                                            fontSize: '10.5px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Preserved Tab 1: Users */}
                              {sourceAssignTab === 'users' && (
                                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                                      Inherited Users
                                    </span>
                                    <span className="pill pill-success" style={{ fontSize: '10.5px' }}>✓ Synced Directory Identity</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(activeMapping.sourceAssignments?.users || [
                                      { name: 'Sarah Jenkins', email: 'sarah.jenkins@corp.com', title: 'VP Operations' },
                                      { name: 'Alex Chen', email: 'alex.chen@corp.com', title: 'Lead Architect' },
                                      { name: 'David Miller', email: 'david.miller@corp.com', title: 'Systems Director' },
                                      { name: 'Emily Watson', email: 'emily.watson@corp.com', title: 'Security Engineer' }
                                    ]).map((u: any) => (
                                      <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#3730A3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                                            {u.name.split(' ').map((n: string) => n[0]).join('')}
                                          </div>
                                          <div>
                                            <strong style={{ color: '#111827' }}>{u.name}</strong>
                                            <span style={{ color: '#6B7280', marginLeft: '6px', fontSize: '11px' }}>{u.email}</span>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '11px', color: '#6B7280' }}>{u.title}</span>
                                          <span className="pill pill-info" style={{ fontSize: '10px' }}>Source Inherited</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Preserved Tab 2: Groups */}
                              {sourceAssignTab === 'groups' && (
                                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                                    Inherited Groups
                                  </span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.sourceAssignments?.groups || ['Engineering', 'Product Management', 'Design']).map((grp: string) => (
                                      <span key={grp} className="pill pill-info" style={{ fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <UsersIcon size={12} /> {grp}
                                        <span style={{ fontSize: '10px', background: '#DBEAFE', padding: '1px 5px', borderRadius: '9999px', color: '#1E40AF' }}>Source Inherited</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Preserved Tab 3: OUs */}
                              {sourceAssignTab === 'ous' && (
                                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                                    Inherited Organizational Units
                                  </span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.sourceAssignments?.ous || ['OU=Headquarters,DC=meridian,DC=com']).map((ou: string) => (
                                      <span key={ou} className="pill pill-muted" style={{ fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)' }}>
                                        📁 {ou}
                                        <span style={{ fontSize: '10px', background: '#E2E8F0', padding: '1px 5px', borderRadius: '9999px', color: '#475569' }}>Source Inherited</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* OPTION 2: ASSIGN TO ALL USERS */}
                          {activeMapping.assignmentScopeType === 'all_users' && (
                            <div style={{ padding: '24px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                                <CheckIcon size={20} />
                              </div>
                              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#166534', margin: '0 0 6px 0' }}>
                                Universally Assigned to All Users
                              </h4>
                              <p style={{ fontSize: '13px', color: '#15803D', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
                                This application is universally assigned. Every synchronized directory user in Hexnode IdP across all current and future groups and organizational units will automatically receive SSO access.
                              </p>
                            </div>
                          )}

                          {/* OPTION 3: ASSIGN USERS, GROUPS AND OUS */}
                          {activeMapping.assignmentScopeType === 'custom' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Sub-Tabs for Custom Assignment */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {(['users', 'groups', 'ous'] as const).map((tab) => {
                                    const count = tab === 'users'
                                      ? (activeMapping.customAssignments?.users || []).length
                                      : tab === 'groups'
                                      ? (activeMapping.customAssignments?.groups || []).length
                                      : (activeMapping.customAssignments?.ous || []).length;
                                    const label = tab === 'users' ? 'Users' : tab === 'groups' ? 'Groups' : 'Organizational Units';
                                    const isActive = customAssignTab === tab;
                                    return (
                                      <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setCustomAssignTab(tab)}
                                        style={{
                                          background: isActive ? '#1D4ED8' : '#F3F4F6',
                                          color: isActive ? '#FFFFFF' : '#374151',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '12px',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        {label}
                                        <span
                                          style={{
                                            background: isActive ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                                            color: isActive ? '#FFFFFF' : '#4B5563',
                                            padding: '1px 6px',
                                            borderRadius: '9999px',
                                            fontSize: '10.5px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <input
                                  type="text"
                                  placeholder={`Filter ${customAssignTab}...`}
                                  value={assignSearchQuery}
                                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #D1D5DB', width: '160px' }}
                                />
                              </div>

                              {/* Custom Tab 1: Users */}
                              {customAssignTab === 'users' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Add User Bar */}
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="text"
                                      placeholder="Full name (e.g. David Miller)"
                                      value={newAssignUserName}
                                      onChange={(e) => setNewAssignUserName(e.target.value)}
                                      style={{ width: '160px', padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                    />
                                    <input
                                      type="email"
                                      placeholder="Email address (e.g. david.miller@corp.com)"
                                      value={newAssignUserEmail}
                                      onChange={(e) => setNewAssignUserEmail(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomUser();
                                        }
                                      }}
                                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleAddCustomUser()}
                                      disabled={!newAssignUserEmail.trim()}
                                    >
                                      + Add User
                                    </button>
                                  </div>

                                  {/* List of Custom Users */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                                    {(activeMapping.customAssignments?.users || [])
                                      .filter((u: any) => !assignSearchQuery || u.name?.toLowerCase().includes(assignSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                                      .map((u: any) => (
                                        <div
                                          key={u.email}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 10px',
                                            background: '#F9FAFB',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                                              {(u.name || u.email)[0].toUpperCase()}
                                            </div>
                                            <div>
                                              <strong style={{ color: '#111827' }}>{u.name}</strong>
                                              <span style={{ color: '#6B7280', marginLeft: '6px', fontSize: '11px' }}>{u.email}</span>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="pill pill-info" style={{ fontSize: '10px' }}>Custom Assigned</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveCustomUser(u.email)}
                                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                                              title="Remove user assignment"
                                            >
                                              <TrashIcon size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                    {(activeMapping.customAssignments?.users || []).length === 0 && (
                                      <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                                        No custom users assigned yet. Use the input above or quick-add from directory.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Custom Tab 2: Groups */}
                              {customAssignTab === 'groups' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Add Group Bar */}
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="text"
                                      placeholder="Group name (e.g. Engineering)"
                                      value={newAssignGroup}
                                      onChange={(e) => setNewAssignGroup(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomGroup();
                                        }
                                      }}
                                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleAddCustomGroup()}
                                      disabled={!newAssignGroup.trim()}
                                    >
                                      + Add Group
                                    </button>
                                  </div>

                                  {/* Groups Pills List */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.customAssignments?.groups || [])
                                      .filter((g: string) => !assignSearchQuery || g.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                                      .map((grp: string) => (
                                        <span
                                          key={grp}
                                          className="pill pill-info"
                                          style={{ fontSize: '11.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                          <UsersIcon size={12} /> {grp}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomGroup(grp)}
                                            style={{ background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0 }}
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))}

                                    {(activeMapping.customAssignments?.groups || []).length === 0 && (
                                      <div style={{ padding: '16px', width: '100%', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                                        No custom groups assigned yet.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Custom Tab 3: OUs */}
                              {customAssignTab === 'ous' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Add OU Bar */}
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="text"
                                      placeholder="OU distinguished path (e.g. OU=Engineering,DC=meridian,DC=com)"
                                      value={newAssignOU}
                                      onChange={(e) => setNewAssignOU(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomOU();
                                        }
                                      }}
                                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleAddCustomOU()}
                                      disabled={!newAssignOU.trim()}
                                    >
                                      + Add OU
                                    </button>
                                  </div>

                                  {/* OUs List */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.customAssignments?.ous || [])
                                      .filter((o: string) => !assignSearchQuery || o.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                                      .map((ou: string) => (
                                        <span
                                          key={ou}
                                          className="pill pill-muted"
                                          style={{ fontSize: '11.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)' }}
                                        >
                                          📁 {ou}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomOU(ou)}
                                            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))}

                                    {(activeMapping.customAssignments?.ous || []).length === 0 && (
                                      <div style={{ padding: '16px', width: '100%', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                                        No custom organizational units assigned yet.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================
                      WORKSPACE BODY: POLICIES (Configuration | Assignments)
                     ======================================================== */}
                  {category === 'policies' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Only Two Primary Tabs */}
                      <div className="tabs" style={{ marginBottom: '16px' }}>
                        <button
                          type="button"
                          className={`tab ${policyWorkspaceTab === 'configuration' ? 'active' : ''}`}
                          onClick={() => setPolicyWorkspaceTab('configuration')}
                        >
                          Configuration
                        </button>
                        <button
                          type="button"
                          className={`tab ${policyWorkspaceTab === 'assignments' ? 'active' : ''}`}
                          onClick={() => setPolicyWorkspaceTab('assignments')}
                        >
                          Assignments
                        </button>
                      </div>

                      {/* SECTION 1: CONFIGURATION */}
                      {policyWorkspaceTab === 'configuration' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Conditional Access vs Standard Policy */}
                          {(activeMapping.isConditionalAccess ||
                            activeAsset.type === 'Conditional Access' ||
                            activeAsset.name.includes('Access') ||
                            activeAsset.name.includes('Contractor')) ? (
                            /* ===== CONDITIONAL ACCESS POLICY WORKSPACE ===== */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {activeAsset.name.includes('Contractor') && (
                                <div className="alert-banner alert-banner-warning">
                                  <span className="alert-banner-icon">
                                    <AlertIcon size={16} />
                                  </span>
                                  <div>
                                    <strong>Schedule Translation Notice:</strong> Outside business hours condition translated to Hexnode IdP tenant default timezone (UTC-08:00 Pacific Time).
                                  </div>
                                </div>
                              )}

                              {/* Subsection 1: Conditions */}
                              <div className="card" style={{ padding: '14px', background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '10px' }}>
                                  1. Access Conditions
                                </span>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                                      Client Platforms
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {['macOS', 'Windows', 'iOS', 'Android', 'Linux'].map((platform) => {
                                        const current = activeMapping.platforms || ['macOS', 'Windows', 'iOS', 'Android'];
                                        const isChecked = current.includes(platform);
                                        return (
                                          <button
                                            key={platform}
                                            type="button"
                                            onClick={() => {
                                              const updated = isChecked
                                                ? current.filter((p: string) => p !== platform)
                                                : [...current, platform];
                                              updateActiveMapping({ platforms: updated });
                                            }}
                                            style={{
                                              fontSize: '11.5px',
                                              padding: '3px 8px',
                                              borderRadius: '4px',
                                              border: `1px solid ${isChecked ? '#BFDBFE' : '#D1D5DB'}`,
                                              background: isChecked ? '#EFF6FF' : '#FFFFFF',
                                              color: isChecked ? '#1D4ED8' : '#6B7280',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isChecked ? `✓ ${platform}` : platform}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                      Network Locations &amp; IP CIDRs
                                      <span
                                        className="pill"
                                        style={{
                                          background: '#F5F3FF',
                                          color: '#6D28D9',
                                          border: '1px solid #DDD6FE',
                                          fontSize: '10.5px',
                                          padding: '1px 7px',
                                          fontWeight: 500,
                                          borderRadius: '9999px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                      </span>
                                    </label>
                                    <input
                                      className="input"
                                      style={{ fontSize: '12px', padding: '6px 10px' }}
                                      value={activeMapping.ipConditions || 'Trusted Corporate CIDRs (10.0.0.0/8)'}
                                      onChange={(e) => updateActiveMapping({ ipConditions: e.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                      Schedule Condition
                                      <span
                                        className="pill"
                                        style={{
                                          background: '#F5F3FF',
                                          color: '#6D28D9',
                                          border: '1px solid #DDD6FE',
                                          fontSize: '10.5px',
                                          padding: '1px 7px',
                                          fontWeight: 500,
                                          borderRadius: '9999px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                      </span>
                                    </label>
                                    <input
                                      className="input"
                                      style={{ fontSize: '12px', padding: '6px 10px' }}
                                      value={activeMapping.timeSchedule || (activeAsset.name.includes('Contractor') ? 'Outside Business Hours (09:00 - 18:00 UTC-08:00)' : 'Anytime')}
                                      onChange={(e) => updateActiveMapping({ timeSchedule: e.target.value })}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                    <span style={{ fontSize: '12px', color: '#374151' }}>
                                      Require device enrolled and compliant in Hexnode UEM
                                    </span>
                                    <label className="toggle">
                                      <input
                                        type="checkbox"
                                        checked={activeMapping.requireCompliantDevice !== false}
                                        onChange={(e) => updateActiveMapping({ requireCompliantDevice: e.target.checked })}
                                      />
                                      <span className="toggle-track" />
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* Subsection 2: Access Control */}
                              <div className="card" style={{ padding: '14px', background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '10px' }}>
                                  2. Access Control &amp; Enforcement
                                </span>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                      Enforcement Mode
                                    </label>
                                    <select
                                      className="select"
                                      style={{ fontSize: '12px', padding: '6px 8px' }}
                                      value={activeMapping.targetEnforcement || 'Enforced'}
                                      onChange={(e) => updateActiveMapping({ targetEnforcement: e.target.value })}
                                    >
                                      <option value="Enforced">Enforced (Active blocking / challenge)</option>
                                      <option value="Report-only">Report-only (Audit evaluation only)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                      Grant Action
                                      <span
                                        className="pill"
                                        style={{
                                          background: '#F5F3FF',
                                          color: '#6D28D9',
                                          border: '1px solid #DDD6FE',
                                          fontSize: '10.5px',
                                          padding: '1px 7px',
                                          fontWeight: 500,
                                          borderRadius: '9999px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                      </span>
                                    </label>
                                    <select
                                      className="select"
                                      style={{ fontSize: '12px', padding: '6px 8px' }}
                                      value={activeMapping.grantAction || (activeAsset.name.includes('Contractor') ? 'Block access' : 'Require step-up MFA')}
                                      onChange={(e) => updateActiveMapping({ grantAction: e.target.value })}
                                    >
                                      <option value="Block access">Block access</option>
                                      <option value="Require step-up MFA">Require step-up Multi-Factor Authentication</option>
                                      <option value="Require compliant device">Grant access only with compliant device</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                                    Allowed Authentication Factors
                                  </label>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {['Hexnode Authenticator App', 'FIDO2 Security Key', 'SMS OTP', 'Push Notification'].map((factor) => {
                                      const current = activeMapping.allowedFactors || ['Hexnode Authenticator App', 'FIDO2 Security Key', 'SMS OTP'];
                                      const isChecked = current.includes(factor);
                                      return (
                                        <button
                                          key={factor}
                                          type="button"
                                          onClick={() => {
                                            const updated = isChecked
                                              ? current.filter((f: string) => f !== factor)
                                              : [...current, factor];
                                            updateActiveMapping({ allowedFactors: updated });
                                          }}
                                          style={{
                                            fontSize: '11.5px',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${isChecked ? '#BFDBFE' : '#D1D5DB'}`,
                                            background: isChecked ? '#EFF6FF' : '#FFFFFF',
                                            color: isChecked ? '#1D4ED8' : '#6B7280',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {isChecked ? `✓ ${factor}` : factor}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Subsection 3: Session Controls */}
                              <div className="card" style={{ padding: '14px', background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '10px' }}>
                                  3. Session Controls
                                </span>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                      Inactivity Timeout
                                    </label>
                                    <select
                                      className="select"
                                      style={{ fontSize: '12px', padding: '6px 8px' }}
                                      value={activeMapping.sessionTimeout || '30 mins'}
                                      onChange={(e) => updateActiveMapping({ sessionTimeout: e.target.value })}
                                    >
                                      <option value="15 mins">15 minutes</option>
                                      <option value="30 mins">30 minutes</option>
                                      <option value="1 hour">1 hour</option>
                                      <option value="8 hours">8 hours</option>
                                    </select>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '12px', color: '#374151' }}>Persistent Browser Session</span>
                                      <label className="toggle">
                                        <input
                                          type="checkbox"
                                          checked={activeMapping.persistentSession === true}
                                          onChange={(e) => updateActiveMapping({ persistentSession: e.target.checked })}
                                        />
                                        <span className="toggle-track" />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ===== STANDARD POLICIES (Password / MFA / Session) ===== */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Policy Display Name */}
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                  Policy Display Name <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <input
                                  className="input"
                                  style={{ fontSize: '12.5px', padding: '6px 10px' }}
                                  value={activeMapping.targetName || activeAsset.name}
                                  onChange={(e) => updateActiveMapping({ targetName: e.target.value })}
                                />
                              </div>

                              {/* Password Policy Fields */}
                              {(activeAsset.type === 'Password' || activeAsset.name.includes('Password')) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                        Minimum Password Length
                                        <span
                                          className="pill"
                                          style={{
                                            background: '#F5F3FF',
                                            color: '#6D28D9',
                                            border: '1px solid #DDD6FE',
                                            fontSize: '10.5px',
                                            padding: '1px 7px',
                                            fontWeight: 500,
                                            borderRadius: '9999px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                          }}
                                        >
                                          <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                        </span>
                                      </label>
                                      <input
                                        type="number"
                                        className="input"
                                        style={{ fontSize: '12px', padding: '6px 10px' }}
                                        value={activeMapping.minLength || (activeAsset.name.includes('Legacy') ? 8 : 12)}
                                        onChange={(e) => updateActiveMapping({ minLength: Number(e.target.value) })}
                                      />
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                        Enforcement Mode
                                      </label>
                                      <select
                                        className="select"
                                        style={{ fontSize: '12px', padding: '6px 8px' }}
                                        value={activeMapping.targetEnforcement || (activeAsset.status === 'Report-only' ? 'Report-only' : 'Enforced')}
                                        onChange={(e) => updateActiveMapping({ targetEnforcement: e.target.value })}
                                      >
                                        <option value="Enforced">Enforced (Active)</option>
                                        <option value="Report-only">Report-only (Audit evaluation)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                                      Complexity Requirements
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={activeMapping.requireUpper !== false}
                                          onChange={(e) => updateActiveMapping({ requireUpper: e.target.checked })}
                                        />
                                        Require Uppercase Letters (A-Z)
                                      </label>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={activeMapping.requireLower !== false}
                                          onChange={(e) => updateActiveMapping({ requireLower: e.target.checked })}
                                        />
                                        Require Lowercase Letters (a-z)
                                      </label>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={activeMapping.requireNumber !== false}
                                          onChange={(e) => updateActiveMapping({ requireNumber: e.target.checked })}
                                        />
                                        Require Numbers (0-9)
                                      </label>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={activeMapping.requireSymbol !== false}
                                          onChange={(e) => updateActiveMapping({ requireSymbol: e.target.checked })}
                                        />
                                        Require Special Symbols (!@#$)
                                      </label>
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                        Password Expiration
                                      </label>
                                      <select
                                        className="select"
                                        style={{ fontSize: '12px', padding: '6px 8px' }}
                                        value={activeMapping.maxAgeDays || (activeAsset.name.includes('Legacy') ? 180 : 90)}
                                        onChange={(e) => updateActiveMapping({ maxAgeDays: Number(e.target.value) })}
                                      >
                                        <option value={90}>90 days</option>
                                        <option value={180}>180 days</option>
                                        <option value={365}>365 days</option>
                                        <option value={0}>Never expire</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                        History Remembrance
                                      </label>
                                      <select
                                        className="select"
                                        style={{ fontSize: '12px', padding: '6px 8px' }}
                                        value={activeMapping.historyCount || (activeAsset.name.includes('Legacy') ? 2 : 5)}
                                        onChange={(e) => updateActiveMapping({ historyCount: Number(e.target.value) })}
                                      >
                                        <option value={2}>Last 2 passwords blocked</option>
                                        <option value={5}>Last 5 passwords blocked</option>
                                        <option value={10}>Last 10 passwords blocked</option>
                                        <option value={0}>No history check</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* MFA Policy Fields */}
                              {(activeAsset.type === 'MFA' || activeAsset.name.includes('MFA')) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                      Required &amp; Allowed Factors
                                      <span
                                        className="pill"
                                        style={{
                                          background: '#F5F3FF',
                                          color: '#6D28D9',
                                          border: '1px solid #DDD6FE',
                                          fontSize: '10.5px',
                                          padding: '1px 7px',
                                          fontWeight: 500,
                                          borderRadius: '9999px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                      </span>
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {['Authenticator App (TOTP)', 'Push Notification', 'FIDO2 / WebAuthn', 'SMS OTP'].map((factor) => {
                                        const current = activeMapping.allowedFactors || ['Authenticator App (TOTP)', 'Push Notification', 'FIDO2 / WebAuthn'];
                                        const isChecked = current.includes(factor);
                                        return (
                                          <button
                                            key={factor}
                                            type="button"
                                            onClick={() => {
                                              const updated = isChecked
                                                ? current.filter((f: string) => f !== factor)
                                                : [...current, factor];
                                              updateActiveMapping({ allowedFactors: updated });
                                            }}
                                            style={{
                                              fontSize: '11.5px',
                                              padding: '3px 8px',
                                              borderRadius: '4px',
                                              border: `1px solid ${isChecked ? '#BFDBFE' : '#D1D5DB'}`,
                                              background: isChecked ? '#EFF6FF' : '#FFFFFF',
                                              color: isChecked ? '#1D4ED8' : '#6B7280',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isChecked ? `✓ ${factor}` : factor}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                        Enrollment Grace Period
                                      </label>
                                      <select
                                        className="select"
                                        style={{ fontSize: '12px', padding: '6px 8px' }}
                                        value={activeMapping.gracePeriodDays || 7}
                                        onChange={(e) => updateActiveMapping({ gracePeriodDays: Number(e.target.value) })}
                                      >
                                        <option value={7}>7 days for new users</option>
                                        <option value={14}>14 days for new users</option>
                                        <option value={0}>Immediate (No grace period)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                        Remember Trusted Device
                                      </label>
                                      <select
                                        className="select"
                                        style={{ fontSize: '12px', padding: '6px 8px' }}
                                        value={activeMapping.rememberDeviceDays || 30}
                                        onChange={(e) => updateActiveMapping({ rememberDeviceDays: Number(e.target.value) })}
                                      >
                                        <option value={30}>30 days</option>
                                        <option value={60}>60 days</option>
                                        <option value={0}>Prompt on every login</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Session Policy Fields */}
                              {(activeAsset.type === 'Session' || activeAsset.name.includes('Session')) && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                      Idle Timeout
                                      <span
                                        className="pill"
                                        style={{
                                          background: '#F5F3FF',
                                          color: '#6D28D9',
                                          border: '1px solid #DDD6FE',
                                          fontSize: '10.5px',
                                          padding: '1px 7px',
                                          fontWeight: 500,
                                          borderRadius: '9999px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                                      </span>
                                    </label>
                                    <select
                                      className="select"
                                      style={{ fontSize: '12px', padding: '6px 8px' }}
                                      value={activeMapping.idleTimeout || '30 mins'}
                                      onChange={(e) => updateActiveMapping({ idleTimeout: e.target.value })}
                                    >
                                      <option value="15 mins">15 minutes</option>
                                      <option value="30 mins">30 minutes</option>
                                      <option value="1 hour">1 hour</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                                      Maximum Session Duration
                                    </label>
                                    <select
                                      className="select"
                                      style={{ fontSize: '12px', padding: '6px 8px' }}
                                      value={activeMapping.maxSession || '12 hours'}
                                      onChange={(e) => updateActiveMapping({ maxSession: e.target.value })}
                                    >
                                      <option value="8 hours">8 hours</option>
                                      <option value="12 hours">12 hours</option>
                                      <option value="24 hours">24 hours</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 2: ASSIGNMENTS */}
                      {policyWorkspaceTab === 'assignments' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                              Policy Assignment Mode
                            </span>

                            {/* 3 Horizontal Radio Options */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                              {[
                                {
                                  id: 'source_preserved',
                                  label: 'Preserve source directory assignments',
                                  desc: `Retain policy targets inherited from Meridian ID.`
                                },
                                {
                                  id: 'all_users',
                                  label: 'Assign to All Users',
                                  desc: 'Universally enforce this policy across all tenant users.'
                                },
                                {
                                  id: 'custom',
                                  label: 'Assign Users, Groups and OUs',
                                  desc: 'Designate specific users, groups, and organizational units.'
                                }
                              ].map((opt) => {
                                const isSelected = (activeMapping.assignmentScopeType || 'source_preserved') === opt.id;
                                return (
                                  <label
                                    key={opt.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '10px',
                                      padding: '12px',
                                      borderRadius: '6px',
                                      border: `1px solid ${isSelected ? '#1D4ED8' : '#E5E7EB'}`,
                                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name="policyAssignmentMode"
                                      checked={isSelected}
                                      onChange={() => updateActiveMapping({ assignmentScopeType: opt.id })}
                                      style={{ marginTop: '2px', accentColor: '#1D4ED8' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <strong style={{ fontSize: '12.5px', color: '#111827', display: 'block', marginBottom: '2px' }}>
                                        {opt.label}
                                      </strong>
                                      <span style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4, display: 'block' }}>
                                        {opt.desc}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* OPTION 1: PRESERVE SOURCE DIRECTORY ASSIGNMENTS */}
                          {(activeMapping.assignmentScopeType || 'source_preserved') === 'source_preserved' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div className="alert-banner alert-banner-info" style={{ margin: 0 }}>
                                <span className="alert-banner-icon">
                                  <InfoCircleIcon size={16} />
                                </span>
                                <div>
                                  <strong>Source Directory Policy Scope Preserved:</strong> Policy scoping discovered in Meridian ID will be enforced in Hexnode IdP upon migration.
                                </div>
                              </div>

                              {/* Inherited Metrics Bar */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inherited Users</span>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                                    {(activeMapping.sourceAssignments?.users || []).length || 2}
                                  </div>
                                </div>
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inherited Groups</span>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                                    {(activeMapping.sourceAssignments?.groups || []).length || 2}
                                  </div>
                                </div>
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inherited OUs</span>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                                    {(activeMapping.sourceAssignments?.ous || []).length || 1}
                                  </div>
                                </div>
                              </div>

                              {/* Horizontal Sub-Tabs for Preserved Assignments */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {(['users', 'groups', 'ous'] as const).map((tab) => {
                                    const count = tab === 'users'
                                      ? (activeMapping.sourceAssignments?.users || [
                                          { name: 'James Wilson', email: 'james.wilson@corp.com', title: 'Contract Consultant' },
                                          { name: 'Maya Patel', email: 'maya.patel@corp.com', title: 'External Advisor' }
                                        ]).length
                                      : tab === 'groups'
                                      ? (activeMapping.sourceAssignments?.groups || ['Contractors Group', 'Vendor Partners']).length
                                      : (activeMapping.sourceAssignments?.ous || ['OU=Corporate,DC=meridian,DC=com']).length;
                                    const label = tab === 'users' ? 'Users' : tab === 'groups' ? 'Groups' : 'Organizational Units';
                                    const isActive = sourceAssignTab === tab;
                                    return (
                                      <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setSourceAssignTab(tab)}
                                        style={{
                                          background: isActive ? '#1D4ED8' : '#F3F4F6',
                                          color: isActive ? '#FFFFFF' : '#374151',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '12px',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        {label}
                                        <span
                                          style={{
                                            background: isActive ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                                            color: isActive ? '#FFFFFF' : '#4B5563',
                                            padding: '1px 6px',
                                            borderRadius: '9999px',
                                            fontSize: '10.5px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Preserved Tab 1: Users */}
                              {sourceAssignTab === 'users' && (
                                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                                      Inherited Users
                                    </span>
                                    <span className="pill pill-success" style={{ fontSize: '10.5px' }}>✓ Synced Directory Identity</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(activeMapping.sourceAssignments?.users || [
                                      { name: 'James Wilson', email: 'james.wilson@corp.com', title: 'Contract Consultant' },
                                      { name: 'Maya Patel', email: 'maya.patel@corp.com', title: 'External Advisor' }
                                    ]).map((u: any) => (
                                      <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                                            {u.name.split(' ').map((n: string) => n[0]).join('')}
                                          </div>
                                          <div>
                                            <strong style={{ color: '#111827' }}>{u.name}</strong>
                                            <span style={{ color: '#6B7280', marginLeft: '6px', fontSize: '11px' }}>{u.email}</span>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '11px', color: '#6B7280' }}>{u.title}</span>
                                          <span className="pill pill-info" style={{ fontSize: '10px' }}>Source Inherited</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Preserved Tab 2: Groups */}
                              {sourceAssignTab === 'groups' && (
                                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                                    Inherited Target Groups
                                  </span>
                                  <div style={{ display: 'flex', flexWrap: 'gap', gap: '6px' }}>
                                    {(activeMapping.sourceAssignments?.groups || ['Contractors Group', 'Vendor Partners']).map((grp: string) => (
                                      <span key={grp} className="pill pill-info" style={{ fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <UsersIcon size={12} /> {grp}
                                        <span style={{ fontSize: '10px', background: '#DBEAFE', padding: '1px 5px', borderRadius: '9999px', color: '#1E40AF' }}>Source Inherited</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Preserved Tab 3: OUs */}
                              {sourceAssignTab === 'ous' && (
                                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                                    Inherited Organizational Units
                                  </span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.sourceAssignments?.ous || ['OU=Corporate,DC=meridian,DC=com']).map((ou: string) => (
                                      <span key={ou} className="pill pill-muted" style={{ fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)' }}>
                                        📁 {ou}
                                        <span style={{ fontSize: '10px', background: '#E2E8F0', padding: '1px 5px', borderRadius: '9999px', color: '#475569' }}>Source Inherited</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* OPTION 2: ASSIGN TO ALL USERS */}
                          {activeMapping.assignmentScopeType === 'all_users' && (
                            <div style={{ padding: '24px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                                <CheckIcon size={20} />
                              </div>
                              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#166534', margin: '0 0 6px 0' }}>
                                Universally Assigned to All Users
                              </h4>
                              <p style={{ fontSize: '13px', color: '#15803D', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
                                This policy is universally assigned. Enforcement applies to every synchronized user in Hexnode IdP across all current and future groups and organizational units.
                              </p>
                            </div>
                          )}

                          {/* OPTION 3: ASSIGN USERS, GROUPS AND OUS */}
                          {activeMapping.assignmentScopeType === 'custom' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Sub-Tabs for Custom Assignment */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {(['users', 'groups', 'ous'] as const).map((tab) => {
                                    const count = tab === 'users'
                                      ? (activeMapping.customAssignments?.users || []).length
                                      : tab === 'groups'
                                      ? (activeMapping.customAssignments?.groups || []).length
                                      : (activeMapping.customAssignments?.ous || []).length;
                                    const label = tab === 'users' ? 'Users' : tab === 'groups' ? 'Groups' : 'Organizational Units';
                                    const isActive = customAssignTab === tab;
                                    return (
                                      <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setCustomAssignTab(tab)}
                                        style={{
                                          background: isActive ? '#1D4ED8' : '#F3F4F6',
                                          color: isActive ? '#FFFFFF' : '#374151',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '12px',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        {label}
                                        <span
                                          style={{
                                            background: isActive ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                                            color: isActive ? '#FFFFFF' : '#4B5563',
                                            padding: '1px 6px',
                                            borderRadius: '9999px',
                                            fontSize: '10.5px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <input
                                  type="text"
                                  placeholder={`Filter ${customAssignTab}...`}
                                  value={assignSearchQuery}
                                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #D1D5DB', width: '160px' }}
                                />
                              </div>

                              {/* Custom Tab 1: Users */}
                              {customAssignTab === 'users' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Add User Bar */}
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="text"
                                      placeholder="Full name (e.g. James Wilson)"
                                      value={newAssignUserName}
                                      onChange={(e) => setNewAssignUserName(e.target.value)}
                                      style={{ width: '160px', padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                    />
                                    <input
                                      type="email"
                                      placeholder="Email address (e.g. james.wilson@corp.com)"
                                      value={newAssignUserEmail}
                                      onChange={(e) => setNewAssignUserEmail(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomUser();
                                        }
                                      }}
                                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleAddCustomUser()}
                                      disabled={!newAssignUserEmail.trim()}
                                    >
                                      + Add User
                                    </button>
                                  </div>

                                  {/* List of Custom Users */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                                    {(activeMapping.customAssignments?.users || [])
                                      .filter((u: any) => !assignSearchQuery || u.name?.toLowerCase().includes(assignSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                                      .map((u: any) => (
                                        <div
                                          key={u.email}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 10px',
                                            background: '#F9FAFB',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                                              {(u.name || u.email)[0].toUpperCase()}
                                            </div>
                                            <div>
                                              <strong style={{ color: '#111827' }}>{u.name}</strong>
                                              <span style={{ color: '#6B7280', marginLeft: '6px', fontSize: '11px' }}>{u.email}</span>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="pill pill-info" style={{ fontSize: '10px' }}>Custom Assigned</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveCustomUser(u.email)}
                                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                                              title="Remove user assignment"
                                            >
                                              <TrashIcon size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                    {(activeMapping.customAssignments?.users || []).length === 0 && (
                                      <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                                        No custom users assigned yet. Use the input above or quick-add from directory.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Custom Tab 2: Groups */}
                              {customAssignTab === 'groups' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Add Group Bar */}
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="text"
                                      placeholder="Group name (e.g. Contractors Group)"
                                      value={newAssignGroup}
                                      onChange={(e) => setNewAssignGroup(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomGroup();
                                        }
                                      }}
                                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleAddCustomGroup()}
                                      disabled={!newAssignGroup.trim()}
                                    >
                                      + Add Group
                                    </button>
                                  </div>

                                  {/* Groups Pills List */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.customAssignments?.groups || [])
                                      .filter((g: string) => !assignSearchQuery || g.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                                      .map((grp: string) => (
                                        <span
                                          key={grp}
                                          className="pill pill-info"
                                          style={{ fontSize: '11.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                          <UsersIcon size={12} /> {grp}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomGroup(grp)}
                                            style={{ background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0 }}
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))}

                                    {(activeMapping.customAssignments?.groups || []).length === 0 && (
                                      <div style={{ padding: '16px', width: '100%', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                                        No custom groups assigned yet.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Custom Tab 3: OUs */}
                              {customAssignTab === 'ous' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Add OU Bar */}
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="text"
                                      placeholder="OU distinguished path (e.g. OU=APAC Branch,DC=meridian,DC=com)"
                                      value={newAssignOU}
                                      onChange={(e) => setNewAssignOU(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomOU();
                                        }
                                      }}
                                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'var(--mono)' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleAddCustomOU()}
                                      disabled={!newAssignOU.trim()}
                                    >
                                      + Add OU
                                    </button>
                                  </div>

                                  {/* OUs List */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(activeMapping.customAssignments?.ous || [])
                                      .filter((o: string) => !assignSearchQuery || o.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                                      .map((ou: string) => (
                                        <span
                                          key={ou}
                                          className="pill pill-muted"
                                          style={{ fontSize: '11.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)' }}
                                        >
                                          📁 {ou}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomOU(ou)}
                                            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))}

                                    {(activeMapping.customAssignments?.ous || []).length === 0 && (
                                      <div style={{ padding: '16px', width: '100%', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                                        No custom organizational units assigned yet.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Exclusions */}
                          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                              Excluded Emergency Entities (Break-Glass)
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                              {(activeMapping.excludedGroups || ['Break-glass Emergency Admins']).map((grp: string) => (
                                <span
                                  key={grp}
                                  className="pill pill-muted"
                                  style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {grp}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExcludedGroup(grp)}
                                    style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Add excluded entity name..."
                                value={newExcludedGroup}
                                onChange={(e) => setNewExcludedGroup(e.target.value)}
                                style={{ flex: 1, padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={handleAddExcludedGroup}
                                disabled={!newExcludedGroup.trim()}
                              >
                                + Add Exclusion
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================
                      WORKSPACE BODY: TECHNICIANS (Configuration | Assignments)
                     ======================================================== */}
                  {category === 'roles' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Two Primary Tabs: Configuration | Assignments */}
                      <div className="tabs" style={{ marginBottom: '16px' }}>
                        <button
                          type="button"
                          className={`tab ${roleWorkspaceTab === 'configuration' ? 'active' : ''}`}
                          onClick={() => setRoleWorkspaceTab('configuration')}
                        >
                          Configuration
                        </button>
                        <button
                          type="button"
                          className={`tab ${roleWorkspaceTab === 'assignments' ? 'active' : ''}`}
                          onClick={() => setRoleWorkspaceTab('assignments')}
                        >
                          Assignments ({(activeMapping.technicians || []).length})
                        </button>
                      </div>

                      {/* SECTION 1: CONFIGURATION */}
                      {roleWorkspaceTab === 'configuration' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Notice for Billing Admin */}
                          {activeAsset.name.includes('Billing') && (
                            <div className="alert-banner alert-banner-warning">
                              <span className="alert-banner-icon">
                                <AlertIcon size={16} />
                              </span>
                              <div>
                                <strong>Restricted Privilege Mapping:</strong> In Meridian ID this role had app view permissions. In Hexnode IdP, Subscription Manager restricts access strictly to licensing &amp; billing.
                              </div>
                            </div>
                          )}

                          {/* Target Hexnode IdP Technician Profile */}
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              Target Hexnode IdP Technician Profile <span style={{ color: '#DC2626' }}>*</span>
                              <span
                                className="pill"
                                style={{
                                  background: '#F5F3FF',
                                  color: '#6D28D9',
                                  border: '1px solid #DDD6FE',
                                  fontSize: '10.5px',
                                  padding: '1px 7px',
                                  fontWeight: 500,
                                  borderRadius: '9999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <SparkleIcon size={11} color="#7C3AED" /> Genie mapped
                              </span>
                            </label>
                            <input
                              className="input"
                              style={{ fontSize: '12.5px', padding: '6px 10px' }}
                              value={activeMapping.technicianProfile || `${activeAsset.name} Profile`}
                              onChange={(e) => updateActiveMapping({ technicianProfile: e.target.value })}
                            />
                            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'block' }}>
                              Source in Meridian ID: <code>{activeAsset.name}</code> ({activeAsset.type})
                            </span>
                          </div>

                          {/* Role Assigned to Technician Profile */}
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                              Assigned Role <span style={{ color: '#DC2626' }}>*</span>
                            </label>
                            <select
                              className="select"
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                              value={activeMapping.assignedRole || activeMapping.targetRole || 'Hexnode Helpdesk Technician'}
                              onChange={(e) => updateActiveMapping({ assignedRole: e.target.value, targetRole: e.target.value })}
                            >
                              <option value="Hexnode Super Admin">Hexnode Super Admin (Full tenant privileges)</option>
                              <option value="Hexnode Helpdesk Technician">Hexnode Helpdesk Technician</option>
                              <option value="Hexnode Device Admin">Hexnode Device Administrator</option>
                              <option value="Hexnode Application Admin">Hexnode Application Administrator</option>
                              <option value="Hexnode Security Administrator">Hexnode Security Administrator</option>
                              <option value="Hexnode Subscription Manager">Hexnode Subscription &amp; Billing Manager</option>
                              <option value="Hexnode Reports & Audit Viewer">Hexnode Reports &amp; Audit Viewer</option>
                            </select>

                            {/* Granted Capabilities Preview */}
                            <div style={{ marginTop: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                                Granted Capabilities:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {(activeMapping.assignedRole || activeMapping.targetRole || '').includes('Super Admin') ? (
                                  <>
                                    <span className="pill pill-success" style={{ fontSize: '10px' }}>Full Directory Write</span>
                                    <span className="pill pill-success" style={{ fontSize: '10px' }}>Policy Management</span>
                                    <span className="pill pill-success" style={{ fontSize: '10px' }}>MFA Enforcement</span>
                                    <span className="pill pill-success" style={{ fontSize: '10px' }}>Audit Logs</span>
                                  </>
                                ) : (activeMapping.assignedRole || activeMapping.targetRole || '').includes('Helpdesk') ? (
                                  <>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Reset Passwords</span>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Unlock Accounts</span>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Scoped Directory Read</span>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Device Remote Lock</span>
                                  </>
                                ) : (activeMapping.assignedRole || activeMapping.targetRole || '').includes('Device') ? (
                                  <>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Enroll &amp; Wipe Devices</span>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>MDM Configurations</span>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Compliance Actions</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>Scoped Role Actions</span>
                                    <span className="pill pill-info" style={{ fontSize: '10px' }}>View Scoped Resources</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Scope Selection: Two Horizontally Arranged Radio Options */}
                          <div>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                              Scope
                            </span>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '10px',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${(activeMapping.scopeType || 'global') === 'global' ? '#1D4ED8' : '#E5E7EB'}`,
                                  background: (activeMapping.scopeType || 'global') === 'global' ? '#EFF6FF' : '#FFFFFF',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="technicianProfileScope"
                                  checked={(activeMapping.scopeType || 'global') === 'global'}
                                  onChange={() => updateActiveMapping({ scopeType: 'global', adminScope: 'full' })}
                                  style={{ marginTop: '2px', accentColor: '#1D4ED8' }}
                                />
                                <div>
                                  <strong style={{ fontSize: '13px', color: '#111827', display: 'block', marginBottom: '2px' }}>
                                    Global
                                  </strong>
                                  <span style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4, display: 'block' }}>
                                    Technician profile applies globally across all organizational units, groups, and managed devices.
                                  </span>
                                </div>
                              </label>

                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '10px',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${activeMapping.scopeType === 'local' ? '#1D4ED8' : '#E5E7EB'}`,
                                  background: activeMapping.scopeType === 'local' ? '#EFF6FF' : '#FFFFFF',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="technicianProfileScope"
                                  checked={activeMapping.scopeType === 'local'}
                                  onChange={() => updateActiveMapping({ scopeType: 'local', adminScope: 'scoped' })}
                                  style={{ marginTop: '2px', accentColor: '#1D4ED8' }}
                                />
                                <div>
                                  <strong style={{ fontSize: '13px', color: '#111827', display: 'block', marginBottom: '2px' }}>
                                    Local
                                  </strong>
                                  <span style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4, display: 'block' }}>
                                    Technician profile is restricted to specific organizational units and user groups.
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* When Local: Controls to Select and Add Specific OUs and Groups */}
                          {activeMapping.scopeType === 'local' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                              {/* Scoped OUs */}
                              <div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                                  Scoped Organizational Units ({ (activeMapping.scopedOUs || []).length })
                                </span>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                  {(activeMapping.scopedOUs || ['Sales & Support OU', 'APAC Branch OU']).map((ou: string) => (
                                    <span
                                      key={ou}
                                      className="pill pill-info"
                                      style={{ fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      📁 {ou}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveScopedOU(ou)}
                                        style={{ background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0 }}
                                        title="Remove scoped OU"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add OU path (e.g. Finance OU, DC=corp)..."
                                    value={newScopedOU}
                                    onChange={(e) => setNewScopedOU(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddScopedOU();
                                      }
                                    }}
                                    style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleAddScopedOU()}
                                    disabled={!newScopedOU.trim()}
                                  >
                                    + Add OU
                                  </button>
                                </div>

                              </div>

                              {/* Scoped Groups */}
                              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                                  Scoped User Groups ({ (activeMapping.scopedGroups || []).length })
                                </span>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                  {(activeMapping.scopedGroups || ['IT Tier 1 Support', 'Regional Technicians']).map((grp: string) => (
                                    <span
                                      key={grp}
                                      className="pill pill-info"
                                      style={{ fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      <UsersIcon size={12} /> {grp}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveScopedGroup(grp)}
                                        style={{ background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0 }}
                                        title="Remove scoped group"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add group name (e.g. IT Tier 1 Support)..."
                                    value={newScopedGroup}
                                    onChange={(e) => setNewScopedGroup(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddScopedGroup();
                                      }
                                    }}
                                    style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleAddScopedGroup()}
                                    disabled={!newScopedGroup.trim()}
                                  >
                                    + Add Group
                                  </button>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 2: ASSIGNMENTS */}
                      {roleWorkspaceTab === 'assignments' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: '#111827' }}>
                                Users Assigned to Technician Profile
                              </strong>
                              <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '2px' }}>
                                Administrators and technicians assigned to <code>{activeMapping.technicianProfile || activeAsset.name}</code>.
                              </span>
                            </div>
                            <span className="pill pill-success" style={{ fontSize: '11px' }}>
                              {(activeMapping.technicians || []).length} Assigned
                            </span>
                          </div>

                          {/* Add User Bar */}
                          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                              Assign User to Profile
                            </span>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                              <input
                                type="email"
                                placeholder="Enter technician email address..."
                                value={newTechEmail}
                                onChange={(e) => setNewTechEmail(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTechnician();
                                  }
                                }}
                                style={{ flex: 1, padding: '5px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleAddTechnician()}
                                disabled={!newTechEmail.trim()}
                              >
                                + Add User
                              </button>
                            </div>

                          </div>

                          {/* List of Assigned Users */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(activeMapping.technicians || ['david.miller@corp.com']).map((tech: string) => (
                              <div
                                key={tech}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  background: '#FFFFFF',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  fontSize: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                                    {tech.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong style={{ color: '#111827', display: 'block' }}>{tech}</strong>
                                    <span style={{ color: '#6B7280', fontSize: '11px' }}>
                                      Active Directory User • Synchronized Identity
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span className="pill pill-success" style={{ fontSize: '10px' }}>
                                    Active Assignee
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTechnician(tech)}
                                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                    title="Remove user from technician profile"
                                  >
                                    <TrashIcon size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {(activeMapping.technicians || []).length === 0 && (
                              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '12.5px', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '6px' }}>
                                No users currently assigned to this technician profile. Use the input above to add users.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  Please select an asset from the left panel to configure mappings.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: REVIEW & VALIDATE (Streamlined & Unified)
           ======================================================== */}
        {currentStep === 3 && (
          <div>
            {/* Clean heading without redundant subheading */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Pre-Flight Migration Plan &amp; Validation
                </h2>
                <span className="pill pill-success" style={{ fontSize: '12px' }}>
                  Ready for Execution
                </span>
                <span className="pill pill-info" style={{ fontSize: '12px' }}>
                  Target: corp.hexnode.com
                </span>
              </div>
            </div>

            {/* Validation Metrics Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '18px'
              }}
            >
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Items to Migrate</span>
                <strong style={{ fontSize: '20px', color: '#111827' }}>
                  {state.selectedAssetIds.length} {categoryMeta.title}
                </strong>
              </div>
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Pre-Flight Checks Passed</span>
                <strong style={{ fontSize: '20px', color: '#15803D' }}>
                  {state.selectedAssetIds.length - state.validationFindings.filter((f) => f.severity === 'blocker').length}
                </strong>
              </div>
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Blockers</span>
                <strong style={{ fontSize: '20px', color: '#111827' }}>0</strong>
              </div>
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Notices / Warnings</span>
                <strong style={{ fontSize: '20px', color: '#B45309' }}>
                  {state.validationFindings.filter((f) => f.severity === 'warning').length}
                </strong>
              </div>
            </div>

            {/* Validation Findings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {state.validationFindings.map((finding) => (
                <div
                  key={finding.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      finding.severity === 'blocker'
                        ? '#FEF2F2'
                        : finding.severity === 'warning'
                        ? '#FFFBEB'
                        : '#EFF6FF',
                    border: `1px solid ${
                      finding.severity === 'blocker'
                        ? '#FCA5A5'
                        : finding.severity === 'warning'
                        ? '#FDE68A'
                        : '#BFDBFE'
                    }`
                  }}
                >
                  <span style={{ marginTop: '2px', color: finding.severity === 'warning' ? '#B45309' : '#1D4ED8' }}>
                    {finding.severity === 'warning' ? <AlertIcon size={16} /> : <InfoCircleIcon size={16} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#111827' }}>{finding.title}</strong>
                      <span
                        className={`pill ${
                          finding.severity === 'warning' ? 'pill-warning' : 'pill-info'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#4B5563', margin: 0 }}>
                      {finding.description}
                    </p>
                  </div>
                  {finding.actionLabel && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        if (finding.assetId) {
                          setSelectedAssetId(finding.assetId);
                        }
                        goToStep(2);
                      }}
                      style={{ flexShrink: 0 }}
                    >
                      {finding.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Approved Configuration Manifest Table Preview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>
                  Target Configurations Manifest ({selectedCount})
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  Ready to register in tenant corp.hexnode.com
                </span>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Asset Name</th>
                      <th>Protocol / Type</th>
                      <th>Target Parameters</th>
                      <th>Scope / Assignees</th>
                      <th>Pre-Flight Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.discoveredAssets
                      .filter((a) => state.selectedAssetIds.includes(a.id))
                      .map((asset) => {
                        const m = state.mappings[asset.id] || {};
                        return (
                          <tr key={asset.id}>
                            <td>
                              <strong style={{ color: '#111827' }}>{asset.name}</strong>
                            </td>
                            <td>
                              <span className="pill pill-info">{asset.type}</span>
                            </td>
                            <td style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: '#4B5563' }}>
                              {category === 'apps' && (m.entityId || 'Standard SAML metadata')}
                              {category === 'policies' && `Enforcement: ${m.targetEnforcement || 'Enforced'}`}
                              {category === 'roles' && (m.technicianProfile || m.targetRole || 'Mapped Role')}
                            </td>
                            <td style={{ fontSize: '12px', color: '#4B5563' }}>
                              {category === 'apps' && (
                                m.assignmentScopeType === 'all_users' ? 'All Users' :
                                m.assignmentScopeType === 'custom' ? `${(m.customAssignments?.users || []).length} users, ${(m.customAssignments?.groups || []).length} groups` :
                                'Source Preserved'
                              )}
                              {category === 'policies' && (
                                m.assignmentScopeType === 'all_users' ? 'All Users' :
                                m.assignmentScopeType === 'custom' ? `${(m.customAssignments?.users || []).length} users, ${(m.customAssignments?.groups || []).length} groups` :
                                'Source Preserved'
                              )}
                              {category === 'roles' && `${(m.scopeType || 'global') === 'local' ? 'Local' : 'Global'} Scope • ${(m.technicians || []).length} technicians`}
                            </td>
                            <td>
                              <span className="pill pill-success">Validated</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setSelectedAssetId(asset.id);
                                  goToStep(2);
                                }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explicit Approval Checkbox Callout */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <input
                type="checkbox"
                id="approveCheck"
                checked={approvalConfirmed}
                onChange={(e) => setApprovalConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#1D4ED8' }}
              />
              <label htmlFor="approveCheck" style={{ fontSize: '13px', color: '#1E293B', cursor: 'pointer' }}>
                <strong>Confirm Migration Plan Approval:</strong> I approve the execution of these {selectedCount} {categoryMeta.title} into Hexnode IdP. Source directory connections and ongoing authentication remain unaffected.
              </label>
            </div>

                      </div>
        )}

        {/* ========================================================
            STEP 4: MIGRATE & VERIFY (Unified Combined Step)
           ======================================================== */}
        {currentStep === 4 && (
          <div>
            {/* Clean Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {state.migrationJob?.finished ? 'Migration & Verification Results' : `Migrating ${categoryMeta.title}`}
                </h2>
                <span
                  className={`pill ${
                    state.migrationJob?.finished
                      ? Object.values(state.verificationResults).some((v: any) => v.status === 'Manual Action Required')
                        ? 'pill-warning'
                        : 'pill-success'
                      : 'pill-info'
                  }`}
                  style={{ fontSize: '12px' }}
                >
                  {state.migrationJob?.finished
                    ? 'Execution Complete'
                    : 'Batch Execution in Progress'}
                </span>
              </div>

              {state.migrationJob?.finished && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => showToast('Full audit report downloaded')}
                  >
                    Download Audit Report
                  </button>
                </div>
              )}
            </div>

            {/* LIVE EXECUTION PROGRESS (Shown during migration) */}
            {(!state.migrationJob?.finished || isMigrating) && (
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#111827' }}>
                    Provisioning &amp; Validating Configurations
                  </strong>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1D4ED8' }}>
                    {state.migrationJob?.completed || 0} / {state.migrationJob?.total || selectedCount} Completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-track" style={{ height: '8px', marginBottom: '12px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${
                        state.migrationJob?.total
                          ? (state.migrationJob.completed / state.migrationJob.total) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#4B5563',
                    fontFamily: 'var(--mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#1D4ED8',
                      display: 'inline-block'
                    }}
                  />
                  {state.migrationJob?.currentOperation || 'Preparing operations…'}
                </div>
              </div>
            )}

            {/* COMBINED VERIFICATION RESULTS (Shown when finished) */}
            {state.migrationJob?.finished && (
              <div>
                {/* Result Alert Banner */}
                {Object.values(state.verificationResults).some((v: any) => v.status === 'Manual Action Required') ? (
                  <div
                    style={{
                      background: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <span style={{ color: '#B45309', marginTop: '1px' }}>
                      <AlertIcon size={18} />
                    </span>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#92400E' }}>
                        Migration Successful — Manual Service Provider Setup Required
                      </strong>
                      <p style={{ fontSize: '12.5px', color: '#B45309', margin: '3px 0 0 0' }}>
                        All configurations were successfully created in Hexnode IdP. For 2 SAML applications (Salesforce and Workday), please download the Hexnode signing certificate and copy the SSO endpoint into their respective external administrator consoles.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#DCFCE7',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ color: '#15803D' }}>
                      <CheckIcon size={18} />
                    </span>
                    <div style={{ fontSize: '13.5px', color: '#166534' }}>
                      <strong>Migration &amp; Automated Verification Successful:</strong> All {state.migrationJob?.total || selectedCount} configurations have been deployed and verified in your Hexnode IdP tenant.
                    </div>
                  </div>
                )}

                {/* Metric Summary Counters */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '18px'
                  }}
                >
                  <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: '#6B7280', display: 'block' }}>Total Migrated</span>
                    <strong style={{ fontSize: '18px', color: '#111827' }}>
                      {state.migrationJob.completed}
                    </strong>
                  </div>
                  <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: '#6B7280', display: 'block' }}>Verified in Tenant</span>
                    <strong style={{ fontSize: '18px', color: '#15803D' }}>
                      {Object.values(state.verificationResults).filter((v: any) => v.status === 'Verified').length}
                    </strong>
                  </div>
                  <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: '#6B7280', display: 'block' }}>Manual Action Required</span>
                    <strong style={{ fontSize: '18px', color: '#B45309' }}>
                      {Object.values(state.verificationResults).filter((v: any) => v.status === 'Manual Action Required').length}
                    </strong>
                  </div>
                  <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: '#6B7280', display: 'block' }}>Failed / Errored</span>
                    <strong style={{ fontSize: '18px', color: '#111827' }}>0</strong>
                  </div>
                </div>

                {/* Complete Post-Migration Verification Results Table */}
                <div style={{ marginBottom: '20px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Source Asset</th>
                        <th>Target Hexnode ID</th>
                        <th>Migration Result</th>
                        <th>Verification Status</th>
                        <th>Notes &amp; Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.discoveredAssets
                        .filter((a) => state.selectedAssetIds.includes(a.id))
                        .map((asset, i) => {
                          const ver = state.verificationResults[asset.id] || {
                            verified: true,
                            status: 'Verified',
                            notes: 'Configuration matched and registered in tenant.'
                          };
                          return (
                            <tr key={asset.id}>
                              <td>
                                <strong style={{ color: '#111827' }}>{asset.name}</strong>
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>{asset.type}</div>
                              </td>
                              <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: '#374151' }}>
                                {`hx_${category}_${100 + i}`}
                              </td>
                              <td>
                                <span className="pill pill-success">Migrated</span>
                              </td>
                              <td>
                                <span
                                  className={`pill ${
                                    ver.status === 'Verified' ? 'pill-success' : 'pill-warning'
                                  }`}
                                >
                                  {ver.status === 'Verified' ? (
                                    <>
                                      <CheckIcon size={11} /> Verified
                                    </>
                                  ) : (
                                    ver.status
                                  )}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: ver.status === 'Verified' ? '#4B5563' : '#B45309' }}>
                                <div>{ver.notes}</div>
                                {ver.manualAction && (
                                  <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ fontSize: '11px', padding: '2px 8px' }}
                                      onClick={() => showToast(`Downloaded certificate for ${asset.name}`)}
                                    >
                                      Download Cert &amp; Metadata
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ fontSize: '11px', padding: '2px 8px' }}
                                      onClick={() => {
                                        navigator.clipboard?.writeText?.(`https://idp.hexnode.com/saml/${asset.name.toLowerCase()}/sso`);
                                        showToast(`Copied SSO URL for ${asset.name}`);
                                      }}
                                    >
                                      Copy SSO URL
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Finish Action Controls */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #E5E7EB'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => showToast('Full migration report generated')}
                  >
                    View Detailed Report
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onBackToDashboard();
                      showToast(`${categoryMeta.title} migration updated`);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Back to Integration Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
