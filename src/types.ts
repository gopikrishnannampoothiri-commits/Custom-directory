export interface MappingRow {
  hexnodeAttr: string;
  externalAttr: string;
  dataType: string;
  transformation: string;
}

export interface TransformRule {
  id: string;
  field: string;
  operation: string;
  parameter: string;
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface SsoApp {
  name: string;
  protocol: string;
  users: number;
  category: string;
  status: string;
  confidence: 'High' | 'Medium' | 'Needs review';
  conflict?: boolean;
  warn?: string;
}

export interface SecurityPolicy {
  name: string;
  type: string;
  appliesTo: string;
  enforcement: string;
  confidence: 'High' | 'Medium' | 'Needs review';
  conflict?: boolean;
  rules: [string, string][];
}

export interface AuthFactor {
  type: string;
  enrolled: number;
  required: string;
  confidence: 'High' | 'Medium' | 'Needs review';
  usedBy: string[];
}

export interface RoleAssignment {
  name: string;
  users: number;
  scope: string;
  permissionLevel: string;
  confidence: 'High' | 'Medium' | 'Needs review';
  conflict?: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
}

export type ScreenType = 'list' | 'wizard1' | 'dashboard' | 'wizard2';
export type DashboardState = 'partial' | 'complete';
export type AuthMethodType = 'oauth2' | 'apikey' | 'bearer' | 'basic' | 'customheader';

export type AssetCategory = 'apps' | 'policies' | 'roles';

export type AssetPanelStatus =
  | 'not_discovered'
  | 'discovery_incomplete'
  | 'needs_configuration'
  | 'ready_to_migrate'
  | 'in_progress'
  | 'partially_migrated'
  | 'verification_required'
  | 'verified';

export interface DiscoveredAsset {
  id: string;
  name: string;
  type: string;
  sourceId: string;
  status: string;
  supportLevel: 'supported' | 'needs_review' | 'unsupported';
  issue?: string;
  usersCount?: number;
  protocol?: string;
  categoryGroup?: string;
  details?: Record<string, any>;
}

export interface ValidationFinding {
  id: string;
  assetId?: string;
  assetName?: string;
  severity: 'blocker' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  returnToStep?: number;
}

export interface CategoryMigrationState {
  category: AssetCategory;
  title: string;
  description: string;
  status: AssetPanelStatus;
  currentStep: number;
  lastUpdated?: string;
  discoveredAssets: DiscoveredAsset[];
  selectedAssetIds: string[];
  mappings: Record<string, Record<string, any>>;
  validationFindings: ValidationFinding[];
  validationFresh: boolean;
  warningsAcknowledged: boolean;
  approvedPlan: {
    selectedCount: number;
    readyCount: number;
    blockedCount: number;
    toCreateCount: number;
    toUpdateCount: number;
    unsupportedCount: number;
  } | null;
  migrationJob: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    skipped: number;
    running: boolean;
    finished: boolean;
    currentOperation?: string;
    assetResults: Record<
      string,
      {
        status: 'completed' | 'failed' | 'skipped';
        targetId?: string;
        error?: string;
      }
    >;
  };
  verificationResults: Record<
    string,
    {
      verified: boolean;
      status: 'Verified' | 'Migrated — Verification Pending' | 'Partially Migrated' | 'Failed' | 'Manual Action Required';
      notes?: string;
      manualAction?: string;
    }
  >;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  department: string;
  groups: string[];
  policiesCount: number;
  lastSignIn: string;
  avatarBg: string;
  mfaEnabled: boolean;
  role: string;
}

export interface GroupRecord {
  id: string;
  name: string;
  type: 'Security' | 'Distribution' | 'Synced';
  memberCount: number;
  source: string;
  tags: string[];
  description: string;
}

export interface OuNode {
  id: string;
  name: string;
  itemCount: number;
  path: string;
  children?: OuNode[];
  usersCount: number;
  groupsCount: number;
  policiesCount: number;
}

