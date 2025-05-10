
import { v4 as uuidv4 } from 'uuid';
import { ReportDocument, Template } from '@/types/editor';

// Mock templates data
export const mockTemplates: Template[] = [
  {
    id: "template1",
    name: "Basic Medical Report",
    category: "system",
    elements: [
      {
        id: uuidv4(),
        type: "text",
        x: 50,
        y: 50,
        width: 500,
        height: 50,
        content: {
          text: "Patient Medical Report",
          fontSize: 24,
          fontWeight: "bold",
          color: "#333333",
          textAlign: "center"
        }
      },
      {
        id: uuidv4(),
        type: "text",
        x: 50,
        y: 120,
        width: 700,
        height: 200,
        content: {
          text: "Enter patient medical details here...",
          fontSize: 14,
          fontWeight: "normal",
          color: "#666666",
          textAlign: "left"
        }
      }
    ]
  },
  {
    id: "template2",
    name: "Lab Results",
    category: "system",
    elements: [
      {
        id: uuidv4(),
        type: "text",
        x: 50,
        y: 50,
        width: 500,
        height: 50,
        content: {
          text: "Laboratory Test Results",
          fontSize: 24,
          fontWeight: "bold",
          color: "#333333",
          textAlign: "center"
        }
      },
      {
        id: uuidv4(),
        type: "table",
        x: 50,
        y: 120,
        width: 700,
        height: 300,
        content: {
          headers: ["Test", "Result", "Reference Range", "Units"],
          rows: [
            ["Hemoglobin", "14.2", "13.5-17.5", "g/dL"],
            ["White Blood Cell Count", "7.5", "4.5-11.0", "10^3/μL"],
            ["Platelets", "250", "150-450", "10^3/μL"]
          ],
          title: "Complete Blood Count",
          headerBgColor: "#f2f2f2"
        }
      }
    ]
  },
  {
    id: "template3",
    name: "Prescription Form",
    category: "system",
    elements: [
      {
        id: uuidv4(),
        type: "text",
        x: 50,
        y: 50,
        width: 500,
        height: 50,
        content: {
          text: "Prescription",
          fontSize: 24,
          fontWeight: "bold",
          color: "#333333",
          textAlign: "center"
        }
      },
      {
        id: uuidv4(),
        type: "text",
        x: 50,
        y: 120,
        width: 700,
        height: 50,
        content: {
          text: "Patient Name: ____________________________",
          fontSize: 14,
          fontWeight: "normal",
          color: "#000000",
          textAlign: "left"
        }
      },
      {
        id: uuidv4(),
        type: "text",
        x: 50,
        y: 180,
        width: 700,
        height: 50,
        content: {
          text: "Date: ____________________________",
          fontSize: 14,
          fontWeight: "normal",
          color: "#000000",
          textAlign: "left"
        }
      }
    ]
  }
];

// Mock reports data
export const mockReports: ReportDocument[] = [
  {
    id: uuidv4(),
    name: "John Doe - Annual Checkup",
    templateId: "template1",
    pages: [
      {
        id: uuidv4(),
        name: "Page 1",
        elements: [
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 50,
            width: 500,
            height: 50,
            content: {
              text: "Annual Health Examination - John Doe",
              fontSize: 24,
              fontWeight: "bold",
              color: "#333333",
              textAlign: "center"
            }
          },
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 120,
            width: 700,
            height: 200,
            content: {
              text: "Patient is in good health. Blood pressure is 120/80. Heart rate is 72 bpm. No significant findings.",
              fontSize: 14,
              fontWeight: "normal",
              color: "#666666",
              textAlign: "left"
            }
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: uuidv4(),
    name: "Jane Smith - Blood Test Results",
    templateId: "template2",
    pages: [
      {
        id: uuidv4(),
        name: "Page 1",
        elements: [
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 50,
            width: 500,
            height: 50,
            content: {
              text: "Blood Test Results - Jane Smith",
              fontSize: 24,
              fontWeight: "bold",
              color: "#333333",
              textAlign: "center"
            }
          },
          {
            id: uuidv4(),
            type: "table",
            x: 50,
            y: 120,
            width: 700,
            height: 300,
            content: {
              headers: ["Test", "Result", "Reference Range", "Units"],
              rows: [
                ["Hemoglobin", "13.8", "12.0-15.5", "g/dL"],
                ["White Blood Cell Count", "6.2", "4.5-11.0", "10^3/μL"],
                ["Platelets", "280", "150-450", "10^3/μL"],
                ["Glucose", "95", "70-100", "mg/dL"]
              ],
              title: "Complete Blood Count",
              headerBgColor: "#f2f2f2"
            }
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: uuidv4(),
    name: "Michael Johnson - Prescription",
    templateId: "template3",
    pages: [
      {
        id: uuidv4(),
        name: "Page 1",
        elements: [
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 50,
            width: 500,
            height: 50,
            content: {
              text: "Prescription - Michael Johnson",
              fontSize: 24,
              fontWeight: "bold",
              color: "#333333",
              textAlign: "center"
            }
          },
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 120,
            width: 700,
            height: 50,
            content: {
              text: "Patient Name: Michael Johnson",
              fontSize: 14,
              fontWeight: "normal",
              color: "#000000",
              textAlign: "left"
            }
          },
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 180,
            width: 700,
            height: 50,
            content: {
              text: "Date: May 8, 2025",
              fontSize: 14,
              fontWeight: "normal",
              color: "#000000",
              textAlign: "left"
            }
          },
          {
            id: uuidv4(),
            type: "text",
            x: 50,
            y: 240,
            width: 700,
            height: 200,
            content: {
              text: "Rx:\nAmoxicillin 500mg\nTake 1 capsule by mouth three times daily for 10 days",
              fontSize: 14,
              fontWeight: "normal",
              color: "#000000",
              textAlign: "left"
            }
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now()).toISOString(), // today
  }
];
