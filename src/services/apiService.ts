// src/services/apiService.ts
const API_BASE_URL = 'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net';

interface SendRequestParams {
  endpoint: string;
  method?: string;
  body?: any;
  useToken?: boolean;
}

export const apiService = {
  sendRequest: async ({ endpoint, method = 'GET', body, useToken = true }: SendRequestParams) => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json', // Burada 415 problemini həll edirik
    };

    // Əgər token istənirsə, əlavə et
    if (useToken) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // JSON body varsa, onu stringify edirik
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
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
