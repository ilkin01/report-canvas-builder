import { store } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';

const API_BASE_URL = 'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net';

interface SendRequestParams {
  endpoint: string;
  method?: string;
  body?: any;
  useToken?: boolean;
  token?: string;
}

export const apiService = {
  sendRequest: async ({ endpoint, method = 'GET', body, useToken = true, token }: SendRequestParams & { token?: string }) => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (useToken) {
      const realToken = token || localStorage.getItem('authToken');
      if (realToken) {
        headers['Authorization'] = `Bearer ${realToken}`;
      }
    }

    let requestBody = undefined;
    if (body instanceof FormData) {
      requestBody = body;
    } else if (body) {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: requestBody,
      credentials: 'include',
    });

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      store.dispatch(logout());
      window.location.href = '/login';
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }
};
