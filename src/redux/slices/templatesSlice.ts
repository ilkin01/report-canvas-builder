
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Template } from '@/types/editor';
import { templatesApi } from '../api';

interface TemplatesState {
  templates: Template[];
  loading: boolean;
  error: string | null;
}

const initialState: TemplatesState = {
  templates: [],
  loading: false,
  error: null,
};

// Async thunks for API operations
export const fetchAllTemplates = createAsyncThunk(
  'templates/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await templatesApi.getAllTemplates();
    } catch (error) {
      return rejectWithValue('Failed to fetch templates');
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'templates/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const template = await templatesApi.getTemplateById(id);
      if (!template) {
        return rejectWithValue('Template not found');
      }
      return template;
    } catch (error) {
      return rejectWithValue('Failed to fetch template');
    }
  }
);

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch all templates
    builder.addCase(fetchAllTemplates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllTemplates.fulfilled, (state, action) => {
      state.templates = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchAllTemplates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch template by ID
    builder.addCase(fetchTemplateById.fulfilled, (state, action) => {
      const index = state.templates.findIndex(t => t.id === action.payload.id);
      if (index >= 0) {
        state.templates[index] = action.payload;
      } else {
        state.templates.push(action.payload);
      }
      state.loading = false;
    });
  },
});

export default templatesSlice.reducer;
