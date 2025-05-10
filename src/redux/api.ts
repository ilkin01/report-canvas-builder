
import { mockReports, mockTemplates } from './mockData';
import { ReportDocument, Template } from '@/types/editor';
import { v4 as uuidv4 } from 'uuid';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Reports API
export const reportsApi = {
  // Get all reports
  getAllReports: async (): Promise<ReportDocument[]> => {
    await delay(500);
    return [...mockReports];
  },

  // Get report by ID
  getReportById: async (id: string): Promise<ReportDocument | undefined> => {
    await delay(300);
    return mockReports.find(report => report.id === id);
  },

  // Create new report
  createReport: async (name: string, templateId: string): Promise<ReportDocument> => {
    await delay(700);
    
    const template = mockTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const newReport: ReportDocument = {
      id: uuidv4(),
      name,
      templateId,
      pages: [
        {
          id: uuidv4(),
          name: "Page 1",
          elements: [...template.elements]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newReport;
  },

  // Update report
  updateReport: async (report: ReportDocument): Promise<ReportDocument> => {
    await delay(400);
    return {
      ...report,
      updatedAt: new Date().toISOString(),
    };
  },

  // Delete report
  deleteReport: async (id: string): Promise<boolean> => {
    await delay(300);
    return true;
  }
};

// Templates API
export const templatesApi = {
  // Get all templates
  getAllTemplates: async (): Promise<Template[]> => {
    await delay(500);
    return [...mockTemplates];
  },

  // Get template by ID
  getTemplateById: async (id: string): Promise<Template | undefined> => {
    await delay(300);
    return mockTemplates.find(template => template.id === id);
  }
};
