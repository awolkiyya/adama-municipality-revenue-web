export function formatApiError(error: any) {
    return {
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Unexpected error occurred",
  
      status: error?.response?.status || 500,
  
      data: error?.response?.data || null,
    };
  }
  

