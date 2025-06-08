import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Search, 
  MessageSquare, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

export default function MTIntelligenceSimple() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  // Fetch MT intelligence data
  const { data: intelligenceData, isLoading } = useQuery({
    queryKey: ["/api/mt-intelligence"],
    retry: false,
  });

  const insights = [
    {
      id: "processing-speed",
      title: "Message Processing Speed",
      description: "Average processing time for MT700 messages",
      value: "2.3 seconds",
      trend: "improving",
      icon: Zap,
      details: "Processing speed has improved by 15% this month due to optimized validation rules."
    },
    {
      id: "success-rate",
      title: "Validation Success Rate",
      description: "Percentage of messages passing validation",
      value: "94.7%",
      trend: "stable",
      icon: CheckCircle,
      details: "Consistent validation success rate with most failures due to formatting issues."
    },
    {
      id: "common-errors",
      title: "Common Errors",
      description: "Most frequent validation errors",
      value: "Field 32B",
      trend: "declining",
      icon: AlertTriangle,
      details: "Currency amount field errors are the most common, but declining due to better input validation."
    },
    {
      id: "message-volume",
      title: "Daily Message Volume",
      description: "Average MT messages processed per day",
      value: "1,247",
      trend: "increasing",
      icon: TrendingUp,
      details: "Message volume has increased by 8% compared to last month."
    }
  ];

  const recentAnalyses = [
    {
      id: "1",
      messageType: "MT700",
      reference: "LC240115001",
      status: "completed",
      timestamp: "2024-01-15T14:30:00Z",
      score: 98,
      issues: 0
    },
    {
      id: "2",
      messageType: "MT707",
      reference: "AM240115002",
      status: "completed",
      timestamp: "2024-01-15T13:45:00Z",
      score: 85,
      issues: 2
    },
    {
      id: "3",
      messageType: "MT750",
      reference: "DS240115003",
      status: "processing",
      timestamp: "2024-01-15T13:20:00Z",
      score: null,
      issues: null
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">MT Intelligence Dashboard</h1>
          <p className="text-gray-600">
            AI-powered insights and analytics for SWIFT message processing
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages, references, or patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Bot className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight) => {
          const IconComponent = insight.icon;
          return (
            <Card 
              key={insight.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedInsight === insight.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedInsight(insight.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className="h-8 w-8 text-blue-500" />
                  {getTrendIcon(insight.trend)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Detection</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Intelligence Summary</CardTitle>
                <CardDescription>
                  AI-generated insights from message processing data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedInsight ? (
                  <div>
                    <h3 className="font-semibold mb-2">
                      {insights.find(i => i.id === selectedInsight)?.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {insights.find(i => i.id === selectedInsight)?.details}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Click on any insight card above to view detailed analysis and recommendations.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Real-time processing statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Messages Processed Today</span>
                    <Badge variant="outline">1,247</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Processing Time</span>
                    <Badge variant="outline">2.3s</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge className="bg-green-100 text-green-800">94.7%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Validations</span>
                    <Badge variant="outline">23</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Message Analyses</CardTitle>
              <CardDescription>
                Latest AI-powered message validations and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(analysis.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{analysis.messageType}</Badge>
                          <span className="font-medium">{analysis.reference}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(analysis.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {analysis.score !== null && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Score: {analysis.score}%</p>
                          <p className="text-xs text-gray-600">
                            {analysis.issues} issues found
                          </p>
                        </div>
                      )}
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Detection</CardTitle>
              <CardDescription>
                AI-identified patterns in message processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Detected Pattern: Field 32B Errors</h3>
                  <p className="text-sm text-blue-600">
                    Increased errors in currency amount field during afternoon hours. 
                    Suggests user fatigue or system load issues.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Improvement Trend: Processing Speed</h3>
                  <p className="text-sm text-green-600">
                    15% improvement in processing speed over the last 30 days. 
                    Optimization algorithms are working effectively.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Attention Required: Message Volume</h3>
                  <p className="text-sm text-yellow-600">
                    Peak message volume approaching system capacity limits. 
                    Consider scaling resources during high-traffic periods.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Automated suggestions for system optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Optimize Field Validation</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Add real-time validation hints for currency fields to reduce Field 32B errors.
                    </p>
                    <Button size="sm" variant="outline">Implement</Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Schedule Maintenance</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      System performance degrades after 6 hours of continuous operation. Schedule regular maintenance windows.
                    </p>
                    <Button size="sm" variant="outline">Schedule</Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Update Validation Rules</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      New UCP 600 interpretation detected. Update validation rules to maintain compliance.
                    </p>
                    <Button size="sm" variant="outline">Review</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}