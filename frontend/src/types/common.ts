/** Pagination meta returned by list queries */
export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

/** Generic paginated response */
export interface Paginated<T> {
  items: T[];
  meta:  PaginationMeta;
}

export function paginate(total: number, page: number, limit: number): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
