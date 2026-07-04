export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
};
