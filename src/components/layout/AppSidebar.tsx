
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { ElementType } from "@/types/editor";
import { 
  Square, 
  CircleIcon, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  PenTool,
  ListPlus 
} from "lucide-react";
import { ElementProperties } from "../editor/properties/ElementProperties";
import { PageControls } from "../editor/PageControls";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AppSidebar = () => {
  const { addElement, canvasState, getActiveReport } = useEditor();
  
  const selectedElement = canvasState.selectedElementIds.length > 0
    ? canvasState.pages[canvasState.currentPageIndex].elements.find(el => el.id === canvasState.selectedElementIds[0])
    : null;

  const activeReport = getActiveReport();

  const handleAddElement = (type: ElementType) => {
    if (!activeReport) {
      toast.error("Please open or create a report first");
      return;
    }

    const baseElement = {
      type,
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    };

    let content;
    switch (type) {
      case "text":
        content = {
          text: "Enter text here",
          fontSize: 16,
          color: "#333333",
          textAlign: "left",
        };
        break;
      case "chart":
        content = {
          type: "bar",
          data: {
            labels: ["A", "B", "C", "D", "E"],
            datasets: [
              {
                label: "Dataset",
                data: [12, 19, 3, 5, 2],
                backgroundColor: "rgba(14, 165, 233, 0.6)",
              },
            ],
          },
        };
        break;
      case "shape":
        content = {
          type: "rectangle",
          color: "#E5F3FF",
          borderWidth: 1,
          borderColor: "#0EA5E9",
        };
        break;
      case "comment":
        content = {
          text: "Add a comment here",
          author: "User",
          timestamp: new Date().toISOString(),
        };
        break;
      case "signature":
        content = {
          name: "",
          date: "",
          signature: "",
        };
        break;
      case "table":
        content = {
          title: "Laboratory Results",
          headerBgColor: "#f3f4f6",
          highlightColor: "#fef9c3",
          headers: ["Test Name", "Result", "Units", "Reference Range"],
          rows: [
            ["Hemoglobin", "12.5", "g/dL", "12.0-16.0"],
            ["Glucose", "95", "mg/dL", "74-106"],
            ["Cholesterol", "185", "mg/dL", "<200"]
          ],
          rowHighlights: [false, false, false],
          cellStatus: [
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"]
          ],
        };
        break;
      default:
        content = {};
    }

    addElement({
      ...baseElement,
      content,
    });
  };
  
  const handleAddLabTemplate = (template: string) => {
    if (!activeReport) {
      toast.error("Please open or create a report first");
      return;
    }
    
    let content;
    let width = 500;
    let height = 300;
    
    switch (template) {
      case "cbc":
        content = {
          title: "Complete Blood Count (CBC)",
          headerBgColor: "#e5f3ff",
          highlightColor: "#fef9c3",
          headers: ["Test Name", "Result", "Units", "Reference Range"],
          rows: [
            ["WBC", "7.5", "10³/μL", "4.0-10.0"],
            ["RBC", "4.8", "10⁶/μL", "4.0-5.5"],
            ["Hemoglobin", "14.2", "g/dL", "12.0-16.0"],
            ["Hematocrit", "42", "%", "36-46"],
            ["MCV", "88", "fL", "80-100"],
            ["MCH", "29.5", "pg", "27-33"],
            ["MCHC", "33.5", "g/dL", "32-36"],
            ["Platelets", "250", "10³/μL", "150-450"],
          ],
          rowHighlights: [false, false, false, false, false, false, false, false],
          cellStatus: [
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
          ],
        };
        break;
      case "biochemistry":
        content = {
          title: "Biochemistry Panel",
          headerBgColor: "#e5f3ff",
          highlightColor: "#fef9c3",
          headers: ["Test Name", "Result", "Units", "Reference Range"],
          rows: [
            ["Glucose", "95", "mg/dL", "74-106"],
            ["Urea", "32", "mg/dL", "17-43"],
            ["Creatinine", "0.9", "mg/dL", "0.7-1.2"],
            ["Total Protein", "7.2", "g/dL", "6.4-8.3"],
            ["Albumin", "4.5", "g/dL", "3.5-5.2"],
            ["AST", "25", "U/L", "0-35"],
            ["ALT", "28", "U/L", "0-45"],
            ["ALP", "75", "U/L", "30-120"],
          ],
          rowHighlights: [false, false, false, false, false, false, false, false],
          cellStatus: [
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
          ],
        };
        break;
      case "coagulation":
        content = {
          title: "Coagulation Profile",
          headerBgColor: "#e5f3ff",
          highlightColor: "#fef9c3",
          headers: ["Test Name", "Result", "Units", "Reference Range"],
          rows: [
            ["Prothrombin Time", "12.5", "sec", "11-15"],
            ["INR", "1.1", "", "0.8-1.2"],
            ["aPTT", "30", "sec", "25-35"],
            ["Fibrinogen", "320", "mg/dL", "200-400"],
            ["D-dimer", "<0.5", "μg/mL", "<0.5"],
          ],
          rowHighlights: [false, false, false, false, false],
          cellStatus: [
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
            ["normal", "normal", "normal", "normal"],
          ],
        };
        break;
      default:
        content = {
          headers: ["Column 1", "Column 2", "Column 3"],
          rows: [
            ["Cell 1", "Cell 2", "Cell 3"],
            ["Cell 4", "Cell 5", "Cell 6"],
          ],
        };
    }
    
    addElement({
      type: "table",
      x: 100,
      y: 100,
      width,
      height,
      content,
    });
  };

  return (
    <div className="w-64 border-r bg-white h-[calc(100vh-4rem)] flex flex-col">
      <PageControls />
      <Tabs defaultValue="elements" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-2 w-full rounded-none border-b">
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>
        
        <TabsContent value="elements" className="flex-grow overflow-auto">
          <div className="p-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 flex flex-col justify-center"
              onClick={() => handleAddElement("text")}
            >
              <FileText className="h-8 w-8 mb-2" />
              <span>Text</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col justify-center"
              onClick={() => handleAddElement("table")}
            >
              <Square className="h-8 w-8 mb-2" />
              <span>Table</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col justify-center"
              onClick={() => handleAddElement("chart")}
            >
              <BarChart3 className="h-8 w-8 mb-2" />
              <span>Chart</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col justify-center"
              onClick={() => handleAddElement("shape")}
            >
              <CircleIcon className="h-8 w-8 mb-2" />
              <span>Shape</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col justify-center"
              onClick={() => handleAddElement("comment")}
            >
              <MessageSquare className="h-8 w-8 mb-2" />
              <span>Comment</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col justify-center"
              onClick={() => handleAddElement("signature")}
            >
              <PenTool className="h-8 w-8 mb-2" />
              <span>Signature</span>
            </Button>
          </div>
          
          <div className="p-4 border-t">
            <h2 className="font-semibold text-lg mb-3 flex items-center">
              <ListPlus className="h-5 w-5 mr-2" />
              Lab Templates
            </h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAddLabTemplate("cbc")}
              >
                Complete Blood Count
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAddLabTemplate("biochemistry")}
              >
                Biochemistry Panel
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAddLabTemplate("coagulation")}
              >
                Coagulation Profile
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="properties" className="flex-grow overflow-auto">
          {selectedElement ? (
            <ElementProperties element={selectedElement} />
          ) : (
            <div className="p-4 text-center text-gray-500">
              Select an element to edit its properties
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
