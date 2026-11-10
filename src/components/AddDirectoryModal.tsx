import React from 'react';
import {
  CloseIcon,
  GoogleLogoIcon,
  EntraLogoIcon,
  OktaLogoIcon,
  SparkleIcon,
  MultiSparkleIcon
} from './icons.tsx';

interface AddDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustom: () => void;
  showToast: (msg: string) => void;
}

export const AddDirectoryModal: React.FC<AddDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCustom,
  showToast
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      id="modal-add-directory"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999
      }}
    >
      <div
        className="modal-box"
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '680px',
          maxWidth: '92vw',
          padding: '24px 28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid #E5E7EB',
            marginBottom: '24px'
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0
            }}
          >
            Select Identity Provider
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Top Provider Grid (3 cards) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          {/* 1. Google Workspace */}
          <div
            onClick={() => {
              onClose();
              showToast('Google Workspace integration coming soon');
            }}
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              <GoogleLogoIcon size={24} />
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                textAlign: 'center'
              }}
            >
              Google Workspace
            </span>
          </div>

          {/* 2. Microsoft Entra */}
          <div
            onClick={() => {
              onClose();
              showToast('Microsoft Entra ID integration coming soon');
            }}
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#F0F9FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              <EntraLogoIcon size={26} />
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                textAlign: 'center'
              }}
            >
              Microsoft Entra
            </span>
          </div>

          {/* 3. Okta */}
          <div
            onClick={() => {
              onClose();
              showToast('Okta integration coming soon');
            }}
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#F0F9FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              <OktaLogoIcon size={26} />
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                textAlign: 'center'
              }}
            >
              Okta
            </span>
          </div>
        </div>

        {/* Center Divider Line: OR BUILD A CUSTOM INTEGRATION */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            margin: '24px 0'
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: '#6B7280',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            OR BUILD A CUSTOM INTEGRATION
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
        </div>

        {/* Custom Integration Card (Screenshot 2) */}
        <div
          onClick={() => {
            onClose();
            onSelectCustom();
          }}
          style={{
            backgroundColor: '#FAF5FF',
            border: '1px solid #DDD6FE',
            borderRadius: '8px',
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5EEFD';
            e.currentTarget.style.borderColor = '#C4B5FD';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FAF5FF';
            e.currentTarget.style.borderColor = '#DDD6FE';
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}
            >
              <MultiSparkleIcon size={18} color="#7C3AED" />
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#7C3AED'
                }}
              >
                Custom Identity Connector
              </span>
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: '#4B5563',
                lineHeight: 1.4
              }}
            >
              Connect any directory via SCIM v2 / REST with automated Genie assistance
            </div>
          </div>
          <div style={{ paddingLeft: '16px', flexShrink: 0 }}>
            <SparkleIcon size={20} color="#7C3AED" />
          </div>
        </div>
      </div>
    </div>
  );
};
