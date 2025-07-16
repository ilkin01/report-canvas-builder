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

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        dispatch(setToken(response.token)); // <-- redux state-ə yaz
        localStorage.setItem('auth_role', 'HospitalLab');
        try {
          const userResponse = await apiService.sendRequest({
            endpoint: '/api/HospitalLab/me',
            method: 'GET',
            useToken: true,
            token: response.token, // <-- token-i birbaşa ötür
          });

          const userData = {
            name: userResponse.name,
            surname: userResponse.surname,
            email: userResponse.email,
            avatarUrl: userResponse.avatarUrl,
            phoneNumber: userResponse.phoneNumber,
            role: 'HospitalLab',
          };

          return {
            token: response.token,
            user: userData
          };
        } catch (profileError: any) {
          return {
            token: response.token,
            user: null
          };
        }
      }
      return {
        token: response.token,
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
      const token = state.auth.token;
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/me',
        method: 'GET',
        useToken: true,
        token, // <-- redux-dan token
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
      localStorage.setItem('auth_role', '');
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profile: { name: string; surname: string; email: string; phoneNumber: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/UpdateHospitalLab',
        method: 'PUT', // <-- Fix: Use PUT instead of POST
        body: profile,
        useToken: true,
      });
      return profile; // Return the updated profile
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
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
  isLoading: boolean;
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
        // Əgər user məlumatı login cavabında yoxdursa, user null olaraq qalır
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
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
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
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;