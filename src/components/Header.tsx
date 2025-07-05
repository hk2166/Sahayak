import { GraduationCap, MessageSquare, Upload, Palette } from "lucide-react";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Header = ({ activeSection, onSectionChange }: HeaderProps) => {
  const sections = [
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'upload', label: 'Worksheet Generator', icon: Upload },
    { id: 'visual', label: 'Visual Aids', icon: Palette },
  ];

  return (
    <header className="bg-gradient-subtle border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary text-primary-foreground shadow-soft">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">EduPlatform</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Learning Assistant</p>
            </div>
          </div>

          <nav className="flex gap-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth font-medium ${
                    activeSection === section.id
                      ? "bg-gradient-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};