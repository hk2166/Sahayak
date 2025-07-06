import { useState } from "react";
import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";
import { ImageUpload } from "@/components/ImageUpload";
import { DocumentScanner } from "@/components/DocumentScanner";
import { VisualAidGenerator } from "@/components/VisualAidGenerator";
import QuizGame from "@/components/QuizGame";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Zap } from "lucide-react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("chat");

  const renderContent = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatInterface />;
      case 'upload':
        return <ImageUpload />;
      case 'scanner':
        return <DocumentScanner />;
      case 'visual':
        return <VisualAidGenerator />;
      case 'games':
        return <QuizGame onClose={() => setActiveSection('chat')} />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <Header activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-0 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to Your AI Learning Platform
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Enhance your learning experience with AI-powered tools for chat, worksheet generation, and visual aids.
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-gradient-primary text-primary-foreground">
                      <Brain className="h-3 w-3 mr-1" />
                      AI-Powered
                    </Badge>
                    <Badge className="bg-gradient-secondary text-secondary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Interactive
                    </Badge>
                    <Badge variant="outline" className="border-border">
                      <Zap className="h-3 w-3 mr-1" />
                      Fast & Reliable
                    </Badge>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="p-4 rounded-full bg-gradient-primary text-primary-foreground shadow-glow animate-pulse-glow">
                    <Sparkles className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="animate-slide-up">
            {renderContent()}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <Card className="p-4 text-center bg-white/8 backdrop-blur-sm shadow-soft hover:shadow-elevated transition-smooth">
              <div className="text-2xl font-bold text-primary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">AI Assistant Available</div>
            </Card>
            <Card className="p-4 text-center bg-white/8 backdrop-blur-sm shadow-soft hover:shadow-elevated transition-smooth">
              <div className="text-2xl font-bold text-secondary mb-1">10MB</div>
              <div className="text-sm text-muted-foreground">Max Image Upload Size</div>
            </Card>
            <Card className="p-4 text-center bg-white/8 backdrop-blur-sm shadow-soft hover:shadow-elevated transition-smooth">
              <div className="text-2xl font-bold text-success mb-1">∞</div>
              <div className="text-sm text-muted-foreground">Visual Aids Generated</div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
