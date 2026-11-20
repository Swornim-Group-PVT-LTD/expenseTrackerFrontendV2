import axios, { type InternalAxiosRequestConfig } from "axios";
import BASE_URL from "@/app/urlConfig/urlConfig";
import { endSession, getSessionToken, recordSessionActivity } from "@/lib/session";

const apiOrigin = new URL(BASE_URL).origin;
const apiClient = axios.create();

// Ignore late responses from a request sent with a previous session's token.
function usesCurrentToken(config: InternalAxiosRequestConfig) {
  if (typeof window === "undefined") return false;

  const token = getSessionToken();
  const authorization = config.headers.get("Authorization");

  return Boolean(
    token &&
      config.url &&
      new URL(config.url, apiOrigin).origin === apiOrigin &&
      authorization === `Bearer ${token}`,
  );
}

apiClient.interceptors.response.use(
  (response) => {
    if (usesCurrentToken(response.config)) {
      recordSessionActivity();
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.config && usesCurrentToken(error.config)) {
      if (error.response?.status === 401) {
        endSession();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
