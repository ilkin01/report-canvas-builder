
import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from './slices/reportsSlice';
import templatesReducer from './slices/templatesSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    reports: reportsReducer,
    templates: templatesReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['reports/fetchAll/fulfilled', 'reports/create/fulfilled', 'templates/fetchAll/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
