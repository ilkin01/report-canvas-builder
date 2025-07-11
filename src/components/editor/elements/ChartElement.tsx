
import { ElementData } from "@/types/editor";
import {
  Bar,
  BarChart,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useMemo } from "react";

interface ChartElementProps {
  element: ElementData;
}

export const ChartElement: React.FC<ChartElementProps> = ({ element }) => {
  const { content } = element;
  const data = content?.data;
  // Fix: robust chart type detection for backend data
  const type = ["bar", "line", "pie"].includes(content?.type) ? content.type : "bar";

  // Provide default data structure if data is missing or incomplete
  const defaultData = {
    labels: ["Sample 1", "Sample 2", "Sample 3"],
    datasets: [{
      label: "Sample Data",
      data: [10, 20, 30],
      backgroundColor: "rgba(14, 165, 233, 0.6)",
      borderColor: "#0EA5E9"
    }]
  };

  // Accept both backend (array of objects) and frontend (labels/datasets) chart data formats
  const normalizeData = (data: any) => {
    console.log('ChartElement normalizeData input:', data);
    // Backend format: [{ name: 'A', value: 100 }, ...]
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'name' in data[0] && 'value' in data[0]) {
      return {
        labels: data.map((d: any) => d.name),
        datasets: [{
          label: content.title || 'Chart',
          data: data.map((d: any) => d.value),
          backgroundColor: 'rgba(14, 165, 233, 0.6)',
          borderColor: '#0EA5E9',
        }],
      };
    }
    // Frontend format: { labels, datasets }
    if (data && data.labels && data.datasets) {
      return data;
    }
    return defaultData;
  };

  const safeData = normalizeData(data);

  const chartData = useMemo(() => {
    if (!safeData?.labels || !safeData?.datasets || !safeData.datasets[0]?.data) {
      return [];
    }
    // Əgər backend array formatı gəlirsə, birbaşa onu qaytar
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'name' in data[0] && 'value' in data[0]) {
      return data;
    }
    return safeData.labels.map((label, index) => ({
      name: label,
      value: safeData.datasets[0].data[index] || 0,
    }));
  }, [safeData, data]);

  const getBackgroundColor = (index?: number) => {
    const dataset = safeData?.datasets?.[0];
    if (!dataset) return "rgba(14, 165, 233, 0.6)";
    
    const bgColor = dataset.backgroundColor;
    if (Array.isArray(bgColor)) {
      return bgColor[index || 0] || bgColor[0] || "rgba(14, 165, 233, 0.6)";
    }
    return bgColor || "rgba(14, 165, 233, 0.6)";
  };

  const getBorderColor = () => {
    const dataset = safeData?.datasets?.[0];
    if (!dataset) return "#0EA5E9";
    
    const borderColor = dataset.borderColor;
    if (Array.isArray(borderColor)) {
      return borderColor[0] || "#0EA5E9";
    }
    return borderColor || "#0EA5E9";
  };

  const renderChart = () => {
    console.log('ChartElement renderChart chartData:', chartData);
    // If no valid data, show a placeholder
    if (!chartData || chartData.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          No chart data available
        </div>
      );
    }

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={getBackgroundColor()}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={getBorderColor()}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <Tooltip />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.name}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBackgroundColor(index) || `hsl(${index * 45 % 360}, 70%, 60%)`}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="w-full h-full flex items-center justify-center">Invalid chart type</div>;
    }
  };

  return (
    <div className="w-full h-full overflow-hidden" style={{ minHeight: 180, minWidth: 120 }}>
      {renderChart()}
    </div>
  );
};
