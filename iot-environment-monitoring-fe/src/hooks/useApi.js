import { useState, useCallback, useEffect, useRef } from "react";
import api from "../services/api";
import { API_STATUS, ERROR_MESSAGES } from "../constants/api";

/**
 * Custom hook để gọi API
 * @param {string} endpoint - API endpoint
 * @param {object} options - { method, data, params, onSuccess, onError }
 * @returns { data, loading, error, execute, reset }
 */
export const useApi = (endpoint, options = {}) => {
  const {
    method = "GET",
    data: initialData = null,
    params = {},
    onSuccess = null,
    onError = null,
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    status: API_STATUS.IDLE,
  });

  const execute = useCallback(
    async (overrideEndpoint, overrideData, overrideParams) => {
      const finalEndpoint = overrideEndpoint || endpoint;
      const finalData = overrideData !== undefined ? overrideData : initialData;
      const finalParams = { ...params, ...overrideParams };

      setState((prev) => ({
        ...prev,
        loading: true,
        status: API_STATUS.LOADING,
        error: null,
      }));

      try {
        let response;

        if (method === "GET") {
          response = await api.get(finalEndpoint, { params: finalParams });
        } else if (method === "POST") {
          response = await api.post(finalEndpoint, finalData, {
            params: finalParams,
          });
        } else if (method === "PUT") {
          response = await api.put(finalEndpoint, finalData, {
            params: finalParams,
          });
        } else if (method === "DELETE") {
          response = await api.delete(finalEndpoint, { params: finalParams });
        } else if (method === "PATCH") {
          response = await api.patch(finalEndpoint, finalData, {
            params: finalParams,
          });
        }

        setState({
          data: response,
          loading: false,
          error: null,
          status: API_STATUS.SUCCESS,
        });

        onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMessage = err.message || ERROR_MESSAGES.UNKNOWN_ERROR;

        setState({
          data: null,
          loading: false,
          error: errorMessage,
          status: API_STATUS.ERROR,
        });

        onError?.(err);
        console.error(`API Error [${method} ${finalEndpoint}]:`, err);
        throw err;
      }
    },
    [endpoint, method, initialData, params, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: API_STATUS.IDLE,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

/**
 * Hook để fetch dữ liệu khi component mount
 */
export const useApiFetch = (endpoint, options = {}) => {
  const { immediate = true, params = {}, onSuccess, onError } = options;
  const apiHook = useApi(endpoint, {
    method: "GET",
    params,
    onSuccess,
    onError,
  });
  const hasFetchedRef = useRef(false);
  const { execute } = apiHook;

  useEffect(() => {
    if (!immediate || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    execute().catch(() => {
      // Errors are already stored in hook state and passed to onError.
    });
  }, [immediate, execute]);

  return apiHook;
};
