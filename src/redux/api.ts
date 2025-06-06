import { mockReports, mockTemplates } from './mockData';
import { ReportDocument, Template } from '@/types/editor';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getUserTemplates } from '@/lib/templates';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Reports API
export const reportsApi = {
  // Get all reports
  getAllReports: async (): Promise<ReportDocument[]> => {
    await delay(500);
    console.log("Fetched all reports:", mockReports);
    return [...mockReports];
  },

  // Get report by ID
  getReportById: async (id: string): Promise<ReportDocument | undefined> => {
    await delay(300);
    const report = mockReports.find(report => report.id === id);
    console.log("Fetched report by ID:", id, report);
    if (!report) {
      throw new Error(`Report with ID ${id} not found`);
    }
    return JSON.parse(JSON.stringify(report)); // Deep copy to avoid reference issues
  },

  // Create new report
  createReport: async (name: string, templateId: string): Promise<ReportDocument> => {
    await delay(700);
    
    // First check system templates
    let template = mockTemplates.find(t => t.id === templateId);
    
    // If not found in system templates, check user templates
    if (!template) {
      const userTemplates = getUserTemplates();
      template = userTemplates.find(t => t.id === templateId);
    }
    
    if (!template) {
      console.error("Template not found:", templateId);
      toast.error("Template not found");
      throw new Error('Template not found');
    }
    
    console.log("Creating report with template:", template);
    
    // Use pages if available (for multi-page templates), otherwise use elements
    const templatePages = template.pages && template.pages.length > 0 
      ? JSON.parse(JSON.stringify(template.pages))
      : [
          {
            id: uuidv4(),
            name: "Page 1",
            elements: JSON.parse(JSON.stringify(template.elements || [])),
            width: 595,
            height: 842
          }
        ];
    
    const newReport: ReportDocument = {
      id: uuidv4(),
      name,
      templateId,
      pages: templatePages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log("Created new report:", newReport);
    
    // Store the new report in mockReports for session persistence
    mockReports.push(newReport);
    
    return newReport;
  },

  // Update report
  updateReport: async (report: ReportDocument): Promise<ReportDocument> => {
    await delay(400);
    console.log("Updating report:", report);
    return {
      ...report,
      updatedAt: new Date().toISOString(),
    };
  },

  // Delete report
  deleteReport: async (id: string): Promise<boolean> => {
    await delay(300);
    console.log("Deleting report:", id);
    return true;
  }
};

// Templates API
export const templatesApi = {
  // Get all templates
  getAllTemplates: async (): Promise<Template[]> => {
    await delay(500);
    console.log("Fetched all templates:", mockTemplates);
    return [...mockTemplates];
  },

  // Get template by ID
  getTemplateById: async (id: string): Promise<Template | undefined> => {
    await delay(300);
    const template = mockTemplates.find(template => template.id === id);
    console.log("Fetched template by ID:", id, template);
    return template ? JSON.parse(JSON.stringify(template)) : undefined; // Deep copy
  }
};
