import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, Ship, Package, CheckCircle, BarChart3 } from "lucide-react";

export default function Incoterms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-900/10 dark:to-cyan-900/10">
      {/* Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20"></div>
        
        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Globe className="w-5 h-5 text-white" />
              <span className="text-white font-medium">International Chamber of Commerce</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Incoterms <span className="text-emerald-200">2020</span>
            </h1>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              International Commercial Terms defining the responsibilities, costs, and risks involved in the delivery of goods from sellers to buyers
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-emerald-200">
                <CheckCircle className="w-5 h-5" />
                <span>ICC Official Standards</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-200">
                <CheckCircle className="w-5 h-5" />
                <span>Global Trade Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Terms</p>
                  <p className="text-3xl font-bold text-white">11</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-blue-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                ICC 2020 Official
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Sea Transport</p>
                  <p className="text-3xl font-bold text-white">4</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Ship className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-green-600">
                <Ship className="w-4 h-4 mr-1" />
                Maritime specific
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Any Mode</p>
                  <p className="text-3xl font-bold text-white">7</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-purple-600">
                <Package className="w-4 h-4 mr-1" />
                Multi-modal
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Coverage</p>
                  <p className="text-3xl font-bold text-white">Global</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-orange-600">
                <Globe className="w-4 h-4 mr-1" />
                Worldwide standard
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incoterms Content */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Incoterms Categories */}
            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Incoterms Categories</h3>
                      <p className="text-slate-200 text-sm">Transport mode classification</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sea Transport Terms */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Ship className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-800">Sea & Inland Waterway</h4>
                      </div>
                      <div className="space-y-2">
                        {[
                          { code: 'FAS', name: 'Free Alongside Ship' },
                          { code: 'FOB', name: 'Free on Board' },
                          { code: 'CFR', name: 'Cost and Freight' },
                          { code: 'CIF', name: 'Cost, Insurance and Freight' }
                        ].map((term) => (
                          <div key={term.code} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <span className="font-medium">{term.code}</span>
                              <div className="text-xs text-gray-600">{term.name}</div>
                            </div>
                            <Badge variant="outline" className="text-blue-600 border-blue-600">Maritime</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Any Mode Terms */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-800">Any Mode of Transport</h4>
                      </div>
                      <div className="space-y-2">
                        {[
                          { code: 'EXW', name: 'Ex Works' },
                          { code: 'FCA', name: 'Free Carrier' },
                          { code: 'CPT', name: 'Carriage Paid To' },
                          { code: 'CIP', name: 'Carriage and Insurance Paid' },
                          { code: 'DAP', name: 'Delivered at Place' },
                          { code: 'DPU', name: 'Delivered at Place Unloaded' },
                          { code: 'DDP', name: 'Delivered Duty Paid' }
                        ].map((term) => (
                          <div key={term.code} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <span className="font-medium">{term.code}</span>
                              <div className="text-xs text-gray-600">{term.name}</div>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-600">Multi-modal</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Incoterms Reference Guide */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Key Information</h3>
                      <p className="text-orange-100 text-sm">ICC 2020 guidelines</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Risk Transfer</h4>
                      <p className="text-sm text-blue-700">Defines when risk passes from seller to buyer</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Cost Allocation</h4>
                      <p className="text-sm text-green-700">Specifies who pays for transport and insurance</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Documentation</h4>
                      <p className="text-sm text-purple-700">Outlines required documents and responsibilities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}