import React, { useState, useEffect } from "react";
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
  Globe,
  GitBranch,
  BarChart3
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
        name: "LC Lifecycle",
        href: "/mt700-lifecycle",
        description: "Complete LC processing pipeline visualization",
      },
      {
        name: "Credit Analysis",
        href: "/credit-analysis",
        description: "Credit risk assessment and analysis",
      },
    ],
  },
  {
    name: "UCP 600 Rules",
    icon: Scale,
    description: "UCP 600 Rule Management",
    subItems: [
      {
        name: "UCP Dashboard",
        href: "/ucp600/dashboard",
        description: "UCP 600 overview and metrics",
      },
      {
        name: "Articles Management",
        href: "/ucp600/articles",
        description: "Manage UCP 600 articles",
      },
      {
        name: "Rules Engine",
        href: "/ucp600/rules",
        description: "Rule configuration and management",
      },
      {
        name: "Usage Rules",
        href: "/ucp600/usage-rules",
        description: "Define usage rules and constraints",
      },
      {
        name: "Message Field Rules",
        href: "/ucp600/message-field-rules",
        description: "Field-level validation rules",
      },
      {
        name: "Document Compliance",
        href: "/ucp600/document-compliance",
        description: "Document compliance checking",
      },
      {
        name: "Business Owners",
        href: "/ucp600/business-owners",
        description: "Manage business process owners",
      },
      {
        name: "Validation Results",
        href: "/ucp600/validation-results",
        description: "View validation outcomes",
      },
      {
        name: "Execution History",
        href: "/ucp600/execution-history",
        description: "Rule execution audit trail",
      },
    ],
  },
  {
    name: "Incoterms Management",
    icon: Globe,
    description: "Comprehensive Incoterms System",
    subItems: [
      {
        name: "Incoterms Overview",
        href: "/incoterms",
        description: "Main Incoterms dashboard",
      },
      {
        name: "Responsibility Matrix",
        href: "/incoterms/matrix",
        description: "Buyer/Seller responsibility matrix",
      },
    ],
  },
  {
    name: "Document Management",
    icon: Upload,
    description: "Document Processing & OCR",
    subItems: [
      {
        name: "Document Upload",
        href: "/document-upload",
        description: "Upload and process documents",
      },
      {
        name: "Document Library",
        href: "/documents",
        description: "Browse document repository",
      },
      {
        name: "Upload Documents",
        href: "/document-management/upload-documents",
        description: "Bulk document upload",
      },
      {
        name: "OCR Processing",
        href: "/document-management/ocr-processing",
        description: "OCR and text extraction",
      },
      {
        name: "Document Sets",
        href: "/document-management/document-sets",
        description: "Manage document collections",
      },
      {
        name: "Template Library",
        href: "/document-management/templates",
        description: "Document templates",
      },
      {
        name: "Compliance Check",
        href: "/document-management/compliance",
        description: "Document compliance verification",
      },
    ],
  },
  {
    name: "SWIFT & Messaging",
    icon: MessageCircle,
    description: "SWIFT Message Processing",
    subItems: [
      {
        name: "MT Intelligence Dashboard",
        href: "/swift/mt-intelligence",
        description: "Comprehensive MT message intelligence",
      },

      {
        name: "Message Parser",
        href: "/swift/parser",
        description: "Parse and analyze SWIFT messages",
      },
      {
        name: "Message Types",
        href: "/swift/message-types",
        description: "SWIFT message type management",
      },

      {
        name: "Dependencies",
        href: "/swift/dependencies",
        description: "Message dependencies and relationships",
      },
      {
        name: "Lifecycle Management",
        href: "/swift/lifecycle",
        description: "Message lifecycle tracking",
      },
      {
        name: "MT Analytics",
        href: "/swift/analytics",
        description: "Message analytics and reporting",
      },
    ],
  },
  {
    name: "AI & Automation",
    icon: Brain,
    description: "AI Agents & Automation",
    subItems: [
      {
        name: "Agent Monitor",
        href: "/agent-monitor",
        description: "Monitor AI agent activities",
      },
      {
        name: "Discrepancy Analysis",
        href: "/discrepancy-analysis",
        description: "AI-powered discrepancy detection",
      },
      {
        name: "Custom Agents",
        href: "/ai/custom-agents",
        description: "Create and manage custom agents",
      },
      {
        name: "Agent Tasks",
        href: "/ai/agent-tasks",
        description: "Define and monitor agent tasks",
      },
      {
        name: "Crew Management",
        href: "/ai/crew-management",
        description: "Manage agent crews and workflows",
      },
      {
        name: "Performance Analytics",
        href: "/ai/performance",
        description: "Agent performance metrics",
      },
    ],
  },
  {
    name: "System & Analytics",
    icon: Settings,
    description: "System Administration",
    subItems: [
      {
        name: "User Management",
        href: "/admin/users",
        description: "Manage system users",
      },
      {
        name: "System Settings",
        href: "/admin/settings",
        description: "Configure system settings",
      },
      {
        name: "Audit Trail",
        href: "/admin/audit",
        description: "System audit and logs",
      },
      {
        name: "Security",
        href: "/admin/security",
        description: "Security configuration",
      },
      {
        name: "Backups",
        href: "/admin/backups",
        description: "Data backup management",
      },
      {
        name: "Database",
        href: "/admin/database",
        description: "Database administration",
      },
      {
        name: "API Management",
        href: "/admin/api",
        description: "API configuration and monitoring",
      },
    ],
  },
  {
    name: "Lifecycle Management",
    icon: GitBranch,
    description: "tf_genie Database Dashboard",
    subItems: [
      {
        name: "Dashboard Overview",
        href: "/lifecycle/dashboard",
        description: "Key metrics and recent activity",
      },
      {
        name: "Master Documents",
        href: "/lifecycle/master-documents",
        description: "Manage master documents (swift.Masterdocuments)",
      },
      {
        name: "Sub Documents",
        href: "/lifecycle/sub-document-types",
        description: "Browse and manage sub document types grouped by master documents",
      },
      {
        name: "Lifecycle States",
        href: "/lifecycle/lifecycle-states",
        description: "Manage lifecycle states (swift.Lifecyclestates)",
      },
      {
        name: "Document Requirements",
        href: "/lifecycle/document-requirements",
        description: "Lifecycle document requirements (swift.Lifecycledocumentrequirements)",
      },
      {
        name: "MT7 Dependencies",
        href: "/lifecycle/mt7-dependencies",
        description: "MT7 series dependencies (swift.ls_MT7SeriesDependencies)",
      },
      {
        name: "Analytics View",
        href: "/lifecycle/analytics",
        description: "Lifecycle analytics (vw_ls_lifecycle)",
      },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand lifecycle management if on a lifecycle page
    const initialExpanded = new Set<string>();
    if (location.startsWith('/lifecycle/')) {
      initialExpanded.add('Lifecycle Management');
    }
    return initialExpanded;
  });

  // Auto-expand sections based on current location
  useEffect(() => {
    const newExpanded = new Set(expandedItems);
    let shouldUpdate = false;
    
    if (location.startsWith('/lifecycle/') && !newExpanded.has('Lifecycle Management')) {
      newExpanded.add('Lifecycle Management');
      shouldUpdate = true;
    } else if (location.startsWith('/swift/') && !newExpanded.has('SWIFT Messages')) {
      newExpanded.add('SWIFT Messages');
      shouldUpdate = true;
    } else if (location.startsWith('/incoterms/') && !newExpanded.has('Incoterms Management')) {
      newExpanded.add('Incoterms Management');
      shouldUpdate = true;
    } else if (location.startsWith('/ucp600/') && !newExpanded.has('UCP 600 Management')) {
      newExpanded.add('UCP 600 Management');
      shouldUpdate = true;
    } else if ((location.startsWith('/ai/') || location.includes('agent')) && !newExpanded.has('AI & Automation')) {
      newExpanded.add('AI & Automation');
      shouldUpdate = true;
    } else if (location.startsWith('/admin/') && !newExpanded.has('System & Analytics')) {
      newExpanded.add('System & Analytics');
      shouldUpdate = true;
    }
    
    if (shouldUpdate) {
      setExpandedItems(newExpanded);
    }
  }, [location]);

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
      case "active":
        return "bg-green-400";
      case "processing":
        return "bg-blue-400";
      case "warning":
        return "bg-yellow-400";
      case "error":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <nav className="sidebar-container">
      <div className="sidebar-nav">
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
        <div className="flex-1 p-3 overflow-y-auto">
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
        </div>

        {/* User Profile Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Guest User
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">System Access</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="w-full mt-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}