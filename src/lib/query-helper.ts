import { FilterQuery, Model, Query } from "mongoose";

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string | Record<string, any>;
  populate?: any;
  select?: string;
  lean?: boolean;
}

/**
 * Standardized Pagination and Filter Helper
 * This replaces repetitive query logic in every route.
 */
export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: QueryOptions = {},
): Promise<PaginationResult<T>> {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.max(1, Math.min(100, Number(options.limit || 25)));
  const skip = (page - 1) * limit;

  const query = model.find(filter);

  // Apply Sort
  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ createdAt: -1 });
  }

  // Apply Populate
  if (options.populate) {
    query.populate(options.populate);
  }

  // Apply Select
  if (options.select) {
    query.select(options.select);
  }

  // Use Lean for performance
  if (options.lean !== false) {
    query.lean();
  }

  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit).exec(),
    model.countDocuments(filter),
  ]);

  return {
    data: data as T[],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
