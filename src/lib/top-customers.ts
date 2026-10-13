import Customer from "@/models/Customer";

export const TOP_CUSTOMERS_LIMIT = 10;

export interface TopCustomer {
  _id: number;
  name: string;
  phone: string;
  location?: string;
  totalPayments: number;
  debtBalance: number;
  totalDebtPaid: number;
  ordersCount: number;
  rank: number;
}

/**
 * The customers who paid the most (by totalPayments), best first.
 * Customers who never paid anything are not ranked, so a new shop
 * doesn't show ten "top" customers with zero payments.
 */
export async function getTopCustomers(limit = TOP_CUSTOMERS_LIMIT): Promise<TopCustomer[]> {
  const rows = await Customer.aggregate([
    { $match: { isActive: true, totalPayments: { $gt: 0 } } },
    { $sort: { totalPayments: -1, _id: 1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        phone: 1,
        location: 1,
        totalPayments: 1,
        debtBalance: 1,
        totalDebtPaid: 1,
        ordersCount: { $size: { $ifNull: ["$completedOrders", []] } },
      },
    },
  ]);

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Rank (1-based) of one customer inside the top list, or null when not in it. */
export async function getTopCustomerRank(customerId: number): Promise<number | null> {
  const top = await getTopCustomers();
  const found = top.find((customer) => customer._id === Number(customerId));
  return found ? found.rank : null;
}
