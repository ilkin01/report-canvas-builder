
import { ElementData } from "@/types/editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, Minus } from "lucide-react";

interface ChartPropertiesProps {
  element: ElementData;
  handleChange: (field: string, value: string | number | Record<string, any>) => void;
}

export const ChartProperties: React.FC<ChartPropertiesProps> = ({ element, handleChange }) => {
  // Provide default data structure if missing or incomplete
  const defaultChartData = {
    labels: ["Label 1", "Label 2", "Label 3"],
    datasets: [{
      label: "Dataset 1",
      data: [10, 20, 30],
      backgroundColor: "rgba(14, 165, 233, 0.6)",
      borderColor: "#0EA5E9"
    }]
  };

  const chartData = element.content.data || defaultChartData;

  // Ensure datasets array exists and has at least one dataset
  const safeChartData = {
    ...chartData,
    labels: chartData.labels || defaultChartData.labels,
    datasets: chartData.datasets && chartData.datasets.length > 0 
      ? chartData.datasets 
      : defaultChartData.datasets
  };

  const handleDatasetChange = (index: number, field: string, value: any) => {
    const updatedDatasets = [...safeChartData.datasets];
    updatedDatasets[index] = {
      ...updatedDatasets[index],
      [field]: value,
    };

    handleChange("data", {
      ...safeChartData,
      datasets: updatedDatasets,
    });
  };

  const handleLabelChange = (index: number, value: string) => {
    const updatedLabels = [...safeChartData.labels];
    updatedLabels[index] = value;

    handleChange("data", {
      ...safeChartData,
      labels: updatedLabels,
    });
  };

  const handleDataValueChange = (datasetIndex: number, valueIndex: number, value: string) => {
    const updatedDatasets = [...safeChartData.datasets];
    const newDataArray = [...(updatedDatasets[datasetIndex]?.data || [])];
    newDataArray[valueIndex] = parseFloat(value) || 0;

    updatedDatasets[datasetIndex] = {
      ...updatedDatasets[datasetIndex],
      data: newDataArray,
    };

    handleChange("data", {
      ...safeChartData,
      datasets: updatedDatasets,
    });
  };

  const addLabel = () => {
    const updatedLabels = [...safeChartData.labels, `Label ${safeChartData.labels.length + 1}`];
    
    // Also add a corresponding data point to each dataset
    const updatedDatasets = safeChartData.datasets.map(dataset => ({
      ...dataset,
      data: [...(dataset.data || []), 0]
    }));

    handleChange("data", {
      labels: updatedLabels,
      datasets: updatedDatasets,
    });
  };

  const removeLabel = (index: number) => {
    const updatedLabels = safeChartData.labels.filter((_, i) => i !== index);
    
    // Also remove the corresponding data point from each dataset
    const updatedDatasets = safeChartData.datasets.map(dataset => ({
      ...dataset,
      data: (dataset.data || []).filter((_, i) => i !== index)
    }));

    handleChange("data", {
      labels: updatedLabels,
      datasets: updatedDatasets,
    });
  };

  // Get the first dataset safely
  const firstDataset = safeChartData.datasets[0] || defaultChartData.datasets[0];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chartType">Chart Type</Label>
        <Select
          value={element.content.type || "bar"}
          onValueChange={(value) => handleChange("type", value)}
        >
          <SelectTrigger id="chartType">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Dataset Label</Label>
        <Input
          value={firstDataset.label || ""}
          onChange={(e) => handleDatasetChange(0, "label", e.target.value)}
          placeholder="Dataset label"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <Label>Labels & Values</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLabel}
            className="h-7 px-2"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {safeChartData.labels.map((label, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder={`Label ${index + 1}`}
                className="flex-1"
              />
              <Input
                type="number"
                value={firstDataset.data?.[index] || 0}
                onChange={(e) => handleDataValueChange(0, index, e.target.value)}
                placeholder="Value"
                className="w-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLabel(index)}
                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="backgroundColor">Chart Color</Label>
        <div className="flex gap-2">
          <Input
            id="backgroundColor"
            type="color"
            value={
              Array.isArray(firstDataset.backgroundColor)
                ? firstDataset.backgroundColor[0] || "#0EA5E9"
                : firstDataset.backgroundColor || "#0EA5E9"
            }
            onChange={(e) => handleDatasetChange(0, "backgroundColor", e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={
              Array.isArray(firstDataset.backgroundColor)
                ? firstDataset.backgroundColor[0] || "#0EA5E9"
                : firstDataset.backgroundColor || "#0EA5E9"
            }
            onChange={(e) => handleDatasetChange(0, "backgroundColor", e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
