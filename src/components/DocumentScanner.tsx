import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Scan, FileText, Download, Camera, Sparkles, BookOpen, X } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from 'tesseract.js';

interface ScannedDocument {
  id: string;
  file: File;
  preview: string;
  extractedText: string;
  summary: string;
  notes: string;
  status: 'uploading' | 'processing' | 'success' | 'error';
  timestamp: Date;
}

export const DocumentScanner = () => {
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const extractTextFromImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await Tesseract.recognize(
            e.target?.result as string,
            'eng+hin+ben+tam+tel+mar+guj+kan+mal+ori+asm+pan+urd',
            {
              logger: m => console.log(m)
            }
          );
          resolve(result.data.text);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const generateSummaryAndNotes = async (extractedText: string): Promise<{ summary: string; notes: string }> => {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      throw new Error("Gemini API key not found");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Please analyze the following text extracted from a document and provide:

    1. A concise summary (2-3 paragraphs)
    2. Structured study notes with key points, definitions, and important concepts

    Extracted text:
    ${extractedText}

    Please format the response as:
    SUMMARY:
    [summary here]

    STUDY NOTES:
    [structured notes here]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response to separate summary and notes
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=STUDY NOTES:|$)/i);
    const notesMatch = text.match(/STUDY NOTES:\s*([\s\S]*?)$/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : text;
    const notes = notesMatch ? notesMatch[1].trim() : "Notes could not be generated.";

    return { summary, notes };
  };

  const processDocument = async (file: File) => {
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

    const newDocument: ScannedDocument = {
      id,
      file,
      preview,
      extractedText: "",
      summary: "",
      notes: "",
      status: 'uploading',
      timestamp: new Date()
    };

    setScannedDocuments(prev => [...prev, newDocument]);

    try {
      // Update status to processing
      setScannedDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, status: 'processing' } : doc
      ));

      // Extract text using OCR
      toast({
        title: "Processing document...",
        description: "Extracting text from image...",
      });

      const extractedText = await extractTextFromImage(file);

      if (!extractedText.trim()) {
        throw new Error("No text could be extracted from the image");
      }

      // Generate summary and notes using Gemini
      toast({
        title: "Generating summary...",
        description: "Creating summary and study notes...",
      });

      const { summary, notes } = await generateSummaryAndNotes(extractedText);

      // Update document with results
      setScannedDocuments(prev => prev.map(doc => 
        doc.id === id ? { 
          ...doc, 
          extractedText, 
          summary, 
          notes, 
          status: 'success' 
        } : doc
      ));

      toast({
        title: "Document processed successfully!",
        description: "Text extracted and summary generated.",
      });

    } catch (error) {
      console.error("Error processing document:", error);
      
      setScannedDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, status: 'error' } : doc
      ));

      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive"
      });
    }
  };

  const processFiles = (files: FileList) => {
    setIsProcessing(true);
    Array.from(files).forEach(async (file) => {
      await processDocument(file);
    });
    setIsProcessing(false);
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

  const removeDocument = (id: string) => {
    setScannedDocuments(prev => {
      const doc = prev.find(d => d.id === id);
      if (doc) {
        URL.revokeObjectURL(doc.preview);
      }
      return prev.filter(d => d.id !== id);
    });
  };

  const downloadNotes = (doc: ScannedDocument) => {
    const content = `Document Analysis Report\n\n` +
      `Date: ${doc.timestamp.toLocaleDateString()}\n\n` +
      `SUMMARY:\n${doc.summary}\n\n` +
      `STUDY NOTES:\n${doc.notes}\n\n` +
      `EXTRACTED TEXT:\n${doc.extractedText}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${doc.file.name.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes downloaded!",
      description: "Your study notes have been saved.",
    });
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
              <Scan className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Scan Documents & Generate Notes
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload images of documents, textbooks, or handwritten notes to extract text and generate summaries
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="document-upload"
              />
              <Button 
                asChild 
                className="bg-gradient-primary hover:shadow-glow transition-smooth"
                disabled={isProcessing}
              >
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Choose Documents"}
                </label>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {scannedDocuments.length > 0 && (
        <Card className="p-6 shadow-soft bg-white/10 backdrop-blur-sm">
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Scanned Documents
          </h4>
          <div className="space-y-6">
            {scannedDocuments.map((document) => (
              <div key={document.id} className="animate-slide-up">
                <Card className="overflow-hidden shadow-soft bg-white/10 backdrop-blur-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Image Preview */}
                    <div className="relative">
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={document.preview}
                          alt="Scanned document"
                          className="w-full h-full object-cover"
                        />
                        {document.status === 'processing' && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <div className="text-sm">Processing...</div>
                            </div>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => removeDocument(document.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate">
                            {document.file.name}
                          </span>
                          <Badge variant={document.status === 'success' ? 'default' : document.status === 'error' ? 'destructive' : 'secondary'}>
                            {document.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {(document.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    {document.status === 'success' && (
                      <div className="p-4 space-y-4">
                        <div>
                          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Summary
                          </h5>
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
                            {document.summary}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Study Notes
                          </h5>
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
                            {document.notes}
                          </div>
                        </div>

                        <Button
                          onClick={() => downloadNotes(document)}
                          className="w-full bg-gradient-secondary hover:shadow-glow transition-smooth"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Notes
                        </Button>
                      </div>
                    )}

                    {document.status === 'error' && (
                      <div className="p-4">
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                          Failed to process document. Please try again with a clearer image.
                        </div>
                      </div>
                    )}
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