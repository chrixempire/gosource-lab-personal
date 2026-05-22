export type AdminSessionUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  role?: string;
  status?: string;
  [key: string]: unknown;
};

export type AdminSessionState = {
  message: string;
  data: AdminSessionUser;
};
