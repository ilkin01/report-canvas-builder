
import { Template } from "@/types/editor";

export const systemTemplates: Template[] = [
  {
    id: "cbc-template",
    name: "Complete Blood Count",
    thumbnail: "cbc-thumbnail.png",
    category: "system",
    elements: [
      {
        id: "header-1",
        type: "text",
        x: 20,
        y: 20,
        width: 500,
        height: 40,
        content: {
          text: "Complete Blood Count (CBC) Report",
          fontSize: 24,
          fontWeight: "bold",
          color: "#0EA5E9",
          textAlign: "center",
        }
      },
      {
        id: "patient-info",
        type: "text",
        x: 20,
        y: 70,
        width: 300,
        height: 120,
        content: {
          text: "Patient: [Name]\nDate of Birth: [DOB]\nMedical Record #: [MRN]\nDate Collected: [Date]\nDate Reported: [Date]",
          fontSize: 14,
          color: "#333333",
          textAlign: "left",
        }
      },
      {
        id: "cbc-table",
        type: "table",
        x: 20,
        y: 200,
        width: 700,
        height: 300,
        content: {
          headers: ["Test", "Result", "Units", "Reference Range", "Flag"],
          rows: [
            ["WBC", "", "10^3/μL", "4.5-11.0", ""],
            ["RBC", "", "10^6/μL", "4.5-5.9", ""],
            ["Hemoglobin", "", "g/dL", "13.5-17.5", ""],
            ["Hematocrit", "", "%", "41.0-53.0", ""],
            ["MCV", "", "fL", "80.0-100.0", ""],
            ["MCH", "", "pg", "27.0-31.0", ""],
            ["MCHC", "", "g/dL", "32.0-36.0", ""],
            ["Platelets", "", "10^3/μL", "150-450", ""],
          ]
        }
      },
      {
        id: "cbc-chart",
        type: "chart",
        x: 20,
        y: 520,
        width: 400,
        height: 250,
        content: {
          type: "bar",
          data: {
            labels: ["WBC", "RBC", "Hemoglobin", "Hematocrit"],
            datasets: [
              {
                label: "Results",
                data: [7.5, 5.2, 15.2, 46],
                backgroundColor: "rgba(14, 165, 233, 0.6)",
                borderColor: "rgba(14, 165, 233, 1)",
                borderWidth: 1
              }
            ]
          }
        }
      },
      {
        id: "signature-1",
        type: "signature",
        x: 500,
        y: 600,
        width: 250,
        height: 100,
        content: {
          name: "Dr. Smith",
          date: "",
          signature: ""
        }
      },
    ]
  },
  {
    id: "biochemistry-template",
    name: "Biochemistry Panel",
    thumbnail: "biochemistry-thumbnail.png",
    category: "system",
    elements: [
      {
        id: "header-1",
        type: "text",
        x: 20,
        y: 20,
        width: 500,
        height: 40,
        content: {
          text: "Biochemistry Panel Report",
          fontSize: 24,
          fontWeight: "bold",
          color: "#0EA5E9",
          textAlign: "center",
        }
      },
      {
        id: "patient-info",
        type: "text",
        x: 20,
        y: 70,
        width: 300,
        height: 120,
        content: {
          text: "Patient: [Name]\nDate of Birth: [DOB]\nMedical Record #: [MRN]\nDate Collected: [Date]\nDate Reported: [Date]",
          fontSize: 14,
          color: "#333333",
          textAlign: "left",
        }
      },
      {
        id: "biochem-table",
        type: "table",
        x: 20,
        y: 200,
        width: 700,
        height: 400,
        content: {
          headers: ["Test", "Result", "Units", "Reference Range", "Flag"],
          rows: [
            ["Glucose", "", "mg/dL", "70-99", ""],
            ["Urea", "", "mg/dL", "7-20", ""],
            ["Creatinine", "", "mg/dL", "0.7-1.3", ""],
            ["Sodium", "", "mmol/L", "135-145", ""],
            ["Potassium", "", "mmol/L", "3.5-5.0", ""],
            ["Chloride", "", "mmol/L", "98-107", ""],
            ["Total Protein", "", "g/dL", "6.4-8.3", ""],
            ["Albumin", "", "g/dL", "3.5-5.0", ""],
            ["Total Bilirubin", "", "mg/dL", "0.2-1.2", ""],
            ["ALT", "", "U/L", "7-55", ""],
            ["AST", "", "U/L", "8-48", ""],
          ]
        }
      },
      {
        id: "comment-1",
        type: "comment",
        x: 20,
        y: 620,
        width: 400,
        height: 100,
        content: {
          text: "Note: Results should be interpreted in the clinical context.",
          author: "Lab Technician"
        }
      },
      {
        id: "signature-1",
        type: "signature",
        x: 500,
        y: 620,
        width: 250,
        height: 100,
        content: {
          name: "Dr. Johnson",
          date: "",
          signature: ""
        }
      }
    ]
  },
  {
    id: "hematology-template",
    name: "Hematology Table",
    thumbnail: "hematology-thumbnail.png",
    category: "system",
    elements: [
      {
        id: "header-1",
        type: "text",
        x: 20,
        y: 20,
        width: 500,
        height: 40,
        content: {
          text: "Hematology Report",
          fontSize: 24,
          fontWeight: "bold",
          color: "#0EA5E9",
          textAlign: "center",
        }
      },
      {
        id: "patient-info",
        type: "text",
        x: 20,
        y: 70,
        width: 300,
        height: 120,
        content: {
          text: "Patient: [Name]\nDate of Birth: [DOB]\nMedical Record #: [MRN]\nDate Collected: [Date]\nDate Reported: [Date]",
          fontSize: 14,
          color: "#333333",
          textAlign: "left",
        }
      },
      {
        id: "hematology-table",
        type: "table",
        x: 20,
        y: 200,
        width: 700,
        height: 300,
        content: {
          headers: ["Test", "Result", "Units", "Reference Range", "Flag"],
          rows: [
            ["Leukocytes", "", "10^3/μL", "4.5-11.0", ""],
            ["Neutrophils", "", "%", "40-75", ""],
            ["Lymphocytes", "", "%", "20-45", ""],
            ["Monocytes", "", "%", "2-10", ""],
            ["Eosinophils", "", "%", "1-6", ""],
            ["Basophils", "", "%", "0-1", ""],
            ["Erythrocytes", "", "10^6/μL", "4.5-5.9", ""],
          ]
        }
      },
      {
        id: "differential-chart",
        type: "chart",
        x: 20,
        y: 520,
        width: 400,
        height: 250,
        content: {
          type: "pie",
          data: {
            labels: ["Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils"],
            datasets: [
              {
                label: "Differential Count",
                data: [60, 30, 5, 4, 1],
                backgroundColor: [
                  "rgba(14, 165, 233, 0.8)",
                  "rgba(249, 115, 22, 0.8)",
                  "rgba(16, 185, 129, 0.8)",
                  "rgba(239, 68, 68, 0.8)",
                  "rgba(107, 114, 128, 0.8)"
                ],
                borderWidth: 1
              }
            ]
          }
        }
      },
      {
        id: "signature-1",
        type: "signature",
        x: 500,
        y: 600,
        width: 250,
        height: 100,
        content: {
          name: "Dr. Williams",
          date: "",
          signature: ""
        }
      }
    ]
  }
];

export const getTemplateById = (id: string): Template | undefined => {
  // First check system templates
  const systemTemplate = systemTemplates.find(template => template.id === id);
  if (systemTemplate) {
    return systemTemplate;
  }
  
  // Then check user templates
  const userTemplates = getUserTemplates();
  return userTemplates.find(template => template.id === id);
};

export const getUserTemplates = (): Template[] => {
  const savedTemplates = localStorage.getItem('userTemplates');
  if (savedTemplates) {
    return JSON.parse(savedTemplates);
  }
  return [];
};

export const saveUserTemplate = (template: Template): void => {
  const userTemplates = getUserTemplates();
  const existingIndex = userTemplates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    userTemplates[existingIndex] = template;
  } else {
    userTemplates.push({
      ...template,
      category: 'custom',
      id: template.id || `custom-${Date.now()}`
    });
  }
  
  localStorage.setItem('userTemplates', JSON.stringify(userTemplates));
};
