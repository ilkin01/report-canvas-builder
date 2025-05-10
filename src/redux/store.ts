
import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from './slices/reportsSlice';
import templatesReducer from './slices/templatesSlice';

export const store = configureStore({
  reducer: {
    reports: reportsReducer,
    templates: templatesReducer,
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
