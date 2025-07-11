// src/services/apiService.ts
const API_BASE_URL = 'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net';

interface SendRequestParams {
  endpoint: string;
  method?: string;
  body?: any;
  useToken?: boolean;
  token?: string; // <-- bunu əlavə et
}

export const apiService = {
  sendRequest: async ({ endpoint, method = 'GET', body, useToken = true, token }: SendRequestParams & { token?: string }) => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json', // Burada 415 problemini həll edirik
    };

    // Əgər token istənirsə, əlavə et
    if (useToken) {
      const realToken = token || localStorage.getItem('authToken');
      if (realToken) {
        headers['Authorization'] = `Bearer ${realToken}`;
      }
    }

    // JSON body varsa, onu stringify edirik
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // <-- cookie-lər də göndərilsin
    });

    // Cavabı oxuyuruq
    const data = await response.json();

    // Əgər cavab "ok" deyilsə, xəta atırıq
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }
};
