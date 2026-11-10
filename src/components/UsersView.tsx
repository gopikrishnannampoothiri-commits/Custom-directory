import React, { useState } from 'react';
import { UserRecord } from '../types.ts';
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  MergeIcon,
  DotsIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SortChevronsIcon,
  UserCheckIcon,
  ShieldIcon
} from './icons.tsx';
import { EmptyState } from './EmptyState.tsx';

interface UsersViewProps {
  users: UserRecord[];
  onOpenMergeModal: (sourceUser?: UserRecord) => void;
  onOpenSplitAssignModal: () => void;
  showToast: (msg: string) => void;
  onDeleteUser: (id: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  onOpenMergeModal,
  onOpenSplitAssignModal,
  showToast,
  onDeleteUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserRecord | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [detailActionsOpen, setDetailActionsOpen] = useState(false);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.id));

  // Bulk actions
  const handleBulkActivate = () => {
    showToast(`Activated ${selectedUserIds.length} users successfully`);
    setSelectedUserIds([]);
  };

  const handleBulkDeactivate = () => {
    showToast(`Deactivated ${selectedUserIds.length} users`);
    setSelectedUserIds([]);
  };

  const handleBulkDelete = () => {
    selectedUserIds.forEach((id) => onDeleteUser(id));
    showToast(`Deleted ${selectedUserIds.length} user records`);
    setSelectedUserIds([]);
  };

  // ==========================================
  // COMPONENT SPEC 5: DETAILS / PROFILE VIEW
  // ==========================================
  if (selectedUserDetail) {
    const u = selectedUserDetail;
    return (
      <div className="user-profile-view">
        {/* Breadcrumbs */}
        <div className="breadcrumb">
          <a onClick={() => setSelectedUserDetail(null)}>Directory</a>
          <ChevronRightIcon size={12} />
          <a onClick={() => setSelectedUserDetail(null)}>Users</a>
          <ChevronRightIcon size={12} />
          <strong>{u.name}</strong>
        </div>

        {/* Profile Header Summary */}
        <div className="card profile-header-card" style={{ marginBottom: '20px' }}>
          <div className="profile-header-main">
            <div className="profile-avatar-container">
              <div className="profile-avatar" style={{ background: u.avatarBg }}>
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <span className={`status-indicator-dot dot-${u.status}`}></span>
            </div>
            <div className="profile-title-group">
              <div className="profile-name-row">
                <h2>{u.name}</h2>
                <span className={`pill ${u.status === 'active' ? 'pill-success' : u.status === 'inactive' ? 'pill-danger' : 'pill-warning'}`}>
                  {u.status === 'active' ? 'Active' : u.status === 'inactive' ? 'Inactive' : 'Pending Invite'}
                </span>
                {u.mfaEnabled && (
                  <span className="pill pill-info">
                    <ShieldIcon size={12} /> MFA Enforced
                  </span>
                )}
              </div>
              <div className="profile-meta-row">
                <span className="profile-email">{u.email}</span>
                <span className="meta-separator">•</span>
                <span className="profile-role">{u.role}</span>
                <span className="meta-separator">•</span>
                <span className="profile-dept">{u.department}</span>
              </div>
            </div>
            <div className="profile-actions-dropdown">
              <div className="dropdown">
                <button
                  className="btn btn-primary"
                  onClick={() => setDetailActionsOpen(!detailActionsOpen)}
                >
                  Actions <ChevronDownIcon size={14} />
                </button>
                {detailActionsOpen && (
                  <div className="dropdown-menu open" style={{ minWidth: '210px' }}>
                    <button onClick={() => { setDetailActionsOpen(false); showToast('Password reset link sent'); }}>
                      <LockIcon size={14} /> Reset Password
                    </button>
                    <button onClick={() => { setDetailActionsOpen(false); onOpenMergeModal(u); }}>
                      <MergeIcon size={14} /> Merge Account...
                    </button>
                    <button onClick={() => { setDetailActionsOpen(false); showToast('Assigned to new group'); }}>
                      <UserCheckIcon size={14} /> Assign Groups
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        setDetailActionsOpen(false);
                        onDeleteUser(u.id);
                        setSelectedUserDetail(null);
                        showToast(`Deleted ${u.name}`);
                      }}
                    >
                      <TrashIcon size={14} /> Delete User Record
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="profile-metrics-row" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-label">Status</div>
            <div className="metric-value" style={{ color: u.status === 'active' ? 'var(--success-text)' : 'var(--text)' }}>
              {u.status === 'active' ? 'Active' : u.status.charAt(0).toUpperCase() + u.status.slice(1)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Groups</div>
            <div className="metric-value">{u.groups.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Policies</div>
            <div className="metric-value">0{u.policiesCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Last Sign-in</div>
            <div className="metric-value">{u.lastSignIn}</div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="profile-sections-grid">
          {/* Section 1: Personal & Identity Information */}
          <div className="card profile-content-block">
            <div className="block-header">
              <h3>Personal Information</h3>
              <button className="ghost-edit-btn" onClick={() => showToast('Edit modal opened')}>
                <EditIcon size={13} /> Edit
              </button>
            </div>
            <div className="profile-kv-list">
              <div className="kv-row">
                <span className="kv-key">Full Legal Name</span>
                <span className="kv-val">{u.name}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">User Principal Name</span>
                <span className="kv-val font-mono">{u.email}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Primary Department</span>
                <span className="kv-val">{u.department}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Assigned Title</span>
                <span className="kv-val">{u.role}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Directory Source</span>
                <span className="kv-val">corp.hexnode.com (Synced)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Authentication Factors */}
          <div className="card profile-content-block">
            <div className="block-header">
              <h3>Security &amp; Authentication Factors</h3>
              <button className="ghost-edit-btn" onClick={() => showToast('MFA configuration opened')}>
                <EditIcon size={13} /> Configure
              </button>
            </div>
            <div className="profile-kv-list">
              <div className="kv-row">
                <span className="kv-key">FIDO2 WebAuthn Key</span>
                <span className="kv-val text-success">
                  <CheckIcon size={14} /> Registered (YubiKey 5 NFC)
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Authenticator TOTP</span>
                <span className="kv-val text-success">
                  <CheckIcon size={14} /> Active (Hexnode Authenticator)
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Password Status</span>
                <span className="kv-val">Compliant (Rotated 42 days ago)</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Risk Score</span>
                <span className="kv-val">
                  <span className="pill pill-success">Low Risk (0.02)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Group Memberships */}
          <div className="card profile-content-block" style={{ gridColumn: '1 / -1' }}>
            <div className="block-header">
              <h3>Assigned Groups ({u.groups.length})</h3>
              <button className="ghost-edit-btn" onClick={onOpenSplitAssignModal}>
                <PlusIcon size={13} /> Add to Group
              </button>
            </div>
            <div className="profile-tags-container">
              {u.groups.map((grp) => (
                <span key={grp} className="tag-pill">
                  {grp}
                  <button
                    className="tag-dismiss"
                    onClick={() => showToast(`Removed from ${grp}`)}
                    aria-label={`Remove from ${grp}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button className="btn btn-outline" onClick={() => setSelectedUserDetail(null)}>
            ← Back to Users Directory
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PATTERN A: STANDARD SINGLE PANEL / DATA VIEW
  // ==========================================
  return (
    <div className="standard-data-view">
      {/* Top Bar: Page Title on left, Search, filters, and primary action on right */}
      <div className="data-view-topbar">
        <div className="topbar-left">
          <h1>Users</h1>
        </div>
        <div className="topbar-right">
          {/* Search Input */}
          <div className="search-box">
            <SearchIcon size={15} />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="filter-select-wrap">
            <FilterIcon size={14} />
            <select
              className="select select-sm filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="pending">Pending Invite</option>
            </select>
          </div>

          {/* Secondary Action: Merge Accounts */}
          <button
            className="btn btn-outline"
            onClick={() => onOpenMergeModal()}
            title="Merge duplicate user accounts"
          >
            <MergeIcon size={15} /> Merge Accounts
          </button>

          {/* Primary Action Button */}
          <button
            className="btn btn-primary"
            onClick={() => showToast('New User form modal opened')}
          >
            <PlusIcon size={15} /> Add User
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (slides down when checkboxes are selected) */}
      {selectedUserIds.length > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-info">
            <span className="bulk-count">{selectedUserIds.length}</span> users selected
          </div>
          <div className="bulk-actions-group">
            <button className="bulk-btn" onClick={onOpenSplitAssignModal}>
              <UserCheckIcon size={14} /> Assign Group
            </button>
            <button className="bulk-btn" onClick={handleBulkActivate}>
              <CheckIcon size={14} /> Activate
            </button>
            <button className="bulk-btn" onClick={handleBulkDeactivate}>
              Deactivate
            </button>
            <button className="bulk-btn bulk-btn-danger" onClick={handleBulkDelete}>
              <TrashIcon size={14} /> Delete
            </button>
            <button className="bulk-btn bulk-btn-link" onClick={() => setSelectedUserIds([])}>
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Panel Container with Datatable */}
      <div className="card datatable-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No directory members match your search keywords or filter status."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '42px', paddingLeft: '16px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                  <th>
                    <div className="th-sortable">
                      User <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>
                    <div className="th-sortable">
                      Status <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>
                    <div className="th-sortable">
                      Department <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>
                    <div className="th-sortable">
                      Role / Title <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>
                    <div className="th-sortable">
                      Last Sign-in <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th style={{ width: '60px', textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  const isMenuOpen = openDropdownId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={isChecked ? 'row-selected' : ''}
                      onClick={() => setSelectedUserDetail(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td
                        style={{ paddingLeft: '16px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectUser(user.id)}
                        />
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-sm" style={{ background: user.avatarBg }}>
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {user.status === 'active' && (
                          <span className="pill pill-success">Active</span>
                        )}
                        {user.status === 'inactive' && (
                          <span className="pill pill-danger">Inactive</span>
                        )}
                        {user.status === 'pending' && (
                          <span className="pill pill-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <span className="pill pill-muted">{user.department}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {user.role}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {user.lastSignIn}
                      </td>
                      <td
                        style={{ textAlign: 'right', paddingRight: '16px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="dropdown" style={{ display: 'inline-block' }}>
                          <button
                            className="dir-card-menu"
                            onClick={() =>
                              setOpenDropdownId(isMenuOpen ? null : user.id)
                            }
                            aria-label="Row actions"
                          >
                            <DotsIcon size={16} />
                          </button>
                          {isMenuOpen && (
                            <div className="dropdown-menu open" style={{ right: 0, minWidth: '180px' }}>
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setSelectedUserDetail(user);
                                }}
                              >
                                <EditIcon size={14} /> View Details
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  showToast(`Password reset link generated for ${user.email}`);
                                }}
                              >
                                <LockIcon size={14} /> Reset Password
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onOpenMergeModal(user);
                                }}
                              >
                                <MergeIcon size={14} /> Merge Account
                              </button>
                              <button
                                className="danger"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onDeleteUser(user.id);
                                  showToast(`Deleted ${user.name}`);
                                }}
                              >
                                <TrashIcon size={14} /> Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination Bar: Page size dropdown on left, page numbers & arrows on right */}
        <div className="pagination-bar">
          <div className="pagination-left">
            <span className="pagination-label">Page Size</span>
            <select
              className="select select-sm pagination-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 ∨</option>
              <option value={20}>20 ∨</option>
              <option value={50}>50 ∨</option>
              <option value={100}>100 ∨</option>
            </select>
            <span className="pagination-total-text">
              Showing 1–{filteredUsers.length} of {users.length} items
            </span>
          </div>
          <div className="pagination-right">
            <button
              className="page-nav-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              &lt;
            </button>
            <button className="page-num-btn active">1</button>
            <button className="page-num-btn">2</button>
            <button className="page-num-btn">3</button>
            <span className="page-ellipsis">...</span>
            <button className="page-num-btn">6</button>
            <button
              className="page-nav-btn"
              onClick={() => setCurrentPage((p) => p + 1)}
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
