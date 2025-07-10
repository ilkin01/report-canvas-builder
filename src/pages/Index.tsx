
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
  Download
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

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId } = useAppSelector(state => state.reports);
  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  // Chart config
  const chartConfig = {
    value: {
      label: "Dəyər",
      color: "#3B82F6",
    },
    patients: {
      label: "Pasientlər",
      color: "#10B981",
    },
    analyses: {
      label: "Analizlər",
      color: "#3B82F6",
    },
  };

  // User adını al
  const getUserName = () => {
    if (!user) return "İstifadəçi";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName} ${lastName}`.trim() || "İstifadəçi";
  };

  // User adının baş hərflərini al
  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Cari vaxtı al
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    let greeting = "";
    
    if (hours < 12) {
      greeting = "Günaydın";
    } else if (hours < 18) {
      greeting = "Günortanız xeyr";
    } else {
      greeting = "Axşamınız xeyr";
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
    { title: 'Bu günkü analizlər', value: '42', change: '+12%', icon: TestTube, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Aktiv pasientlər', value: '183', change: '+5%', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Ümumi hesabatlar', value: '1,234', change: '+8%', icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Orta müddət', value: '2.4h', change: '-15%', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];
  
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          {!isEditing ? (
            <div className="flex-1 overflow-auto">
              {/* Hero Section */}
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 ring-4 ring-white/20">
                        <AvatarImage src={user?.profileImage} alt={getUserName()} />
                        <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                          {getCurrentTime()}, {getUserName()}!
                        </h1>
                        <p className="text-blue-100 mt-1 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {getCurrentDate()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {user?.role || "İstifadəçi"}
                      </Badge> */}
                      <div className="ml-2 bg-white rounded-md px-4 py-2">
                        <div className="text-black">
                          <LanguageSwitcher />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6">
                  <Button 
                    onClick={handleCreateAnalysis}
                    className="h-24 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                        <TestTube className="h-6 w-6" />
                      </div>
                      <span className="font-medium">Yeni Analiz</span>
                    </div>
                  </Button>

                  <Button 
                    onClick={handleCreateTemplate}
                    variant="outline"
                    className="h-24 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                        <PenTool className="h-6 w-6" />
                      </div>
                      <span className="font-medium">Yeni Şablon</span>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => setShowTemplateManagement(true)}
                    variant="outline"
                    className="h-24 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                        <Settings className="h-6 w-6" />
                      </div>
                      <span className="font-medium">İdarəetmə</span>
                    </div>
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4 md:gap-6">
                  {quickStats.map((stat, index) => (
                    <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <p className="text-xs text-green-600 mt-1">{stat.change} keçən həftədən</p>
                          </div>
                          <div className={`p-3 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 backdrop-blur-sm">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Ümumi Baxış
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analitika
                    </TabsTrigger>
                    <TabsTrigger value="patients" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <Users className="h-4 w-4 mr-2" />
                      Pasientlər
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Hesabatlar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                      {/* Daily Analysis Chart */}
                      <Card className="col-span-1 lg:col-span-2 bg-white/80 backdrop-blur-sm border-0">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                            Həftəlik Analiz Statistikası
                          </CardTitle>
                          <CardDescription>Bu həftə aparılan analizlərin sayı</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={chartConfig} className="h-[300px]">
                            <BarChart data={dailyAnalysisData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      {/* Analysis Types Pie Chart */}
                      <Card className="bg-white/80 backdrop-blur-sm border-0 mt-4 md:mt-0">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                            Analiz Növləri
                          </CardTitle>
                          <CardDescription>Bu ay aparılan analizlərin növləri</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={chartConfig} className="h-[300px]">
                            <PieChart>
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Pie
                                data={analysisTypeData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                nameKey="name"
                                label={(entry) => `${entry.name}: ${entry.value}%`}
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

                    {/* Recent Activities */}
                    <Card className="bg-white/80 backdrop-blur-sm border-0 mt-4">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-purple-600" />
                          Son Fəaliyyətlər
                        </CardTitle>
                        <CardDescription>Son 24 saatda aparılan əməliyyatlar</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                              <div className="p-2 rounded-full bg-blue-100">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.patient}</p>
                                <p className="text-sm text-gray-500">{activity.time}</p>
                              </div>
                              <Badge className={getStatusColor(activity.status)}>
                                {activity.status === 'completed' && 'Tamamlandı'}
                                {activity.status === 'pending' && 'Gözləyir'}
                                {activity.status === 'in-progress' && 'Davam edir'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                          Aylıq Trend Analizi
                        </CardTitle>
                        <CardDescription>Pasient və analiz saylarının aylıq dəyişimi</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[400px]">
                          <LineChart data={monthlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line 
                              type="monotone" 
                              dataKey="patients" 
                              stroke="#10B981" 
                              strokeWidth={3}
                              dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="analyses" 
                              stroke="#3B82F6" 
                              strokeWidth={3}
                              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                            />
                          </LineChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="patients" className="space-y-4 sm:space-y-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-green-600" />
                          Pasientlər Siyahısı
                        </CardTitle>
                        <CardDescription>Son əlavə edilən pasientlər</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PatientsList onReportSelect={() => setIsEditing(true)} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-4 sm:space-y-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          Hesabatlar
                        </CardTitle>
                        <CardDescription>Yaradılmış hesabatlar</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500">
                          Hesabatlar burada göstəriləcək
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Template Management Dialog */}
              <TemplateManagement
                open={showTemplateManagement}
                onOpenChange={setShowTemplateManagement}
              />

              {/* Template Gallery Dialog */}
              <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
                <DialogContent className="max-w-xs sm:max-w-md md:max-w-lg w-full">
                  <DialogHeader>
                    <DialogTitle>Şablon Seçin</DialogTitle>
                    <DialogDescription>
                      Yeni analiz üçün şablon seçin
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
