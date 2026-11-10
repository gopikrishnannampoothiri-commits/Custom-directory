import React, { useState } from 'react';
import { OuNode, UserRecord } from '../types.ts';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  GlobeIcon,
  DotsIcon,
  ShieldIcon,
  EditIcon,
  TrashIcon,
  SortChevronsIcon
} from './icons.tsx';

interface OrganizationalUnitsViewProps {
  ouTree: OuNode;
  users: UserRecord[];
  showToast: (msg: string) => void;
}

export const OrganizationalUnitsView: React.FC<OrganizationalUnitsViewProps> = ({
  ouTree,
  users,
  showToast
}) => {
  const [selectedDomain, setSelectedDomain] = useState('corp.hexnode.com');
  const [selectedOu, setSelectedOu] = useState<OuNode>(ouTree.children?.[0] || ouTree);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['ou_root', 'ou_eng']);
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'policies' | 'settings'>('users');
  const [treeSearch, setTreeSearch] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Domains / Root sources list (Panel 1)
  const rootSources = [
    { id: 'corp.hexnode.com', name: 'corp.hexnode.com', type: 'Active Directory (Root)', status: 'Active', count: '58 OUs' },
    { id: 'apac.hexnode.com', name: 'apac.hexnode.com', type: 'Regional Subsidiary', status: 'Active', count: '14 OUs' },
    { id: 'eu-sub.hexnode.com', name: 'eu-sub.hexnode.com', type: 'Federated Domain', status: 'Active', count: '8 OUs' },
    { id: 'meridian.cloud', name: 'Meridian Cloud IdP', type: 'SCIM Synced Provider', status: 'Active', count: '6 OUs' }
  ];

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  // Render tree node recursively
  const renderTreeNode = (node: OuNode, depth: number = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const isSelected = selectedOu.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    // Filter node check if search is typed
    const matchesSearch =
      treeSearch === '' || node.name.toLowerCase().includes(treeSearch.toLowerCase());

    return (
      <div key={node.id} className="tree-node-wrapper" style={{ display: matchesSearch ? 'block' : 'none' }}>
        <div
          className={`tree-node-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 18 + 10}px` }}
          onClick={() => setSelectedOu(node)}
        >
          {hasChildren ? (
            <button
              className="tree-expand-btn"
              onClick={(e) => toggleExpand(node.id, e)}
              aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
            >
              {isExpanded ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
            </button>
          ) : (
            <span className="tree-expand-placeholder"></span>
          )}

          <span className="tree-node-icon">
            {isSelected || isExpanded ? <FolderOpenIcon size={15} /> : <FolderIcon size={15} />}
          </span>

          <span className="tree-node-title">{node.name}</span>

          {/* Item counter tag e.g. Sales ↗02 */}
          <span className="tree-counter-tag">
            ↗{String(node.itemCount).padStart(2, '0')}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-children-container">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter users inside selected OU
  const ouUsers = users.filter((u) => {
    if (selectedOu.name === 'Global HQ') return true;
    return u.department.toLowerCase().includes(selectedOu.name.toLowerCase().split(' ')[0]);
  });

  return (
    <div className="ou-hierarchy-screen">
      {/* Breadcrumbs */}
      <div className="breadcrumb" style={{ marginBottom: '16px' }}>
        <span>Directory</span>
        <ChevronRightIcon size={12} />
        <span>Organizational Units</span>
        <ChevronRightIcon size={12} />
        <span>{selectedDomain}</span>
        <ChevronRightIcon size={12} />
        <strong>{selectedOu.name}</strong>
      </div>

      {/* Pattern C: Three-Panel Organizational Hierarchy Layout */}
      <div className="three-panel-container">
        {/* PANEL 1: Root List (~20% Width) */}
        <aside className="panel-col panel-root-list">
          <div className="panel-col-header">
            <h3>Directory Sources</h3>
          </div>
          <div className="root-source-list">
            {rootSources.map((src) => (
              <div
                key={src.id}
                className={`root-source-item ${selectedDomain === src.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDomain(src.id);
                  showToast(`Switched source to ${src.name}`);
                }}
              >
                <div className="root-item-top">
                  <span className="root-icon">
                    <GlobeIcon size={14} />
                  </span>
                  <strong className="root-name">{src.name}</strong>
                </div>
                <div className="root-item-meta">
                  <span>{src.type}</span>
                  <span className="pill pill-success" style={{ padding: '1px 7px', fontSize: '10.5px' }}>
                    {src.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="panel-col-footer">
            <button className="btn btn-outline btn-block btn-sm" onClick={() => showToast('Connect new domain modal')}>
              <PlusIcon size={13} /> Add Domain
            </button>
          </div>
        </aside>

        {/* PANEL 2: Tree-View Folder Navigation (~25% Width) */}
        <aside className="panel-col panel-tree-view">
          <div className="panel-col-header">
            <h3>OU Hierarchy</h3>
            <button
              className="icon-btn"
              title="Add Sub-OU to current"
              onClick={() => showToast(`Add new child OU under ${selectedOu.name}`)}
            >
              <PlusIcon size={14} />
            </button>
          </div>

          <div className="tree-search-wrap">
            <SearchIcon size={14} />
            <input
              type="text"
              placeholder="Search OU folders..."
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
            />
          </div>

          <div className="tree-scroll-container">
            {renderTreeNode(ouTree)}
          </div>
        </aside>

        {/* PANEL 3: Selected Node Content Panel (~55% Width) */}
        <section className="panel-col panel-content-view">
          {/* Header Summary */}
          <div className="node-summary-card">
            <div className="node-summary-top">
              <div className="node-title-group">
                <div className="node-icon-large">
                  <FolderOpenIcon size={22} />
                </div>
                <div>
                  <h2 className="node-title">{selectedOu.name}</h2>
                  <div className="node-path font-mono">{selectedOu.path}</div>
                </div>
              </div>
              <div className="node-action-buttons">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => showToast(`Moved ${selectedOu.name}`)}
                >
                  Move Node
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => showToast(`Add sub-OU inside ${selectedOu.name}`)}
                >
                  <PlusIcon size={13} /> Add Sub-OU
                </button>
              </div>
            </div>

            {/* Metric counters */}
            <div className="node-metric-pills">
              <span className="node-metric-pill">
                <strong>{selectedOu.usersCount}</strong> Assigned Users
              </span>
              <span className="node-metric-pill">
                <strong>{selectedOu.groupsCount}</strong> Security Groups
              </span>
              <span className="node-metric-pill">
                <strong>{selectedOu.policiesCount}</strong> Inherited Policies
              </span>
            </div>
          </div>

          {/* Tabbed Navigation */}
          <div className="tabs" style={{ padding: '0 20px', marginBottom: '0' }}>
            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users ({ouUsers.length})
            </button>
            <button
              className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              Assigned Groups ({selectedOu.groupsCount})
            </button>
            <button
              className={`tab ${activeTab === 'policies' ? 'active' : ''}`}
              onClick={() => setActiveTab('policies')}
            >
              Applied Policies ({selectedOu.policiesCount})
            </button>
            <button
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              OU Settings
            </button>
          </div>

          {/* Nested Datatables */}
          <div className="node-tab-content">
            {activeTab === 'users' && (
              <div className="nested-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-sortable">
                          Member <SortChevronsIcon size={12} />
                        </div>
                      </th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ width: '50px', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ouUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          No members in this OU branch.
                        </td>
                      </tr>
                    ) : (
                      ouUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-sm" style={{ background: user.avatarBg }}>
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600 }}>{user.name}</span>
                            </div>
                          </td>
                          <td className="font-mono" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {user.email}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{user.role}</td>
                          <td>
                            <span className={`pill ${user.status === 'active' ? 'pill-success' : 'pill-muted'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="dropdown" style={{ display: 'inline-block' }}>
                              <button
                                className="dir-card-menu"
                                onClick={() =>
                                  setOpenDropdownId(openDropdownId === user.id ? null : user.id)
                                }
                              >
                                <DotsIcon size={15} />
                              </button>
                              {openDropdownId === user.id && (
                                <div className="dropdown-menu open" style={{ right: 0, minWidth: '150px' }}>
                                  <button onClick={() => { setOpenDropdownId(null); showToast(`Reassigning ${user.name}`); }}>
                                    <EditIcon size={13} /> Move User
                                  </button>
                                  <button
                                    className="danger"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      showToast(`Removed ${user.name} from OU`);
                                    }}
                                  >
                                    <TrashIcon size={13} /> Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="nested-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Type</th>
                      <th>Scope</th>
                      <th>Sync Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{selectedOu.name} Primary Team</strong></td>
                      <td><span className="pill pill-info">Security</span></td>
                      <td>Direct OU Membership</td>
                      <td><span className="pill pill-success">Synced</span></td>
                    </tr>
                    <tr>
                      <td><strong>{selectedOu.name} Elevated Operators</strong></td>
                      <td><span className="pill pill-warning">Privileged</span></td>
                      <td>Inherited from Root</td>
                      <td><span className="pill pill-success">Synced</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="nested-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy Name</th>
                      <th>Enforcement</th>
                      <th>Inheritance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600 }}>Default Corporate MFA Policy</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>FIDO2 / WebAuthn mandatory for cloud apps</div>
                      </td>
                      <td><span className="pill pill-danger">Mandatory</span></td>
                      <td>Inherited from Global HQ</td>
                      <td><span className="pill pill-success">Enforced</span></td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600 }}>Session Lifetime 8-Hour Maximum</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Forces re-authentication after inactivity</div>
                      </td>
                      <td><span className="pill pill-warning">Adaptive</span></td>
                      <td>Applied at OU Level</td>
                      <td><span className="pill pill-success">Enforced</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ padding: '20px' }}>
                <div className="inline-form-row">
                  <div className="inline-label">
                    <label>OU Display Name <span className="req-star">*</span></label>
                  </div>
                  <div className="inline-control">
                    <input className="input" defaultValue={selectedOu.name} />
                  </div>
                </div>

                <div className="inline-form-row">
                  <div className="inline-label">
                    <label>Distinguished Path</label>
                  </div>
                  <div className="inline-control">
                    <input className="input mono" defaultValue={selectedOu.path} disabled />
                  </div>
                </div>

                <div className="inline-form-row" style={{ borderBottom: 'none' }}>
                  <div className="inline-label">
                    <label>Policy Inheritance</label>
                    <span className="inline-subtext">Inherit higher-level policies from parent organizational units</span>
                  </div>
                  <div className="inline-control">
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-track"></span>
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('Changes discarded')}>
                    Discard
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => showToast('OU configuration saved')}>
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
