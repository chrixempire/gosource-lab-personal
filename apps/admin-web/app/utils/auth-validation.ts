export type PasswordRuleState = {
  id: string;
  label: string;
  met: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRules = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (value: string) => value.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: 'number',
    label: 'At least one number',
    test: (value: string) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'At least one special character',
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string) {
  if (!value.trim()) {
    return 'Email address is required';
  }

  if (!emailPattern.test(normalizeEmail(value))) {
    return 'Enter a valid email address';
  }

  return '';
}

export function validateRequiredText(value: string, label: string, minLength = 2) {
  if (!value.trim()) {
    return `${label} is required`;
  }

  if (value.trim().length < minLength) {
    return `${label} must be at least ${minLength} characters`;
  }

  return '';
}

export function getPasswordRuleStates(value: string): PasswordRuleState[] {
  return passwordRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(value),
  }));
}

function isStrongPassword(value: string) {
  return getPasswordRuleStates(value).every((rule) => rule.met);
}

export function validatePassword(value: string) {
  if (!value) {
    return 'Password is required';
  }

  if (!isStrongPassword(value)) {
    return 'Password does not meet the required rules';
  }

  return '';
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return '';
}

export function validateOtpCode(value: string, label = 'Reset code', digits = 4) {
  if (!value.trim()) {
    return `${label} is required`;
  }

  const pattern = new RegExp(`^\\d{${digits}}$`);

  if (!pattern.test(value.trim())) {
    return `${label} must be a ${digits}-digit code`;
  }

  return '';
}
