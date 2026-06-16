import { toast } from '@gosource/ui';

type PaystackArgs = {
  amount: number;
  metadata: Record<string, unknown>;
  onSuccess?: (event: unknown) => void | Promise<void>;
  onCancel?: () => void;
};

const PAYSTACK_SCRIPT_SRC = 'https://js.paystack.co/v2/inline.js';
let paystackScriptPromise: Promise<void> | null = null;

function paystackConnectionHelpMessage() {
  return (
    'Paystack could not connect securely. Try a private/incognito window, disable extensions ' +
    '(ad blockers, privacy tools, or “requests” injectors), turn off VPN/proxy, or use another network.'
  );
}

function loadPaystackScript(): Promise<void> {
  if (!import.meta.client) {
    return Promise.resolve();
  }

  if ((window as any).PaystackPop) {
    return Promise.resolve();
  }

  if (paystackScriptPromise) {
    return paystackScriptPromise;
  }

  paystackScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PAYSTACK_SCRIPT_SRC}"]`,
    );

    if (existing) {
      if ((window as any).PaystackPop) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Paystack')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.head.appendChild(script);
  });

  return paystackScriptPromise;
}

export function usePaystack() {
  const config = useRuntimeConfig();
  const session = useState<any>('customer-session', () => null);

  const mutate = async ({
    amount,
    metadata,
    onSuccess,
    onCancel,
  }: PaystackArgs): Promise<'success' | 'cancelled' | 'failed'> => {
    const publicKey = config.public.paystackPublicKey;
    const email = session.value?.data?.email;

    if (!publicKey) {
      toast.error('Paystack public key is missing. Add NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your env.');
      return 'failed';
    }

    if (!email) {
      toast.error('Sign in with a valid email before paying with Paystack.');
      return 'failed';
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Invalid payment amount.');
      return 'failed';
    }

    try {
      await loadPaystackScript();
    } catch {
      toast.error(paystackConnectionHelpMessage());
      return 'failed';
    }

    const PaystackPop = (window as any)?.PaystackPop;
    if (!PaystackPop) {
      toast.error('Paystack is still loading. Please try again in a moment.');
      return 'failed';
    }

    return new Promise((resolve) => {
      let settled = false;
      let successHandled = false;

      const finish = (result: 'success' | 'cancelled' | 'failed') => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(result);
      };

      const handleSuccess = async (event: unknown) => {
        if (successHandled) {
          finish('success');
          return;
        }

        successHandled = true;

        try {
          await onSuccess?.(event);
          finish('success');
        } catch {
          successHandled = false;
          finish('failed');
        }
      };

      const transactionOptions = {
        key: publicKey,
        email,
        amount: Math.round(amount * 100),
        currency: 'NGN',
        metadata,
        onSuccess: handleSuccess,
        onCancel: () => {
          onCancel?.();
          finish('cancelled');
        },
        onError: (error: { message?: string }) => {
          toast.error(error?.message?.trim() || 'Paystack payment failed.');
          finish('failed');
        },
      };

      try {
        const paystack = new PaystackPop();
        if (typeof paystack.newTransaction === 'function') {
          paystack.newTransaction(transactionOptions);
        } else if (typeof paystack.checkout === 'function') {
          // Legacy inline API only exposes `callback` (not onSuccess).
          paystack.checkout({
            ...transactionOptions,
            callback: handleSuccess,
          });
        } else {
          toast.error('Paystack checkout is unavailable. Please refresh and try again.');
          finish('failed');
        }
      } catch {
        toast.error(paystackConnectionHelpMessage());
        finish('failed');
      }
    });
  };

  return { mutate, paystackConnectionHelpMessage };
}
