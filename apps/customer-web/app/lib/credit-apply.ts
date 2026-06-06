function validateCreditApplyBvn(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return 'BVN is required';
  }
  if (digits.length !== 11) {
    return 'BVN must be 11 digits';
  }
  return '';
}

export const CREDIT_APPLY_BVN_HINT = 'BVN must be 11 digits';

export function getCreditApplyBvnValidationError(value: string) {
  return validateCreditApplyBvn(value);
}

export type CreditApplicationFormValues = {
  cacRegistrationNumber: string;
  tin: string;
  bvn: string;
  revenueRange: string;
  yearOfOperations: string;
  identityType: string;
  bankStatement: File | null;
  identity: File | null;
};

export type CreditApplySelectOption = {
  label: string;
  value: string;
};

export const CREDIT_APPLY_STEPS = [
  { label: 'Business information', value: 1 },
  { label: 'Financial snapshot', value: 2 },
  { label: 'KYC', value: 3 },
  { label: 'Summary', value: 4 },
] as const;

export const CREDIT_APPLY_REVENUE_OPTIONS: CreditApplySelectOption[] = [
  { label: '₦0 - ₦100,000', value: '0-100000' },
  { label: '₦100,001 - ₦500,000', value: '100001-500000' },
  { label: '₦500,001 - ₦1,000,000', value: '500001-1000000' },
  { label: '₦1,000,001 - ₦5,000,000', value: '1000001-5000000' },
  { label: 'Above ₦5,000,000', value: '5000001+' },
];

export const CREDIT_APPLY_YEARS_OPTIONS: CreditApplySelectOption[] = [
  { label: 'Less than 1 year', value: '0-1' },
  { label: '1-2 years', value: '1-2' },
  { label: '3-5 years', value: '3-5' },
  { label: '6-10 years', value: '6-10' },
  { label: 'More than 10 years', value: '10+' },
];

export const CREDIT_APPLY_IDENTITY_OPTIONS: CreditApplySelectOption[] = [
  { label: 'National ID', value: 'national_id' },
  { label: 'Passport', value: 'passport' },
  { label: "Driver's License", value: 'drivers_license' },
];

export const CREDIT_APPLY_FILE_MAX_BYTES = 1024 * 1024;

export const CREDIT_APPLY_FILE_ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png';

export const CREDIT_APPLY_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export function createEmptyCreditApplicationForm(): CreditApplicationFormValues {
  return {
    cacRegistrationNumber: '',
    tin: '',
    bvn: '',
    revenueRange: '',
    yearOfOperations: '',
    identityType: '',
    bankStatement: null,
    identity: null,
  };
}

export function creditApplyOptionLabel(
  options: CreditApplySelectOption[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function validateCreditApplyFile(file: File | null, label: string) {
  if (!file) {
    return `${label} is required`;
  }
  if (file.size > CREDIT_APPLY_FILE_MAX_BYTES) {
    return `${label} must be 1MB or less`;
  }
  if (!CREDIT_APPLY_FILE_TYPES.includes(file.type)) {
    return `${label} must be PDF, DOCX, JPG, or PNG`;
  }
  return '';
}

export type CreditApplyFieldErrors = Partial<Record<keyof CreditApplicationFormValues, string>>;

export function validateCreditApplyStep(
  step: number,
  values: CreditApplicationFormValues,
): CreditApplyFieldErrors {
  const errors: CreditApplyFieldErrors = {};

  if (step === 1) {
    if (!values.cacRegistrationNumber.trim()) {
      errors.cacRegistrationNumber = 'CAC registration number is required';
    }
  }

  if (step === 2) {
    if (!values.revenueRange) {
      errors.revenueRange = 'Monthly revenue range is required';
    }
    if (!values.yearOfOperations) {
      errors.yearOfOperations = 'Years in operation is required';
    }
    const bankStatementError = validateCreditApplyFile(values.bankStatement, 'Bank statement');
    if (bankStatementError) {
      errors.bankStatement = bankStatementError;
    }
  }

  if (step === 3) {
    const bvnError = validateCreditApplyBvn(values.bvn);
    if (bvnError) {
      errors.bvn = bvnError;
    }
    if (!values.identityType) {
      errors.identityType = 'Identity type is required';
    }
    const identityError = validateCreditApplyFile(values.identity, 'Identity document');
    if (identityError) {
      errors.identity = identityError;
    }
  }

  return errors;
}

export function isCreditApplyStepComplete(
  step: number,
  values: CreditApplicationFormValues,
) {
  return Object.keys(validateCreditApplyStep(step, values)).length === 0;
}

export function buildCreditApplicationFormData(values: CreditApplicationFormValues) {
  const formData = new FormData();
  formData.append('cacRegistrationNumber', values.cacRegistrationNumber.trim());
  formData.append('revenueRange', values.revenueRange);
  formData.append('yearOfOperations', values.yearOfOperations);
  formData.append('bvn', values.bvn.replace(/\D/g, ''));
  formData.append(
    'identityType',
    creditApplyOptionLabel(CREDIT_APPLY_IDENTITY_OPTIONS, values.identityType),
  );

  if (values.tin.trim()) {
    formData.append('tin', values.tin.trim());
  }
  if (values.bankStatement) {
    formData.append('bankStatement', values.bankStatement);
  }
  if (values.identity) {
    formData.append('identity', values.identity);
  }

  return formData;
}
