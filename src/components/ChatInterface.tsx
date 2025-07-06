import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Globe, Mic, MicOff, Camera, Image as ImageIcon } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Type declarations for SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
  { code: "my", name: "Manipuri", nativeName: "মৈতৈলোন্" },
  { code: "ks", name: "Kashmiri", nativeName: "कॉशुर" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" }
];

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "नमस्ते! मैं आपका AI सीखने का सहायक हूं। अपनी पढ़ाई के बारे में कुछ भी पूछें या सहायता के लिए सामग्री अपलोड करें!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hi"); // Default to Hindi
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Fallback speech recognition
  const [fallbackTranscript, setFallbackTranscript] = useState("");
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  // Handle fallback speech recognition
  useEffect(() => {
    if (fallbackTranscript && !isListening) {
      setInputValue(fallbackTranscript);
      setFallbackTranscript("");
    }
  }, [fallbackTranscript, isListening]);

  const startFallbackSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsUsingFallback(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setFallbackTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsUsingFallback(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone access in your browser settings.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsUsingFallback(false);
      };

      recognition.start();
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      if (isUsingFallback) {
        // Stop fallback recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          // We can't directly stop it, but it will stop when we set isListening to false
          setIsListening(false);
          setIsUsingFallback(false);
        }
      } else {
        SpeechRecognition.stopListening();
        setIsListening(false);
      }
      return;
    }

    // Try the react-speech-recognition first
    if (browserSupportsSpeechRecognition) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setIsListening(true);
          setIsUsingFallback(false);
          SpeechRecognition.startListening({ 
            continuous: true, 
            language: 'en-US',
            interimResults: true
          });
        })
        .catch((error) => {
          console.error("Microphone permission denied:", error);
          // Try fallback method
          startFallbackSpeechRecognition();
        });
    } else {
      // Use fallback method
      startFallbackSpeechRecognition();
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || "Analyze this image",
      isUser: true,
      timestamp: new Date(),
      imageUrl: uploadedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setUploadedImage(null);
    setIsLoading(true);

    try {
      // Get Gemini API key from environment variable
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      console.log("API Key exists:", !!geminiApiKey);
      console.log("API Key length:", geminiApiKey?.length);
      
      if (!geminiApiKey) {
        throw new Error("Gemini API key not found. Please check your .env file.");
      }

      // Initialize Google AI
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      console.log("Making API call to Gemini...");
      
      // Create prompt with language instruction
      const languageInstruction = getLanguageInstruction(selectedLanguage);
      let prompt = `${languageInstruction}\n\nUser question: ${inputValue || "Please analyze this image and provide insights."}`;
      
      let result;
      
      if (uploadedImage) {
        // If there's an image, use the multimodal model
        const multimodalModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Convert base64 to Uint8Array for image processing
        const base64Data = uploadedImage.split(',')[1];
        const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        result = await multimodalModel.generateContent([
          prompt,
          {
            inlineData: {
              data: btoa(String.fromCharCode(...imageData)),
              mimeType: "image/jpeg"
            }
          }
        ]);
      } else {
        // Text-only request
        result = await model.generateContent(prompt);
      }
      
      const response = await result.response;
      const text = response.text();

      console.log("API response received:", text.substring(0, 100) + "...");

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      
      let errorMessage = "Sorry, I encountered an error while processing your request.";
      
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API key error: " + error.message;
        } else if (error.message.includes("quota")) {
          errorMessage = "API quota exceeded. Please check your Gemini API usage.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else {
          errorMessage = "Error: " + error.message;
        }
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getLanguageInstruction = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (!language) return "";
    
    return `Please respond in ${language.name} (${language.nativeName}). If the user asks in a different language, still respond in ${language.name}.`;
  };

  return (
    <Card className="h-[500px] bg-white/10 backdrop-blur-sm border-0 shadow-soft">
      <div className="flex flex-col h-full p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Learning Assistant
          </h3>
          
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[120px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.nativeName}</span>
                      <span className="text-muted-foreground text-xs">({language.name})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea ref={scrollRef} className="flex-1 pr-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-slide-up`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    message.isUser
                      ? "bg-gradient-primary text-primary-foreground shadow-soft"
                      : "bg-white/15 backdrop-blur-sm border border-border shadow-soft"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!message.isUser && <Bot className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />}
                    {message.isUser && <User className="h-3 w-3 mt-0.5 text-primary-foreground flex-shrink-0" />}
                    <div className="text-xs leading-relaxed">
                      {message.content}
                      {message.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={message.imageUrl} 
                            alt="Uploaded image" 
                            className="max-w-full h-auto rounded-lg max-h-32 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs mt-1 opacity-70 ${message.isUser ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-bounce-in">
                <div className="max-w-[85%] rounded-xl px-3 py-2 bg-white/15 backdrop-blur-sm border border-border shadow-soft">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3 text-primary" />
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Image Preview */}
        {uploadedImage && (
          <div className="mb-2 p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Image to analyze:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedImage(null)}
                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            </div>
            <img 
              src={uploadedImage} 
              alt="Preview" 
              className="max-w-full h-auto rounded max-h-16 object-cover"
            />
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            className="flex-1 border-border focus:ring-primary transition-smooth text-xs h-8"
            disabled={isLoading}
          />
          
          {/* Voice Input Button */}
          <Button
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`h-8 w-8 p-0 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gradient-secondary hover:shadow-glow'}`}
            title={browserSupportsSpeechRecognition ? "Click to start voice input" : "Voice input not supported in this browser"}
          >
            {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </Button>

          {/* Screenshot Upload Button */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-8 w-8 p-0 bg-gradient-secondary hover:shadow-glow"
            title="Upload Screenshot"
          >
            <Camera className="h-3 w-3" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleScreenshotUpload}
            className="hidden"
          />

          <Button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !uploadedImage) || isLoading}
            className="bg-gradient-primary hover:shadow-glow transition-smooth px-3 h-8"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>

        {/* Voice Input Status */}
        {isListening && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Mic className="h-3 w-3 text-red-600 animate-pulse" />
              <span className="text-xs text-red-600">
                {isUsingFallback ? "Listening (fallback mode)..." : "Listening... Speak now"}
              </span>
            </div>
            <div className="text-xs text-red-500 mt-1">
              Click the microphone button again to stop recording
            </div>
          </div>
        )}

        {/* Voice Input Help */}
        {!isListening && !browserSupportsSpeechRecognition && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Mic className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-600">
                Voice input works best in Chrome, Edge, or Safari. Make sure to allow microphone access.
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};