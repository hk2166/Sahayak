import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Bot,
  User,
  Globe,
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

// Type declarations for SpeechRecognition API (minimal)
type TSpeechRecognition = {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart?: () => void;
  onresult?: (event: TSpeechRecognitionEvent) => void;
  onerror?: (event: TSpeechRecognitionErrorEvent) => void;
  onend?: () => void;
};

type TSpeechRecognitionConstructor = new () => TSpeechRecognition;

// Minimal event types
type TSpeechRecognitionAlternative = { transcript: string };
type TSpeechRecognitionResult = {
  isFinal: boolean;
  0: TSpeechRecognitionAlternative;
};
type TSpeechRecognitionResultList = {
  length: number;
  [index: number]: TSpeechRecognitionResult;
};
type TSpeechRecognitionEvent = {
  resultIndex: number;
  results: TSpeechRecognitionResultList;
};
type TSpeechRecognitionErrorEvent = { error: string };

declare global {
  interface Window {
    SpeechRecognition: TSpeechRecognitionConstructor | undefined;
    webkitSpeechRecognition: TSpeechRecognitionConstructor | undefined;
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
  { code: "en", name: "English", nativeName: "English" },
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
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

// Map selected language code to BCP-47 locale for speech recognition
const getLocaleForLanguage = (code: string): string => {
  const map: Record<string, string> = {
    hi: "hi-IN",
    en: "en-US",
    bn: "bn-IN",
    te: "te-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    or: "or-IN",
    as: "as-IN",
    sa: "sa-IN",
    ur: "ur-IN",
    ne: "ne-NP",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
    ru: "ru-RU",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
    ar: "ar-SA",
  };
  return map[code] || "en-US";
};

// AssemblyAI test integration (for testing only)
const useAssemblyAIRecorder = (
  setInputValue: (val: string) => void,
  setIsTranscribing: (val: boolean) => void
) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    // Guard: MediaRecorder support check
    if (typeof MediaRecorder === "undefined") {
      alert(
        "Voice recording is not supported in this browser. Try Chrome on desktop."
      );
      return;
    }
    setIsRecording(true);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        // Send to AssemblyAI
        await sendToAssemblyAI(audioBlob);
        setIsTranscribing(false);
      };
      mediaRecorder.start();
    } catch (err) {
      setIsRecording(false);
      setIsTranscribing(false);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // AssemblyAI upload and transcription
  const sendToAssemblyAI = async (audioBlob: Blob) => {
    const apiKey = import.meta.env.VITE_ASSEMBLY_API_KEY;
    if (!apiKey) {
      alert("AssemblyAI API key not found in environment variables!");
      return;
    }
    try {
      // 1. Upload audio file to AssemblyAI
      const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          authorization: apiKey,
        },
        body: audioBlob,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.upload_url) {
        alert("Failed to upload audio to AssemblyAI.");
        return;
      }
      // 2. Request transcription
      const transcriptRes = await fetch(
        "https://api.assemblyai.com/v2/transcript",
        {
          method: "POST",
          headers: {
            authorization: apiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            audio_url: uploadData.upload_url,
          }),
        }
      );
      const transcriptData = await transcriptRes.json();
      if (!transcriptData.id) {
        alert("Failed to start transcription.");
        return;
      }
      // 3. Poll for completion
      let completed = false;
      let text = "";
      while (!completed) {
        await new Promise((res) => setTimeout(res, 2000));
        const pollRes = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`,
          {
            headers: { authorization: apiKey },
          }
        );
        const pollData = await pollRes.json();
        if (pollData.status === "completed") {
          completed = true;
          text = pollData.text;
        } else if (pollData.status === "failed") {
          completed = true;
          alert("Transcription failed.");
          console.error("AssemblyAI transcription failed:", pollData);
          return;
        }
      }
      // Log the result
      console.log("[AssemblyAI Transcript]:", text);
      if (text && text.trim().length > 0) {
        setInputValue(text);
      } else {
        console.warn("AssemblyAI returned an empty transcript.");
      }
    } catch (err) {
      setIsTranscribing(false);
      console.error("AssemblyAI error:", err);
    }
  };

  return { isRecording, startRecording, stopRecording };
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "नमस्ते! मैं आपका AI सीखने का सहायक हूं। अपनी पढ़ाई के बारे में कुछ भी पूछें या सहायता के लिए सामग्री अपलोड करें!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hi"); // Default to Hindi
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const assemblyAI = useAssemblyAIRecorder(setInputValue, setIsTranscribing);
  const fallbackRecognitionRef = useRef<TSpeechRecognition | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
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
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      const recognition = new SR();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getLocaleForLanguage(selectedLanguage);

      recognition.onstart = () => {
        setIsListening(true);
        setIsUsingFallback(true);
        fallbackRecognitionRef.current = recognition;
      };

      recognition.onresult = (event: TSpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setFallbackTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: TSpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setIsUsingFallback(false);
        if (event.error === "not-allowed") {
          alert(
            "Microphone access denied. Please allow microphone access in your browser settings."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsUsingFallback(false);
        fallbackRecognitionRef.current = null;
      };

      recognition.start();
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      if (isUsingFallback) {
        // Stop fallback recognition reliably
        if (fallbackRecognitionRef.current) {
          try {
            fallbackRecognitionRef.current.stop();
          } catch (e) {
            console.warn("Failed to stop fallback recognition:", e);
          }
        }
        setIsListening(false);
        setIsUsingFallback(false);
      } else {
        SpeechRecognition.stopListening();
        setIsListening(false);
      }
      return;
    }

    // Try the react-speech-recognition first
    if (browserSupportsSpeechRecognition) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          setIsListening(true);
          setIsUsingFallback(false);
          SpeechRecognition.startListening({
            continuous: true,
            language: getLocaleForLanguage(selectedLanguage),
            interimResults: true,
          });
        })
        .catch((error) => {
          console.error("Microphone permission denied:", error);
          // Try fallback method
          startFallbackSpeechRecognition();
        });
    } else {
      // Use fallback method
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        startFallbackSpeechRecognition();
      } else {
        alert(
          "Voice input is not supported in this browser. Please try Chrome or Edge on desktop."
        );
      }
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
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
      imageUrl: uploadedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setUploadedImage(null);
    setIsLoading(true);

    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("Gemini API key not found. Check .env file.");
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // capture text BEFORE clearing it
      const userPrompt = inputValue || "Please analyze this image.";

      const parts: any[] = [
        {
          text: `${getLanguageInstruction(
            selectedLanguage
          )}\n\nUser: ${userPrompt}`,
        },
      ];

      if (uploadedImage) {
        const base64Data = uploadedImage.split(",")[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: parts,
      });
      const text = response.text;

      console.log("API response:", text.substring(0, 80) + "...");

      const aiResponse: Message = {
        id: crypto.randomUUID(),
        content: text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Lamb AI TTS integration
      try {
        setIsTTSLoading(true);
        const lambApiKey = import.meta.env.VITE_LAMB_AI_API_KEY;
        if (!lambApiKey) throw new Error("Lamb AI API key not found.");
        // Example Lamb AI TTS API call (adjust endpoint/body as needed)
        const ttsRes = await fetch("https://api.lambdalabs.com/tts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lambApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });
        if (!ttsRes.ok) throw new Error("Lamb AI TTS request failed");
        const ttsData = await ttsRes.json();
        console.log("Lamb AI TTS response:", ttsData);
        // Assume ttsData.audio_url or ttsData.audio_base64
        let audioUrl = ttsData.audio_url;
        if (!audioUrl && ttsData.audio_base64) {
          audioUrl = `data:audio/wav;base64,${ttsData.audio_base64}`;
        }
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play();
        } else {
          throw new Error("No audio URL returned from Lamb AI");
        }
      } catch (ttsError) {
        console.error("Lamb AI TTS error:", ttsError);
      } finally {
        setIsTTSLoading(false);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);

      let errorMessage =
        "Sorry, I encountered an error while processing your request.";

      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API key error: " + error.message;
        } else if (error.message.includes("quota")) {
          errorMessage =
            "API quota exceeded. Please check your Gemini API usage.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else {
          errorMessage = "Error: " + error.message;
        }
      }

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
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
    const language = languages.find((lang) => lang.code === languageCode);
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
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
            >
              <SelectTrigger className="w-[120px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.nativeName}</span>
                      <span className="text-muted-foreground text-xs">
                        ({language.name})
                      </span>
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
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                } animate-slide-up`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    message.isUser
                      ? "bg-gradient-primary text-primary-foreground shadow-soft"
                      : "bg-white/15 backdrop-blur-sm border border-border shadow-soft"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!message.isUser && (
                      <Bot className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    )}
                    {message.isUser && (
                      <User className="h-3 w-3 mt-0.5 text-primary-foreground flex-shrink-0" />
                    )}
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
                  <div
                    className={`text-xs mt-1 opacity-70 ${
                      message.isUser
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
                      <div
                        className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
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
              <span className="text-xs text-muted-foreground">
                Image to analyze:
              </span>
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
            className={`h-8 w-8 p-0 bg-gradient-secondary hover:shadow-glow transition-shadow duration-300 ${
              isListening
                ? "animate-mic-glow ring-2 ring-red-400 shadow-lg"
                : ""
            }`}
            title={
              browserSupportsSpeechRecognition
                ? "Click to start voice input"
                : "Voice input not supported in this browser"
            }
          >
            {isListening && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-0.5 z-0">
                <span className="w-0.5 h-3 bg-red-400 rounded animate-bar1-mic" />
                <span className="w-0.5 h-4 bg-red-500 rounded animate-bar2-mic" />
                <span className="w-0.5 h-5 bg-red-600 rounded animate-bar3-mic" />
                <span className="w-0.5 h-4 bg-red-500 rounded animate-bar2-mic" />
                <span className="w-0.5 h-3 bg-red-400 rounded animate-bar1-mic" />
              </span>
            )}
            {isListening ? (
              <MicOff className="h-3 w-3 z-10 relative" />
            ) : (
              <Mic className="h-3 w-3" />
            )}
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
                {isUsingFallback
                  ? "Listening (fallback mode)..."
                  : "Listening... Speak now"}
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
                Voice input works best in Chrome, Edge, or Safari. Make sure to
                allow microphone access.
              </span>
            </div>
          </div>
        )}

        {/* AssemblyAI Transcribing Indicator */}
        {isTranscribing && (
          <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Mic className="h-3 w-3 text-blue-600 animate-pulse" />
              <span className="text-xs text-blue-600">
                Transcribing your speech with AssemblyAI...
              </span>
            </div>
          </div>
        )}

        {/* AssemblyAI Speech Recognition Animation */}
        {assemblyAI.isRecording && (
          <div className="flex justify-center items-center mt-2 mb-2">
            {/* Animated bars */}
            <div className="flex gap-1 h-6">
              <div
                className="w-1.5 bg-blue-500 rounded animate-bar1"
                style={{ height: "100%" }}
              ></div>
              <div
                className="w-1.5 bg-blue-400 rounded animate-bar2"
                style={{ height: "100%" }}
              ></div>
              <div
                className="w-1.5 bg-blue-300 rounded animate-bar3"
                style={{ height: "100%" }}
              ></div>
              <div
                className="w-1.5 bg-blue-400 rounded animate-bar2"
                style={{ height: "100%" }}
              ></div>
              <div
                className="w-1.5 bg-blue-500 rounded animate-bar1"
                style={{ height: "100%" }}
              ></div>
            </div>
            <span className="ml-3 text-xs text-blue-600 animate-pulse">
              Listening...
            </span>
          </div>
        )}

        {/* Lamb AI TTS Loading Indicator */}
        {isTTSLoading && (
          <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-600 animate-pulse">
                Generating audio response...
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
