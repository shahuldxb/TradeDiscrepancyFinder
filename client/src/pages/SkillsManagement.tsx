import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Search, Settings, Wrench, Code, BookOpen, Brain, Target } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  tags: string[];
  prerequisites: string[];
  learning_resources: string[];
  difficulty: string;
  estimated_hours: number;
  certification_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewSkill {
  name: string;
  description: string;
  category: string;
  level: string;
  tags: string[];
  prerequisites: string[];
  learning_resources: string[];
  difficulty: string;
  estimated_hours: number;
  certification_required: boolean;
}

const skillCategories = [
  "Document Analysis",
  "Data Processing", 
  "Communication",
  "Validation",
  "Financial Analysis",
  "Technical",
  "Language Processing",
  "Machine Learning"
];

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
const difficultyLevels = ["Easy", "Medium", "Hard", "Expert"];

export default function SkillsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [newSkill, setNewSkill] = useState<NewSkill>({
    name: "",
    description: "",
    category: "",
    level: "",
    tags: [],
    prerequisites: [],
    learning_resources: [],
    difficulty: "",
    estimated_hours: 0,
    certification_required: false,
  });

  // Fetch skills from Azure SQL
  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: (skillData: NewSkill) => apiRequest("/api/skills", "POST", skillData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Success",
        description: "Skill created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewSkill({
        name: "",
        description: "",
        category: "",
        level: "",
        tags: [],
        prerequisites: [],
        learning_resources: [],
        difficulty: "",
        estimated_hours: 0,
        certification_required: false,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create skill",
        variant: "destructive",
      });
    },
  });

  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: ({ id, ...skillData }: Partial<Skill> & { id: string }) => 
      apiRequest(`/api/skills/${id}`, {
        method: "PUT",
        body: JSON.stringify(skillData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Success",
        description: "Skill updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingSkill(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update skill",
        variant: "destructive",
      });
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/skills/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Success",
        description: "Skill deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  const filteredSkills = skills.filter((skill: Skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateSkill = () => {
    createSkillMutation.mutate(newSkill);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSkill = () => {
    if (editingSkill) {
      updateSkillMutation.mutate(editingSkill);
    }
  };

  const handleDeleteSkill = (id: string) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      deleteSkillMutation.mutate(id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Document Analysis": return <BookOpen className="h-4 w-4" />;
      case "Data Processing": return <Settings className="h-4 w-4" />;
      case "Communication": return <Target className="h-4 w-4" />;
      case "Technical": return <Code className="h-4 w-4" />;
      case "Machine Learning": return <Brain className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-orange-100 text-orange-800";
      case "Expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills Management</h1>
          <p className="text-muted-foreground">Manage agent skills and capabilities</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Skill</DialogTitle>
              <DialogDescription>
                Define a new skill that can be assigned to agents
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Skill Name</Label>
                    <Input
                      id="name"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      placeholder="e.g., Document OCR Processing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newSkill.category} onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                    placeholder="Detailed description of the skill..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select value={newSkill.level} onValueChange={(value) => setNewSkill({ ...newSkill, level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={newSkill.difficulty} onValueChange={(value) => setNewSkill({ ...newSkill, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyLevels.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hours">Estimated Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      value={newSkill.estimated_hours}
                      onChange={(e) => setNewSkill({ ...newSkill, estimated_hours: parseInt(e.target.value) || 0 })}
                      placeholder="Hours to learn"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="requirements" className="space-y-4">
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newSkill.tags.join(", ")}
                    onChange={(e) => setNewSkill({ ...newSkill, tags: e.target.value.split(",").map(t => t.trim()).filter(t => t) })}
                    placeholder="OCR, PDF, Analysis, AI"
                  />
                </div>
                <div>
                  <Label htmlFor="prerequisites">Prerequisites (comma-separated)</Label>
                  <Input
                    id="prerequisites"
                    value={newSkill.prerequisites.join(", ")}
                    onChange={(e) => setNewSkill({ ...newSkill, prerequisites: e.target.value.split(",").map(t => t.trim()).filter(t => t) })}
                    placeholder="Basic Document Processing, Text Analysis"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="certification"
                    checked={newSkill.certification_required}
                    onChange={(e) => setNewSkill({ ...newSkill, certification_required: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="certification">Certification Required</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4">
                <div>
                  <Label htmlFor="resources">Learning Resources (comma-separated URLs)</Label>
                  <Textarea
                    id="resources"
                    value={newSkill.learning_resources.join(", ")}
                    onChange={(e) => setNewSkill({ ...newSkill, learning_resources: e.target.value.split(",").map(t => t.trim()).filter(t => t) })}
                    placeholder="https://docs.example.com, https://tutorial.example.com"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSkill} disabled={createSkillMutation.isPending}>
                {createSkillMutation.isPending ? "Creating..." : "Create Skill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Overview</CardTitle>
          <CardDescription>
            Search and filter agent skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {skillCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Skills ({filteredSkills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkills.map((skill: Skill) => (
                <TableRow key={skill.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(skill.category)}
                      <div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-sm text-muted-foreground">{skill.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{skill.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{skill.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(skill.difficulty)}>
                      {skill.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{skill.estimated_hours}h</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {skill.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {skill.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{skill.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={skill.is_active ? "default" : "secondary"}>
                      {skill.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSkill(skill)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSkill && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Skill</DialogTitle>
              <DialogDescription>
                Update skill information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Skill Name</Label>
                  <Input
                    id="edit-name"
                    value={editingSkill.name}
                    onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={editingSkill.category} 
                    onValueChange={(value) => setEditingSkill({ ...editingSkill, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingSkill.description}
                  onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-level">Level</Label>
                  <Select 
                    value={editingSkill.level} 
                    onValueChange={(value) => setEditingSkill({ ...editingSkill, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <Select 
                    value={editingSkill.difficulty} 
                    onValueChange={(value) => setEditingSkill({ ...editingSkill, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingSkill.is_active}
                  onChange={(e) => setEditingSkill({ ...editingSkill, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSkill} disabled={updateSkillMutation.isPending}>
                {updateSkillMutation.isPending ? "Updating..." : "Update Skill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}