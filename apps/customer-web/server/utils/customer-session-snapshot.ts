import type {
  CustomerMeResponse,
  CustomerSessionData,
  EmployeeSessionData,
} from '@gosource/api-client';

type SessionBootstrap = {
  hasBranch?: boolean;
};

type CustomerCookieSessionData = {
  id: string;
  businessId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  onboardingStep?: number;
};

type EmployeeCookieSessionData = {
  id: string;
  businessId: string;
  branchId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  position: string | null;
  role: string;
  status: string;
};

export type CustomerSessionState = Omit<CustomerMeResponse, 'data'> & {
  data: CustomerSessionData | EmployeeSessionData;
  bootstrap?: SessionBootstrap;
};

export type CustomerSessionSnapshot =
  | {
      user_type: 'customer';
      data: CustomerCookieSessionData;
      bootstrap?: SessionBootstrap;
    }
  | {
      user_type: 'employee';
      data: EmployeeCookieSessionData;
      bootstrap?: SessionBootstrap;
    };

export function serializeCustomerSessionSnapshot(session: CustomerSessionState): CustomerSessionSnapshot {
  if (session.user_type === 'employee') {
    const data = session.data as EmployeeSessionData;
    return {
      user_type: 'employee',
      data: {
        id: data.id,
        businessId: data.businessId,
        branchId: data.branchId,
        email: data.email,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        phoneNumber: data.phoneNumber ?? null,
        position: data.position ?? null,
        role: data.role,
        status: data.status,
      },
      bootstrap: session.bootstrap,
    };
  }

  const data = session.data as CustomerSessionData;
  return {
    user_type: 'customer',
    data: {
      id: data.id,
      businessId: data.businessId,
      email: data.email,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      phoneNumber: data.phoneNumber ?? null,
      role: data.role,
      status: data.status,
      onboardingStep: data.onboardingStep,
    },
    bootstrap: session.bootstrap,
  };
}

export function deserializeCustomerSessionSnapshot(
  snapshot: Partial<CustomerSessionSnapshot> | null | undefined,
): CustomerSessionState | null {
  if (!snapshot?.user_type || !snapshot.data || typeof snapshot.data !== 'object') {
    return null;
  }

  if (snapshot.user_type === 'employee') {
    const data = snapshot.data as Partial<EmployeeCookieSessionData>;
    if (!data.id || !data.businessId || !data.branchId || !data.email) {
      return null;
    }

    return {
      message: 'Session restored',
      user_type: 'employee',
      data: {
        id: data.id,
        businessId: data.businessId,
        branchId: data.branchId,
        email: data.email,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        phoneNumber: data.phoneNumber ?? '',
        position: data.position ?? '',
        role: data.role ?? 'employee',
        status: data.status ?? 'active',
      },
      bootstrap: snapshot.bootstrap,
    };
  }

  const data = snapshot.data as Partial<CustomerCookieSessionData>;
  if (!data.id || !data.businessId || !data.email) {
    return null;
  }

  return {
    message: 'Session restored',
    user_type: 'customer',
    data: {
      id: data.id,
      businessId: data.businessId,
      email: data.email,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      phoneNumber: data.phoneNumber ?? '',
      role: data.role ?? 'super_admin',
      status: data.status ?? 'active',
      onboardingStep: data.onboardingStep,
    } as CustomerSessionData,
    bootstrap: snapshot.bootstrap,
  };
}
