import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Eye, ExternalLink, FileText } from "lucide-react";
import { Discrepancy } from "@/lib/api";

interface DiscrepancyTableProps {
  discrepancies: Discrepancy[];
  isLoading: boolean;
}

export default function DiscrepancyTable({ discrepancies, isLoading }: DiscrepancyTableProps) {
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);

  if (isLoading) {
    return (
      <Card className="banking-card">
        <CardHeader>
          <CardTitle>Discrepancy Analysis</CardTitle>
          <CardDescription>Detailed review of detected discrepancies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-24 h-4 bg-muted rounded"></div>
                  <div className="w-32 h-4 bg-muted rounded"></div>
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-20 h-4 bg-muted rounded"></div>
                  <div className="w-16 h-4 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getDiscrepancyTypeLabel = (type: string) => {
    switch (type) {
      case "quantitative":
        return "Quantitative Discrepancy";
      case "qualitative":
        return "Qualitative Discrepancy";
      case "contextual":
        return "Contextual Violation";
      case "data_inconsistency":
        return "Data Inconsistency";
      case "format_error":
        return "Format Error";
      case "missing_field":
        return "Missing Field";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (discrepancies.length === 0) {
    return (
      <Card className="banking-card">
        <CardHeader>
          <CardTitle>Discrepancy Analysis</CardTitle>
          <CardDescription>Detailed review of detected discrepancies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Discrepancies Found</h3>
            <p className="text-muted-foreground">
              All documents have passed validation successfully. Ready to proceed with ILC creation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="banking-card">
      <CardHeader>
        <CardTitle>Discrepancy Analysis</CardTitle>
        <CardDescription>
          Detailed review of {discrepancies.length} detected discrepancies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="banking-table">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>UCP Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discrepancies.map((discrepancy) => (
                <TableRow key={discrepancy.id}>
                  <TableCell>
                    <div className="font-medium">
                      {getDiscrepancyTypeLabel(discrepancy.discrepancyType)}
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-48">
                      {discrepancy.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {discrepancy.fieldName || "N/A"}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(discrepancy.severity)}
                  </TableCell>
                  <TableCell>
                    {discrepancy.ucpReference ? (
                      <Badge variant="outline" className="font-mono">
                        {discrepancy.ucpReference}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={discrepancy.status === "resolved" ? "default" : "secondary"}
                    >
                      {discrepancy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedDiscrepancy(discrepancy)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                              <span>Discrepancy Details</span>
                            </DialogTitle>
                            <DialogDescription>
                              Comprehensive analysis and recommendations
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedDiscrepancy && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                                  <p className="font-medium">{getDiscrepancyTypeLabel(selectedDiscrepancy.discrepancyType)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                                  <div className="mt-1">
                                    {getSeverityBadge(selectedDiscrepancy.severity)}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Field</label>
                                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                    {selectedDiscrepancy.fieldName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">UCP Reference</label>
                                  <p className="font-mono text-sm">
                                    {selectedDiscrepancy.ucpReference || "N/A"}
                                  </p>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="mt-1 text-sm">{selectedDiscrepancy.description}</p>
                              </div>

                              {/* Rule Explanation */}
                              {selectedDiscrepancy.ruleExplanation && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Rule Explanation</label>
                                  <p className="mt-1 text-sm bg-blue-50 p-3 rounded-md">
                                    {selectedDiscrepancy.ruleExplanation}
                                  </p>
                                </div>
                              )}

                              {/* Advice */}
                              {selectedDiscrepancy.advice && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Recommended Action</label>
                                  <p className="mt-1 text-sm bg-green-50 p-3 rounded-md">
                                    {selectedDiscrepancy.advice}
                                  </p>
                                </div>
                              )}

                              {/* Document Values */}
                              {selectedDiscrepancy.documentValues && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Conflicting Values</label>
                                  <div className="mt-1 bg-gray-50 p-3 rounded-md">
                                    <pre className="text-xs overflow-x-auto">
                                      {JSON.stringify(selectedDiscrepancy.documentValues, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex space-x-2 pt-4 border-t">
                                <Button variant="outline" size="sm">
                                  Mark as Resolved
                                </Button>
                                <Button variant="outline" size="sm">
                                  Request Waiver
                                </Button>
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View UCP Reference
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {discrepancies.length > 10 && (
          <div className="flex items-center justify-between px-6 py-3 bg-muted border-t border-border rounded-b-lg mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{" "}
                  <span className="font-medium">{discrepancies.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
