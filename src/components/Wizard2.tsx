import React, { useState, useEffect } from 'react';
import {
  GridIcon,
  ShieldIcon,
  KeyIcon,
  UsersIcon,
  ChevronDownIcon,
  AlertIcon,
  CheckIcon
} from './icons.tsx';
import { discoverCards, assetTables } from '../data/mockData.ts';

interface Wizard2Props {
  onCancel: () => void;
  onFinish: () => void;
  onShowItemDetail: (category: 'apps' | 'policies' | 'factors' | 'roles', index: number) => void;
  showToast: (msg: string) => void;
}

function confidencePillClass(c: string) {
  return c === 'High' ? 'pill-success' : 'pill-warning';
}

export const Wizard2: React.FC<Wizard2Props> = ({
  onCancel,
  onFinish,
  onShowItemDetail
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedAssets, setSelectedAssets] = useState<Record<string, boolean>>({
    apps: true,
    policies: true,
    factors: true,
    roles: true,
    devicepolicies: false
  });

  // Step 2 Accordions
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    apps: true,
    policies: false,
    factors: false,
    roles: false
  });
  const [sampleOpen, setSampleOpen] = useState<Record<string, boolean>>({
    apps: false,
    policies: false,
    factors: false,
    roles: false
  });

  // Step 3 Review
  const [reviewTab, setReviewTab] = useState<'apps' | 'policies' | 'factors' | 'roles'>('apps');
  const [checkedItems, setCheckedItems] = useState<{
    apps: boolean[];
    policies: boolean[];
    factors: boolean[];
    roles: boolean[];
  }>({
    apps: new Array(assetTables.apps.length).fill(true),
    policies: new Array(assetTables.policies.length).fill(true),
    factors: new Array(assetTables.factors.length).fill(true),
    roles: new Array(assetTables.roles.length).fill(true)
  });

  // Step 4 Validation
  const [validating, setValidating] = useState<boolean>(false);
  const [validationDone, setValidationDone] = useState<boolean>(false);

  // Step 5 Progress
  const [progress, setProgress] = useState<{
    apps: number;
    policies: number;
    factors: number;
    roles: number;
    complete: boolean;
  }>({
    apps: 0,
    policies: 0,
    factors: 0,
    roles: 0,
    complete: false
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const selectedCount = ['apps', 'policies', 'factors', 'roles'].filter(
    (k) => selectedAssets[k]
  ).length;

  const toggleAssetSelection = (key: string) => {
    if (key === 'devicepolicies') return;
    setSelectedAssets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSample = (key: string) => {
    setSampleOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCheckItem = (category: 'apps' | 'policies' | 'factors' | 'roles', index: number) => {
    setCheckedItems((prev) => {
      const copy = [...prev[category]];
      copy[index] = !copy[index];
      return { ...prev, [category]: copy };
    });
  };

  const runValidation = () => {
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      setValidationDone(true);
    }, 1000);
  };

  const startMigration = () => {
    const duration = 1800;
    const start = performance.now();
    const animate = (time: number) => {
      const elapsed = time - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress({
        apps: Math.floor(p * 13),
        policies: Math.floor(Math.min(elapsed / 1400, 1) * 6),
        factors: Math.floor(Math.min(elapsed / 1100, 1) * 4),
        roles: Math.floor(Math.min(elapsed / 1300, 1) * 8),
        complete: false
      });

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setProgress({
          apps: 13,
          policies: 6,
          factors: 4,
          roles: 8,
          complete: true
        });
      }
    };
    requestAnimationFrame(animate);
  };

  const goToStep = (target: number) => {
    setStep(target);
    if (target === 5) {
      startMigration();
    }
  };

  const getAssetIcon = (iconName: string) => {
    switch (iconName) {
      case 'grid':
        return <GridIcon size={16} />;
      case 'shield':
        return <ShieldIcon size={16} />;
      case 'key':
        return <KeyIcon size={16} />;
      case 'users':
        return <UsersIcon size={16} />;
      default:
        return null;
    }
  };

  return (
    <section className="screen active" id="screen-wizard2">
      <div className="wizard-header">
        <h1>Complete migration — Meridian ID</h1>
        {step < 5 && (
          <div className="wizard-actions">
            <button className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setStep((s) => s - 1)}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (step < 4) setStep((s) => s + 1);
                else if (step === 4) goToStep(5);
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="stepper" id="w2-stepper">
        {[
          { num: 1, label: 'Discover assets' },
          { num: 2, label: 'Configure endpoints' },
          { num: 3, label: 'Review assets' },
          { num: 4, label: 'Test & validate' },
          { num: 5, label: 'Migrate & complete' }
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
        {/* STEP 1: DISCOVER ASSETS */}
        {step === 1 && (
          <div className="step-content active" id="w2-step-1">
            <h2>Discover assets</h2>
            <p className="step-desc">
              We scanned Meridian ID's API and found the following. Choose what to migrate now — you can always come back for the rest.
            </p>
            <div className="asset-grid" id="discover-grid">
              {discoverCards.map((c) => {
                const disabled = c.status === 'unsupported';
                const checked = selectedAssets[c.key];
                return (
                  <div key={c.key} className={`asset-card ${disabled ? 'unsupported' : ''}`}>
                    <div className="asset-card-top">
                      <span className="asset-icon">{getAssetIcon(c.icon)}</span>
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={checked}
                        onChange={() => toggleAssetSelection(c.key)}
                      />
                    </div>
                    <div className="asset-card-name">{c.name}</div>
                    <div className={`asset-card-count ${disabled ? 'muted' : ''}`}>{c.count}</div>
                    <span className={`pill ${disabled ? 'pill-muted' : 'pill-success'}`}>
                      {disabled ? 'Not supported' : 'Ready'}
                    </span>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Configure selected ({selectedCount})
            </button>
          </div>
        )}

        {/* STEP 2: CONFIGURE ENDPOINTS */}
        {step === 2 && (
          <div className="step-content active" id="w2-step-2">
            <h2>Configure endpoints</h2>
            <p className="step-desc">Same idea as before — endpoints below were detected automatically and can be edited.</p>
            <div id="accordion-container">
              {/* SSO Applications */}
              {selectedAssets.apps && (
                <div className="accordion-item" id="acc-section-apps">
                  <button
                    className={`accordion-header ${openAccordions.apps ? 'open' : ''}`}
                    onClick={() => toggleAccordion('apps')}
                  >
                    SSO Applications <span className="chev"><ChevronDownIcon size={14} /></span>
                  </button>
                  {openAccordions.apps && (
                    <div className="accordion-body">
                      <div className="field-row">
                        <div className="field">
                          <label>Base URL</label>
                          <input className="input mono" defaultValue="https://api.meridianid.com/v2" />
                        </div>
                        <div className="field">
                          <label>Endpoint path</label>
                          <input className="input mono" defaultValue="/apps/v1/connections" />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field">
                          <label>Array path</label>
                          <input className="input mono" defaultValue="$.data" />
                        </div>
                        <div className="field">
                          <label>Detail endpoint</label>
                          <input className="input mono" defaultValue="/apps/v1/connections/{id}" />
                        </div>
                      </div>
                      <div className="mini-map-row">
                        <span>App name</span>
                        <span className="ext">displayName</span>
                      </div>
                      <div className="mini-map-row">
                        <span>Protocol</span>
                        <span className="ext">ssoProtocol</span>
                      </div>
                      <div className="mini-map-row">
                        <span>Assigned users</span>
                        <span className="ext">assignedCount</span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={() => toggleSample('apps')}
                      >
                        Fetch sample
                      </button>
                      {sampleOpen.apps && (
                        <div className="sample-preview" style={{ display: 'block' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>displayName</th>
                                <th>ssoProtocol</th>
                                <th>assignedCount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Salesforce</td>
                                <td>SAML 2.0</td>
                                <td>342</td>
                              </tr>
                              <tr>
                                <td>Slack</td>
                                <td>OIDC</td>
                                <td>891</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Security Policies */}
              {selectedAssets.policies && (
                <div className="accordion-item" id="acc-section-policies">
                  <button
                    className={`accordion-header ${openAccordions.policies ? 'open' : ''}`}
                    onClick={() => toggleAccordion('policies')}
                  >
                    Security Policies <span className="chev"><ChevronDownIcon size={14} /></span>
                  </button>
                  {openAccordions.policies && (
                    <div className="accordion-body">
                      <div className="field-row">
                        <div className="field">
                          <label>Base URL</label>
                          <input className="input mono" defaultValue="https://api.meridianid.com/v2" />
                        </div>
                        <div className="field">
                          <label>Endpoint path</label>
                          <input className="input mono" defaultValue="/policy/v1/policies" />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field">
                          <label>Array path</label>
                          <input className="input mono" defaultValue="$.policies" />
                        </div>
                        <div className="field">
                          <label>Detail endpoint</label>
                          <input className="input mono" defaultValue="/policy/v1/policies/{id}" />
                        </div>
                      </div>
                      <div className="mini-map-row">
                        <span>Policy name</span>
                        <span className="ext">policyName</span>
                      </div>
                      <div className="mini-map-row">
                        <span>Policy type</span>
                        <span className="ext">category</span>
                      </div>
                      <div className="mini-map-row">
                        <span>Applies to</span>
                        <span className="ext">scope.label</span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={() => toggleSample('policies')}
                      >
                        Fetch sample
                      </button>
                      {sampleOpen.policies && (
                        <div className="sample-preview" style={{ display: 'block' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>policyName</th>
                                <th>category</th>
                                <th>scope.label</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Password Complexity Policy</td>
                                <td>Password</td>
                                <td>All Users</td>
                              </tr>
                              <tr>
                                <td>MFA Enforcement Policy</td>
                                <td>MFA</td>
                                <td>All Users</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Authentication Factors */}
              {selectedAssets.factors && (
                <div className="accordion-item" id="acc-section-factors">
                  <button
                    className={`accordion-header ${openAccordions.factors ? 'open' : ''}`}
                    onClick={() => toggleAccordion('factors')}
                  >
                    Authentication Factors <span className="chev"><ChevronDownIcon size={14} /></span>
                  </button>
                  {openAccordions.factors && (
                    <div className="accordion-body">
                      <div className="field-row">
                        <div className="field">
                          <label>Base URL</label>
                          <input className="input mono" defaultValue="https://api.meridianid.com/v2" />
                        </div>
                        <div className="field">
                          <label>Endpoint path</label>
                          <input className="input mono" defaultValue="/mfa/v1/factor-types" />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field">
                          <label>Array path</label>
                          <input className="input mono" defaultValue="$.factorTypes" />
                        </div>
                        <div className="field">
                          <label>Detail endpoint</label>
                          <input className="input mono" defaultValue="/mfa/v1/factor-types/{id}" />
                        </div>
                      </div>
                      <div className="mini-map-row">
                        <span>Factor type</span>
                        <span className="ext">type</span>
                      </div>
                      <div className="mini-map-row">
                        <span>Enrolled users</span>
                        <span className="ext">enrolledCount</span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={() => toggleSample('factors')}
                      >
                        Fetch sample
                      </button>
                      {sampleOpen.factors && (
                        <div className="sample-preview" style={{ display: 'block' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>type</th>
                                <th>enrolledCount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>TOTP</td>
                                <td>864</td>
                              </tr>
                              <tr>
                                <td>SMS_OTP</td>
                                <td>412</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Roles & Technicians */}
              {selectedAssets.roles && (
                <div className="accordion-item" id="acc-section-roles">
                  <button
                    className={`accordion-header ${openAccordions.roles ? 'open' : ''}`}
                    onClick={() => toggleAccordion('roles')}
                  >
                    Roles &amp; Technicians <span className="chev"><ChevronDownIcon size={14} /></span>
                  </button>
                  {openAccordions.roles && (
                    <div className="accordion-body">
                      <div className="field-row">
                        <div className="field">
                          <label>Base URL</label>
                          <input className="input mono" defaultValue="https://api.meridianid.com/v2" />
                        </div>
                        <div className="field">
                          <label>Endpoint path</label>
                          <input className="input mono" defaultValue="/admin/v1/role-assignments" />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field">
                          <label>Array path</label>
                          <input className="input mono" defaultValue="$.assignments" />
                        </div>
                        <div className="field">
                          <label>Detail endpoint</label>
                          <input className="input mono" defaultValue="/admin/v1/role-assignments/{id}" />
                        </div>
                      </div>
                      <div className="mini-map-row">
                        <span>Role name</span>
                        <span className="ext">roleName</span>
                      </div>
                      <div className="mini-map-row">
                        <span>Scope</span>
                        <span className="ext">scope</span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={() => toggleSample('roles')}
                      >
                        Fetch sample
                      </button>
                      {sampleOpen.roles && (
                        <div className="sample-preview" style={{ display: 'block' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>roleName</th>
                                <th>scope</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Global Admin</td>
                                <td>Full tenant</td>
                              </tr>
                              <tr>
                                <td>Helpdesk Technician — APAC</td>
                                <td>APAC OU</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW ASSETS */}
        {step === 3 && (
          <div className="step-content active" id="w2-step-3">
            <h2>Review assets</h2>
            <p className="step-desc">
              Everything found is included by default. Uncheck anything you don't want migrated — click a name for the full detail, including anything you'll need to configure on the other side.
            </p>

            <div className="tabs">
              {(
                [
                  { id: 'apps', label: 'SSO Apps' },
                  { id: 'policies', label: 'Security Policies' },
                  { id: 'factors', label: 'Factors' },
                  { id: 'roles', label: 'Roles & Technicians' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  className={`tab ${reviewTab === t.id ? 'active' : ''}`}
                  onClick={() => setReviewTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* APPS REVIEW */}
            {reviewTab === 'apps' && (
              <div className="tab-panel active">
                <p className="section-desc">
                  {checkedItems.apps.filter(Boolean).length} of {assetTables.apps.length} selected
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Protocol</th>
                      <th>Category</th>
                      <th>Assigned users</th>
                      <th>Status</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.apps.map((app, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="checkbox"
                            checked={checkedItems.apps[i]}
                            onChange={() => toggleCheckItem('apps', i)}
                            style={{ marginRight: '6px' }}
                          />
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('apps', i)}
                          >
                            {app.name}
                          </button>
                          {app.conflict && (
                            <span
                              className="conflict-icon"
                              title={`Name conflict — will import as '${app.name} (2)'`}
                            >
                              <AlertIcon size={15} />
                            </span>
                          )}
                          {app.warn && (
                            <span className="conflict-icon" title={app.warn}>
                              <AlertIcon size={15} />
                            </span>
                          )}
                        </td>
                        <td>{app.protocol}</td>
                        <td>{app.category}</td>
                        <td>{app.users.toLocaleString()}</td>
                        <td>{app.status}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(app.confidence)}`}>
                            {app.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* POLICIES REVIEW */}
            {reviewTab === 'policies' && (
              <div className="tab-panel active">
                <p className="section-desc">
                  {checkedItems.policies.filter(Boolean).length} of {assetTables.policies.length} selected
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy</th>
                      <th>Type</th>
                      <th>Applies to</th>
                      <th>Enforcement</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.policies.map((pol, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="checkbox"
                            checked={checkedItems.policies[i]}
                            onChange={() => toggleCheckItem('policies', i)}
                            style={{ marginRight: '6px' }}
                          />
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('policies', i)}
                          >
                            {pol.name}
                          </button>
                          {pol.conflict && (
                            <span
                              className="conflict-icon"
                              title={`Name conflict — will import as '${pol.name} (2)'`}
                            >
                              <AlertIcon size={15} />
                            </span>
                          )}
                        </td>
                        <td>{pol.type}</td>
                        <td>{pol.appliesTo}</td>
                        <td>{pol.enforcement}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(pol.confidence)}`}>
                            {pol.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* FACTORS REVIEW */}
            {reviewTab === 'factors' && (
              <div className="tab-panel active">
                <p className="section-desc">
                  {checkedItems.factors.filter(Boolean).length} of {assetTables.factors.length} selected
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Factor type</th>
                      <th>Required?</th>
                      <th>Enrolled users</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.factors.map((fac, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="checkbox"
                            checked={checkedItems.factors[i]}
                            onChange={() => toggleCheckItem('factors', i)}
                            style={{ marginRight: '6px' }}
                          />
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('factors', i)}
                          >
                            {fac.type}
                          </button>
                        </td>
                        <td>{fac.required}</td>
                        <td>{fac.enrolled.toLocaleString()}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(fac.confidence)}`}>
                            {fac.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ROLES REVIEW */}
            {reviewTab === 'roles' && (
              <div className="tab-panel active">
                <p className="section-desc">
                  {checkedItems.roles.filter(Boolean).length} of {assetTables.roles.length} selected
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Permission level</th>
                      <th>Assigned users</th>
                      <th>Scope</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTables.roles.map((role, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="checkbox"
                            checked={checkedItems.roles[i]}
                            onChange={() => toggleCheckItem('roles', i)}
                            style={{ marginRight: '6px' }}
                          />
                          <button
                            className="item-name-link"
                            onClick={() => onShowItemDetail('roles', i)}
                          >
                            {role.name}
                          </button>
                          {role.conflict && (
                            <span
                              className="conflict-icon"
                              title={`Name conflict — will import as '${role.name} (2)'`}
                            >
                              <AlertIcon size={15} />
                            </span>
                          )}
                        </td>
                        <td>{role.permissionLevel}</td>
                        <td>{role.users}</td>
                        <td>{role.scope}</td>
                        <td>
                          <span className={`pill ${confidencePillClass(role.confidence)}`}>
                            {role.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: TEST & VALIDATE */}
        {step === 4 && (
          <div className="step-content active" id="w2-step-4">
            <h2>Test &amp; validate</h2>
            <p className="step-desc">Run a dry run before committing anything. Nothing is written to Hexnode IdP yet.</p>

            {!validationDone ? (
              <button className="btn btn-primary" onClick={runValidation} disabled={validating}>
                {validating ? 'Running validation…' : 'Run validation'}
              </button>
            ) : (
              <div style={{ marginTop: '20px' }}>
                {[
                  { label: 'SSO Applications', create: 13, update: 0, skip: 1, errors: 0 },
                  { label: 'Security Policies', create: 5, update: 1, skip: 0, errors: 0 },
                  { label: 'Authentication Factors', create: 4, update: 0, skip: 0, errors: 0 },
                  { label: 'Roles & Technicians', create: 7, update: 1, skip: 0, errors: 0 }
                ].map((s) => (
                  <div key={s.label} style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '8px' }}>
                      {s.label}
                    </div>
                    <div className="stat-row" style={{ margin: 0 }}>
                      <div className="stat-box">
                        <div className="num">{s.create}</div>
                        <div className="lbl">Will create</div>
                      </div>
                      <div className="stat-box">
                        <div className="num">{s.update}</div>
                        <div className="lbl">Will update</div>
                      </div>
                      <div className="stat-box">
                        <div className="num">{s.skip}</div>
                        <div className="lbl">Will skip</div>
                      </div>
                      <div className="stat-box">
                        <div className="num">{s.errors}</div>
                        <div className="lbl">Errors</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="validation-warnings">
                  <div className="w-row">
                    <AlertIcon size={15} /> App "Legacy Portal" has no valid ACS URL — will be skipped.
                  </div>
                  <div className="w-row">
                    <AlertIcon size={15} /> "Workday" and "Billing Admin" already exist by name — will be imported with a suffix to avoid overwriting.
                  </div>
                </div>

                <div style={{ marginTop: '22px', display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" onClick={() => setStep(3)}>
                    Back to review
                  </button>
                  <button className="btn btn-primary" onClick={() => goToStep(5)}>
                    Proceed to migration
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: MIGRATE & COMPLETE */}
        {step === 5 && (
          <div className="step-content active" id="w2-step-5">
            <h2>Migrating your remaining assets</h2>
            <p className="step-desc">This runs in the background — you can leave this page once it starts.</p>

            <div className="progress-item">
              <div className="progress-item-top">
                <strong>SSO Applications</strong>
                <span>{progress.apps} / 13 apps</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(progress.apps / 13) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-top">
                <strong>Security Policies</strong>
                <span>{progress.policies} / 6 policies</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(progress.policies / 6) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-top">
                <strong>Authentication Factors</strong>
                <span>{progress.factors} / 4 factor types</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(progress.factors / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-top">
                <strong>Roles &amp; Technicians</strong>
                <span>{progress.roles} / 8 roles</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(progress.roles / 8) * 100}%` }}
                ></div>
              </div>
            </div>

            {progress.complete && (
              <div className="success-panel" id="flow2-success">
                <div className="success-icon">
                  <CheckIcon size={26} />
                </div>
                <h3>Migration complete</h3>
                <p>
                  13 apps, 6 policies, 4 factor types and 8 roles are now in Hexnode IdP. Legacy Portal was skipped — see sync history for details.
                </p>
                <button className="btn btn-primary" onClick={onFinish}>
                  Go to integration dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
