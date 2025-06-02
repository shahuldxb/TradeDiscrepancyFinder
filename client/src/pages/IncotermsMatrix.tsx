import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter, Globe, Truck, Ship } from "lucide-react";

interface ResponsibilityMatrix {
  id: number;
  incoterm_code: string;
  responsibility_category: string;
  seller_responsibility: string;
  buyer_responsibility: string;
  cost_bearer: string;
  risk_bearer: string;
}

export default function IncotermsMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByTerm, setFilterByTerm] = useState("all");
  const [filterByCategory, setFilterByCategory] = useState("all");

  const { data: matrix = [], isLoading } = useQuery({
    queryKey: ["/api/incoterms/matrix"],
    retry: false,
  });

  // Complete Incoterms 2020 responsibility matrix with authentic data
  const completeMatrix = [
    { id: 1, incoterm_code: 'EXW', responsibility_category: 'All Transport & Export', seller_responsibility: 'Make goods available at premises', buyer_responsibility: 'All transport, export/import formalities, duties', cost_bearer: 'Buyer', risk_bearer: 'Buyer' },
    { id: 2, incoterm_code: 'FCA', responsibility_category: 'Export & Delivery to Carrier', seller_responsibility: 'Export formalities, deliver to carrier', buyer_responsibility: 'Main carriage, import formalities', cost_bearer: 'Shared', risk_bearer: 'Buyer' },
    { id: 3, incoterm_code: 'CPT', responsibility_category: 'Main Carriage Paid', seller_responsibility: 'Export formalities, main carriage cost', buyer_responsibility: 'Import formalities, unloading', cost_bearer: 'Seller', risk_bearer: 'Buyer' },
    { id: 4, incoterm_code: 'CIP', responsibility_category: 'Carriage & Insurance Paid', seller_responsibility: 'Main carriage, minimum insurance', buyer_responsibility: 'Import formalities, unloading', cost_bearer: 'Seller', risk_bearer: 'Buyer' },
    { id: 5, incoterm_code: 'DAP', responsibility_category: 'Delivered at Place', seller_responsibility: 'All transport to destination', buyer_responsibility: 'Unloading, import duties', cost_bearer: 'Seller', risk_bearer: 'Seller' },
    { id: 6, incoterm_code: 'DPU', responsibility_category: 'Delivered & Unloaded', seller_responsibility: 'Transport and unload at destination', buyer_responsibility: 'Import duties only', cost_bearer: 'Seller', risk_bearer: 'Seller' },
    { id: 7, incoterm_code: 'DDP', responsibility_category: 'Delivered Duty Paid', seller_responsibility: 'All costs including import duties', buyer_responsibility: 'Receive goods only', cost_bearer: 'Seller', risk_bearer: 'Seller' },
    { id: 8, incoterm_code: 'FAS', responsibility_category: 'Free Alongside Ship', seller_responsibility: 'Deliver alongside ship, export', buyer_responsibility: 'Loading, main carriage, import', cost_bearer: 'Shared', risk_bearer: 'Buyer' },
    { id: 9, incoterm_code: 'FOB', responsibility_category: 'Free on Board', seller_responsibility: 'Load on ship, export formalities', buyer_responsibility: 'Main carriage, import formalities', cost_bearer: 'Shared', risk_bearer: 'Buyer' },
    { id: 10, incoterm_code: 'CFR', responsibility_category: 'Cost & Freight', seller_responsibility: 'Sea freight, export formalities', buyer_responsibility: 'Marine insurance, import duties', cost_bearer: 'Seller', risk_bearer: 'Buyer' },
    { id: 11, incoterm_code: 'CIF', responsibility_category: 'Cost, Insurance & Freight', seller_responsibility: 'Sea freight, marine insurance', buyer_responsibility: 'Import duties, unloading', cost_bearer: 'Seller', risk_bearer: 'Buyer' }
  ];

  const displayMatrix = Array.isArray(matrix) && matrix.length > 0 ? matrix : completeMatrix;

  const filteredMatrix = displayMatrix.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.incoterm_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsibility_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seller_responsibility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.buyer_responsibility.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTerm = filterByTerm === "all" || item.incoterm_code === filterByTerm;
    
    const matchesCategory = filterByCategory === "all" || 
      item.responsibility_category.toLowerCase().includes(filterByCategory.toLowerCase());
    
    return matchesSearch && matchesTerm && matchesCategory;
  });

  const uniqueTerms = [...new Set(displayMatrix.map(item => item.incoterm_code))];
  const categories = [...new Set(displayMatrix.map(item => item.responsibility_category))];

  const getTransportIcon = (termCode: string) => {
    const seaTerms = ['FAS', 'FOB', 'CFR', 'CIF'];
    if (seaTerms.includes(termCode)) return <Ship className="h-4 w-4" />;
    return <Truck className="h-4 w-4" />;
  };

  const exportMatrix = () => {
    const csvContent = [
      ['Incoterm', 'Category', 'Seller Responsibility', 'Buyer Responsibility', 'Cost Bearer', 'Risk Bearer'],
      ...filteredMatrix.map(item => [
        item.incoterm_code,
        item.responsibility_category,
        item.seller_responsibility,
        item.buyer_responsibility,
        item.cost_bearer,
        item.risk_bearer
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incoterms-responsibility-matrix.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading responsibility matrix...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incoterms Responsibility Matrix</h1>
        <p className="text-muted-foreground">
          Comprehensive breakdown of seller and buyer responsibilities for all Incoterms 2020 terms
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search responsibilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterByTerm} onValueChange={setFilterByTerm}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {uniqueTerms.map(term => (
                <SelectItem key={term} value={term}>{term}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterByCategory} onValueChange={setFilterByCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="export">Export Related</SelectItem>
              <SelectItem value="transport">Transport Related</SelectItem>
              <SelectItem value="insurance">Insurance Related</SelectItem>
              <SelectItem value="delivery">Delivery Related</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportMatrix} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Responsibility Matrix ({filteredMatrix.length} entries)
          </CardTitle>
          <CardDescription>
            Detailed breakdown showing seller and buyer obligations for each Incoterm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Term</TableHead>
                  <TableHead className="w-48">Responsibility Category</TableHead>
                  <TableHead>Seller Responsibility</TableHead>
                  <TableHead>Buyer Responsibility</TableHead>
                  <TableHead className="w-24">Cost Bearer</TableHead>
                  <TableHead className="w-24">Risk Bearer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatrix.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransportIcon(item.incoterm_code)}
                        <span className="font-mono font-medium">{item.incoterm_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.responsibility_category}</TableCell>
                    <TableCell className="text-sm">{item.seller_responsibility}</TableCell>
                    <TableCell className="text-sm">{item.buyer_responsibility}</TableCell>
                    <TableCell>
                      <Badge variant={item.cost_bearer === 'Seller' ? 'default' : item.cost_bearer === 'Shared' ? 'outline' : 'secondary'}>
                        {item.cost_bearer}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.risk_bearer === 'Seller' ? 'destructive' : 'default'}>
                        {item.risk_bearer}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transport Modes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTerms.length}</div>
            <p className="text-xs text-muted-foreground">Incoterms covered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Responsibility Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Matrix Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMatrix.length}</div>
            <p className="text-xs text-muted-foreground">Total responsibilities</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}