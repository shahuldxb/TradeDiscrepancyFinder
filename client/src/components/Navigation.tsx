import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Home, 
  FileText, 
  Database, 
  Bot, 
  Shield, 
  Settings, 
  BarChart3,
  Upload,
  Search,
  MessageSquare,
  Workflow,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Globe,
  Archive
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Incoterms Management",
    href: "/incoterms",
    icon: Globe,
    children: [
      { title: "Data Grid", href: "/incoterms-grid", icon: Database },
      { title: "Management Portal", href: "/incoterms", icon: Settings },
      { title: "Responsibility Matrix", href: "/incoterms/matrix", icon: FileText },
      { title: "Validation Rules", href: "/incoterms/validation", icon: CheckCircle },
      { title: "Comparison Tool", href: "/incoterms/comparison", icon: BarChart3 },
      { title: "Statistics & Analytics", href: "/incoterms/statistics", icon: TrendingUp },
    ]
  },
  {
    title: "Document Management",
    href: "/documents",
    icon: FileText,
    children: [
      { title: "Upload Documents", href: "/document-upload", icon: Upload },
      { title: "Document Library", href: "/documents/library", icon: Archive },
      { title: "OCR Processing", href: "/documents/ocr", icon: Bot },
      { title: "Validation Results", href: "/documents/validation", icon: CheckCircle },
      { title: "Trade Finance Docs", href: "/trade-finance-documents", icon: FileText },
      { title: "Document Workflow", href: "/documents/workflow", icon: Workflow },
    ]
  },
  {
    title: "AI Agents",
    href: "/agents",
    icon: Bot,
    badge: "Active",
    children: [
      { title: "Agent Monitor", href: "/agent-monitor", icon: Bot },
      { title: "Agent Designer", href: "/agent-designer", icon: Settings },
      { title: "Agent Code", href: "/agent-code", icon: FileText },
      { title: "Skills Management", href: "/skills-management", icon: BookOpen },
      { title: "OCR Agent", href: "/ocr-agent", icon: Search },
      { title: "Autonomous Agents", href: "/agents/autonomous", icon: Bot },
      { title: "Agent Performance", href: "/agents/performance", icon: TrendingUp },
    ]
  },
  {
    title: "SWIFT Messages",
    href: "/swift",
    icon: MessageSquare,
    children: [
      { title: "MT700 Lifecycle", href: "/mt700-lifecycle", icon: Workflow },
      { title: "Message Builder", href: "/message-builder", icon: Settings },
      { title: "MT Intelligence", href: "/mt-intelligence", icon: Bot },
      { title: "Message Details", href: "/swift-message/700", icon: FileText },
      { title: "Message Validation", href: "/swift/validation", icon: CheckCircle },
      { title: "Category 7 Messages", href: "/swift/category7", icon: MessageSquare },
    ]
  },
  {
    title: "Analysis & Reporting",
    href: "/analysis",
    icon: BarChart3,
    children: [
      { title: "Discrepancy Analysis", href: "/discrepancy-analysis", icon: AlertTriangle },
      { title: "Performance Metrics", href: "/analysis/performance", icon: TrendingUp },
      { title: "Compliance Reports", href: "/analysis/compliance", icon: Shield },
      { title: "Business Intelligence", href: "/analysis/business", icon: BarChart3 },
      { title: "Risk Assessment", href: "/analysis/risk", icon: AlertTriangle },
      { title: "Audit Reports", href: "/analysis/audit", icon: Clock },
    ]
  },
  {
    title: "Test Drive",
    href: "/test-drive",
    icon: Bot,
    badge: "Demo",
    children: [
      { title: "OCR Demo", href: "/test-drive/ocr", icon: Search },
      { title: "Agent Code Demo", href: "/test-drive/agent-code", icon: FileText },
      { title: "AI Validation Demo", href: "/test-drive/validation", icon: CheckCircle },
      { title: "Document Processing", href: "/test-drive/documents", icon: Upload },
      { title: "SWIFT Processing", href: "/test-drive/swift", icon: MessageSquare },
    ]
  },
  {
    title: "UCP Rules",
    href: "/ucp-rules",
    icon: BookOpen,
  },
  {
    title: "System Admin",
    href: "/admin",
    icon: Settings,
    children: [
      { title: "User Management", href: "/admin/users", icon: Users },
      { title: "System Settings", href: "/admin/settings", icon: Settings },
      { title: "Audit Logs", href: "/admin/audit", icon: Clock },
      { title: "Security Management", href: "/admin/security", icon: Shield },
      { title: "Backup & Recovery", href: "/admin/backups", icon: Archive },
      { title: "Database Management", href: "/admin/database", icon: Database },
      { title: "API Management", href: "/admin/api", icon: Settings },
    ]
  }
];

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const hasActiveChild = (children?: NavItem[]) => {
    return children?.some(child => isActive(child.href)) || false;
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isGroupOpen = openGroups.includes(item.title);
    const itemIsActive = isActive(item.href);
    const hasActiveChildItem = hasActiveChild(item.children);

    if (hasChildren) {
      return (
        <div key={item.title}>
          <Button
            variant={itemIsActive || hasActiveChildItem ? "secondary" : "ghost"}
            className={`w-full justify-start h-auto py-2 px-3 ${level > 0 ? 'ml-4 w-[calc(100%-1rem)]' : ''}`}
            onClick={() => toggleGroup(item.title)}
          >
            <item.icon className="h-4 w-4 mr-2" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {item.badge}
              </Badge>
            )}
            <span className={`ml-2 transition-transform ${isGroupOpen ? 'rotate-90' : ''}`}>
              ›
            </span>
          </Button>
          {isGroupOpen && (
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href}>
        <Button
          variant={itemIsActive ? "secondary" : "ghost"}
          className={`w-full justify-start h-auto py-2 px-3 ${level > 0 ? 'ml-4 w-[calc(100%-1rem)]' : ''}`}
        >
          <item.icon className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  };

  const NavigationContent = () => (
    <div className="space-y-2 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Trade Finance Platform
        </h2>
        <div className="space-y-1">
          {navigationItems.map(item => renderNavItem(item))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block ${className}`}>
        <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
            <NavigationContent />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <NavigationContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}