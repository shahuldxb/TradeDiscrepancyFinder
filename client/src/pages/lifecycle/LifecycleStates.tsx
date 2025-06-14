import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, ArrowUpDown, Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface LifecycleState {
  StateCode: string;
  StateName: string;
  StateCategory: string;
  StateType: string;
  Description: string;
  IsActive: boolean;
  Sequence: number;
}

export default function LifecycleStates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const { data: lifecycleStates = [], isLoading, error } = useQuery<LifecycleState[]>({
    queryKey: ["/api/lifecycle/lifecycle-states"],
  });

  const filteredStates = lifecycleStates.filter((state) => {
    const matchesSearch = 
      state.StateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.StateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.Description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || state.StateCategory === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(lifecycleStates.map(state => state.StateCategory)));

  const getStateIcon = (stateType: string) => {
    switch (stateType) {
      case 'Initial':
        return <Clock className="h-4 w-4" />;
      case 'Processing':
      case 'Review':
      case 'Approval':
      case 'Presentation':
      case 'Examination':
        return <Activity className="h-4 w-4" />;
      case 'Issuance':
      case 'Advice':
      case 'Confirmation':
      case 'Amendment':
      case 'Transfer':
      case 'Acceptance':
      case 'Payment':
      case 'Reimbursement':
        return <CheckCircle className="h-4 w-4" />;
      case 'Closure':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStateBadgeVariant = (stateCategory: string) => {
    switch (stateCategory) {
      case 'Initial':
        return 'secondary';
      case 'Processing':
        return 'default';
      case 'Issuance':
        return 'default';
      case 'Advice':
        return 'outline';
      case 'Confirmation':
        return 'outline';
      case 'Amendment':
        return 'secondary';
      case 'Transfer':
        return 'secondary';
      case 'Settlement':
        return 'default';
      case 'Final':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Lifecycle States</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load lifecycle states. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lifecycle States</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            LC transaction lifecycle management and state tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {filteredStates.length} States
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by state name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStates.map((state) => (
            <Card key={state.StateCode} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStateIcon(state.StateType)}
                    <CardTitle className="text-lg">{state.StateName}</CardTitle>
                  </div>
                  <Badge variant={getStateBadgeVariant(state.StateCategory)}>
                    {state.StateCategory}
                  </Badge>
                </div>
                <CardDescription className="text-sm font-mono">
                  {state.StateCode}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {state.Description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Sequence: {state.Sequence}</span>
                  <span className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-1 ${state.IsActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {state.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Seq</TableHead>
                  <TableHead>State Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStates.map((state) => (
                  <TableRow key={state.StateCode}>
                    <TableCell className="font-medium">{state.Sequence}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStateIcon(state.StateType)}
                        <span>{state.StateName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{state.StateCode}</TableCell>
                    <TableCell>
                      <Badge variant={getStateBadgeVariant(state.StateCategory)}>
                        {state.StateCategory}
                      </Badge>
                    </TableCell>
                    <TableCell>{state.StateType}</TableCell>
                    <TableCell className="max-w-xs truncate">{state.Description}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${state.IsActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs">{state.IsActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredStates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No lifecycle states found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No states match your current search and filter criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}