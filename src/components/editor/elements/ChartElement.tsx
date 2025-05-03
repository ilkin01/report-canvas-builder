
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
  const { type, data } = content;

  const chartData = useMemo(() => {
    if (!data?.labels || !data?.datasets || !data.datasets[0]?.data) {
      return [];
    }

    return data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0].data[index] || 0,
    }));
  }, [data]);

  const renderChart = () => {
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
                fill={
                  Array.isArray(data?.datasets[0]?.backgroundColor)
                    ? data?.datasets[0]?.backgroundColor[0]
                    : data?.datasets[0]?.backgroundColor || "rgba(14, 165, 233, 0.6)"
                }
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
                stroke={
                  Array.isArray(data?.datasets[0]?.borderColor)
                    ? data?.datasets[0]?.borderColor[0]
                    : data?.datasets[0]?.borderColor || "#0EA5E9"
                }
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
                    fill={
                      Array.isArray(data?.datasets[0]?.backgroundColor)
                        ? data?.datasets[0]?.backgroundColor[index % data.datasets[0].backgroundColor.length]
                        : `hsl(${index * 45 % 360}, 70%, 60%)`
                    }
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
    <div className="w-full h-full overflow-hidden">
      {renderChart()}
    </div>
  );
};
