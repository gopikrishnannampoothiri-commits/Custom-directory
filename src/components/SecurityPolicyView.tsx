import React, { useState } from 'react';
import {
  ShieldIcon,
  LockIcon,
  SlidersIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InfoCircleIcon,
  AlertIcon,
  CheckIcon
} from './icons.tsx';

interface SecurityPolicyViewProps {
  showToast: (msg: string) => void;
}

export const SecurityPolicyView: React.FC<SecurityPolicyViewProps> = ({ showToast }) => {
  const [selectedSubItem, setSelectedSubItem] = useState<string>('mfa_enforce');
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'mfa',
    'password',
    'session',
    'conditional'
  ]);

  // Form states
  const [mfaEnforceState, setMfaEnforceState] = useState<boolean>(true);
  const [promptFrequency, setPromptFrequency] = useState<string>('every_login');
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(7);
  const [allowedFactors, setAllowedFactors] = useState<string[]>([
    'FIDO2 / WebAuthn Hardware Security Keys',
    'Hexnode Authenticator TOTP'
  ]);
  const [excludedGroups, setExcludedGroups] = useState<string[]>([
    'Emergency Break-Glass Admins',
    'Service Accounts (Automated)'
  ]);
  const [newExcludedTag, setNewExcludedTag] = useState<string>('');

  // Accordion toggle
  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeExcludedGroup = (grpName: string) => {
    setExcludedGroups((prev) => prev.filter((g) => g !== grpName));
    showToast(`Removed ${grpName} from exclusion`);
  };

  const addExcludedGroup = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newExcludedTag.trim()) {
      e.preventDefault();
      if (!excludedGroups.includes(newExcludedTag.trim())) {
        setExcludedGroups((prev) => [...prev, newExcludedTag.trim()]);
        showToast(`Added ${newExcludedTag.trim()} to exclusion`);
      }
      setNewExcludedTag('');
    }
  };

  return (
    <div className="security-policy-screen">
      {/* Breadcrumbs */}
      <div className="breadcrumb" style={{ marginBottom: '16px' }}>
        <span>Security</span>
        <ChevronRightIcon size={12} />
        <span>Policy Rules</span>
        <ChevronRightIcon size={12} />
        <strong>MFA Policies</strong>
      </div>

      {/* Pattern B: Sidebar Configuration Layout */}
      <div className="sidebar-config-container">
        {/* LEFT PANEL (20–25% Width): Vertical menu with grouped category headers */}
        <aside className="sidebar-config-left">
          {/* Group 1: MFA Policies */}
          <div className="config-nav-group">
            <div
              className="config-group-header"
              onClick={() => toggleSection('mfa')}
            >
              <div className="group-title-wrap">
                <ShieldIcon size={15} />
                <span>MFA Policies</span>
              </div>
              <span className="chevron-icon">
                {expandedSections.includes('mfa') ? (
                  <ChevronDownIcon size={13} />
                ) : (
                  <ChevronRightIcon size={13} />
                )}
              </span>
            </div>
            {expandedSections.includes('mfa') && (
              <div className="config-sub-menu">
                <button
                  className={`config-menu-item ${selectedSubItem === 'mfa_enforce' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('mfa_enforce')}
                >
                  MFA Enforcement
                </button>
                <button
                  className={`config-menu-item ${selectedSubItem === 'mfa_factors' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('mfa_factors')}
                >
                  Allowed Factors
                </button>
                <button
                  className={`config-menu-item ${selectedSubItem === 'mfa_recovery' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('mfa_recovery')}
                >
                  Recovery &amp; Bypass Codes
                </button>
              </div>
            )}
          </div>

          {/* Group 2: Password Policies */}
          <div className="config-nav-group">
            <div
              className="config-group-header"
              onClick={() => toggleSection('password')}
            >
              <div className="group-title-wrap">
                <LockIcon size={15} />
                <span>Password Policies</span>
              </div>
              <span className="chevron-icon">
                {expandedSections.includes('password') ? (
                  <ChevronDownIcon size={13} />
                ) : (
                  <ChevronRightIcon size={13} />
                )}
              </span>
            </div>
            {expandedSections.includes('password') && (
              <div className="config-sub-menu">
                <button
                  className={`config-menu-item ${selectedSubItem === 'pwd_complexity' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('pwd_complexity')}
                >
                  Complexity &amp; Length
                </button>
                <button
                  className={`config-menu-item ${selectedSubItem === 'pwd_expiration' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('pwd_expiration')}
                >
                  Expiration &amp; History
                </button>
                <button
                  className={`config-menu-item ${selectedSubItem === 'pwd_lockout' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('pwd_lockout')}
                >
                  Account Lockout Thresholds
                </button>
              </div>
            )}
          </div>

          {/* Group 3: Session Rules */}
          <div className="config-nav-group">
            <div
              className="config-group-header"
              onClick={() => toggleSection('session')}
            >
              <div className="group-title-wrap">
                <SlidersIcon size={15} />
                <span>Session &amp; Access</span>
              </div>
              <span className="chevron-icon">
                {expandedSections.includes('session') ? (
                  <ChevronDownIcon size={13} />
                ) : (
                  <ChevronRightIcon size={13} />
                )}
              </span>
            </div>
            {expandedSections.includes('session') && (
              <div className="config-sub-menu">
                <button
                  className={`config-menu-item ${selectedSubItem === 'sess_lifetime' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('sess_lifetime')}
                >
                  Session Lifetime
                </button>
                <button
                  className={`config-menu-item ${selectedSubItem === 'sess_concurrent' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('sess_concurrent')}
                >
                  Concurrent Logins
                </button>
              </div>
            )}
          </div>

          {/* Group 4: Conditional Access */}
          <div className="config-nav-group">
            <div
              className="config-group-header"
              onClick={() => toggleSection('conditional')}
            >
              <div className="group-title-wrap">
                <ShieldIcon size={15} />
                <span>Conditional Access</span>
              </div>
              <span className="chevron-icon">
                {expandedSections.includes('conditional') ? (
                  <ChevronDownIcon size={13} />
                ) : (
                  <ChevronRightIcon size={13} />
                )}
              </span>
            </div>
            {expandedSections.includes('conditional') && (
              <div className="config-sub-menu">
                <button
                  className={`config-menu-item ${selectedSubItem === 'cond_geofence' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('cond_geofence')}
                >
                  Geofencing &amp; IP Ranges
                </button>
                <button
                  className={`config-menu-item ${selectedSubItem === 'cond_device' ? 'active' : ''}`}
                  onClick={() => setSelectedSubItem('cond_device')}
                >
                  Device Trust &amp; Compliance
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL (75–80% Width): White card container for form configuration controls */}
        <section className="sidebar-config-right">
          <div className="card config-card-content">
            {/* Header */}
            <div className="config-card-header">
              <h2>MFA Enforcement Policy</h2>
            </div>

            {/* Info Banner */}
            <div className="alert-banner alert-banner-info" style={{ marginBottom: '18px' }}>
              <span className="alert-banner-icon">
                <InfoCircleIcon size={18} />
              </span>
              <div className="alert-banner-content">
                <strong>Zero Trust Multi-Factor Mandate</strong>
                <p>
                  Enforcing MFA ensures that all federated applications and Hexnode IdP portals prompt for a second cryptographic factor.{' '}
                  <a href="#learn-more" onClick={(e) => e.preventDefault()}>
                    Learn more about FIDO2 standards
                  </a>
                </p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="alert-banner alert-banner-warning" style={{ marginBottom: '24px' }}>
              <span className="alert-banner-icon">
                <AlertIcon size={18} />
              </span>
              <div className="alert-banner-content">
                <strong>Grace Period Notification</strong>
                <p>
                  Newly provisioned identities without registered security factors will be granted temporary sign-in access during their grace period before hard enforcement engages.
                </p>
              </div>
            </div>

            {/* Form Controls: 2-column inline key-value layout */}
            <div className="inline-form-container">
              {/* Row 1: Global Enable Toggle */}
              <div className="inline-form-row">
                <div className="inline-label">
                  <label>
                    Require MFA for all directory users <span className="req-star">*</span>
                  </label>
                  <span className="inline-subtext">
                    Applies to web portals, CLI authentication, and all integrated SSO applications.
                  </span>
                </div>
                <div className="inline-control">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={mfaEnforceState}
                      onChange={(e) => setMfaEnforceState(e.target.checked)}
                    />
                    <span className="toggle-track"></span>
                  </label>
                </div>
              </div>

              {/* Row 2: Prompt Frequency Dropdown */}
              <div className="inline-form-row">
                <div className="inline-label">
                  <label>
                    Prompt Frequency <span className="req-star">*</span>
                  </label>
                  <span className="inline-subtext">
                    Control how often users must perform a step-up challenge.
                  </span>
                </div>
                <div className="inline-control">
                  <select
                    className="select"
                    value={promptFrequency}
                    onChange={(e) => setPromptFrequency(e.target.value)}
                  >
                    <option value="every_login">Prompt on every login from an untrusted browser</option>
                    <option value="daily">Prompt once per 24 hours per device</option>
                    <option value="weekly">Remember verified devices for 7 days</option>
                    <option value="adaptive">Adaptive Risk-Based (Prompt only on anomaly)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Grace Period Input */}
              <div className="inline-form-row">
                <div className="inline-label">
                  <label>
                    New User Grace Period <span className="req-star">*</span>
                  </label>
                  <span className="inline-subtext">
                    Number of days a newly invited user can sign in prior to completing factor registration.
                  </span>
                </div>
                <div className="inline-control" style={{ maxWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      className="input"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                      min={0}
                      max={30}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>days</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Tag Inputs (Excluded Groups) */}
              <div className="inline-form-row" style={{ borderBottom: 'none' }}>
                <div className="inline-label">
                  <label>Excluded Groups &amp; Roles</label>
                  <span className="inline-subtext">
                    Accounts in these security groups will bypass strict MFA enforcement. Press enter to add.
                  </span>
                </div>
                <div className="inline-control">
                  <div className="tag-input-container">
                    <div className="tag-list">
                      {excludedGroups.map((grp) => (
                        <span key={grp} className="tag-pill">
                          {grp}
                          <button
                            type="button"
                            className="tag-dismiss"
                            onClick={() => removeExcludedGroup(grp)}
                            aria-label={`Remove ${grp}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="tag-text-input"
                      placeholder="Type group name and press Enter..."
                      value={newExcludedTag}
                      onChange={(e) => setNewExcludedTag(e.target.value)}
                      onKeyDown={addExcludedGroup}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="config-form-footer">
              <button
                className="btn btn-outline"
                onClick={() => showToast('Changes discarded')}
              >
                Discard
              </button>
              <button
                className="btn btn-primary"
                onClick={() => showToast('MFA Enforcement Policy updated successfully')}
              >
                Save Changes
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
