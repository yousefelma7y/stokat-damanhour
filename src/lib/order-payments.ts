import PaymentMethod from "@/models/PaymentMethod";
import type mongoose from "mongoose";

export const MONEY_EPSILON = 0.01;

export const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

type NormalizePaymentOptions = {
  payments?: any[];
  paymentMethodId?: number | null;
  fallbackAmount?: number;
  total: number;
  status?: string;
  isDebt?: boolean;
  customer?: any;
  session?: mongoose.ClientSession;
};

const hasCustomerReference = (customer: any) => {
  if (!customer) return false;
  if (typeof customer === "number") return true;
  if (typeof customer === "object") {
    return Boolean(customer._id || customer.id || customer.phone);
  }
  return false;
};

const findPaymentMethod = async (
  paymentMethodId: number,
  session?: mongoose.ClientSession,
) => {
  const query = PaymentMethod.findById(paymentMethodId);
  if (session) query.session(session);
  return query;
};

export async function normalizeOrderPayments({
  payments,
  paymentMethodId,
  fallbackAmount,
  total,
  status = "pending",
  isDebt = false,
  customer,
  session,
}: NormalizePaymentOptions) {
  const normalizedTotal = roundMoney(total);
  const sourcePayments =
    Array.isArray(payments) && payments.length > 0
      ? payments
      : paymentMethodId && Number(fallbackAmount || 0) > 0
        ? [{ paymentMethodId, amount: fallbackAmount }]
        : [];

  const rows = sourcePayments.map((payment) => {
    const id = Number(payment.paymentMethodId || payment.methodId);
    const amount = roundMoney(Number(payment.amount || 0));

    if (Number.isNaN(id) || id <= 0) {
      throw new Error("وسيلة الدفع غير صحيحة");
    }

    if (amount < 0) {
      throw new Error("قيمة الدفع لا يمكن أن تكون سالبة");
    }

    return {
      paymentMethodId: id,
      amount,
    };
  });

  const positiveRows = rows.filter((payment) => payment.amount > MONEY_EPSILON);
  const duplicateCheck = new Set<number>();
  for (const payment of positiveRows) {
    if (duplicateCheck.has(payment.paymentMethodId)) {
      throw new Error("لا يمكن تكرار نفس وسيلة الدفع في الطلب الواحد");
    }
    duplicateCheck.add(payment.paymentMethodId);
  }

  const hydratedPayments = [];
  for (const payment of positiveRows) {
    const wallet = await findPaymentMethod(payment.paymentMethodId, session);
    if (!wallet || wallet.isActive === false) {
      throw new Error("وسيلة الدفع غير موجودة");
    }

    hydratedPayments.push({
      paymentMethodId: wallet._id,
      name: wallet.name,
      amount: payment.amount,
    });
  }

  const paidAmount = roundMoney(
    hydratedPayments.reduce((sum, payment) => sum + payment.amount, 0),
  );

  if (paidAmount - normalizedTotal > MONEY_EPSILON) {
    throw new Error("إجمالي المدفوعات لا يمكن أن يتجاوز إجمالي الطلب");
  }

  const remaining = roundMoney(Math.max(0, normalizedTotal - paidAmount));
  const completed = status === "completed";
  const debtRequested = Boolean(isDebt);

  if (completed && !debtRequested && remaining > MONEY_EPSILON) {
    throw new Error("يجب دفع إجمالي الطلب أو تفعيل المديونية");
  }

  if (
    completed &&
    debtRequested &&
    remaining > MONEY_EPSILON &&
    !hasCustomerReference(customer)
  ) {
    throw new Error("يجب تحديد عميل لتسجيل المديونية");
  }

  const remainingAmount =
    completed && remaining > MONEY_EPSILON ? roundMoney(remaining) : 0;
  const debtAmount = remainingAmount; // Synchronize for clarity
  const hasDebt = remainingAmount > MONEY_EPSILON;

  return {
    payments: hydratedPayments,
    paidAmount,
    debtAmount,
    remainingAmount,
    isDebt: hasDebt,
    debtStatus: hasDebt ? (paidAmount > MONEY_EPSILON ? "partial" : "open") : "none",
    paymentMethod:
      hydratedPayments.length > 1
        ? "mixed"
        : hydratedPayments[0]?.name || (hasDebt ? "debt" : "cash"),
    paymentMethodId: hydratedPayments[0]?.paymentMethodId || null,
  };
}
