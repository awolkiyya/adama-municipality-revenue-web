import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";
import { PaginatedResponse, SingleResponse } from "@/types/api";
import { AuthUser, UserFormData, UserQueryParams } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


export async function fetchPrivateImage(path: string): Promise<string> {
  const res = await api.get( `${path}`, {
    responseType: "blob",
  });

  return URL.createObjectURL(res.data);
}


export const UserService = {
  // =========================
  // GET USERS (LIST)
  // =========================
  async getUsers(
    params: UserQueryParams = {}
  ): Promise<PaginatedResponse<AuthUser>> {
    try {
      const response = await api.get<PaginatedResponse<AuthUser>>(`/users`, {
        params,
      });

      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // =========================
  // GET SINGLE USER
  // =========================
  async getUser(id: string | number): Promise<UserFormData> {
    try {
      const response = await api.get<SingleResponse<UserFormData>>(
        `/users/${id}`,
      );

      return response.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // =========================
  // CREATE USER
  // =========================
  async createUser(data: Partial<AuthUser>): Promise<AuthUser> {
    try {
      const response = await api.post<SingleResponse<AuthUser>>(
        `/users`,
        data,
      );

      return response.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // =========================
  // UPDATE USER (PROFILE / STRUCTURE)
  // =========================
  async updateUser(
    id: string | number,
    data: Partial<AuthUser> | FormData
  ): Promise<AuthUser> {
    try {
      const isFormData = data instanceof FormData;
  
      const response = await api.request<SingleResponse<AuthUser>>({
        url: `/users/${id}`,
        method: "POST", // IMPORTANT for Laravel file uploads
        data,
        headers: isFormData
          ? { "Content-Type": "multipart/form-data" }
          : { "Content-Type": "application/json" },
      });
  
      return response.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // =========================
  // UPDATE PASSWORD
  // =========================
  async updatePassword(
    id: string | number,
    data: {
      password: string;
    }
  ): Promise<void> {
    try {
      await api.put(`/users/${id}/password`, data, {
      });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // =========================
  // TOGGLE USER STATUS
  // =========================
  async toggleStatus(id: string | number): Promise<AuthUser> {
    try {
      const response = await api.patch<SingleResponse<AuthUser>>(
        `/users/${id}/status`,
        {},
      );

      return response.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // =========================
  // UPDATE STATUS (EXPLICIT)
  // =========================
  async updateStatus(
    id: string | number,
    is_active: boolean
  ): Promise<AuthUser> {
    try {
      const response = await api.patch<SingleResponse<AuthUser>>(
        `/users/${id}/status`,
        { is_active },
        { withCredentials: true }
      );

      return response.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};