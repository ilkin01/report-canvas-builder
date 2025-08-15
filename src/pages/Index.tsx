
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
import { 
  Settings, 
  PenTool, 
  TestTube, 
  Users, 
  FileText, 
  TrendingUp, 
  User, 
  Calendar,
  Clock,
  Activity,
  BarChart3,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { TemplateManagement } from "@/components/editor/TemplateManagement";
import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/services/apiService";
import { fetchUserProfile } from "@/redux/slices/authSlice";
import { Input } from "@/components/ui/input";
import PatientFilesList from '@/components/patients/PatientFilesList';
import { fetchReportStats } from '@/redux/slices/reportsSlice';
import { fetchMonthlySentFilesCount } from '@/redux/slices/reportsSlice';
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'reports' | 'files'>('reports');
  const [sort, setSort] = useState(true);
  const [patientReports, setPatientReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId, reportStats } = useAppSelector(state => state.reports);
  const { user } = useAppSelector(state => state.auth);
  const { monthlySentFilesCount } = useAppSelector(state => state.reports);
  const navigate = useNavigate();

  // Chart config
  const chartConfig = {
    value: {
      label: t('chartLabels.value'),
      color: "#3B82F6",
    },
    patients: {
      label: t('chartLabels.patients'),
      color: "#10B981",
    },
    analyses: {
      label: t('chartLabels.analyses'),
      color: "#3B82F6",
    },
  };

  // User adını al
  const getUserName = () => {
    if (!user || user.role !== 'HospitalLab') return t('header.user');
    const name = user.name || "";
    const surname = user.surname || "";
    return `${name} ${surname}`.trim() || t('header.user');
  };

  // User adının baş hərflərini al
  const getUserInitials = () => {
    if (!user || user.role !== 'HospitalLab') return "U";
    const name = user.name || "";
    const surname = user.surname || "";
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  // Cari vaxtı al
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    let greeting = "";
    
    if (hours < 12) {
      greeting = t('dashboard.greeting.morning');
    } else if (hours < 18) {
      greeting = t('dashboard.greeting.afternoon');
    } else {
      greeting = t('dashboard.greeting.evening');
    }
    
    return greeting;
  };

  // Cari tarixi al
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('az-AZ', options);
  };

  // Mock data for dashboard statistics
  const dailyAnalysisData = [
    { name: 'Bazar ertəsi', value: 24 },
    { name: 'Çərşənbə axşamı', value: 31 },
    { name: 'Çərşənbə', value: 28 },
    { name: 'Cümə axşamı', value: 35 },
    { name: 'Cümə', value: 42 },
    { name: 'Şənbə', value: 38 },
    { name: 'Bazar', value: 29 },
  ];

  const analysisTypeData = [
    { name: 'Qan analizi', value: 45, color: "#0EA5E9" },
    { name: 'Sidik analizi', value: 25, color: "#10B981" },
    { name: 'Biokimya', value: 20, color: "#F97316" },
    { name: 'Mikrobiologiya', value: 10, color: "#EF4444" },
  ];

  const monthlyTrendData = [
    { month: 'Yan', patients: 145, analyses: 324 },
    { month: 'Fev', patients: 152, analyses: 342 },
    { month: 'Mar', patients: 168, analyses: 378 },
    { month: 'Apr', patients: 175, analyses: 395 },
    { month: 'May', patients: 183, analyses: 412 },
    { month: 'İyun', patients: 192, analyses: 435 },
  ];

  const recentActivities = [
    { id: 1, type: 'analysis', patient: 'Əli Məmmədov', time: '2 dəqiqə əvvəl', status: 'completed' },
    { id: 2, type: 'report', patient: 'Aysu Hüseynova', time: '15 dəqiqə əvvəl', status: 'pending' },
    { id: 3, type: 'template', patient: 'Məryəm Əliyeva', time: '1 saat əvvəl', status: 'completed' },
    { id: 4, type: 'analysis', patient: 'Rəşad Qurbanov', time: '2 saat əvvəl', status: 'in-progress' },
  ];

  const quickStats = [
    { title: t('dashboard.stats.dailyReports'), value: String(reportStats?.dailyReportCount ?? 0), icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: t('dashboard.stats.monthlyReports'), value: String(reportStats?.monthlyReportCount ?? 0), icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: t('dashboard.stats.monthlySentFiles'), value: String(monthlySentFilesCount ?? 0), icon: Download, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];
  
  useEffect(() => {
    // Load initial data
    Promise.all([
      dispatch(fetchAllReports()),
      dispatch(fetchAllTemplates()),
      dispatch(fetchReportStats()),
      dispatch(fetchMonthlySentFilesCount()),
    ]).catch(err => {
      toast.error(t('messages.loadingError'));
      console.error("Error loading initial data:", err);
    });
  }, [dispatch]);

  useEffect(() => {
    // Restore user session if token exists but user is missing
    if (!user && localStorage.getItem('authToken')) {
      dispatch(fetchUserProfile());
    }
  }, [user, dispatch]);

  // Fetch patient reports with sort
  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const res = await apiService.sendRequest({
          endpoint: "/api/Report/GetAllReportsPagination",
          method: "POST",
          body: {
            name: searchName,
            sort,
            pageIndex,
            pageSize,
          },
        });
        setPatientReports(res?.data || res?.reports || []);
        setTotalCount(res?.totalCount || 0);
        setTotalPages(Math.max(1, Math.ceil((res?.totalCount || 0) / pageSize)));
      } catch (err) {
        setPatientReports([]);
        setTotalCount(0);
        setTotalPages(1);
      }
      setLoadingReports(false);
    };
    fetchReports();
  }, [sort, searchName, pageIndex]);

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <TestTube className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      case 'template': return <PenTool className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <EditorProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          {!isEditing ? (
            <div className="flex-1 overflow-auto">
              {/* Quick Actions Grid */}
              <div className="p-6 md:p-8">
                <div className="grid gap-4 md:gap-6 mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* New Analysis Button - Hidden on Mobile */}
                    {!isMobile && (
                      <Button 
                        onClick={handleCreateAnalysis}
                        className="h-20 md:h-24 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-2 bg-white/20 rounded-full">
                            <TestTube className="h-6 w-6" />
                          </div>
                          <span className="font-medium">{t('dashboard.quickActions.newAnalysis')}</span>
                        </div>
                      </Button>
                    )}

                    {/* New Template Button - Hidden on Mobile */}
                    {!isMobile && (
                      <Button 
                        onClick={handleCreateTemplate}
                        variant="outline"
                        className="h-20 md:h-24 bg-green-600 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-2 bg-white/20 rounded-full">
                            <PenTool className="h-6 w-6" />
                          </div>
                          <span className="font-medium">{t('dashboard.quickActions.newTemplate')}</span>
                        </div>
                      </Button>
                    )}

                    {/* Management Button */}
                    <Button 
                      onClick={() => setShowTemplateManagement(true)}
                      variant="outline"
                      className="h-20 md:h-24 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-2 bg-white/20 rounded-full">
                          <Settings className="h-6 w-6" />
                        </div>
                        <span className="font-medium">{t('dashboard.quickActions.management')}</span>
                      </div>
                    </Button>

                    {/* Send File to Patient Button */}
                    <Button
                      onClick={() => navigate('/send-file-to-patient')}
                      className="h-20 md:h-24 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-2 bg-white/20 rounded-full">
                          <Download className="h-6 w-6" />
                        </div>
                        <span className="font-medium">{t('dashboard.stats.sendFileToPatient')}</span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                  {quickStats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-all duration-200 border-0 bg-white shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          </div>
                          <div className={`p-3 rounded-full ${stat.bgColor}`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
                  <div className="flex gap-1">
                    <button
                      className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                        activeTab === 'reports' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab('reports')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-5 w-5" />
                        {t('dashboard.tabs.patientReports')}
                      </div>
                    </button>
                    <button
                      className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                        activeTab === 'files' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab('files')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t('dashboard.tabs.patientFiles')}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'reports' ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="p-6 border-b border-gray-100">
                      <CardTitle className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.patientsList.title')}</h2>
                            <p className="text-gray-600">{t('dashboard.patientsList.description')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder={t('common.search')}
                              value={searchName}
                              onChange={e => {
                                setSearchName(e.target.value);
                                setPageIndex(0);
                              }}
                              className="w-full sm:w-64 h-10 text-sm border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg pl-9"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setSort((prev) => !prev)}
                            className="h-10 px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              {sort ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {sort ? t('dashboard.patientsList.newest') : t('dashboard.patientsList.oldest')}
                            </div>
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {loadingReports ? (
                        <div className="py-12 text-center">
                          <div className="inline-flex items-center gap-3 text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="text-lg">{t('common.loading')}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <PatientsList onReportSelect={() => setIsEditing(true)} reports={patientReports} />
                          {/* Pagination */}
                          {patientReports.length > 0 && (
                            <div className="flex justify-center items-center mt-8">
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                                  disabled={pageIndex === 0}
                                  className="h-9 w-9 p-0 rounded-md border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="px-4 py-2 bg-white rounded-md border border-gray-200">
                                  <span className="font-medium text-gray-700">{pageIndex + 1} / {totalPages}</span>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                                  disabled={pageIndex >= totalPages - 1}
                                  className="h-9 w-9 p-0 rounded-md border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="p-6 border-b border-gray-100">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">{t('patients.patientFiles')}</h2>
                          <p className="text-gray-600">{t('patients.patientFilesDescription')}</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <PatientFilesList />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Template Management Dialog */}
              <TemplateManagement
                open={showTemplateManagement}
                onOpenChange={setShowTemplateManagement}
              />

              {/* Template Gallery Dialog */}
              <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
                <DialogContent className="max-w-4xl w-full mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">{t('templates.selectTemplate')}</DialogTitle>
                    <DialogDescription>
                      {t('dashboard.selectTemplateDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <TemplateGallery onSelectTemplate={() => setShowTemplateGallery(false)} />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex-1 flex">
              <AppSidebar />
              <div className="flex-1 overflow-auto">
                <EditorCanvas />
              </div>
            </div>
          )}
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;

