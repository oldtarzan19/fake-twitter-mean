export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    skip: number;
    count?: number;
    total?: number;
  };
}
