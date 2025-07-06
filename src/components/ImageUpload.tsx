import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, FileText, X } from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
}

export const ImageUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files.",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload images smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);

      const newFile: UploadedFile = {
        id,
        file,
        preview,
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Simulate processing (replace with actual worksheet generation API)
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === id ? { ...f, status: 'success' } : f
        ));
        toast({
          title: "Image processed!",
          description: "Worksheet generation completed successfully.",
        });
      }, 2000);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const generateWorksheet = (fileId: string) => {
    toast({
      title: "Generating worksheet...",
      description: "Please wait while we create your personalized worksheet.",
    });
    // In a real implementation, this would trigger worksheet generation
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-border hover:border-primary transition-smooth bg-white/10 backdrop-blur-sm">
        <div
          className={`p-8 text-center transition-smooth ${
            isDragOver ? "bg-gradient-subtle border-primary" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-primary text-primary-foreground">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Upload Images for Worksheet Generation
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your images here, or click to browse
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild className="bg-gradient-primary hover:shadow-glow transition-smooth">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose Images
                </label>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-6 shadow-soft bg-white/10 backdrop-blur-sm">
          <h4 className="text-lg font-semibold text-foreground mb-4">Uploaded Images</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="relative group animate-slide-up">
                <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-smooth bg-white/10 backdrop-blur-sm">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={uploadedFile.preview}
                      alt="Uploaded file"
                      className="w-full h-full object-cover"
                    />
                    {uploadedFile.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-sm">Processing...</div>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-smooth h-8 w-8"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">
                        {uploadedFile.file.name}
                      </span>
                      {uploadedFile.status === 'success' && (
                        <Button
                          size="sm"
                          onClick={() => generateWorksheet(uploadedFile.id)}
                          className="bg-gradient-secondary hover:shadow-glow transition-smooth text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
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