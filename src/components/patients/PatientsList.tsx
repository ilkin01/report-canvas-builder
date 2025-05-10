
import { useEditor } from "@/context/EditorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export const PatientsList = () => {
  const { openReports, setActiveReport } = useEditor();

  // Function to get a short excerpt from the report content
  const getDocumentExcerpt = (report) => {
    if (!report.pages || !report.pages.length) return "No content";
    
    // Find text elements in the first page
    const textElements = report.pages[0].elements.filter(el => el.type === "text");
    if (textElements.length === 0) return "No text content";
    
    // Get the content of the first text element
    const firstText = textElements[0].content || "";
    
    // Return a short excerpt
    return firstText.length > 60 ? firstText.substring(0, 60) + "..." : firstText;
  };
  
  // Function to handle clicking on a report row
  const handleReportClick = (reportId) => {
    setActiveReport(reportId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Patient Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {openReports.length === 0 ? (
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
              {openReports.map((report) => (
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
