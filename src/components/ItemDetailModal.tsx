import React from 'react';
import { CloseIcon } from './icons.tsx';
import { assetTables, spConfigFor, mockAssignees } from '../data/mockData.ts';

interface ItemDetailModalProps {
  item: { category: 'apps' | 'policies' | 'factors' | 'roles'; index: number } | null;
  onClose: () => void;
  showToast: (msg: string) => void;
}

function confidencePillClass(c: string) {
  return c === 'High' ? 'pill-success' : 'pill-warning';
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, showToast }) => {
  if (!item) return null;

  const { category, index } = item;
  const row = assetTables[category][index];
  if (!row) return null;

  const renderContent = () => {
    if (category === 'apps') {
      const app = row as (typeof assetTables.apps)[0];
      const sp = spConfigFor(app.name);
      return (
        <>
          <div className="detail-pills">
            <span className={`pill ${confidencePillClass(app.confidence)}`}>
              {app.confidence} confidence
            </span>
            <span className="pill pill-info">{app.protocol}</span>
            <span className="pill pill-muted">{app.category}</span>
          </div>
          <div className="detail-section">
            <h4>Overview</h4>
            <div className="detail-kv">
              <span className="k">Assigned users</span>
              <span className="v">{app.users.toLocaleString()}</span>
            </div>
            <div className="detail-kv">
              <span className="k">Status in Meridian ID</span>
              <span className="v">{app.status}</span>
            </div>
            <div className="detail-kv">
              <span className="k">Detected from</span>
              <span className="v">/apps/v1/connections</span>
            </div>
            {app.warn && (
              <div className="detail-kv">
                <span className="k">Migration note</span>
                <span className="v" style={{ color: 'var(--warning-text)' }}>
                  {app.warn}
                </span>
              </div>
            )}
          </div>
          <div className="detail-section">
            <h4>Complete setup in {app.name}</h4>
            <p className="section-desc" style={{ marginBottom: '10px' }}>
              Importing this app into Hexnode doesn't automatically re-point {app.name} — add these values to its SAML/SSO settings so it trusts Hexnode IdP.
            </p>
            <div className="sp-config-box">
              <div className="sp-config-row">
                <span className="k">Entity ID / Issuer</span>
                <span className="v">{sp.entityId}</span>
              </div>
              <div className="sp-config-row">
                <span className="k">Single sign-on URL</span>
                <span className="v">{sp.ssoUrl}</span>
              </div>
              <div className="sp-config-row">
                <span className="k">Signing certificate</span>
                <span className="v">{sp.cert}</span>
              </div>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => showToast('Configuration values copied')}
              >
                Copy values
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => showToast('Certificate download started')}
              >
                Download certificate
              </button>
            </div>
          </div>
        </>
      );
    }

    if (category === 'policies') {
      const pol = row as (typeof assetTables.policies)[0];
      return (
        <>
          <div className="detail-pills">
            <span className={`pill ${confidencePillClass(pol.confidence)}`}>
              {pol.confidence} confidence
            </span>
            <span className="pill pill-info">{pol.type}</span>
            <span className={`pill ${pol.enforcement === 'Enforced' ? 'pill-success' : 'pill-muted'}`}>
              {pol.enforcement}
            </span>
          </div>
          <div className="detail-section">
            <h4>Applies to</h4>
            <div className="detail-kv">
              <span className="k">Scope</span>
              <span className="v">{pol.appliesTo}</span>
            </div>
          </div>
          <div className="detail-section">
            <h4>Policy rules</h4>
            {pol.rules.map((r, i) => (
              <div className="detail-kv" key={i}>
                <span className="k">{r[0]}</span>
                <span className="v">{r[1]}</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (category === 'factors') {
      const fac = row as (typeof assetTables.factors)[0];
      return (
        <>
          <div className="detail-pills">
            <span className={`pill ${confidencePillClass(fac.confidence)}`}>
              {fac.confidence} confidence
            </span>
            <span className={`pill ${fac.required === 'Required' ? 'pill-info' : 'pill-muted'}`}>
              {fac.required}
            </span>
          </div>
          <div className="detail-section">
            <h4>Overview</h4>
            <div className="detail-kv">
              <span className="k">Enrolled users</span>
              <span className="v">{fac.enrolled.toLocaleString()}</span>
            </div>
          </div>
          <div className="detail-section">
            <h4>Referenced by</h4>
            {fac.usedBy.map((p, i) => (
              <div className="detail-kv" key={i}>
                <span className="k">Policy</span>
                <span className="v">{p}</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (category === 'roles') {
      const role = row as (typeof assetTables.roles)[0];
      const names = mockAssignees.slice(0, Math.min(role.users, 8));
      const extraCount = role.users - names.length;
      return (
        <>
          <div className="detail-pills">
            <span className={`pill ${confidencePillClass(role.confidence)}`}>
              {role.confidence} confidence
            </span>
            <span className="pill pill-info">{role.permissionLevel}</span>
          </div>
          <div className="detail-section">
            <h4>Overview</h4>
            <div className="detail-kv">
              <span className="k">Scope</span>
              <span className="v">{role.scope}</span>
            </div>
            <div className="detail-kv">
              <span className="k">Assigned users</span>
              <span className="v">{role.users}</span>
            </div>
          </div>
          <div className="detail-section">
            <h4>Assigned to</h4>
            {names.map((n, i) => (
              <span className="assignee-chip" key={i}>
                {n}
              </span>
            ))}
            {extraCount > 0 && <span className="assignee-chip">+{extraCount} more</span>}
          </div>
        </>
      );
    }

    return null;
  };

  const title =
    category === 'factors'
      ? (row as (typeof assetTables.factors)[0]).type
      : (row as { name: string }).name;

  return (
    <div
      className="modal-overlay open"
      id="modal-item-detail"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-detail">
        <div className="modal-header">
          <h2 id="item-detail-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
