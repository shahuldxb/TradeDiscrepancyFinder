import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bot, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardMetrics } from "@/lib/api";

interface StatsGridProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export default function StatsGrid({ metrics, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="banking-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Documents Processed",
      value: metrics?.documentsProcessed || 0,
      change: "+12% from last month",
      trend: "up",
      icon: FileText,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Active Analyses",
      value: metrics?.activeAnalyses || 0,
      change: `${metrics?.activeAnalyses || 0} in progress`,
      trend: "neutral",
      icon: Bot,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
    },
    {
      title: "Critical Discrepancies",
      value: metrics?.criticalDiscrepancies || 0,
      change: "Requires attention",
      trend: metrics && metrics.criticalDiscrepancies > 0 ? "down" : "neutral",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
    },
    {
      title: "Success Rate",
      value: `${metrics?.successRate || 0}%`,
      change: "Above target",
      trend: "up",
      icon: CheckCircle,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : null;

        return (
          <Card key={stat.title} className="banking-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${
                    stat.trend === "up" 
                      ? "text-green-600" 
                      : stat.trend === "down" 
                      ? "text-red-600" 
                      : "text-muted-foreground"
                  }`}>
                    {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
