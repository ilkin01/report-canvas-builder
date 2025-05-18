import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReports, fetchReportById, viewReport } from "@/redux/slices/reportsSlice";
import { toast } from "sonner";

interface PatientsListProps {
  onReportSelect?: () => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({ onReportSelect }) => {
  const dispatch = useAppDispatch();
  const { reports, loading, error } = useAppSelector(state => state.reports);

  useEffect(() => {
    // dispatch(fetchAllReports()); // Bu, Index.tsx'de zaten çağrılıyor olabilir. Tekrar çağırmak yerine oraya güvenebiliriz.
                               // Eğer Index.tsx'de yoksa veya burada özel bir ihtiyaç varsa açılabilir.
  }, [dispatch]);

  // Function to get a short excerpt from the report content
  const getDocumentExcerpt = (report: ReportDocument) => {
    if (!report.pages || !report.pages.length || !report.pages[0].elements) return "No content";
    
    const textElements = report.pages[0].elements.filter(el => el.type === "text");
    if (textElements.length === 0) return "No text content";
    
    const firstTextContent = textElements[0].content;
    // Check if content and content.text exist
    const firstText = firstTextContent && typeof firstTextContent.text === 'string' ? firstTextContent.text : "";
    
    return firstText.length > 60 
      ? firstText.substring(0, 60) + "..." 
      : firstText;
  };
  
  // Function to handle clicking on a report row
  const handleReportClick = async (reportId: string) => {
    try {
      await dispatch(fetchReportById(reportId)).unwrap(); // Raporun tam verisini çek
      dispatch(viewReport(reportId)); // Raporu "görüntülenen" olarak ayarla (diğer sekmeleri temizler)
      
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
        {loading && reports.length === 0 ? ( // Sadece başlangıç yüklemesinde göster
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
