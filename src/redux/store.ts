
import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from './slices/reportsSlice';
import templatesReducer from './slices/templatesSlice';

export const store = configureStore({
  reducer: {
    reports: reportsReducer,
    templates: templatesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
