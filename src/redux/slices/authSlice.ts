import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '@/services/apiService';
import type { RootState } from '../store';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/LoginHospitalLab',
        method: 'POST',
        body: { email, password },
        useToken: false,
      });

      if (response) {
        localStorage.setItem('authToken', response);
        dispatch(setToken(response));
        localStorage.setItem('auth_role', 'HospitalLab');
        try {
          const userResponse = await apiService.sendRequest({
            endpoint: '/api/HospitalLab/me',
            method: 'GET',
            useToken: true,
            token: response,
          });

          const userData = {
            name: userResponse.name,
            surname: userResponse.surname,
            email: userResponse.email,
            avatarUrl: userResponse.avatarUrl,
            phoneNumber: userResponse.phoneNumber,
            role: 'HospitalLab',
          };

          localStorage.setItem('authToken', response);

          return {
            token: response,
            user: userData
          };
        } catch (profileError: any) {
          localStorage.setItem('authToken', response);
          return {
            token: response,
            user: null
          };
        }
      }
      return {
        token: response,
        user: null
      };
    } catch (error: any) {
      localStorage.setItem('auth_role', '');
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('authToken');
      if (!token) {
        return rejectWithValue('401');
      }
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/me',
        method: 'GET',
        useToken: true,
        token,
      });
      const role = localStorage.getItem('auth_role') || 'HospitalLab';
      const userData = {
        name: response.name,
        surname: response.surname,
        email: response.email,
        avatarUrl: response.avatarUrl,
        phoneNumber: response.phoneNumber,
        role,
      };
      return userData;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        localStorage.removeItem('authToken');
        return rejectWithValue('401');
      }
      return rejectWithValue('profile_error');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profile: { name: string; surname: string; email: string; phoneNumber: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/UpdateHospitalLab',
        method: 'PUT',
        body: profile,
        useToken: true,
      });
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  'auth/uploadProfilePhoto',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('newPicture', file);
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/update-photo',
        method: 'POST',
        body: formData,
        useToken: true,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload photo');
    }
  }
);

interface AuthState {
  user: {
    name: string;
    surname: string;
    email: string;
    avatarUrl: string | null;
    phoneNumber: string;
    role: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('authToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('authToken', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.error = null;
        if (action.payload.token) {
          localStorage.setItem('authToken', action.payload.token);
        }
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload === '401') {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('authToken');
        } else {
          state.isAuthenticated = true;
        }
        state.error = action.payload as string;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadProfilePhoto.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user && action.payload?.avatarUrl) {
          state.user.avatarUrl = action.payload.avatarUrl;
        }
        state.error = null;
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;