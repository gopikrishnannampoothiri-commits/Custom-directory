import { UserRecord, GroupRecord, OuNode } from '../types.ts';

export const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr_101',
    name: 'Amelia Tan',
    email: 'amelia.tan@acme.com',
    status: 'active',
    department: 'Engineering',
    groups: ['Engineering', 'All Staff', 'DevOps Team', 'Security Admins', 'Core Platform', 'Architecture Board', 'US Staff', 'Frontend UI', 'Release Managers', 'Key Custodians'],
    policiesCount: 2,
    lastSignIn: '2 Mins Ago',
    avatarBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    mfaEnabled: true,
    role: 'Principal Engineer'
  },
  {
    id: 'usr_102',
    name: 'Raj Patel',
    email: 'raj.patel@acme.com',
    status: 'active',
    department: 'Engineering',
    groups: ['Engineering', 'DevOps Team', 'All Staff', 'Infrastructure & SRE'],
    policiesCount: 3,
    lastSignIn: '18 Mins Ago',
    avatarBg: 'linear-gradient(135deg, #10B981, #059669)',
    mfaEnabled: true,
    role: 'Staff SRE'
  },
  {
    id: 'usr_103',
    name: 'Sofia Lopez',
    email: 'sofia.lopez@acme.com',
    status: 'inactive',
    department: 'Customer Success',
    groups: ['Customer Success', 'All Staff', 'APAC Support'],
    policiesCount: 1,
    lastSignIn: '14 Days Ago',
    avatarBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
    mfaEnabled: false,
    role: 'Account Manager'
  },
  {
    id: 'usr_104',
    name: 'Marcus Vance',
    email: 'marcus.vance@acme.com',
    status: 'active',
    department: 'Product & Design',
    groups: ['Product & Design', 'All Staff', 'Beta Testers'],
    policiesCount: 2,
    lastSignIn: '1 Hour Ago',
    avatarBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    mfaEnabled: true,
    role: 'Lead Product Designer'
  },
  {
    id: 'usr_105',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.com',
    status: 'active',
    department: 'Finance & Legal',
    groups: ['Finance & Legal', 'All Staff', 'Audit Reviewers'],
    policiesCount: 4,
    lastSignIn: '3 Hours Ago',
    avatarBg: 'linear-gradient(135deg, #EC4899, #BE185D)',
    mfaEnabled: true,
    role: 'Compliance Director'
  },
  {
    id: 'usr_106',
    name: 'David Kim',
    email: 'david.kim@acme.com',
    status: 'pending',
    department: 'Sales & Operations',
    groups: ['Sales & Operations', 'Contractors & Vendors'],
    policiesCount: 1,
    lastSignIn: 'Never',
    avatarBg: 'linear-gradient(135deg, #6B7280, #4B5563)',
    mfaEnabled: false,
    role: 'Solutions Architect'
  },
  {
    id: 'usr_107',
    name: 'Chloe Tremblay',
    email: 'chloe.tremblay@acme.com',
    status: 'active',
    department: 'Engineering',
    groups: ['Engineering', 'Frontend UI', 'All Staff'],
    policiesCount: 2,
    lastSignIn: '45 Mins Ago',
    avatarBg: 'linear-gradient(135deg, #06B6D4, #0891B2)',
    mfaEnabled: true,
    role: 'Senior UI Engineer'
  },
  {
    id: 'usr_108',
    name: 'Julian Thorne',
    email: 'julian.thorne@acme.com',
    status: 'active',
    department: 'Security & IT',
    groups: ['Security Admins', 'All Staff', 'Emergency Response'],
    policiesCount: 5,
    lastSignIn: '5 Mins Ago',
    avatarBg: 'linear-gradient(135deg, #EF4444, #B91C1C)',
    mfaEnabled: true,
    role: 'Security Operations Lead'
  }
];

export const INITIAL_GROUPS: GroupRecord[] = [
  {
    id: 'grp_1',
    name: 'Engineering',
    type: 'Security',
    memberCount: 118,
    source: 'corp.hexnode.com',
    tags: ['Dev', 'Prod Access', 'GitHub SSO'],
    description: 'All core software engineers and technical contributors'
  },
  {
    id: 'grp_2',
    name: 'Security Admins',
    type: 'Security',
    memberCount: 8,
    source: 'Local IdP',
    tags: ['MFA Enforced', 'Privileged', 'Zero Trust'],
    description: 'Elevated administrators with full IdP control plane privileges'
  },
  {
    id: 'grp_3',
    name: 'All Staff',
    type: 'Distribution',
    memberCount: 420,
    source: 'corp.hexnode.com',
    tags: ['Company Wide', 'Slack Default', 'Google Workspace'],
    description: 'Universal group containing all active employees and verified contractors'
  },
  {
    id: 'grp_4',
    name: 'DevOps Team',
    type: 'Security',
    memberCount: 24,
    source: 'corp.hexnode.com',
    tags: ['AWS SSO', 'Kubernetes', 'Infra Admin'],
    description: 'Infrastructure and cloud operations reliability engineers'
  },
  {
    id: 'grp_5',
    name: 'Finance & Legal',
    type: 'Security',
    memberCount: 32,
    source: 'corp.hexnode.com',
    tags: ['Strict Geofence', 'Audit Logged'],
    description: 'Finance, payroll, legal counsel and accounting specialists'
  },
  {
    id: 'grp_6',
    name: 'Contractors & Vendors',
    type: 'Synced',
    memberCount: 16,
    source: 'Meridian Cloud IdP',
    tags: ['Time Limited', 'External', 'Read Only'],
    description: 'Third-party vendors and contractors with scoped temporary access'
  }
];

export const OU_TREE_DATA: OuNode = {
  id: 'ou_root',
  name: 'Global HQ',
  itemCount: 58,
  path: 'DC=corp,DC=hexnode,OU=Global HQ',
  usersCount: 58,
  groupsCount: 8,
  policiesCount: 4,
  children: [
    {
      id: 'ou_eng',
      name: 'Engineering',
      itemCount: 24,
      path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Engineering',
      usersCount: 24,
      groupsCount: 4,
      policiesCount: 2,
      children: [
        {
          id: 'ou_eng_core',
          name: 'Core Platform',
          itemCount: 10,
          path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Engineering,OU=Core Platform',
          usersCount: 10,
          groupsCount: 1,
          policiesCount: 1
        },
        {
          id: 'ou_eng_fe',
          name: 'Frontend UI',
          itemCount: 8,
          path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Engineering,OU=Frontend UI',
          usersCount: 8,
          groupsCount: 1,
          policiesCount: 1
        },
        {
          id: 'ou_eng_infra',
          name: 'Infrastructure & SRE',
          itemCount: 6,
          path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Engineering,OU=Infrastructure & SRE',
          usersCount: 6,
          groupsCount: 2,
          policiesCount: 2
        }
      ]
    },
    {
      id: 'ou_sales',
      name: 'Sales & Operations',
      itemCount: 2,
      path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Sales & Operations',
      usersCount: 2,
      groupsCount: 1,
      policiesCount: 1
    },
    {
      id: 'ou_fin',
      name: 'Finance & Legal',
      itemCount: 8,
      path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Finance & Legal',
      usersCount: 8,
      groupsCount: 2,
      policiesCount: 3
    },
    {
      id: 'ou_prod',
      name: 'Product & Design',
      itemCount: 12,
      path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Product & Design',
      usersCount: 12,
      groupsCount: 1,
      policiesCount: 1
    },
    {
      id: 'ou_contractors',
      name: 'Contractors & Vendors',
      itemCount: 4,
      path: 'DC=corp,DC=hexnode,OU=Global HQ,OU=Contractors & Vendors',
      usersCount: 4,
      groupsCount: 1,
      policiesCount: 2
    }
  ]
};
