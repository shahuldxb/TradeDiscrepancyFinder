import { Bell, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopHeader({ title, subtitle, actions }: TopHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* System Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>System Operational</span>
          </div>

          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Default Actions */}
          {!actions && (
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="banking-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>
          )}

          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
