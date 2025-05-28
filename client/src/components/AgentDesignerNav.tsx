import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Briefcase, 
  Users, 
  Settings, 
  Play, 
  Monitor,
  ChevronLeft,
  Plus,
  Zap
} from "lucide-react";

export default function AgentDesignerNav() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      title: "Agent Management",
      items: [
        {
          title: "Custom Agents",
          href: "/agent-designer",
          icon: Bot,
          description: "Design and manage AI agents",
          badge: "New"
        },
        {
          title: "Task Library",
          href: "/agent-designer?tab=tasks",
          icon: Briefcase,
          description: "Create specialized tasks"
        },
        {
          title: "Crew Builder",
          href: "/agent-designer?tab=crews",
          icon: Users,
          description: "Orchestrate agent teams"
        }
      ]
    },
    {
      title: "Execution & Monitoring",
      items: [
        {
          title: "Agent Monitor",
          href: "/agents",
          icon: Monitor,
          description: "Real-time agent status"
        },
        {
          title: "Workflow Executions",
          href: "/agent-designer?view=executions",
          icon: Play,
          description: "Track crew executions"
        }
      ]
    },
    {
      title: "Quick Actions",
      items: [
        {
          title: "Create Agent",
          href: "/agent-designer?action=create-agent",
          icon: Plus,
          description: "Quick agent creation",
          variant: "create" as const
        },
        {
          title: "Run Crew",
          href: "/agent-designer?action=run-crew",
          icon: Zap,
          description: "Execute workflows",
          variant: "execute" as const
        }
      ]
    }
  ];

  return (
    <div className={cn(
      "flex h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      isCollapsed ? "w-16" : "w-80"
    )}>
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agent Designer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                CrewAI Management Studio
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                          location === item.href || location.startsWith(item.href)
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                          item.variant === "create" && "border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20",
                          item.variant === "execute" && "border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        )}
                      >
                        <item.icon className={cn(
                          "w-4 h-4 flex-shrink-0",
                          item.variant === "create" && "text-green-600 dark:text-green-400",
                          item.variant === "execute" && "text-orange-600 dark:text-orange-400"
                        )} />
                        {!isCollapsed && (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {item.description}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {!isCollapsed && section !== navigation[navigation.length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  AI-Powered Platform
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Trade Finance Analytics
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}