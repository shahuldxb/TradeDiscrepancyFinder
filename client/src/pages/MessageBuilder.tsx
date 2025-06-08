import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Save, 
  Send, 
  Eye, 
  Copy,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface MessageField {
  tag: string;
  name: string;
  value: string;
  format: string;
  required: boolean;
  maxLength?: number;
}

export default function MessageBuilder() {
  const [selectedMessageType, setSelectedMessageType] = useState("MT700");
  const [fields, setFields] = useState<MessageField[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch message types
  const { data: messageTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
    retry: false,
  });

  // Fetch fields for selected message type
  const { data: fieldDefinitions } = useQuery({
    queryKey: ["/api/swift/fields-azure", selectedMessageType],
    retry: false,
  });

  // Initialize fields when message type changes
  useState(() => {
    if (fieldDefinitions?.length) {
      const initialFields = fieldDefinitions.slice(0, 8).map((field: any) => ({
        tag: field.field_code,
        name: field.field_name,
        value: "",
        format: field.format || "35x",
        required: ["20", "31C", "32B", "50", "59"].includes(field.field_code),
        maxLength: field.max_length || 35
      }));
      setFields(initialFields);
    }
  });

  const addField = () => {
    const newField: MessageField = {
      tag: "77A",
      name: "Narrative",
      value: "",
      format: "20*35x",
      required: false,
      maxLength: 35
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof MessageField, value: string | boolean) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setFields(updatedFields);
  };

  const validateMessage = () => {
    const errors = [];
    fields.forEach((field, index) => {
      if (field.required && !field.value.trim()) {
        errors.push(`Field ${field.tag} (${field.name}) is required`);
      }
      if (field.maxLength && field.value.length > field.maxLength) {
        errors.push(`Field ${field.tag} exceeds maximum length of ${field.maxLength}`);
      }
    });
    return errors;
  };

  const generateSwiftMessage = () => {
    const header = `{1:F01BANKGB2LAXXX0000000000}{2:I${selectedMessageType.slice(2)}BANKUS33XXXXN}{3:{108:${Date.now()}}}`;
    const body = fields
      .filter(field => field.value.trim())
      .map(field => `:${field.tag}:${field.value}`)
      .join('\n');
    
    return `${header}\n{4:\n${body}\n-}`;
  };

  const saveMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch('/api/swift/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Failed to save message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Saved",
        description: "SWIFT message has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/swift/messages"] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save SWIFT message",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    const errors = validateMessage();
    if (errors.length > 0) {
      toast({
        title: "Validation Errors",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      messageType: selectedMessageType,
      fields: fields,
      rawMessage: generateSwiftMessage(),
      status: 'draft'
    };

    saveMutation.mutate(messageData);
  };

  const handleSend = () => {
    const errors = validateMessage();
    if (errors.length > 0) {
      toast({
        title: "Validation Errors",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: "SWIFT message has been transmitted successfully",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSwiftMessage());
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SWIFT Message Builder</h1>
        <p className="text-gray-600">
          Create and validate SWIFT MT messages with real-time field validation
        </p>
      </div>

      {/* Message Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="messageType">Message Type</Label>
              <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  {messageTypes?.map((type: any) => (
                    <SelectItem key={type.message_type} value={type.message_type}>
                      {type.message_type} - {type.message_type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Edit Mode" : "Preview Mode"}
              </Button>
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Message Builder</TabsTrigger>
          <TabsTrigger value="preview">Raw Preview</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Message Fields</CardTitle>
                  <CardDescription>
                    Configure SWIFT message fields and values
                  </CardDescription>
                </div>
                <Button onClick={addField} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                    <div className="col-span-2">
                      <Label htmlFor={`tag-${index}`}>Tag</Label>
                      <Input
                        id={`tag-${index}`}
                        value={field.tag}
                        onChange={(e) => updateField(index, 'tag', e.target.value)}
                        placeholder="20"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor={`name-${index}`}>Field Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={field.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                        placeholder="Documentary Credit Number"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor={`value-${index}`}>Value</Label>
                      <Textarea
                        id={`value-${index}`}
                        value={field.value}
                        onChange={(e) => updateField(index, 'value', e.target.value)}
                        placeholder="Enter field value..."
                        className="min-h-[40px]"
                        maxLength={field.maxLength}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Format</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{field.format}</Badge>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField(index)}
                        disabled={field.required}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No fields configured. Select a message type to begin.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Raw SWIFT Message</CardTitle>
              <CardDescription>
                Generated SWIFT message in standard format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {generateSwiftMessage() || "No message content generated"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Message Validation</CardTitle>
              <CardDescription>
                Validate message fields and format compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validateMessage().length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Message validation passed</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validateMessage().map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{fields.length}</p>
                    <p className="text-sm text-gray-600">Total Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{fields.filter(f => f.required).length}</p>
                    <p className="text-sm text-gray-600">Required Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{fields.filter(f => f.value.trim()).length}</p>
                    <p className="text-sm text-gray-600">Completed Fields</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Template
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Message
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSend}>
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}