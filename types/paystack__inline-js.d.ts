declare module "@paystack/inline-js" {
  interface PaystackPopOptions {
    key?: string;
    accessCode?: string;
    email?: string;
    amount?: number;
    currency?: string;
    plan?: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    onSuccess?: (response: { reference: string; status: string }) => void;
    onCancel?: () => void;
    callback?: (response: { reference: string; status: string; transaction: string }) => void;
    onClose?: () => void;
  }

  interface PaystackHandler {
    openIframe(): void;
  }

  const PaystackPop: {
    newTransaction(options: PaystackPopOptions): PaystackHandler;
    setup(options: PaystackPopOptions): PaystackHandler;
  };

  export default PaystackPop;
}
