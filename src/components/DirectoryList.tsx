import React from 'react';
import {
  PlusIcon,
  DirectoryArchiveIcon,
  LinkIcon,
  DotsIcon,
  CheckIcon
} from './icons.tsx';

interface DirectoryListProps {
  onOpenAddModal: () => void;
  onOpenDashboard: () => void;
  showToast: (msg: string) => void;
  configuredDirectory?: {
    integrationName: string;
    idpName: string;
    baseUrl: string;
    status: 'active' | 'partial';
  } | null;
}

export const DirectoryList: React.FC<DirectoryListProps> = ({
  onOpenAddModal,
  onOpenDashboard,
  showToast,
  configuredDirectory = null
}) => {
  return (
    <section className="screen active" id="screen-list" style={{ width: '100%' }}>
      {/* Header Layout */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '24px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              letterSpacing: '-0.015em'
            }}
          >
            Directory Integration
          </h1>
          <span className="pill pill-info" style={{ fontSize: '11.5px' }}>
            Federated &amp; Custom IdP
          </span>
        </div>
        <button
          className="btn btn-primary"
          onClick={onOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1D4ED8',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 500,
            padding: '9px 18px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <PlusIcon size={16} /> Add Directory
        </button>
      </div>

      {/* Main Content Area: Default Empty State as in Screenshot 1 */}
      {!configuredDirectory ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            minHeight: '460px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          {/* Centered light-grey circular icon badge */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}
          >
            <DirectoryArchiveIcon size={34} color="#9CA3AF" />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 8px 0'
            }}
          >
            No Directories Configured
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '14px',
              color: '#6B7280',
              maxWidth: '480px',
              lineHeight: 1.5,
              margin: '0 0 24px 0'
            }}
          >
            Connect an identity provider to automate user provisioning, group sync, and federated authentication.
          </p>

          {/* Primary Action Button */}
          <button
            className="btn btn-primary"
            onClick={onOpenAddModal}
            style={{
              backgroundColor: '#1D4ED8',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 22px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            Add new directory
          </button>
        </div>
      ) : (
        /* Configured State when directory exists */
        <div className="dirlist-section">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#111827'
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LinkIcon size={16} />
            </span>
            Custom Directory Integrations
          </div>
          <div className="dir-card-row">
            <div
              className="dir-card clickable"
              onClick={onOpenDashboard}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer'
              }}
            >
              <div className="dir-card-top" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>
                    {configuredDirectory.integrationName || configuredDirectory.idpName}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '2px' }}>
                    {configuredDirectory.baseUrl}
                  </div>
                </div>
                <button
                  className="dir-card-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('Directory options menu');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  <DotsIcon size={18} />
                </button>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span
                  className={`pill ${
                    configuredDirectory.status === 'active' ? 'pill-success' : 'pill-info'
                  }`}
                >
                  {configuredDirectory.status === 'active' ? (
                    <>
                      <CheckIcon size={12} /> Active
                    </>
                  ) : (
                    'Partial Setup'
                  )}
                </span>
              </div>
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E5E7EB',
                  color: '#6B7280',
                  fontSize: '12.5px'
                }}
              >
                Last sync: Just now — Click to open integration dashboard
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
