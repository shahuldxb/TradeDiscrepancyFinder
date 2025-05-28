import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trade Finance Discrepancy Finder</h1>
                <p className="text-sm text-gray-600">Professional LC Document Analysis Platform</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="banking-button-primary"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Trade Finance Document Analysis
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Leverage CrewAI agents and UCP 600 compliance to detect discrepancies in Letter of Credit documents with precision and speed.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="banking-button-primary text-lg px-8 py-4"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="banking-card">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>CrewAI Agent Orchestration</CardTitle>
              <CardDescription>
                Specialized AI agents for document intake, MT message parsing, and UCP rule application
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="banking-card">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>UCP 600 Compliance</CardTitle>
              <CardDescription>
                Comprehensive validation against UCP 600 standards and SWIFT MT message requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="banking-card">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Multi-Format Processing</CardTitle>
              <CardDescription>
                Support for PDF, OCR, and text formats with intelligent document classification
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Processing</h4>
                    <p className="text-gray-600">Instant analysis and discrepancy detection as documents are uploaded</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Role-based Access</h4>
                    <p className="text-gray-600">Customer and operation segmentation with appropriate permissions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Production Ready</h4>
                    <p className="text-gray-600">PostgreSQL database with direct SQL for enterprise-grade performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">API Integration</h4>
                    <p className="text-gray-600">Seamless ILC creation after successful validation</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Supported Document Types</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>• MT700 Messages</div>
                  <div>• Commercial Invoices</div>
                  <div>• Bills of Lading</div>
                  <div>• Insurance Certificates</div>
                  <div>• Certificates of Origin</div>
                  <div>• Packing Lists</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="banking-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join leading financial institutions using our platform for trade finance document analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                size="lg"
                className="banking-button-primary"
              >
                Access Platform
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Trade Finance Discrepancy Finder. Professional banking solution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
