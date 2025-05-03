
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
  const chartData = element.content.data || {
    labels: [],
    datasets: [{ label: "", data: [] }],
  };

  const handleDatasetChange = (index: number, field: string, value: any) => {
    const updatedDatasets = [...chartData.datasets];
    updatedDatasets[index] = {
      ...updatedDatasets[index],
      [field]: value,
    };

    handleChange("data", {
      ...chartData,
      datasets: updatedDatasets,
    });
  };

  const handleLabelChange = (index: number, value: string) => {
    const updatedLabels = [...chartData.labels];
    updatedLabels[index] = value;

    handleChange("data", {
      ...chartData,
      labels: updatedLabels,
    });
  };

  const handleDataValueChange = (datasetIndex: number, valueIndex: number, value: string) => {
    const updatedDatasets = [...chartData.datasets];
    const newDataArray = [...updatedDatasets[datasetIndex].data];
    newDataArray[valueIndex] = parseFloat(value) || 0;

    updatedDatasets[datasetIndex] = {
      ...updatedDatasets[datasetIndex],
      data: newDataArray,
    };

    handleChange("data", {
      ...chartData,
      datasets: updatedDatasets,
    });
  };

  const addLabel = () => {
    const updatedLabels = [...chartData.labels, `Label ${chartData.labels.length + 1}`];
    
    // Also add a corresponding data point to each dataset
    const updatedDatasets = chartData.datasets.map(dataset => ({
      ...dataset,
      data: [...dataset.data, 0]
    }));

    handleChange("data", {
      labels: updatedLabels,
      datasets: updatedDatasets,
    });
  };

  const removeLabel = (index: number) => {
    const updatedLabels = chartData.labels.filter((_, i) => i !== index);
    
    // Also remove the corresponding data point from each dataset
    const updatedDatasets = chartData.datasets.map(dataset => ({
      ...dataset,
      data: dataset.data.filter((_, i) => i !== index)
    }));

    handleChange("data", {
      labels: updatedLabels,
      datasets: updatedDatasets,
    });
  };

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
          value={chartData.datasets[0]?.label || ""}
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
          {chartData.labels.map((label, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder={`Label ${index + 1}`}
                className="flex-1"
              />
              <Input
                type="number"
                value={chartData.datasets[0]?.data[index] || 0}
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
              Array.isArray(chartData.datasets[0]?.backgroundColor)
                ? chartData.datasets[0]?.backgroundColor[0]
                : chartData.datasets[0]?.backgroundColor || "rgba(14, 165, 233, 0.6)"
            }
            onChange={(e) => handleDatasetChange(0, "backgroundColor", e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={
              Array.isArray(chartData.datasets[0]?.backgroundColor)
                ? chartData.datasets[0]?.backgroundColor[0]
                : chartData.datasets[0]?.backgroundColor || "rgba(14, 165, 233, 0.6)"
            }
            onChange={(e) => handleDatasetChange(0, "backgroundColor", e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
