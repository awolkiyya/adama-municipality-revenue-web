import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import axios from "axios";

import { authService } from "@/services/auth.service";
import {
  setUser,
  logout,
} from "@/lib/store/slices/user.slice";

export const useMe = () => {

  const dispatch = useDispatch();

  const query = useQuery({

    /*
    |--------------------------------------------------------------------------
    | QUERY KEY
    |--------------------------------------------------------------------------
    */

    queryKey: ["me"],

    /*
    |--------------------------------------------------------------------------
    | REQUEST
    |--------------------------------------------------------------------------
    */

    queryFn: authService.me,

    /*
    |--------------------------------------------------------------------------
    | CACHE
    |--------------------------------------------------------------------------
    */

    staleTime: 1000 * 60 * 5,

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Do not automatically retry authentication.
    |
    | If Laravel returns 401, the API interceptor will
    | handle the localized redirect.
    |
    |--------------------------------------------------------------------------
    */

    retry: (failureCount, error) => {

      /*
      |--------------------------------------------------------------------------
      | Never retry 401
      |--------------------------------------------------------------------------
      */

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        return false;
      }

      /*
      |--------------------------------------------------------------------------
      | Retry other temporary failures only
      |--------------------------------------------------------------------------
      */

      return failureCount < 2;
    },

    /*
    |--------------------------------------------------------------------------
    | Do not repeatedly call /me when browser tab regains focus.
    |--------------------------------------------------------------------------
    */

    refetchOnWindowFocus: false,
  });

  /*
  |--------------------------------------------------------------------------
  | SET USER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const user =
      query.data?.data?.user;

    if (user) {

      dispatch(
        setUser(user)
      );
    }

  }, [
    query.data,
    dispatch,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATION FAILURE
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Only logout Redux state when Laravel explicitly
  | says the session is unauthenticated.
  |
  | Do NOT logout because of:
  |
  |   400
  |   403
  |   404
  |   422
  |   429
  |   500
  |   network error
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!query.isError) {
      return;
    }

    const error = query.error;

    const isUnauthorized =
      axios.isAxiosError(error) &&
      error.response?.status === 401;

    if (isUnauthorized) {

      dispatch(
        logout()
      );
    }

  }, [
    query.isError,
    query.error,
    dispatch,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RETURN QUERY
  |--------------------------------------------------------------------------
  */

  return query;
};