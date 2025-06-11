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
  Brain,
  Scale,
  ChevronDown,
  ChevronRight,
  Beaker,
  Globe
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview and metrics",
  },
  {
    name: "Trade Finance",
    icon: FileText,
    description: "Trade Finance Management",
    subItems: [
      {
        name: "Documentary Credits",
        href: "/documentary-credits",
        description: "LC management and workflows",
      },
      {
        name: "MT700 Lifecycle",
        href: "/mt700-lifecycle",
        description: "LC issuance and processing lifecycle",
      },
      {
        name: "Incoterms Management",
        href: "/incoterms",
        description: "View and manage Incoterms 2020",
      },
      {
        name: "Incoterms Matrix",
        href: "/incoterms/matrix",
        description: "Seller and buyer responsibilities",
      },
      {
        name: "Incoterms Validation",
        href: "/incoterms/validation",
        description: "Validate LC against Incoterms",
      },
    ],
  },
  {
    name: "UCP 600 Rules",
    icon: Scale,
    description: "UCP 600 compliance and rules",
    subItems: [
      {
        name: "UCP Dashboard",
        href: "/ucp600/dashboard",
        description: "UCP 600 analytics and overview",
      },
      {
        name: "UCP Articles",
        href: "/ucp600/articles",
        description: "Manage UCP 600 articles",
      },
      {
        name: "UCP Rules",
        href: "/ucp600/rules",
        description: "Manage UCP rules derived from articles",
      },
      {
        name: "Usage Rules",
        href: "/ucp600/usage-rules",
        description: "Manage UCP usage rules",
      },
      {
        name: "Message Field Rules",
        href: "/ucp600/message-field-rules",
        description: "SWIFT message field validation rules",
      },
      {
        name: "Document Compliance",
        href: "/ucp600/document-compliance",
        description: "Document compliance rules",
      },
    ],
  },
  {
    name: "Document Management",
    icon: Upload,
    description: "Document processing and analysis",
    subItems: [
      {
        name: "Document Upload",
        href: "/documents",
        description: "Upload LC documents",
      },
      {
        name: "Trade Finance Docs",
        href: "/trade-finance-documents",
        description: "Document management system",
      },
      {
        name: "OCR Processing",
        href: "/test-drive/ocr",
        description: "Upload and extract text from documents",
      },
      {
        name: "Discrepancy Analysis",
        href: "/analysis",
        description: "Review discrepancies",
      },
    ],
  },
  {
    name: "SWIFT & Messaging",
    icon: MessageCircle,
    description: "SWIFT message tools",
    subItems: [
      {
        name: "Message Builder",
        href: "/message-builder",
        description: "Create MT 700 messages",
      },
      {
        name: "MT Intelligence",
        href: "/mt-intelligence",
        description: "SWIFT MT7xx intelligence system",
      },
    ],
  },
  {
    name: "AI & Automation",
    icon: Bot,
    description: "AI-powered tools and agents",
    subItems: [
      {
        name: "CrewAI Agents",
        href: "/agents",
        description: "Agent monitoring and management",
      },
      {
        name: "Agent Designer",
        href: "/agent-designer",
        description: "Create custom agents",
      },
      {
        name: "Skills Management",
        href: "/skills-management",
        description: "Manage agent skills",
      },
      {
        name: "Incoterms AI Agents",
        href: "/incoterms/agents",
        description: "Autonomous Incoterms validation",
      },
      {
        name: "Agent Code",
        href: "/test-drive/agent-code",
        description: "View CrewAI agent implementations",
      },
    ],
  },
  {
    name: "System & Analytics",
    icon: Database,
    description: "System management and reporting",
    subItems: [
      {
        name: "Validation Results",
        href: "/ucp600/validation-results",
        description: "View validation results",
      },
      {
        name: "Rule Execution History",
        href: "/ucp600/execution-history",
        description: "Rule execution audit trail",
      },
      {
        name: "Business Process Owners",
        href: "/ucp600/business-owners",
        description: "Manage business process owners",
      },
      {
        name: "Reports",
        href: "/reports",
        description: "Generate reports",
      },
    ],
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

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
    <nav className="w-56 bg-sidebar shadow-lg fixed h-full z-50 border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground">TradeFinance</h1>
            <p className="text-xs text-sidebar-foreground/70">Discrepancy Finder</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-3">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href && location === item.href;
            const isExpanded = expandedItems.has(item.name);
            
            if (item.subItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className="w-full nav-item text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = location === subItem.href;
                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <div
                              className={`py-2 px-3 rounded-md text-sm transition-colors ${
                                isSubActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                              }`}
                            >
                              <span>{subItem.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`nav-item ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
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
