export const BRANCH_COLLECTION = 'branches';

export interface BranchDocument {
  _id: string;
  branchName: string;
  streetName: string;
  lga: string;
  state: string;
  branchCode: string;
  businessId: string;
  isHeadquarter: boolean;
  isDeactivated: boolean;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const branchIndexes = [
  { key: { businessId: 1 }, options: {} },
  { key: { branchCode: 1 }, options: { unique: true } },
] as const;
