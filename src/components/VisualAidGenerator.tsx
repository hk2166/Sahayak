import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, BarChart3, PieChart, Lightbulb, Download, Sparkles } from "lucide-react";

interface GeneratedAid {
  id: string;
  type: 'drawing' | 'chart' | 'diagram';
  title: string;
  description: string;
  imageUrl: string;
  timestamp: Date;
}

export const VisualAidGenerator = () => {
  const [activeTab, setActiveTab] = useState("drawing");
  const [generatedAids, setGeneratedAids] = useState<GeneratedAid[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Drawing generation form
  const [drawingPrompt, setDrawingPrompt] = useState("");
  const [drawingStyle, setDrawingStyle] = useState("educational");

  // Chart generation form
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState("");
  const [chartTitle, setChartTitle] = useState("");

  const generateVisualAid = async (type: 'drawing' | 'chart' | 'diagram') => {
    if (type === 'drawing' && !drawingPrompt.trim()) {
      toast({
        title: "Missing description",
        description: "Please describe what you'd like me to draw.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'chart' && (!chartData.trim() || !chartTitle.trim())) {
      toast({
        title: "Missing information",
        description: "Please provide both chart title and data.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation (replace with actual AI image generation API)
    setTimeout(() => {
      const newAid: GeneratedAid = {
        id: Date.now().toString(),
        type,
        title: type === 'drawing' ? drawingPrompt : chartTitle,
        description: type === 'drawing' 
          ? `Generated ${drawingStyle} style drawing` 
          : `${chartType} chart visualization`,
        imageUrl: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=300&fit=crop", // Placeholder
        timestamp: new Date()
      };

      setGeneratedAids(prev => [newAid, ...prev]);
      setIsGenerating(false);

      // Clear forms
      if (type === 'drawing') {
        setDrawingPrompt("");
      } else {
        setChartData("");
        setChartTitle("");
      }

      toast({
        title: "Visual aid generated!",
        description: `Your ${type} has been created successfully.`,
      });
    }, 3000);
  };

  const downloadAid = (aid: GeneratedAid) => {
    toast({
      title: "Download started",
      description: `Downloading ${aid.title}...`,
    });
    // In a real implementation, this would trigger the download
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-soft bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-secondary text-secondary-foreground">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Visual Aid Generator</h3>
            <p className="text-muted-foreground">Create drawings, charts, and diagrams to enhance learning</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="drawing" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Drawing
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="diagram" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Diagrams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drawing" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Describe what you'd like me to draw
                </label>
                <Textarea
                  value={drawingPrompt}
                  onChange={(e) => setDrawingPrompt(e.target.value)}
                  placeholder="e.g., A diagram showing the water cycle with clouds, rain, and evaporation"
                  className="min-h-[100px] resize-none border-border focus:ring-primary transition-smooth"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Style</label>
                <div className="flex gap-2">
                  {['educational', 'colorful', 'minimal', 'detailed'].map((style) => (
                    <Badge
                      key={style}
                      variant={drawingStyle === style ? "default" : "outline"}
                      className={`cursor-pointer transition-smooth ${
                        drawingStyle === style 
                          ? "bg-gradient-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setDrawingStyle(style)}
                    >
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generateVisualAid('drawing')}
                disabled={isGenerating || !drawingPrompt.trim()}
                className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Generating Drawing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Drawing
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Chart Title</label>
                <Input
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="e.g., Student Performance by Subject"
                  className="border-border focus:ring-primary transition-smooth"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Chart Type</label>
                <div className="flex gap-2">
                  {['bar', 'line', 'pie', 'area'].map((type) => (
                    <Badge
                      key={type}
                      variant={chartType === type ? "default" : "outline"}
                      className={`cursor-pointer transition-smooth ${
                        chartType === type 
                          ? "bg-gradient-secondary text-secondary-foreground" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setChartType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Data (one item per line)
                </label>
                <Textarea
                  value={chartData}
                  onChange={(e) => setChartData(e.target.value)}
                  placeholder={`Math: 85\nScience: 92\nHistory: 78\nEnglish: 88`}
                  className="min-h-[120px] resize-none border-border focus:ring-primary transition-smooth"
                />
              </div>

              <Button
                onClick={() => generateVisualAid('chart')}
                disabled={isGenerating || !chartData.trim() || !chartTitle.trim()}
                className="w-full bg-gradient-secondary hover:shadow-glow transition-smooth"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-foreground mr-2"></div>
                    Generating Chart...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Chart
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="diagram" className="space-y-4">
            <div className="text-center py-8">
              <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">Diagram Generator</h4>
              <p className="text-muted-foreground">
                Coming soon! This will help you create educational diagrams and flowcharts.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {generatedAids.length > 0 && (
        <Card className="p-6 shadow-soft bg-white/10 backdrop-blur-sm">
          <h4 className="text-lg font-semibold text-foreground mb-4">Generated Visual Aids</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedAids.map((aid) => (
              <div key={aid.id} className="animate-slide-up">
                <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-smooth group bg-white/10 backdrop-blur-sm">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={aid.imageUrl}
                      alt={aid.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-primary text-primary-foreground">
                        {aid.type}
                      </Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-smooth"
                      onClick={() => downloadAid(aid)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h5 className="font-medium text-foreground mb-1 truncate">{aid.title}</h5>
                    <p className="text-sm text-muted-foreground mb-2">{aid.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {aid.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};