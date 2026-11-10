import React, { useState, useEffect } from 'react';
import { SearchIcon, PlugIcon, CheckIcon, KeyIcon, ArrowRightIcon, TrashIcon, InfoCircleIcon, CloseIcon, ShieldIcon, AlertIcon, LockIcon } from './icons.tsx';
import { MappingRow, TransformRule, FilterCondition, AuthMethodType } from '../types.ts';
import { initialMappingData } from '../data/mockData.ts';

interface Wizard1Props {
  onCancel: () => void;
  onFinish: (config?: { integrationName: string; idpName: string; baseUrl: string }) => void;
  showToast: (msg: string) => void;
}

export const Wizard1: React.FC<Wizard1Props> = ({ onCancel, onFinish, showToast }) => {
  const [step, setStep] = useState<number>(1);
  const [integrationName, setIntegrationName] = useState<string>('');
  const [idpName, setIdpName] = useState<string>('');
  const [apiDocUrl, setApiDocUrl] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [detectionRunning, setDetectionRunning] = useState<boolean>(false);
  const [detectionComplete, setDetectionComplete] = useState<boolean>(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  // Step 2 Auth
  const [authMethod, setAuthMethod] = useState<AuthMethodType>('oauth2');
  const [apiKeyVal, setApiKeyVal] = useState<string>('');
  const [bearerToken, setBearerToken] = useState<string>('');
  const [basicUser, setBasicUser] = useState<string>('hexnode-sync');
  const [basicPass, setBasicPass] = useState<string>('');
  const [oauthTokenUrl, setOauthTokenUrl] = useState<string>('https://auth.meridianid.com/oauth2/token');
  const [oauthScope, setOauthScope] = useState<string>('directory.read');
  const [oauthClientId, setOauthClientId] = useState<string>('hexnode-migration-8841');
  const [oauthClientSecret, setOauthClientSecret] = useState<string>('••••••••••••');
  const [customHeaders, setCustomHeaders] = useState<{ name: string; value: string }[]>([
    { name: '', value: '' }
  ]);

  // Auth Status & Validation Tracking
  const [authStatus, setAuthStatus] = useState<{
    isConfigured: boolean;
    method: AuthMethodType | null;
    identity?: string;
    grantedScopes?: string[];
    lastConfiguredAt?: string;
    denied?: boolean;
    errorMessage?: string | null;
    wasModifiedAfterAuth?: boolean;
  }>({
    isConfigured: false,
    method: null,
    denied: false,
    errorMessage: null,
    wasModifiedAfterAuth: false
  });

  // Simulated External IdP State (OAuth 2.0 flow)
  const [simulatedIdp, setSimulatedIdp] = useState<{
    isOpen: boolean;
    screen: 'signin' | 'verify' | 'consent';
    username: string;
    password: string;
    verifyCode: string;
    isVerifying: boolean;
    isRedirecting: boolean;
  }>({
    isOpen: false,
    screen: 'signin',
    username: 'admin@meridianid.com',
    password: '••••••••••••',
    verifyCode: '',
    isVerifying: false,
    isRedirecting: false
  });

  // Non-OAuth Validation Modal State
  const [nonOauthModal, setNonOauthModal] = useState<{
    isOpen: boolean;
    step: number;
    complete: boolean;
  }>({
    isOpen: false,
    step: 0,
    complete: false
  });

  // Step 3 Endpoints
  const [endpointTab, setEndpointTab] = useState<'users' | 'groups' | 'ou'>('users');
  const [usersPagination, setUsersPagination] = useState<'none' | 'offset' | 'page' | 'cursor'>('cursor');
  const [groupsPagination, setGroupsPagination] = useState<'none' | 'offset' | 'page' | 'cursor'>('offset');
  const [ouPagination, setOuPagination] = useState<'none' | 'offset' | 'page' | 'cursor'>('page');
  const [showSample, setShowSample] = useState<{ users: boolean; groups: boolean; ou: boolean }>({
    users: false,
    groups: false,
    ou: false
  });

  // Step 4 Mapping and Provisioning
  const [step4Tab, setStep4Tab] = useState<'attribute' | 'matching'>('attribute');
  const [mappingTab, setMappingTab] = useState<'users' | 'groups' | 'ou'>('users');
  const [mappings, setMappings] = useState<Record<'users' | 'groups' | 'ou', MappingRow[]>>(initialMappingData);
  const [matchingConditions, setMatchingConditions] = useState<{ id: string; localAttr: string; incomingAttr: string }[]>([
    { id: '1', localAttr: 'User Name', incomingAttr: 'User Principal Name' },
    { id: '2', localAttr: 'Corporate Email', incomingAttr: 'Mail' }
  ]);
  const [singleMatchAction, setSingleMatchAction] = useState<string>('Link user and update profile');
  const [multiMatchAction, setMultiMatchAction] = useState<string>('Require manual confirmation');
  const [transformRules, setTransformRules] = useState<TransformRule[]>([]);

  // Step 5 Sync Scope
  const [syncDirection, setSyncDirection] = useState<'inbound' | 'outbound' | 'bidirectional'>('inbound');
  const [syncHour, setSyncHour] = useState<string>('12');
  const [syncMinute, setSyncMinute] = useState<string>('10');
  const [syncFrequency, setSyncFrequency] = useState<'daily' | 'weekly'>('daily');
  const [syncTarget, setSyncTarget] = useState<'all' | 'selected'>('selected');
  const [includedGroups, setIncludedGroups] = useState<string[]>([
    'Finance',
    'Engineering',
    'IT Operations'
  ]);
  const [availableGroups] = useState<string[]>([
    'Finance',
    'Engineering',
    'Customer Success',
    'Sales — APAC',
    'Sales — AMER',
    'Contractors',
    'IT Operations',
    'Executive Team',
    'Human Resources',
    'Legal & Compliance'
  ]);
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState<boolean>(false);
  const [selectiveSync, setSelectiveSync] = useState<'all' | 'groups' | 'filter'>('groups');
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([
    { id: '1', field: 'department', operator: 'equals', value: '' }
  ]);
  const [excludeDeactivated, setExcludeDeactivated] = useState<boolean>(true);
  const [syncSchedule, setSyncSchedule] = useState<string>('Daily at 12:10');

  // Step 6 Launch Progress
  const [launchProgress, setLaunchProgress] = useState<{
    users: number;
    groups: number;
    ou: number;
    running: boolean;
    complete: boolean;
  }>({
    users: 0,
    groups: 0,
    ou: 0,
    running: false,
    complete: false
  });

  const runDetection = async () => {
    setDetectionRunning(true);
    setStatusLog([]);
    const effectiveIdp = idpName.trim() || 'Meridian ID';
    const effectiveIntName = integrationName.trim() || `${effectiveIdp} Custom Directory`;
    const effectiveBaseUrl = baseUrl.trim() || 'https://api.meridianid.com/v2';

    if (!idpName.trim()) setIdpName(effectiveIdp);
    if (!integrationName.trim()) setIntegrationName(effectiveIntName);
    if (!baseUrl.trim()) setBaseUrl(effectiveBaseUrl);

    const lines = [
      `🔎 Searching for "${effectiveIdp}" API documentation…`,
      apiDocUrl.trim()
        ? `📄 Located and parsing developer docs at ${apiDocUrl.trim()}`
        : `📄 Located developer documentation for ${effectiveIdp}`,
      '🔑 Identifying supported authentication methods…',
      '🧩 Locating Users, Groups, and OU endpoints…',
      '🌐 Discovering extended scopes: Applications, Security Policies, Auth Factors…',
      '📋 Drafting field mappings and schema transformations…',
      '✅ Configuration draft ready — review below'
    ];

    for (let i = 0; i < lines.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 550));
      setStatusLog((prev) => [...prev, lines[i]]);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    setDetectionComplete(true);
    setDetectionRunning(false);
  };

  const authLabels: Record<AuthMethodType, string> = {
    oauth2: 'OAuth 2.0 (Client Credentials)',
    apikey: 'API Key',
    bearer: 'Bearer Token',
    basic: 'Basic Auth',
    customheader: 'Custom Header'
  };

  const isConfigValid = (): boolean => {
    if (authMethod === 'oauth2') {
      return !!(
        oauthTokenUrl.trim() &&
        oauthClientId.trim() &&
        oauthClientSecret.trim() &&
        (oauthTokenUrl.startsWith('http://') || oauthTokenUrl.startsWith('https://'))
      );
    }
    if (authMethod === 'apikey') {
      return !!apiKeyVal.trim();
    }
    if (authMethod === 'bearer') {
      return !!bearerToken.trim();
    }
    if (authMethod === 'basic') {
      return !!(basicUser.trim() && basicPass.trim());
    }
    if (authMethod === 'customheader') {
      return customHeaders.some((h) => h.name.trim() !== '' && h.value.trim() !== '');
    }
    return false;
  };

  const invalidateAuth = () => {
    if (authStatus.isConfigured || authStatus.denied || authStatus.errorMessage) {
      setAuthStatus({
        isConfigured: false,
        method: null,
        denied: false,
        errorMessage: null,
        wasModifiedAfterAuth: true
      });
    }
  };

  const handleConfigure = () => {
    if (!isConfigValid()) return;

    if (authMethod === 'oauth2') {
      const effectiveDomain = (idpName.trim() || 'meridianid').toLowerCase().replace(/[^a-z0-9]/g, '');
      setSimulatedIdp({
        isOpen: true,
        screen: 'signin',
        username: `admin@${effectiveDomain}.com`,
        password: '••••••••••••',
        verifyCode: '',
        isVerifying: false,
        isRedirecting: false
      });
    } else {
      setNonOauthModal({
        isOpen: true,
        step: 0,
        complete: false
      });

      // Animate through provider-specific validation probes
      setTimeout(() => setNonOauthModal((prev) => ({ ...prev, step: 1 })), 350);
      setTimeout(() => setNonOauthModal((prev) => ({ ...prev, step: 2 })), 800);
      setTimeout(() => setNonOauthModal((prev) => ({ ...prev, step: 3 })), 1300);
      setTimeout(() => setNonOauthModal((prev) => ({ ...prev, step: 4, complete: true })), 1800);
    }
  };

  const handleCompleteNonOauth = () => {
    setNonOauthModal({ isOpen: false, step: 0, complete: false });
    const methodDesc: Record<AuthMethodType, string> = {
      apikey: 'API Key (X-API-Key)',
      bearer: 'Bearer Token (PAT)',
      basic: `Basic Auth (${basicUser})`,
      oauth2: 'OAuth 2.0',
      customheader: 'Custom Gateway Headers'
    };
    setAuthStatus({
      isConfigured: true,
      method: authMethod,
      identity: methodDesc[authMethod],
      lastConfiguredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      denied: false,
      errorMessage: null,
      wasModifiedAfterAuth: false
    });
    showToast?.(`${authLabels[authMethod]} configured & validated successfully`);
  };

  const handleCancelSimulatedIdp = () => {
    setSimulatedIdp((prev) => ({ ...prev, isOpen: false }));
  };

  const handleVerifyCode = () => {
    setSimulatedIdp((prev) => ({ ...prev, isVerifying: true }));
    setTimeout(() => {
      setSimulatedIdp((prev) => ({
        ...prev,
        isVerifying: false,
        screen: 'consent'
      }));
    }, 700);
  };

  const handleApproveConsent = () => {
    setSimulatedIdp((prev) => ({ ...prev, isRedirecting: true }));
    setTimeout(() => {
      setSimulatedIdp((prev) => ({ ...prev, isOpen: false, isRedirecting: false }));
      const allPermissions = [
        'User.Read.All',
        'Group.Read.All',
        'Directory.Read.All',
        'Application.Read.All',
        'Policy.Read.All',
        'RoleManagement.Read.Directory',
        'offline_access'
      ];
      setAuthStatus({
        isConfigured: true,
        method: 'oauth2',
        identity: simulatedIdp.username,
        grantedScopes: allPermissions,
        lastConfiguredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        denied: false,
        errorMessage: null,
        wasModifiedAfterAuth: false
      });
      showToast?.('OAuth 2.0 authorized & permission consent completed');
    }, 600);
  };

  const handleDenyConsent = () => {
    setSimulatedIdp((prev) => ({ ...prev, isOpen: false }));
    setAuthStatus({
      isConfigured: false,
      method: null,
      denied: true,
      errorMessage: 'Authorization denied by external identity provider. Hexnode was not granted the required directory permissions. You can adjust your configuration or try again.',
      wasModifiedAfterAuth: false
    });
    showToast?.('Authorization was denied by external IdP');
  };

  const addMappingRow = (entity: 'users' | 'groups' | 'ou') => {
    setMappings((prev) => ({
      ...prev,
      [entity]: [
        ...prev[entity],
        { hexnodeAttr: 'new_attribute', externalAttr: 'field_name', dataType: 'String', transformation: 'Direct' }
      ]
    }));
  };

  const updateMappingRow = (
    entity: 'users' | 'groups' | 'ou',
    index: number,
    field: keyof MappingRow,
    value: string
  ) => {
    setMappings((prev) => {
      const rows = [...prev[entity]];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [entity]: rows };
    });
  };

  const removeMappingRow = (entity: 'users' | 'groups' | 'ou', index: number) => {
    setMappings((prev) => ({
      ...prev,
      [entity]: prev[entity].filter((_, i) => i !== index)
    }));
  };

  const addMatchingCondition = () => {
    setMatchingConditions((prev) => [
      ...prev,
      { id: Date.now().toString(), localAttr: '', incomingAttr: '' }
    ]);
  };

  const updateMatchingCondition = (id: string, field: 'localAttr' | 'incomingAttr', val: string) => {
    setMatchingConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const removeMatchingCondition = (id: string) => {
    setMatchingConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const addTransformRule = () => {
    setTransformRules((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(), field: 'department', operation: 'Trim whitespace', parameter: '' }
    ]);
  };

  const removeTransformRule = (id: string) => {
    setTransformRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTransformRule = (id: string, updates: Partial<TransformRule>) => {
    setTransformRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const addFilterCondition = () => {
    setFilterConditions((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'status', operator: 'equals', value: '' }
    ]);
  };

  const startMigration = () => {
    setLaunchProgress({ users: 0, groups: 0, ou: 0, running: true, complete: false });

    // Animate users to 1248
    const duration = 1800;
    const start = performance.now();
    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      setLaunchProgress((prev) => ({
        ...prev,
        users: Math.floor(progress * 1248),
        groups: Math.floor(Math.min(elapsed / 1400, 1) * 86),
        ou: Math.floor(Math.min(elapsed / 1100, 1) * 14)
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setLaunchProgress({
          users: 1248,
          groups: 86,
          ou: 14,
          running: false,
          complete: true
        });
      }
    };
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const isStep1Valid =
    !!integrationName.trim() &&
    !!idpName.trim() &&
    !!baseUrl.trim() &&
    detectionComplete &&
    !detectionRunning;

  const handleNext = () => {
    if (step === 1) {
      if (!isStep1Valid) {
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2 && !authStatus.isConfigured) {
      showToast?.('Please configure and authorize authentication before proceeding');
      return;
    }
    if (step === 6) {
      startMigration();
      return;
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const dirLabels: Record<'inbound' | 'outbound' | 'bidirectional', string> = {
    inbound: 'Inbound only',
    outbound: 'Outbound only',
    bidirectional: 'Bidirectional'
  };

  const selLabels: Record<'all' | 'groups' | 'filter', string> = {
    all: 'All users & groups',
    groups: 'By specific groups',
    filter: 'By custom filter'
  };

  return (
    <section className="screen active" id="screen-wizard1">
      <div className="wizard-header">
        <h1>Set up Custom Directory</h1>
        {!launchProgress.running && !launchProgress.complete && (
          <div className="wizard-actions">
            <button className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn-outline"
              onClick={handlePrev}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !authStatus.isConfigured)
              }
              title={
                step === 1 && !isStep1Valid
                  ? 'Please enter connection configuration and run detection to continue'
                  : step === 2 && !authStatus.isConfigured
                  ? 'Please configure and authorize authentication before proceeding'
                  : ''
              }
            >
              {step === 6 ? 'Start migration' : step === 1 ? 'Continue' : 'Next'}
            </button>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="stepper" id="w1-stepper">
        {[
          { num: 1, label: 'Connect' },
          { num: 2, label: 'Authenticate' },
          { num: 3, label: 'Endpoints' },
          { num: 4, label: 'Mapping and Provisioning' },
          { num: 5, label: 'Sync Scope' },
          { num: 6, label: 'Review & Launch' }
        ].map((st, i, arr) => (
          <React.Fragment key={st.num}>
            <div
              className={`step ${step === st.num ? 'current' : ''} ${step > st.num ? 'completed' : ''}`}
              data-step={st.num}
            >
              <div className="step-circle">{st.num}</div>
              {st.label}
            </div>
            {i < arr.length - 1 && <div className="step-connector"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="wizard-card">
        {/* STEP 1: CONNECT */}
        {step === 1 && (
          <div className="step-content active" id="w1-step-1">
            <h2>Connect to your identity provider</h2>
            <p className="step-desc">
              Provide your directory connection details. Our automated Genie assistant will discover endpoints, authentication schemes, and attributes.
            </p>

            <div className="field" style={{ maxWidth: '520px', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#111827' }}>
                Integration Name
              </label>
              <input
                className="input"
                id="integration-name-input"
                value={integrationName}
                onChange={(e) => {
                  setIntegrationName(e.target.value);
                  if (detectionComplete) {
                    setDetectionComplete(false);
                    setStatusLog([]);
                  }
                }}
                placeholder="Enter a name for the integration"
              />
            </div>

            <div className="field" style={{ maxWidth: '520px', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#111827' }}>
                Identity Provider Name
              </label>
              <input
                className="input"
                id="idp-name-input"
                value={idpName}
                onChange={(e) => {
                  setIdpName(e.target.value);
                  if (detectionComplete) {
                    setDetectionComplete(false);
                    setStatusLog([]);
                  }
                }}
                placeholder="Enter you IdP name"
              />
            </div>

            <div className="field" style={{ maxWidth: '520px', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#111827' }}>
                API Documentation URL (optional)
              </label>
              <input
                className="input"
                id="api-doc-url-input"
                value={apiDocUrl}
                onChange={(e) => setApiDocUrl(e.target.value)}
                placeholder="e.g., https://developer.example.com/docs"
              />
            </div>

            <div className="field" style={{ maxWidth: '520px', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#111827' }}>
                Base URL
              </label>
              <input
                className="input mono"
                id="base-url-input"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  if (detectionComplete) {
                    setDetectionComplete(false);
                    setStatusLog([]);
                  }
                }}
                placeholder="https://api.youridp.com/v2 "
              />
            </div>

            {!detectionRunning && !detectionComplete && (
              <div id="detect-controls" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={runDetection}>
                  <SearchIcon size={15} /> Detect configuration
                </button>
                <a
                  className="link-muted"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!integrationName) setIntegrationName('Custom Directory');
                    if (!idpName) setIdpName('Custom IdP');
                    if (!baseUrl) setBaseUrl('https://api.youridp.com/v2');
                    setDetectionComplete(true);
                    setStep(2);
                  }}
                >
                  Skip detection — I'll configure everything manually
                </a>
              </div>
            )}

            {(detectionRunning || statusLog.length > 0) && (
              <div className="status-log" style={{ display: 'block', marginTop: '16px' }}>
                {statusLog.map((line, idx) => (
                  <div key={idx} className="status-log-line">
                    {line}
                  </div>
                ))}
              </div>
            )}

            {detectionComplete && (
              <div className="detection-summary card" style={{ display: 'block', marginTop: '20px' }}>
                <div className="detection-summary-row">
                  <span className="label">Suggested authentication</span>
                  <span className="value">
                    OAuth 2.0 (Client Credentials) <span className="badge-detected">Detected</span>
                  </span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Discovered Scopes</span>
                  <span className="value" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Users', 'Groups', 'OU', 'Apps', 'Policies'].map((scope) => (
                      <span
                        key={scope}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#DCFCE7',
                          color: '#15803D',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}
                      >
                        <CheckIcon size={12} /> {scope}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Confidence</span>
                  <span className="pill pill-success">High confidence</span>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button className="btn btn-primary" onClick={() => setStep(2)}>
                    Continue to authentication
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: AUTHENTICATE */}
        {step === 2 && (
          <div className="step-content active" id="w1-step-2">
            <h2>Authenticate</h2>
            <p className="step-desc">
              Choose how Hexnode IdP should authenticate with {idpName || integrationName || 'your identity provider'}.
            </p>

            <div className="auth-method-grid">
              {(['apikey', 'bearer', 'basic', 'oauth2', 'customheader'] as AuthMethodType[]).map(
                (m) => {
                  const labels: Record<AuthMethodType, string> = {
                    apikey: 'API Key',
                    bearer: 'Bearer Token',
                    basic: 'Basic Auth',
                    oauth2: 'OAuth 2.0',
                    customheader: 'Custom Header'
                  };
                  return (
                    <div
                      key={m}
                      className={`auth-tile ${authMethod === m ? 'selected' : ''}`}
                      onClick={() => {
                        setAuthMethod(m);
                        invalidateAuth();
                      }}
                    >
                      <KeyIcon size={16} />
                      {labels[m]}
                    </div>
                  );
                }
              )}
            </div>

            {authMethod === 'apikey' && (
              <div className="auth-fields active">
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                    Complete these setup actions in your source directory:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>
                    <li>Generate a secret API key with directory read privileges in your source IdP.</li>
                    <li>Note the required HTTP request header name (e.g. <code>X-API-Key</code> or <code>api-key</code>).</li>
                    <li>Enter an authorization key prefix if required by your gateway schema (e.g. <code>Token </code>).</li>
                  </ol>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Header name</label>
                    <input
                      className="input mono"
                      defaultValue="X-API-Key"
                      onChange={() => invalidateAuth()}
                    />
                  </div>
                  <div className="field">
                    <label>Key prefix (optional)</label>
                    <input
                      className="input mono"
                      placeholder="e.g. Token "
                      onChange={() => invalidateAuth()}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Key value</label>
                  <input
                    className="input mono"
                    type="password"
                    placeholder="Paste API key"
                    value={apiKeyVal}
                    onChange={(e) => {
                      setApiKeyVal(e.target.value);
                      invalidateAuth();
                    }}
                  />
                </div>
              </div>
            )}

            {authMethod === 'bearer' && (
              <div className="auth-fields active">
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                    Complete these setup actions in your source directory:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>
                    <li>Create a personal access token (PAT) or service account token in your source directory.</li>
                    <li>Assign read-only scopes for users, groups, and directory hierarchy.</li>
                    <li>Set an appropriate token expiration schedule for uninterrupted synchronization.</li>
                  </ol>
                </div>
                <div className="field">
                  <label>Token value</label>
                  <input
                    className="input mono"
                    type="password"
                    placeholder="Paste bearer token"
                    value={bearerToken}
                    onChange={(e) => {
                      setBearerToken(e.target.value);
                      invalidateAuth();
                    }}
                  />
                </div>
                <div className="field">
                  <label>Header override (optional)</label>
                  <input
                    className="input mono"
                    placeholder="Authorization: Bearer {token}"
                    onChange={() => invalidateAuth()}
                  />
                </div>
              </div>
            )}

            {authMethod === 'basic' && (
              <div className="auth-fields active">
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                    Complete these setup actions in your source directory:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>
                    <li>Create or designate a service account in your source directory with read-only tree permissions.</li>
                    <li>Generate an authentication password or access key for this account.</li>
                    <li>Ensure HTTPS is enabled on your directory endpoint to protect credentials in transit.</li>
                  </ol>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Username</label>
                    <input
                      className="input"
                      value={basicUser}
                      onChange={(e) => {
                        setBasicUser(e.target.value);
                        invalidateAuth();
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Enter password"
                      value={basicPass}
                      onChange={(e) => {
                        setBasicPass(e.target.value);
                        invalidateAuth();
                      }}
                    />
                  </div>
                </div>
                <p className="hint">Will be Base64-encoded automatically.</p>
              </div>
            )}

            {authMethod === 'oauth2' && (
              <div className="auth-fields active">
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                    Setup prerequisites &amp; directory permissions:
                  </div>
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                    Create an application registration in your source directory with Client Credentials grant enabled. Grant read permissions to allow both <strong>Phase 1 Directory Synchronization</strong> and <strong>Phase 2 Asset Discovery &amp; Migration</strong>.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                        Users &amp; Groups <span className="pill pill-success" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Phase 1 &amp; 2</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.4 }}>
                        • <code>User.Read.All</code>: Read user profiles, attributes, status &amp; titles<br />
                        • <code>Group.Read.All</code>: Read security groups and membership mappings
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                        Organizational Units <span className="pill pill-success" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Phase 1 &amp; 2</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.4 }}>
                        • <code>Directory.Read.All</code>: Read organizational unit hierarchy, domains &amp; tree structure
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                        SSO Applications <span className="pill pill-info" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Phase 2 Discovery</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.4 }}>
                        • <code>Application.Read.All</code>: Read SAML/OIDC app configs, protocols &amp; app assignments
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                        Security Policies <span className="pill pill-info" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Phase 2 Discovery</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.4 }}>
                        • <code>Policy.Read.All</code>: Read password rules, MFA, session controls &amp; conditional access
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                        Technicians &amp; Roles <span className="pill pill-info" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Phase 2 Discovery</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.4 }}>
                        • <code>RoleManagement.Read.Directory</code>: Read technician roles, scopes &amp; user assignments
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                        Session Maintenance <span className="pill pill-muted" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Standard</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#4B5563', lineHeight: 1.4 }}>
                        • <code>offline_access</code>: Refresh access tokens for uninterrupted background synchronization
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#6B7280', borderTop: '1px solid #E5E7EB', paddingTop: '8px', lineHeight: 1.4 }}>
                    <strong>Note:</strong> Phase 2 asset discovery requires these additional read scopes. Granting read access only allows Hexnode to inspect source assets for migration planning—it does not write or modify assets in your source directory.
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Token URL</label>
                    <input
                      className="input mono"
                      value={oauthTokenUrl}
                      onChange={(e) => {
                        setOauthTokenUrl(e.target.value);
                        invalidateAuth();
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Scope (optional)</label>
                    <input
                      className="input mono"
                      value={oauthScope}
                      onChange={(e) => {
                        setOauthScope(e.target.value);
                        invalidateAuth();
                      }}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Client ID</label>
                    <input
                      className="input mono"
                      value={oauthClientId}
                      onChange={(e) => {
                        setOauthClientId(e.target.value);
                        invalidateAuth();
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Client secret</label>
                    <input
                      className="input mono"
                      type="password"
                      value={oauthClientSecret}
                      onChange={(e) => {
                        setOauthClientSecret(e.target.value);
                        invalidateAuth();
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {authMethod === 'customheader' && (
              <div className="auth-fields active">
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                    Complete these setup actions in your source directory:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>
                    <li>Configure custom gateway routing headers in your API management console.</li>
                    <li>Generate API token values formatted according to your gateway specifications.</li>
                    <li>Ensure firewall and IP allowlist settings permit Hexnode synchronization traffic.</li>
                  </ol>
                </div>
                {customHeaders.map((h, i) => (
                  <div className="field-row" style={{ marginBottom: '8px' }} key={i}>
                    <input
                      className="input mono"
                      placeholder="Header name"
                      value={h.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHeaders((prev) =>
                          prev.map((item, idx) => (idx === i ? { ...item, name: val } : item))
                        );
                        invalidateAuth();
                      }}
                    />
                    <input
                      className="input mono"
                      placeholder="Header value"
                      value={h.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHeaders((prev) =>
                          prev.map((item, idx) => (idx === i ? { ...item, value: val } : item))
                        );
                        invalidateAuth();
                      }}
                    />
                  </div>
                ))}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setCustomHeaders((prev) => [...prev, { name: '', value: '' }]);
                    invalidateAuth();
                  }}
                >
                  + Add header
                </button>
              </div>
            )}

            <p className="hint" style={{ marginBottom: '18px' }}>
              Integrations that require multiple rotating headers or an interactive OAuth (PKCE) flow aren't currently supported automatically.
            </p>

            {/* Primary Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isConfigValid()}
                onClick={handleConfigure}
                style={{ minWidth: '140px' }}
              >
                <PlugIcon size={16} /> Configure
              </button>
              {!isConfigValid() && (
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Complete all required fields above to enable configuration
                </span>
              )}
            </div>

            {/* Authorization Denied Alert */}
            {authStatus.denied && (
              <div
                className="alert-banner alert-banner-warning"
                style={{ marginTop: '16px', background: '#FEF2F2', borderColor: '#FECACA' }}
              >
                <div className="alert-banner-icon" style={{ color: '#DC2626' }}>
                  <AlertIcon size={18} />
                </div>
                <div>
                  <strong style={{ color: '#B91C1C' }}>Authorization Denied</strong>
                  <p style={{ color: '#991B1B' }}>
                    {authStatus.errorMessage ||
                      'Authorization was denied by the external identity provider. Hexnode was not granted the required directory permissions. You can adjust your configuration or click Configure again to re-attempt.'}
                  </p>
                </div>
              </div>
            )}

            {/* Modified After Authentication Alert */}
            {authStatus.wasModifiedAfterAuth && !authStatus.isConfigured && !authStatus.denied && (
              <div className="alert-banner alert-banner-warning" style={{ marginTop: '16px' }}>
                <div className="alert-banner-icon">
                  <AlertIcon size={18} />
                </div>
                <div>
                  <strong>Configuration changed</strong>
                  <p>
                    Authentication credentials have been modified. Click Configure again to verify and authorize before proceeding to Endpoints.
                  </p>
                </div>
              </div>
            )}

            {/* Configured & Authorized Status Card */}
            {authStatus.isConfigured && (
              <div className="auth-configured-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill pill-success" style={{ fontSize: '12.5px', padding: '4px 12px' }}>
                      <CheckIcon size={14} /> Authorized &amp; Configured
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#15803D', fontWeight: 500 }}>
                      Configured at {authStatus.lastConfiguredAt}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleConfigure}
                    style={{ background: '#FFFFFF', borderColor: '#86EFAC', color: '#15803D' }}
                  >
                    Re-authenticate / Reconfigure
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                    borderTop: '1px solid #BBF7D0',
                    paddingTop: '14px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: '#166534',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Authentication Method
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#14532D', fontWeight: 600, marginTop: '2px' }}>
                      {authLabels[authStatus.method || authMethod]}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: '#166534',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Account / Identity
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#14532D', fontWeight: 600, marginTop: '2px' }}>
                      {authStatus.identity || 'Authorized Client'}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: '#166534',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Directory Scope Status
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#15803D',
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckIcon size={14} /> Ready for Step 3 probes
                    </div>
                  </div>
                </div>

                {authStatus.grantedScopes && authStatus.grantedScopes.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px dashed #BBF7D0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: 600, marginBottom: '6px' }}>
                      Granted Permissions
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {authStatus.grantedScopes.map((sc) => (
                        <span
                          key={sc}
                          style={{
                            background: '#DCFCE7',
                            border: '1px solid #86EFAC',
                            color: '#166534',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '11.5px',
                            fontFamily: 'var(--mono)',
                            fontWeight: 500
                          }}
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ENDPOINTS */}
        {step === 3 && (
          <div className="step-content active" id="w1-step-3">
            <h2>Configure endpoints</h2>
            <p className="step-desc">These were located automatically. Review and adjust anything that doesn't look right.</p>

            <div className="tabs">
              {(['users', 'groups', 'ou'] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  className={`tab ${endpointTab === tabKey ? 'active' : ''}`}
                  onClick={() => setEndpointTab(tabKey)}
                >
                  {tabKey === 'ou' ? 'OU' : tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
                </button>
              ))}
            </div>

            {endpointTab === 'users' && (
              <div className="tab-panel active">
                <div className="field-row">
                  <div className="field">
                    <label>
                      Base URL <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue={baseUrl} />
                  </div>
                  <div className="field">
                    <label>
                      Endpoint path <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="/scim/v2/Users" />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>
                      Array path <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="$.Resources" />
                  </div>
                  <div className="field">
                    <label>
                      Detail endpoint <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="/scim/v2/Users/{id}" />
                  </div>
                </div>
                <div className="field">
                  <label>
                    Pagination strategy <span className="badge-detected">Detected</span>{' '}
                    <span className="hint" style={{ display: 'inline' }}>
                      — identified automatically from the API docs, change it if needed
                    </span>
                  </label>
                  <select
                    className="select"
                    value={usersPagination}
                    onChange={(e) =>
                      setUsersPagination(e.target.value as 'none' | 'offset' | 'page' | 'cursor')
                    }
                  >
                    <option value="none">None</option>
                    <option value="offset">Offset / Limit</option>
                    <option value="page">Page-based</option>
                    <option value="cursor">Cursor / Token</option>
                  </select>
                </div>

                {usersPagination === 'offset' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field-row">
                      <div className="field">
                        <label>Limit parameter</label>
                        <input className="input mono" defaultValue="limit" />
                      </div>
                      <div className="field">
                        <label>Offset parameter</label>
                        <input className="input mono" defaultValue="offset" />
                      </div>
                    </div>
                  </div>
                )}
                {usersPagination === 'page' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field-row">
                      <div className="field">
                        <label>Page parameter</label>
                        <input className="input mono" defaultValue="page" />
                      </div>
                      <div className="field">
                        <label>Page size parameter</label>
                        <input className="input mono" defaultValue="pageSize" />
                      </div>
                    </div>
                  </div>
                )}
                {usersPagination === 'cursor' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field">
                      <label>Next-page token path</label>
                      <input className="input mono" defaultValue="$.nextCursor" />
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '6px' }}
                  onClick={() => setShowSample((p) => ({ ...p, users: !p.users }))}
                >
                  Fetch sample
                </button>

                {showSample.users && (
                  <div className="sample-preview" style={{ display: 'block' }}>
                    <pre>{`{
  "Resources": [
    { "id": "usr_8841", "userName": "amelia.tan@acme.com", "active": true },
    { "id": "usr_8842", "userName": "raj.patel@acme.com", "active": true },
    { "id": "usr_8843", "userName": "sofia.lopez@acme.com", "active": false }
  ],
  "nextCursor": "eyJvZmZzZXQiOjMwfQ"
}`}</pre>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>id</th>
                          <th>userName</th>
                          <th>active</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>usr_8841</td>
                          <td>amelia.tan@acme.com</td>
                          <td>true</td>
                        </tr>
                        <tr>
                          <td>usr_8842</td>
                          <td>raj.patel@acme.com</td>
                          <td>true</td>
                        </tr>
                        <tr>
                          <td>usr_8843</td>
                          <td>sofia.lopez@acme.com</td>
                          <td>false</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {endpointTab === 'groups' && (
              <div className="tab-panel active">
                <div className="field-row">
                  <div className="field">
                    <label>
                      Base URL <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue={baseUrl} />
                  </div>
                  <div className="field">
                    <label>
                      Endpoint path <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="/scim/v2/Groups" />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>
                      Array path <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="$.Resources" />
                  </div>
                  <div className="field">
                    <label>
                      Detail endpoint <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="/scim/v2/Groups/{id}" />
                  </div>
                </div>
                <div className="field">
                  <label>
                    Pagination strategy <span className="badge-detected">Detected</span>
                  </label>
                  <select
                    className="select"
                    value={groupsPagination}
                    onChange={(e) =>
                      setGroupsPagination(e.target.value as 'none' | 'offset' | 'page' | 'cursor')
                    }
                  >
                    <option value="none">None</option>
                    <option value="offset">Offset / Limit</option>
                    <option value="page">Page-based</option>
                    <option value="cursor">Cursor / Token</option>
                  </select>
                </div>

                {groupsPagination === 'offset' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field-row">
                      <div className="field">
                        <label>Limit parameter</label>
                        <input className="input mono" defaultValue="limit" />
                      </div>
                      <div className="field">
                        <label>Offset parameter</label>
                        <input className="input mono" defaultValue="offset" />
                      </div>
                    </div>
                  </div>
                )}
                {groupsPagination === 'page' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field-row">
                      <div className="field">
                        <label>Page parameter</label>
                        <input className="input mono" defaultValue="page" />
                      </div>
                      <div className="field">
                        <label>Page size parameter</label>
                        <input className="input mono" defaultValue="pageSize" />
                      </div>
                    </div>
                  </div>
                )}
                {groupsPagination === 'cursor' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field">
                      <label>Next-page token path</label>
                      <input className="input mono" defaultValue="$.nextCursor" />
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '6px' }}
                  onClick={() => setShowSample((p) => ({ ...p, groups: !p.groups }))}
                >
                  Fetch sample
                </button>

                {showSample.groups && (
                  <div className="sample-preview" style={{ display: 'block' }}>
                    <pre>{`{
  "Resources": [
    { "id": "grp_201", "name": "Finance", "members": 42 },
    { "id": "grp_202", "name": "Engineering", "members": 118 },
    { "id": "grp_203", "name": "Customer Success", "members": 37 }
  ]
}`}</pre>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>id</th>
                          <th>name</th>
                          <th>members</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>grp_201</td>
                          <td>Finance</td>
                          <td>42</td>
                        </tr>
                        <tr>
                          <td>grp_202</td>
                          <td>Engineering</td>
                          <td>118</td>
                        </tr>
                        <tr>
                          <td>grp_203</td>
                          <td>Customer Success</td>
                          <td>37</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {endpointTab === 'ou' && (
              <div className="tab-panel active">
                <div className="field-row">
                  <div className="field">
                    <label>
                      Base URL <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue={baseUrl} />
                  </div>
                  <div className="field">
                    <label>
                      Endpoint path <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="/directory/v2/organizational-units" />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>
                      Array path <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="$.data.items" />
                  </div>
                  <div className="field">
                    <label>
                      Detail endpoint <span className="badge-detected">Detected</span>
                    </label>
                    <input className="input mono" defaultValue="/directory/v2/organizational-units/{id}" />
                  </div>
                </div>
                <div className="field">
                  <label>
                    Pagination strategy <span className="badge-detected">Detected</span>
                  </label>
                  <select
                    className="select"
                    value={ouPagination}
                    onChange={(e) =>
                      setOuPagination(e.target.value as 'none' | 'offset' | 'page' | 'cursor')
                    }
                  >
                    <option value="none">None</option>
                    <option value="offset">Offset / Limit</option>
                    <option value="page">Page-based</option>
                    <option value="cursor">Cursor / Token</option>
                  </select>
                </div>

                {ouPagination === 'page' && (
                  <div className="pag-sub" style={{ display: 'block' }}>
                    <div className="field-row">
                      <div className="field">
                        <label>Page parameter</label>
                        <input className="input mono" defaultValue="page" />
                      </div>
                      <div className="field">
                        <label>Page size parameter</label>
                        <input className="input mono" defaultValue="pageSize" />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '6px' }}
                  onClick={() => setShowSample((p) => ({ ...p, ou: !p.ou }))}
                >
                  Fetch sample
                </button>

                {showSample.ou && (
                  <div className="sample-preview" style={{ display: 'block' }}>
                    <pre>{`{
  "data": { "items": [
    { "id": "ou_10", "name": "APAC", "parentPath": "/Global" },
    { "id": "ou_11", "name": "EMEA", "parentPath": "/Global" },
    { "id": "ou_12", "name": "Contractors", "parentPath": "/Global/APAC" }
  ]}
}`}</pre>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>id</th>
                          <th>name</th>
                          <th>parentPath</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>ou_10</td>
                          <td>APAC</td>
                          <td>/Global</td>
                        </tr>
                        <tr>
                          <td>ou_11</td>
                          <td>EMEA</td>
                          <td>/Global</td>
                        </tr>
                        <tr>
                          <td>ou_12</td>
                          <td>Contractors</td>
                          <td>/Global/APAC</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: MAPPING AND PROVISIONING */}
        {step === 4 && (
          <div className="step-content active" id="w1-step-4">
            <h2>Mapping and Provisioning</h2>
            <p className="step-desc">
              Configure attribute schema mappings and identity matching rules between directories.
            </p>

            {/* Top-Level Horizontal Tabs */}
            <div className="tabs" style={{ marginBottom: '22px' }}>
              <button
                type="button"
                className={`tab ${step4Tab === 'attribute' ? 'active' : ''}`}
                onClick={() => setStep4Tab('attribute')}
              >
                Attribute Mapping
              </button>
              <button
                type="button"
                className={`tab ${step4Tab === 'matching' ? 'active' : ''}`}
                onClick={() => setStep4Tab('matching')}
              >
                Identity Matching &amp; Provisioning
              </button>
            </div>

            {/* TAB A: Attribute Mapping */}
            {step4Tab === 'attribute' && (
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'flex-start' }}>
                {/* Left-sided Vertical Panel */}
                <div className="card" style={{ padding: '12px', background: '#FFFFFF' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '6px 10px 10px 10px'
                    }}
                  >
                    Entities
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { key: 'users', label: 'Users', count: mappings.users.length, desc: 'User accounts' },
                      { key: 'groups', label: 'Groups', count: mappings.groups.length, desc: 'Security groups' },
                      { key: 'ou', label: 'OU', count: mappings.ou.length, desc: 'Org units' }
                    ].map((tab) => {
                      const isActive = mappingTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setMappingTab(tab.key as 'users' | 'groups' | 'ou')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isActive ? '#EFF6FF' : 'transparent',
                            color: isActive ? '#1D4ED8' : '#374151',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div>{tab.label}</div>
                            <div style={{ fontSize: '11.5px', color: isActive ? '#3B82F6' : '#9CA3AF', fontWeight: 400 }}>
                              {tab.desc}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '11.5px',
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              background: isActive ? '#DBEAFE' : '#F3F4F6',
                              color: isActive ? '#1D4ED8' : '#6B7280',
                              fontWeight: 600
                            }}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Area: Respective Attribute Mapping Table */}
                <div className="card mapping-rules-card" style={{ width: '100%', boxSizing: 'border-box', padding: '24px' }}>
                  <div className="mapping-card-header" style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                      {mappingTab === 'ou' ? 'Organizational Unit' : mappingTab.charAt(0).toUpperCase() + mappingTab.slice(1)} Attribute Mapping
                    </h3>
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 500
                      }}
                    >
                      {mappings[mappingTab].length} fields mapped
                    </span>
                  </div>

                  <p className="mapping-card-desc" style={{ marginBottom: '18px' }}>
                    Map incoming attributes from {idpName || 'external directory'} to Hexnode IdP profile fields.
                  </p>

                  <div className="mapping-rows-container">
                    {mappings[mappingTab].map((row, i) => (
                      <div key={i} className="mapping-row-item">
                        <div className="mapping-field-col">
                          <label className="mapping-field-lbl">Hexnode Attribute</label>
                          <input
                            className="input input-sm"
                            value={row.hexnodeAttr}
                            onChange={(e) => updateMappingRow(mappingTab, i, 'hexnodeAttr', e.target.value)}
                          />
                        </div>

                        <div className="mapping-arrow-col" title="Maps to">
                          <ArrowRightIcon size={16} />
                        </div>

                        <div className="mapping-field-col">
                          <label className="mapping-field-lbl">{idpName || 'External'} Attribute</label>
                          <input
                            className="input input-sm"
                            value={row.externalAttr}
                            onChange={(e) => updateMappingRow(mappingTab, i, 'externalAttr', e.target.value)}
                          />
                        </div>

                        <div className="mapping-type-col">
                          <label className="mapping-field-lbl">Type</label>
                          <select
                            className="select select-sm"
                            value={row.dataType}
                            onChange={(e) => updateMappingRow(mappingTab, i, 'dataType', e.target.value)}
                          >
                            <option>String</option>
                            <option>Boolean</option>
                            <option>Array</option>
                            <option>Number</option>
                            <option>DateTime</option>
                          </select>
                        </div>

                        <div className="mapping-delete-col">
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeMappingRow(mappingTab, i)}
                            title="Remove attribute mapping"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => addMappingRow(mappingTab)}
                    >
                      + Add Attribute Mapping
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: Identity Matching & Provisioning */}
            {step4Tab === 'matching' && (
              <div className="side-by-side-mapping-grid" style={{ alignItems: 'flex-start', marginTop: 0 }}>
                {/* Left Column Card: Identity Matching Rule */}
                <div className="card" style={{ padding: '24px', background: '#FFFFFF', minHeight: '440px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>
                    Identity Matching Rule
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                    A local Hexnode user is an exact match to an incoming {idpName ? `${idpName} profile` : 'profile'} if ANY of the following criteria are met:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {matchingConditions.map((cond) => (
                      <div key={cond.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          className="input"
                          style={{ flex: 1, padding: '9px 12px' }}
                          value={cond.localAttr}
                          placeholder="Local Attribute (e.g. User Name)"
                          onChange={(e) => updateMatchingCondition(cond.id, 'localAttr', e.target.value)}
                        />

                        {/* Arrow separator box */}
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#4B5563',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                          title="Matches to"
                        >
                          <ArrowRightIcon size={16} />
                        </div>

                        <input
                          className="input"
                          style={{ flex: 1, padding: '9px 12px' }}
                          value={cond.incomingAttr}
                          placeholder="Incoming Attribute (e.g. User Principal Name)"
                          onChange={(e) => updateMatchingCondition(cond.id, 'incomingAttr', e.target.value)}
                        />

                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => removeMatchingCondition(cond.id)}
                          title="Remove condition"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={addMatchingCondition}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0F62FE',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0'
                      }}
                    >
                      <span style={{ fontSize: '17px', lineHeight: 1 }}>+</span> Add Matching Condition
                    </button>
                  </div>
                </div>

                {/* Right Column Card: Provisioning Rules & Global Transformation Rule */}
                <div className="card" style={{ padding: '24px', background: '#FFFFFF', minHeight: '440px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
                    Provisioning Rules
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', color: '#374151', marginBottom: '8px' }}>
                      if exactly one matching user is found
                    </label>
                    <select
                      className="select"
                      style={{ width: '100%' }}
                      value={singleMatchAction}
                      onChange={(e) => setSingleMatchAction(e.target.value)}
                    >
                      <option>Link user and update profile</option>
                      <option>Create new user account</option>
                      <option>Do not import</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', color: '#374151', marginBottom: '8px' }}>
                      If multiple matching users are found
                    </label>
                    <select
                      className="select"
                      style={{ width: '100%' }}
                      value={multiMatchAction}
                      onChange={(e) => setMultiMatchAction(e.target.value)}
                    >
                      <option>Require manual confirmation</option>
                      <option>Link to first matching profile</option>
                      <option>Reject incoming record</option>
                    </select>
                  </div>

                  {/* Visual Divider */}
                  <div style={{ borderTop: '1px solid #E5E7EB', margin: '22px 0 18px 0' }} />

                  {/* Migrated Global Transformation Rule */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        Global Transformation Rule
                      </h4>
                      {transformRules.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={addTransformRule}
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                        >
                          + Add Rule
                        </button>
                      )}
                    </div>

                    {transformRules.length === 0 ? (
                      <div
                        style={{
                          padding: '16px',
                          border: '1px dashed #D1D5DB',
                          borderRadius: '6px',
                          backgroundColor: '#F9FAFB',
                          textAlign: 'center'
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={addTransformRule}
                        >
                          + Add Rule
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {transformRules.map((rule) => (
                          <div
                            key={rule.id}
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              background: '#F9FAFB',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB'
                            }}
                          >
                            <select
                              className="select select-sm"
                              style={{ flex: 1, minWidth: '95px' }}
                              value={rule.field}
                              onChange={(e) => updateTransformRule(rule.id, { field: e.target.value })}
                            >
                              <option value="department">department</option>
                              <option value="role">role</option>
                              <option value="email">email</option>
                              <option value="title">title</option>
                            </select>
                            <span style={{ color: '#6B7280', fontSize: '13px', flexShrink: 0 }}>→</span>
                            <select
                              className="select select-sm"
                              style={{ flex: 1.3, minWidth: '130px' }}
                              value={rule.operation}
                              onChange={(e) => updateTransformRule(rule.id, { operation: e.target.value })}
                            >
                              <option value="Trim whitespace">Trim whitespace</option>
                              <option value="Change case to lower">Change case to lower</option>
                              <option value="Change case to upper">Change case to upper</option>
                              <option value="Regex replace">Regex replace</option>
                            </select>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => removeTransformRule(rule.id)}
                              title="Delete rule"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#DC2626',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        ))}
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={addTransformRule}
                          >
                            + Add Rule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: SYNC SCOPE */}
        {step === 5 && (
          <div className="step-content active" id="w1-step-5">
            <h2>Sync Scope</h2>
            <p className="step-desc">Configure sync direction, execution frequency, and directory scope.</p>

            {/* Single-Column Full-Width Card */}
            <div className="card" style={{ padding: '24px', background: '#FFFFFF', width: '100%', boxSizing: 'border-box' }}>
              {/* Top Section: Sync Direction */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#111827', marginBottom: '6px' }}>
                  Sync Direction
                </label>
                <select
                  className="select"
                  style={{ maxWidth: '380px' }}
                  value={syncDirection === 'outbound' ? 'inbound' : syncDirection}
                  onChange={(e) => setSyncDirection(e.target.value as 'inbound' | 'bidirectional')}
                >
                  <option value="inbound">Inbound only</option>
                  <option value="bidirectional">Bidirectional</option>
                </select>
              </div>

              {/* Middle Section: Scheduled Sync */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
                  Scheduled Sync
                </h3>

                {/* Row 1: Initiate sync at */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ width: '160px', fontSize: '13.5px', color: '#374151' }}>
                    Initiate sync at
                  </div>
                  <select
                    className="select"
                    style={{ width: '80px', padding: '6px 10px' }}
                    value={syncHour}
                    onChange={(e) => setSyncHour(e.target.value)}
                  >
                    {[...Array(24)].map((_, h) => {
                      const val = String(h).padStart(2, '0');
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                  <span style={{ fontSize: '13.5px', color: '#374151', margin: '0 12px 0 4px' }}>
                    Hours
                  </span>
                  <select
                    className="select"
                    style={{ width: '80px', padding: '6px 10px' }}
                    value={syncMinute}
                    onChange={(e) => setSyncMinute(e.target.value)}
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '13.5px', color: '#374151', marginLeft: '4px' }}>
                    minutes
                  </span>
                </div>

                {/* Row 2: Frequency */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '160px', fontSize: '13.5px', color: '#374151' }}>
                    Frequency
                  </div>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      marginRight: '24px',
                      fontSize: '13.5px',
                      color: '#374151'
                    }}
                  >
                    <input
                      type="radio"
                      name="syncFreq"
                      checked={syncFrequency === 'daily'}
                      onChange={() => setSyncFrequency('daily')}
                    />
                    Daily
                  </label>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      color: '#374151'
                    }}
                  >
                    <input
                      type="radio"
                      name="syncFreq"
                      checked={syncFrequency === 'weekly'}
                      onChange={() => setSyncFrequency('weekly')}
                    />
                    Weekly
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #E5E7EB', margin: '24px 0' }} />

              {/* Bottom Section: Sync Target */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>
                  Sync Target
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0' }}>
                  Define Which Users and groups from the directory
                </p>

                {/* Card 1: Sync All User groups */}
                <div
                  onClick={() => setSyncTarget('all')}
                  style={{
                    border: syncTarget === 'all' ? '1.5px solid #3B82F6' : '1px solid #E5E7EB',
                    background: syncTarget === 'all' ? '#F8FAFC' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="syncTargetSelection"
                    checked={syncTarget === 'all'}
                    onChange={() => setSyncTarget('all')}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '3px' }}>
                      Sync All User groups
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      Import all users and groups should be imported or provisioned
                    </div>
                  </div>
                </div>

                {/* Card 2: Sync Only Selected groups */}
                <div
                  onClick={() => setSyncTarget('selected')}
                  style={{
                    border: syncTarget === 'selected' ? '1.5px solid #3B82F6' : '1px solid #E5E7EB',
                    background: syncTarget === 'selected' ? '#F8FAFC' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="syncTargetSelection"
                    checked={syncTarget === 'selected'}
                    onChange={() => setSyncTarget('selected')}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '3px' }}>
                      Sync Only Selected groups
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      Choose specific groups to import or provisions
                    </div>
                  </div>
                </div>

                {/* Sub-section when Sync Only Selected groups is selected */}
                {syncTarget === 'selected' && (
                  <div style={{ marginTop: '22px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>
                      Included Groups
                    </div>

                    {/* Tag pills of included groups */}
                    {includedGroups.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {includedGroups.map((grp) => (
                          <span
                            key={grp}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12.5px',
                              fontWeight: 500
                            }}
                          >
                            {grp}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIncludedGroups((prev) => prev.filter((g) => g !== grp));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#3B82F6',
                                fontSize: '12px',
                                padding: 0,
                                lineHeight: 1
                              }}
                              title="Remove group"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsGroupPickerOpen(!isGroupPickerOpen)}
                      style={{
                        border: '1px solid #D1D5DB',
                        color: '#0F62FE',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      + Add New
                    </button>

                    {/* Dropdown / Popover to pick new groups */}
                    {isGroupPickerOpen && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '14px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          maxWidth: '420px'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Select groups to include:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                          {availableGroups.map((grp) => {
                            const isIncluded = includedGroups.includes(grp);
                            return (
                              <label
                                key={grp}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '13px',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  background: isIncluded ? '#F3F4F6' : 'transparent'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() => {
                                    if (isIncluded) {
                                      setIncludedGroups((prev) => prev.filter((g) => g !== grp));
                                    } else {
                                      setIncludedGroups((prev) => [...prev, grp]);
                                    }
                                  }}
                                />
                                {grp}
                              </label>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsGroupPickerOpen(false)}
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & LAUNCH */}
        {step === 6 && (
          <div className="step-content active" id="w1-step-6">
            {!launchProgress.running && !launchProgress.complete ? (
              <div id="review-panel">
                <h2>Review &amp; launch</h2>
                <p className="step-desc">Here's what will happen when you start the sync.</p>
                <div className="detection-summary-row">
                  <span className="label">Integration</span>
                  <span className="value">{integrationName || 'Custom Directory'}</span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Identity Provider</span>
                  <span className="value">{idpName || 'Custom IdP'}</span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Base URL</span>
                  <span className="value mono">{baseUrl || 'https://api.youridp.com/v2'}</span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Authentication</span>
                  <span className="value">{authLabels[authMethod]}</span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Endpoints configured</span>
                  <span className="value">
                    <CheckIcon size={13} /> Users &nbsp; <CheckIcon size={13} /> Groups &nbsp;{' '}
                    <CheckIcon size={13} /> OU
                  </span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Sync direction</span>
                  <span className="value">{dirLabels[syncDirection]}</span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Selective sync</span>
                  <span className="value">{selLabels[selectiveSync]}</span>
                </div>
                <div className="detection-summary-row">
                  <span className="label">Schedule</span>
                  <span className="value">{syncSchedule}</span>
                </div>

                <div className="stat-row">
                  <div className="stat-box">
                    <div className="num">1,248</div>
                    <div className="lbl">Users detected</div>
                  </div>
                  <div className="stat-box">
                    <div className="num">86</div>
                    <div className="lbl">Groups detected</div>
                  </div>
                  <div className="stat-box">
                    <div className="num">14</div>
                    <div className="lbl">OUs detected</div>
                  </div>
                </div>
              </div>
            ) : (
              <div id="launch-progress-panel">
                <h2>Syncing your directory</h2>
                <p className="step-desc">This runs in the background — you can leave this page once it starts.</p>

                <div className="progress-item">
                  <div className="progress-item-top">
                    <strong>Users</strong>
                    <span>{launchProgress.users.toLocaleString()} / 1,248 users</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(launchProgress.users / 1248) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-item-top">
                    <strong>Groups</strong>
                    <span>{launchProgress.groups.toLocaleString()} / 86 groups</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(launchProgress.groups / 86) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-item-top">
                    <strong>OU</strong>
                    <span>{launchProgress.ou.toLocaleString()} / 14 OUs</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(launchProgress.ou / 14) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {launchProgress.complete && (
                  <div className="success-panel" id="launch-success">
                    <div className="success-icon">
                      <CheckIcon size={26} />
                    </div>
                    <h3>Core directory sync complete</h3>
                    <p>
                      Users, groups and OUs are now syncing on schedule. You can migrate SSO apps, policies and more from the integration dashboard.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        onFinish({
                          integrationName: integrationName || idpName || 'Custom Directory Integration',
                          idpName: idpName || 'Custom IdP',
                          baseUrl: baseUrl || 'https://api.youridp.com/v2'
                        })
                      }
                    >
                      Go to integration dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIMULATED EXTERNAL IDP MODAL (OAuth 2.0 Flow) */}
      {simulatedIdp.isOpen && (
        <div className="modal-overlay open" style={{ zIndex: 120 }}>
          <div
            className="browser-mock-container"
            style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Browser Simulation Topbar */}
            <div className="browser-mock-topbar">
              <div className="browser-mock-dots">
                <span className="browser-mock-dot red" />
                <span className="browser-mock-dot yellow" />
                <span className="browser-mock-dot green" />
              </div>
              <div className="browser-mock-url-bar">
                <LockIcon size={13} />
                <span>
                  https://auth.{(idpName || 'meridianid').toLowerCase().replace(/[^a-z0-9]/g, '')}.com/oauth2/v2.0/authorize?client_id={oauthClientId}&amp;response_type=code&amp;scope={encodeURIComponent(oauthScope || 'User.Read.All Group.Read.All')}&amp;redirect_uri=https://idp.hexnode.com/oauth/callback
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelSimulatedIdp}
                className="modal-close"
                title="Cancel external authorization"
                style={{ padding: '2px 6px', lineHeight: 1 }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* External IdP Branding Header */}
            <div className="idp-brand-header">
              <div className="idp-brand-left">
                <div className="idp-brand-icon">
                  <ShieldIcon size={20} />
                </div>
                <div>
                  <div className="idp-brand-title">
                    {idpName || 'Meridian ID'} Single Sign-On
                  </div>
                  <div className="idp-brand-sub">
                    Identity &amp; Access Management Portal
                  </div>
                </div>
              </div>
              <span className="pill pill-info" style={{ fontSize: '11px' }}>
                <LockIcon size={12} /> Secure Auth Session
              </span>
            </div>

            {/* Modal Content Screens */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Screen A: Sign In */}
              {simulatedIdp.screen === 'signin' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    Sign in to your organization
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Hexnode IdP is requesting access to configure automated directory synchronization with your {idpName || 'Meridian ID'} directory.
                  </p>

                  <div className="field">
                    <label>Administrator Email / Username</label>
                    <input
                      className="input"
                      value={simulatedIdp.username}
                      onChange={(e) =>
                        setSimulatedIdp((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="admin@yourcompany.com"
                    />
                  </div>

                  <div className="field">
                    <label>Password</label>
                    <input
                      className="input"
                      type="password"
                      value={simulatedIdp.password}
                      onChange={(e) =>
                        setSimulatedIdp((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Enter password"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <input type="checkbox" id="sim-remember" defaultChecked style={{ cursor: 'pointer' }} />
                    <label htmlFor="sim-remember" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Keep me signed in on this browser
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancelSimulatedIdp}
                    >
                      Cancel and return
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setSimulatedIdp((prev) => ({ ...prev, screen: 'verify' }))}
                    >
                      Continue to verification <ArrowRightIcon size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Screen B: 2FA Verification */}
              {simulatedIdp.screen === 'verify' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    Verify your identity
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Two-factor authentication is required for directory administration. Enter the 6-digit security code sent to your registered authenticator device ending in <strong>••92</strong>.
                  </p>

                  <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      6-DIGIT VERIFICATION CODE
                    </label>
                    <input
                      className="input mono"
                      placeholder="000 000"
                      maxLength={7}
                      value={simulatedIdp.verifyCode}
                      onChange={(e) =>
                        setSimulatedIdp((prev) => ({ ...prev, verifyCode: e.target.value }))
                      }
                      style={{
                        fontSize: '22px',
                        letterSpacing: '5px',
                        textAlign: 'center',
                        maxWidth: '220px',
                        margin: '0 auto',
                        display: 'block',
                        fontWeight: 700
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() =>
                        setSimulatedIdp((prev) => ({ ...prev, verifyCode: '849 201' }))
                      }
                      style={{ margin: '10px auto 0', display: 'inline-flex', fontSize: '11.5px' }}
                    >
                      Auto-fill demo code: 849 201
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setSimulatedIdp((prev) => ({ ...prev, screen: 'signin' }))}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCancelSimulatedIdp}
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={simulatedIdp.isVerifying}
                      onClick={handleVerifyCode}
                    >
                      {simulatedIdp.isVerifying ? 'Verifying security code…' : 'Verify & Proceed'}
                    </button>
                  </div>
                </div>
              )}

              {/* Screen C: Permission & Scope Consent */}
              {simulatedIdp.screen === 'consent' && (
                <div>
                  {simulatedIdp.isRedirecting ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          border: '3px solid #BFDBFE',
                          borderTopColor: '#1D4ED8',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          margin: '0 auto 16px'
                        }}
                      />
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                        Redirecting to Hexnode IdP…
                      </h4>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                        Authorization code received. Returning to wizard with access tokens…
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                        Authorize Permissions
                      </h3>
                      <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', lineHeight: 1.5 }}>
                        <strong>Hexnode IdP</strong> is requesting the following permissions to synchronize directory identities and discover assets from <strong>{idpName || 'Source Directory'}</strong>:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {[
                          { scope: 'User.Read.All', label: 'Read all user profiles, titles, and status', phase: 'Phase 1 & 2' },
                          { scope: 'Group.Read.All', label: 'Read security groups and memberships', phase: 'Phase 1 & 2' },
                          { scope: 'Directory.Read.All', label: 'Read organizational units and directory hierarchy', phase: 'Phase 1 & 2' },
                          { scope: 'Application.Read.All', label: 'Read SSO applications, configurations, and assignments', phase: 'Phase 2' },
                          { scope: 'Policy.Read.All', label: 'Read security policies, password rules, and MFA controls', phase: 'Phase 2' },
                          { scope: 'RoleManagement.Read.Directory', label: 'Read technician roles, scopes, and profile assignments', phase: 'Phase 2' },
                          { scope: 'offline_access', label: 'Maintain continuous background synchronization', phase: 'Session' }
                        ].map((p) => (
                          <div
                            key={p.scope}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px'
                            }}
                          >
                            <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center' }}>
                              <CheckIcon size={16} />
                            </span>
                            <div style={{ flex: 1, fontSize: '13px' }}>
                              <strong style={{ color: '#111827', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                                {p.scope}
                              </strong>
                              <span style={{ color: '#6B7280', marginLeft: '8px' }}>— {p.label}</span>
                            </div>
                            <span
                              className={`pill ${p.phase === 'Phase 2' ? 'pill-info' : p.phase === 'Session' ? 'pill-muted' : 'pill-success'}`}
                              style={{ fontSize: '10px', padding: '1px 6px' }}
                            >
                              {p.phase}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleDenyConsent}
                          disabled={simulatedIdp.isRedirecting}
                          style={{ color: '#DC2626', borderColor: '#FECACA' }}
                        >
                          Deny access
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={simulatedIdp.isRedirecting}
                          onClick={handleApproveConsent}
                        >
                          Approve &amp; Accept
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NON-OAUTH CREDENTIAL VALIDATION MODAL */}
      {nonOauthModal.isOpen && (
        <div className="modal-overlay open" style={{ zIndex: 120 }}>
          <div className="modal-box" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-header">
              <h2>Configuring &amp; Validating {authLabels[authMethod]}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setNonOauthModal({ isOpen: false, step: 0, complete: false })}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Probing directory endpoint and verifying credential parameters for <strong>{baseUrl || 'https://api.youridp.com/v2'}</strong>.
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>1. Validating credential syntax &amp; formatting</span>
                  {nonOauthModal.step >= 1 ? (
                    <span style={{ color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckIcon size={14} /> Complete
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>Validating…</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>2. Testing TLS 1.3 handshake with endpoint</span>
                  {nonOauthModal.step >= 2 ? (
                    <span style={{ color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckIcon size={14} /> TLS 1.3 OK
                    </span>
                  ) : nonOauthModal.step === 1 ? (
                    <span style={{ color: 'var(--primary)' }}>Probing…</span>
                  ) : (
                    <span style={{ color: 'var(--muted-text)' }}>Pending</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>3. Probing authentication header response</span>
                  {nonOauthModal.step >= 3 ? (
                    <span style={{ color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckIcon size={14} /> HTTP 200 Handshake OK
                    </span>
                  ) : nonOauthModal.step === 2 ? (
                    <span style={{ color: 'var(--primary)' }}>Verifying…</span>
                  ) : (
                    <span style={{ color: 'var(--muted-text)' }}>Pending</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>4. Establishing secure session credential store</span>
                  {nonOauthModal.step >= 4 ? (
                    <span style={{ color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckIcon size={14} /> Secure Vault OK
                    </span>
                  ) : nonOauthModal.step === 3 ? (
                    <span style={{ color: 'var(--primary)' }}>Storing…</span>
                  ) : (
                    <span style={{ color: 'var(--muted-text)' }}>Pending</span>
                  )}
                </div>
              </div>
            </div>

            {nonOauthModal.complete && (
              <div className="alert-banner alert-banner-info" style={{ marginBottom: '20px' }}>
                <div className="alert-banner-icon"><InfoCircleIcon size={18} /></div>
                <div>
                  <strong>Credentials validated</strong>
                  <p>
                    Handshake succeeded. Directory access readiness will be verified against Users, Groups, and OU endpoints in Step 3.
                  </p>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!nonOauthModal.complete}
                onClick={handleCompleteNonOauth}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
