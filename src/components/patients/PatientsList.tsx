
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReports, fetchReportById, setActiveReport } from "@/redux/slices/reportsSlice";
import { toast } from "sonner";

interface PatientsListProps {
  onReportSelect?: () => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({ onReportSelect }) => {
  const dispatch = useAppDispatch();
  const { reports, loading, error } = useAppSelector(state => state.reports);

  useEffect(() => {
    dispatch(fetchAllReports());
  }, [dispatch]);

  // Function to get a short excerpt from the report content
  const getDocumentExcerpt = (report) => {
    if (!report.pages || !report.pages.length) return "No content";
    
    // Find text elements in the first page
    const textElements = report.pages[0].elements.filter(el => el.type === "text");
    if (textElements.length === 0) return "No text content";
    
    // Get the content of the first text element
    const firstText = textElements[0].content?.text || "";
    
    // Return a short excerpt
    return typeof firstText === 'string' && firstText.length > 60 
      ? firstText.substring(0, 60) + "..." 
      : firstText;
  };
  
  // Function to handle clicking on a report row
  const handleReportClick = async (reportId) => {
    try {
      // Fetch the full report data first
      await dispatch(fetchReportById(reportId)).unwrap();
      // Then set it as active
      dispatch(setActiveReport(reportId));
      
      if (onReportSelect) {
        onReportSelect();
      }
    } catch (error) {
      toast.error("Failed to load report");
      console.error("Error loading report:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Patient Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6">Loading reports...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">
            Error loading reports: {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No reports available. Create a new report to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Content Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow 
                  key={report.id} 
                  className="cursor-pointer hover:bg-gray-100" 
                  onClick={() => handleReportClick(report.id)}
                >
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {getDocumentExcerpt(report)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
