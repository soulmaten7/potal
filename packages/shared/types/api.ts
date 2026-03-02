export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
