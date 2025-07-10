import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '@/services/apiService';

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

      // Token varsa, yadda saxla
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        
        // Login uğurlu olduqdan sonra user profilini al
        try {
          const userResponse = await apiService.sendRequest({
            endpoint: '/api/HospitalLab/me',
            method: 'GET',
            useToken: true,
          });

          // API response-una görə user məlumatlarını map et
          const userData = {
            id: userResponse.id,
            email: userResponse.email,
            firstName: userResponse.name,
            lastName: userResponse.surname,
            role: userResponse.role,
            profileImage: userResponse.avatarUrl,
            userName: userResponse.userName,
            phoneNumber: userResponse.phoneNumber,
            hospitalId: userResponse.hospitalId,
          };

          return {
            token: response.token,
            user: userData
          };
        } catch (profileError: any) {
          // Profil alınmasa da login uğurlu sayılır
          console.warn('Failed to fetch user profile:', profileError);
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
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// User məlumatlarını al
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.sendRequest({
        endpoint: '/api/HospitalLab/me',
        method: 'GET',
        useToken: true,
      });

      // API response-una görə user məlumatlarını map et
      const userData = {
        id: response.id,
        email: response.email,
        firstName: response.name,
        lastName: response.surname,
        role: response.role,
        profileImage: response.avatarUrl,
        userName: response.userName,
        phoneNumber: response.phoneNumber,
        hospitalId: response.hospitalId,
      };

      return userData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

interface AuthState {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImage: string | null;
    userName: string;
    phoneNumber: string;
    hospitalId: string;
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
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;