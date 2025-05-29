import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Upload, 
  Bot, 
  AlertTriangle, 
  FileText, 
  Settings,
  Database,
  Plug,
  LogOut,
  User,
  Wrench,
  MessageCircle,
  Zap,
  Brain
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview and metrics",
  },
  {
    name: "Document Upload",
    href: "/documents",
    icon: Upload,
    description: "Upload LC documents",
  },
  {
    name: "CrewAI Agents",
    href: "/agents",
    icon: Bot,
    description: "Agent monitoring",
  },
  {
    name: "Agent Designer",
    href: "/agent-designer",
    icon: Wrench,
    description: "Create custom agents",
  },
  {
    name: "Message Builder",
    href: "/message-builder",
    icon: MessageCircle,
    description: "Create MT 700 messages",
  },
  {
    name: "MT Intelligence",
    href: "/mt-intelligence",
    icon: Brain,
    description: "SWIFT MT7xx intelligence system",
  },
  {
    name: "Trade Finance Docs",
    href: "/trade-finance-documents",
    icon: FileText,
    description: "Document management system",
  },
  {
    name: "Discrepancy Analysis",
    href: "/analysis",
    icon: AlertTriangle,
    description: "Review discrepancies",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Generate reports",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System configuration",
  },
];

const systemStatusItems = [
  { name: "CrewAI Runtime", status: "online" },
  { name: "Database", status: "online" },
  { name: "OCR Service", status: "warning" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-400";
      case "warning":
        return "bg-yellow-400";
      case "error":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <nav className="w-64 bg-sidebar shadow-lg fixed h-full z-50 border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">TradeFinance</h1>
            <p className="text-sm text-sidebar-foreground/70">Discrepancy Finder</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`nav-item ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>

        {/* System Status Section */}
        <div className="mt-8 pt-6 border-t border-sidebar-border">
          <div className="px-3 mb-3">
            <p className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              System Status
            </p>
          </div>
          <div className="space-y-1">
            {systemStatusItems.map((item) => (
              <div key={item.name} className="flex items-center px-3 py-2">
                <div className={`w-2 h-2 rounded-full mr-3 ${getStatusColor(item.status)}`}></div>
                <span className="text-sm text-sidebar-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-sidebar-accent">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-sidebar-foreground/70">
                {user?.role || "Analyst"}
              </p>
              {user?.customerSegment && (
                <Badge variant="outline" className="text-xs">
                  {user.customerSegment}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
