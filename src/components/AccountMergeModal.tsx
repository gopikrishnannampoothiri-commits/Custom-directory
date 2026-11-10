import React, { useState } from 'react';
import { UserRecord } from '../types.ts';
import { CloseIcon, AlertIcon, ArrowRightIcon } from './icons.tsx';

interface AccountMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUser?: UserRecord | null;
  targetUser?: UserRecord | null;
  allUsers: UserRecord[];
  onConfirmMerge: (sourceId: string, targetId: string) => void;
}

export const AccountMergeModal: React.FC<AccountMergeModalProps> = ({
  isOpen,
  onClose,
  sourceUser: initialSource,
  targetUser: initialTarget,
  allUsers,
  onConfirmMerge
}) => {
  const [sourceId, setSourceId] = useState<string>(initialSource?.id || allUsers[1]?.id || '');
  const [targetId, setTargetId] = useState<string>(initialTarget?.id || allUsers[0]?.id || '');
  const [mfaOption, setMfaOption] = useState<'keep_target' | 'merge_both'>('merge_both');
  const [groupsOption, setGroupsOption] = useState<'union' | 'replace'>('union');

  if (!isOpen) return null;

  const currentSource = allUsers.find((u) => u.id === sourceId) || allUsers[1] || allUsers[0];
  const currentTarget = allUsers.find((u) => u.id === targetId) || allUsers[0];

  const handleConfirm = () => {
    onConfirmMerge(currentSource.id, currentTarget.id);
    onClose();
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-box modal-box-merge" style={{ width: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Merge User Accounts</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="alert-banner alert-banner-warning">
          <span className="alert-banner-icon">
            <AlertIcon size={18} />
          </span>
          <div className="alert-banner-content">
            <strong>Permanent Account Consolidation</strong>
            <p>
              Merging will transfer group memberships, applied policies, and MFA tokens from the source account into the primary target account. The source account will be archived and deactivated.
            </p>
          </div>
        </div>

        {/* Visual Link Component (Account Merge) */}
        <div className="merge-visual-container">
          {/* Source Account Card */}
          <div className="merge-user-card">
            <div className="merge-card-badge badge-source">Source (To Deactivate)</div>
            <div className="merge-avatar-wrap">
              <div className="merge-avatar" style={{ background: currentSource.avatarBg }}>
                {currentSource.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="merge-user-name">{currentSource.name}</div>
            <div className="merge-user-email">{currentSource.email}</div>
            <div className="merge-user-meta">
              <span className="pill pill-muted">{currentSource.department}</span>
              <span className="pill pill-info">{currentSource.groups.length} Groups</span>
            </div>
            <div className="merge-select-field">
              <label>Select source:</label>
              <select
                className="select select-sm"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                {allUsers
                  .filter((u) => u.id !== targetId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Directional Connector: horizontal dashed line & directional arrow (· · →) */}
          <div className="merge-connector-track">
            <div className="merge-connector-line"></div>
            <div className="merge-connector-badge">
              <span className="dots">· ·</span>
              <ArrowRightIcon size={16} />
            </div>
            <span className="merge-connector-label">Merges Into</span>
          </div>

          {/* Target Account Card */}
          <div className="merge-user-card target-card">
            <div className="merge-card-badge badge-target">Target (Primary Identity)</div>
            <div className="merge-avatar-wrap">
              <div className="merge-avatar" style={{ background: currentTarget.avatarBg }}>
                {currentTarget.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="merge-user-name">{currentTarget.name}</div>
            <div className="merge-user-email">{currentTarget.email}</div>
            <div className="merge-user-meta">
              <span className="pill pill-success">Retains Identity</span>
              <span className="pill pill-info">{currentTarget.groups.length} Groups</span>
            </div>
            <div className="merge-select-field">
              <label>Select target:</label>
              <select
                className="select select-sm"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                {allUsers
                  .filter((u) => u.id !== sourceId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Conflict Resolution Settings */}
        <div className="card merge-options-card" style={{ marginTop: '18px', padding: '16px' }}>
          <div className="inline-form-row">
            <div className="inline-label">
              <label>MFA Factors &amp; Tokens <span className="req-star">*</span></label>
              <span className="inline-subtext">Determine how enrolled authenticators are combined</span>
            </div>
            <div className="inline-control">
              <select
                className="select"
                value={mfaOption}
                onChange={(e) => setMfaOption(e.target.value as any)}
              >
                <option value="merge_both">Combine all registered factors from both accounts</option>
                <option value="keep_target">Keep only target account authenticator keys</option>
              </select>
            </div>
          </div>

          <div className="inline-form-row" style={{ borderBottom: 'none' }}>
            <div className="inline-label">
              <label>Group Memberships <span className="req-star">*</span></label>
              <span className="inline-subtext">Rule for reconciling assigned security groups</span>
            </div>
            <div className="inline-control">
              <select
                className="select"
                value={groupsOption}
                onChange={(e) => setGroupsOption(e.target.value as any)}
              >
                <option value="union">Union: combine all groups from source &amp; target</option>
                <option value="replace">Retain only primary target groups</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ marginTop: '24px' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm &amp; Merge Accounts
          </button>
        </div>
      </div>
    </div>
  );
};
