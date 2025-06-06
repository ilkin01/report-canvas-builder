
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PatientsList } from "@/components/patients/PatientsList";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReports } from "@/redux/slices/reportsSlice";
import { fetchAllTemplates } from "@/redux/slices/templatesSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Settings, PenTool, TestTube, Users, FileText, TrendingUp } from "lucide-react";
import { TemplateManagement } from "@/components/editor/TemplateManagement";
import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId } = useAppSelector(state => state.reports);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Mock data for dashboard statistics with i18n support
  const dailyAnalysisData = [
    { name: t('days.monday'), value: 24 },
    { name: t('days.tuesday'), value: 31 },
    { name: t('days.wednesday'), value: 28 },
    { name: t('days.thursday'), value: 35 },
    { name: t('days.friday'), value: 42 },
    { name: t('days.saturday'), value: 38 },
    { name: t('days.sunday'), value: 29 },
  ];

  const analysisTypeData = [
    { name: t('analysisTypes.bloodTest'), value: 45, color: "#0EA5E9" },
    { name: t('analysisTypes.urineTest'), value: 25, color: "#10B981" },
    { name: t('analysisTypes.biochemistry'), value: 20, color: "#F97316" },
    { name: t('analysisTypes.microbiology'), value: 10, color: "#EF4444" },
  ];

  const monthlyTrendData = [
    { month: t('months.jan'), patients: 145, analyses: 324 },
    { month: t('months.feb'), patients: 152, analyses: 342 },
    { month: t('months.mar'), patients: 168, analyses: 378 },
    { month: t('months.apr'), patients: 175, analyses: 395 },
    { month: t('months.may'), patients: 183, analyses: 412 },
    { month: t('months.jun'), patients: 192, analyses: 435 },
  ];

  const chartConfig = {
    value: {
      label: t('chartLabels.value'),
      color: "#0EA5E9",
    },
    patients: {
      label: t('chartLabels.patients'),
      color: "#0EA5E9",
    },
    analyses: {
      label: t('chartLabels.analyses'),
      color: "#10B981",
    },
  };
  
  useEffect(() => {
    // Load initial data
    Promise.all([
      dispatch(fetchAllReports()),
      dispatch(fetchAllTemplates())
    ]).catch(err => {
      toast.error("Başlangıç verileri yüklenirken hata oluştu");
      console.error("Error loading initial data:", err);
    });
  }, [dispatch]);

  // Go to editor when we have an active report
  useEffect(() => {
    if (activeReportId) {
      setIsEditing(true);
    }
  }, [activeReportId]);

  const handleCreateTemplate = () => {
    navigate("/template-creator");
  };

  const handleCreateAnalysis = () => {
    setShowTemplateGallery(true);
  };

  return (
    <EditorProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          {!isEditing ? (
            <div className="flex-1 overflow-auto">
              {/* Dashboard Header */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <LanguageSwitcher />
                    <Button onClick={handleCreateAnalysis} className="bg-medical-blue hover:bg-blue-600 w-full sm:w-auto text-sm">
                      <TestTube className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('dashboard.createAnalysis')}</span>
                      <span className="sm:hidden">Analiz</span>
                    </Button>
                    <Button onClick={handleCreateTemplate} variant="outline" className="w-full sm:w-auto text-sm">
                      <PenTool className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('dashboard.newTemplate')}</span>
                      <span className="sm:hidden">Şablon</span>
                    </Button>
                    <Button onClick={() => setShowTemplateManagement(true)} variant="outline" className="w-full sm:w-auto text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('dashboard.settings')}</span>
                      <span className="sm:hidden">Ayarlar</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="animate-fade-in">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('dashboard.todayAnalyses')}</CardTitle>
                      <TestTube className="h-4 w-4 text-medical-blue" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-medical-blue">42</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-medical-success">+12%</span> {t('dashboard.fromYesterday')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('dashboard.activePatients')}</CardTitle>
                      <Users className="h-4 w-4 text-medical-success" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-medical-success">183</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-medical-success">+5%</span> {t('dashboard.thisWeek')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('dashboard.totalReports')}</CardTitle>
                      <FileText className="h-4 w-4 text-medical-warning" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-medical-warning">1,234</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-medical-success">+8%</span> {t('dashboard.thisMonth')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('dashboard.averageTime')}</CardTitle>
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">2.4h</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-medical-error">-15%</span> {t('dashboard.improvement')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Daily Analysis Chart */}
                  <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{t('dashboard.dailyAnalysisNumbers')}</CardTitle>
                      <CardDescription className="text-sm">{t('dashboard.thisWeekDistribution')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
                        <BarChart data={dailyAnalysisData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="var(--color-value)" className="animate-[fade-in_0.5s_ease-out]" />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Analysis Types Pie Chart */}
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{t('dashboard.analysisTypes')}</CardTitle>
                      <CardDescription className="text-sm">{t('dashboard.thisMonthDistribution')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={analysisTypeData}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                            nameKey="name"
                            label={(entry) => `${entry.name}: ${entry.value}%`}
                            labelStyle={{ fontSize: 10 }}
                          >
                            {analysisTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">{t('dashboard.monthlyTrendAnalysis')}</CardTitle>
                    <CardDescription className="text-sm">{t('dashboard.monthlyDevelopment')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="patients" 
                          stroke="var(--color-patients)" 
                          strokeWidth={3}
                          dot={{ fill: "var(--color-patients)", strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="analyses" 
                          stroke="var(--color-analyses)" 
                          strokeWidth={3}
                          dot={{ fill: "var(--color-analyses)", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Patients List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">{t('dashboard.recentPatients')}</CardTitle>
                    <CardDescription className="text-sm">{t('dashboard.recentPatientsDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PatientsList onReportSelect={() => setIsEditing(true)} />
                  </CardContent>
                </Card>
              </div>

              {/* Template Management Dialog */}
              <TemplateManagement
                open={showTemplateManagement}
                onOpenChange={setShowTemplateManagement}
              />

              {/* Template Gallery Dialog */}
              <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('dashboard.selectAnalysisTemplate')}</DialogTitle>
                    <DialogDescription>
                      {t('dashboard.selectTemplateDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-6">
                    <TemplateGallery onSelectTemplate={() => setShowTemplateGallery(false)} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              <AppSidebar />
              <EditorCanvas onClose={() => setIsEditing(false)} />
            </>
          )}
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;
