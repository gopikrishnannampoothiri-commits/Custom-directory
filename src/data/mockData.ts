import { SsoApp, SecurityPolicy, AuthFactor, RoleAssignment, MappingRow } from '../types.ts';

export const initialMappingData: Record<'users' | 'groups' | 'ou', MappingRow[]> = {
  users: [
    { hexnodeAttr: 'email*', externalAttr: 'User Principal Name', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'username*', externalAttr: 'Unique Username', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'phone_number*', externalAttr: 'Contact Number', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'role*', externalAttr: 'User Role', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'department*', externalAttr: 'Department Name', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'status*', externalAttr: 'User Status', dataType: 'Boolean', transformation: 'Direct' },
    { hexnodeAttr: 'last_login*', externalAttr: 'Last Login Date', dataType: 'DateTime', transformation: 'Indirect' }
  ],
  groups: [
    { hexnodeAttr: 'group_name*', externalAttr: 'name', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'group_id*', externalAttr: 'id', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'description', externalAttr: 'description', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'member_count', externalAttr: 'members.length', dataType: 'Number', transformation: 'Indirect' },
    { hexnodeAttr: 'group_type', externalAttr: 'groupType', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'created_date', externalAttr: 'createdDate', dataType: 'DateTime', transformation: 'Direct' }
  ],
  ou: [
    { hexnodeAttr: 'ou_name*', externalAttr: 'name', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'ou_id*', externalAttr: 'id', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'parent_ou_path', externalAttr: 'parentPath', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'description', externalAttr: 'description', dataType: 'String', transformation: 'Direct' },
    { hexnodeAttr: 'member_count', externalAttr: 'memberCount', dataType: 'Number', transformation: 'Direct' }
  ]
};

export const discoverCards = [
  { key: 'apps', name: 'SSO Applications', count: '14 apps detected', status: 'ready', icon: 'grid' },
  { key: 'policies', name: 'Security Policies', count: '6 policies detected', status: 'ready', icon: 'shield' },
  { key: 'factors', name: 'Authentication Factors', count: '4 factor types detected', status: 'ready', icon: 'key' },
  { key: 'roles', name: 'Roles & Technicians', count: '8 role assignments detected', status: 'ready', icon: 'users' },
  { key: 'devicepolicies', name: 'Device Policies', count: 'Not available via detected API', status: 'unsupported', icon: 'shield' }
];

export const assetTables: {
  apps: SsoApp[];
  policies: SecurityPolicy[];
  factors: AuthFactor[];
  roles: RoleAssignment[];
} = {
  apps: [
    { name: 'Salesforce', protocol: 'SAML 2.0', users: 342, category: 'CRM', status: 'Active', confidence: 'High' },
    { name: 'Slack', protocol: 'OIDC', users: 891, category: 'Communication', status: 'Active', confidence: 'High' },
    { name: 'Workday', protocol: 'SAML 2.0', users: 1248, category: 'HR', status: 'Active', confidence: 'Medium', conflict: true },
    { name: 'Zoom', protocol: 'OIDC', users: 1102, category: 'Communication', status: 'Active', confidence: 'High' },
    { name: 'GitHub Enterprise', protocol: 'SAML 2.0', users: 88, category: 'Development', status: 'Active', confidence: 'High' },
    { name: 'Jira', protocol: 'SAML 2.0', users: 214, category: 'Development', status: 'Active', confidence: 'High' },
    { name: 'Confluence', protocol: 'SAML 2.0', users: 198, category: 'Development', status: 'Active', confidence: 'High' },
    { name: 'Notion', protocol: 'OIDC', users: 156, category: 'Productivity', status: 'Active', confidence: 'High' },
    { name: 'Figma', protocol: 'OIDC', users: 64, category: 'Design', status: 'Active', confidence: 'High' },
    { name: 'Zendesk', protocol: 'SAML 2.0', users: 47, category: 'Support', status: 'Active', confidence: 'High' },
    { name: 'DocuSign', protocol: 'SAML 2.0', users: 312, category: 'Legal', status: 'Active', confidence: 'High' },
    { name: 'Box', protocol: 'SAML 2.0', users: 530, category: 'Storage', status: 'Active', confidence: 'High' },
    { name: 'Tableau', protocol: 'SAML 2.0', users: 76, category: 'Analytics', status: 'Active', confidence: 'High' },
    { name: 'Legacy Portal', protocol: 'SAML 2.0', users: 12, category: 'Internal Tools', status: 'Active', confidence: 'Needs review', warn: 'No valid ACS URL — will be skipped' }
  ],
  policies: [
    {
      name: 'Password Complexity Policy',
      type: 'Password',
      appliesTo: 'All Users',
      enforcement: 'Enforced',
      confidence: 'High',
      rules: [
        ['Minimum length', '12 characters'],
        ['Complexity', 'Upper, lower, number, symbol'],
        ['Expiry', '90 days'],
        ['History', 'Last 5 passwords blocked']
      ]
    },
    {
      name: 'MFA Enforcement Policy',
      type: 'MFA',
      appliesTo: 'All Users',
      enforcement: 'Enforced',
      confidence: 'High',
      rules: [
        ['Required factors', 'Any 1 of: TOTP, Push, WebAuthn'],
        ['Grace period', '7 days for new users']
      ]
    },
    {
      name: 'Session Timeout Policy',
      type: 'Session',
      appliesTo: 'All Users',
      enforcement: 'Enforced',
      confidence: 'High',
      rules: [
        ['Idle timeout', '30 minutes'],
        ['Max session length', '12 hours'],
        ['Concurrent sessions', '3 allowed']
      ]
    },
    {
      name: 'Conditional Access — Executive Team',
      type: 'Conditional Access',
      appliesTo: 'Executive OU',
      enforcement: 'Enforced',
      confidence: 'High',
      rules: [
        ['Condition', 'Untrusted network or new device'],
        ['Action', 'Require step-up MFA']
      ]
    },
    {
      name: 'Contractor Access Policy',
      type: 'Conditional Access',
      appliesTo: 'Contractors Group',
      enforcement: 'Enforced',
      confidence: 'Medium',
      conflict: true,
      rules: [
        ['Condition', 'Outside business hours'],
        ['Action', 'Block access']
      ]
    },
    {
      name: 'Legacy Password Policy',
      type: 'Password',
      appliesTo: 'APAC OU',
      enforcement: 'Report-only',
      confidence: 'High',
      rules: [
        ['Minimum length', '8 characters'],
        ['Complexity', 'Upper, lower, number'],
        ['Expiry', '180 days'],
        ['History', 'Last 2 passwords blocked']
      ]
    }
  ],
  factors: [
    { type: 'TOTP Authenticator App', enrolled: 864, required: 'Required', confidence: 'High', usedBy: ['MFA Enforcement Policy'] },
    { type: 'SMS OTP', enrolled: 412, required: 'Optional', confidence: 'High', usedBy: ['MFA Enforcement Policy'] },
    { type: 'Push Notification', enrolled: 230, required: 'Optional', confidence: 'High', usedBy: ['MFA Enforcement Policy', 'Conditional Access — Executive Team'] },
    { type: 'WebAuthn / Passkey', enrolled: 96, required: 'Optional', confidence: 'Medium', usedBy: ['MFA Enforcement Policy'] }
  ],
  roles: [
    { name: 'Global Admin', users: 4, scope: 'Full tenant', permissionLevel: 'Full Admin', confidence: 'High' },
    { name: 'Helpdesk Technician — APAC', users: 11, scope: 'APAC OU', permissionLevel: 'Technician', confidence: 'High' },
    { name: 'Device Manager — EU', users: 6, scope: 'EU OU', permissionLevel: 'Technician', confidence: 'High' },
    { name: 'Read-Only Auditor', users: 3, scope: 'Full tenant', permissionLevel: 'Viewer', confidence: 'High' },
    { name: 'Helpdesk Technician — AMER', users: 9, scope: 'AMER OU', permissionLevel: 'Technician', confidence: 'High' },
    { name: 'App Manager', users: 5, scope: 'SSO Apps', permissionLevel: 'Technician', confidence: 'High' },
    { name: 'Security Admin', users: 2, scope: 'Full tenant', permissionLevel: 'Full Admin', confidence: 'High' },
    { name: 'Billing Admin', users: 1, scope: 'Full tenant', permissionLevel: 'Technician', confidence: 'Medium', conflict: true }
  ]
};

export const mockAssignees = [
  'Amelia Tan', 'Raj Patel', 'Sofia Lopez', 'Noah Becker', 'Priya Nair',
  'Liam Johnson', 'Emma Wilson', 'Carlos Mendez', 'Yuki Tanaka',
  'Olivia Brown', 'Ethan Clarke', 'Mia Rodriguez'
];

export function spConfigFor(appName: string) {
  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-)$/g, '');
  return {
    entityId: `https://idp.hexnode.com/saml/${slug}/metadata`,
    ssoUrl: `https://idp.hexnode.com/saml/${slug}/sso`,
    cert: 'hexnode-idp-signing.pem'
  };
}

export const dashUsers: [string, string, string, string][] = [
  ['Amelia Tan', 'amelia.tan@acme.com', 'Finance', 'Active'],
  ['Raj Patel', 'raj.patel@acme.com', 'Engineering', 'Active'],
  ['Sofia Lopez', 'sofia.lopez@acme.com', 'Sales — APAC', 'Suspended'],
  ['Noah Becker', 'noah.becker@acme.com', 'Customer Success', 'Active'],
  ['Priya Nair', 'priya.nair@acme.com', 'Engineering', 'Active']
];

export const dashGroups: [string, string, string][] = [
  ['Finance', '42 members', 'Department'],
  ['Engineering', '118 members', 'Department'],
  ['Customer Success', '37 members', 'Department'],
  ['Contractors', '19 members', 'Access']
];

export const dashOU: [string, string, string][] = [
  ['APAC', '/Global', '214 members'],
  ['EMEA', '/Global', '188 members'],
  ['Contractors', '/Global/APAC', '19 members']
];

export function getInitialCategoryStates(): Record<'apps' | 'policies' | 'roles', import('../types.ts').CategoryMigrationState> {
  return {
    apps: {
      category: 'apps',
      title: 'SSO Applications',
      description: 'Discover and migrate supported single sign-on application configurations.',
      status: 'not_discovered',
      currentStep: 1,
      discoveredAssets: [],
      selectedAssetIds: [],
      mappings: {},
      validationFindings: [],
      validationFresh: false,
      warningsAcknowledged: false,
      approvedPlan: null,
      migrationJob: {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        skipped: 0,
        running: false,
        finished: false,
        assetResults: {}
      },
      verificationResults: {}
    },
    policies: {
      category: 'policies',
      title: 'Security Policies',
      description: 'Review and migrate supported security policies, rules and assignments.',
      status: 'not_discovered',
      currentStep: 1,
      discoveredAssets: [],
      selectedAssetIds: [],
      mappings: {},
      validationFindings: [],
      validationFresh: false,
      warningsAcknowledged: false,
      approvedPlan: null,
      migrationJob: {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        skipped: 0,
        running: false,
        finished: false,
        assetResults: {}
      },
      verificationResults: {}
    },
    roles: {
      category: 'roles',
      title: 'Roles & Permissions',
      description: 'Map roles and permissions and review role assignments before migration.',
      status: 'not_discovered',
      currentStep: 1,
      discoveredAssets: [],
      selectedAssetIds: [],
      mappings: {},
      validationFindings: [],
      validationFresh: false,
      warningsAcknowledged: false,
      approvedPlan: null,
      migrationJob: {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        skipped: 0,
        running: false,
        finished: false,
        assetResults: {}
      },
      verificationResults: {}
    }
  };
}

export function getDiscoveredAssetsForCategory(category: 'apps' | 'policies' | 'roles'): import('../types.ts').DiscoveredAsset[] {
  if (category === 'apps') {
    return assetTables.apps.map((a, i) => {
      const isLegacy = a.name === 'Legacy Portal';
      const isWorkday = a.name === 'Workday';
      return {
        id: `app_${i}_${a.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: a.name,
        type: a.protocol,
        sourceId: `/apps/v1/connections/${a.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        status: a.status,
        supportLevel: isLegacy ? 'unsupported' : isWorkday ? 'needs_review' : 'supported',
        issue: isLegacy ? 'No valid ACS URL detected — will be skipped' : isWorkday ? 'Entity ID collision in target tenant; unique suffix applied' : undefined,
        usersCount: a.users,
        protocol: a.protocol,
        categoryGroup: a.category,
        details: {
          category: a.category,
          confidence: a.confidence
        }
      };
    });
  }

  if (category === 'policies') {
    return assetTables.policies.map((p, i) => {
      const isContractor = p.name.includes('Contractor');
      return {
        id: `pol_${i}_${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: p.name,
        type: p.type,
        sourceId: `/policies/v1/${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        status: p.enforcement,
        supportLevel: isContractor ? 'needs_review' : 'supported',
        issue: isContractor ? 'Time-of-day condition requires target schedule translation in Hexnode' : undefined,
        categoryGroup: p.type,
        details: {
          appliesTo: p.appliesTo,
          rules: p.rules,
          confidence: p.confidence
        }
      };
    });
  }

  return assetTables.roles.map((r, i) => {
    const isBilling = r.name.includes('Billing');
    return {
      id: `role_${i}_${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: r.name,
      type: r.permissionLevel,
      sourceId: `/roles/v1/${r.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      status: `${r.users} users`,
      supportLevel: isBilling ? 'needs_review' : 'supported',
      issue: isBilling ? 'Billing permissions map to Hexnode Tenant Subscription Manager' : undefined,
      usersCount: r.users,
      categoryGroup: r.scope,
      details: {
        scope: r.scope,
        confidence: r.confidence
      }
    };
  });
}

