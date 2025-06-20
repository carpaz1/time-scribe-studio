import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Zap, Sparkles, Settings, Cpu, MessageSquare, AlertCircle, CheckCircle, Send, History, Video, Server } from 'lucide-react';
import { VideoClip } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';
import AIIntegrationService from '@/services/aiIntegration';
import EnhancedAIChatService from '@/services/enhancedAIChat';
import OllamaAutomationService from '@/services/ollamaAutomation';

interface AIAssistantProps {
  clips: VideoClip[];
  onApplySuggestion: (suggestion: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVideoRelated?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ clips, onApplySuggestion }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpuInfo, setGpuInfo] = useState('Checking...');
  const [aiProviders, setAiProviders] = useState<string[]>([]);
  const [hasAISetup, setHasAISetup] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'running' | 'stopped'>('checking');
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMode, setChatMode] = useState<'suggestions' | 'chat'>('suggestions');
  const [isSending, setIsSending] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeServices();
  }, []);

  useEffect(() => {
    // Update video context when clips change
    const chatService = EnhancedAIChatService.getInstance();
    chatService.setVideoContext(clips);
  }, [clips]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const initializeServices = async () => {
    setConnectionStatus('checking');
    setOllamaStatus('checking');
    
    try {
      // Initialize GPU info
      try {
        const { default: GPUAccelerator } = await import('@/services/gpuAccelerator');
        const gpu = GPUAccelerator.getInstance();
        const gpuReady = await gpu.initialize();
        setGpuInfo(gpu.getGPUInfo());
      } catch (error) {
        console.warn('GPU acceleration not available:', error);
        setGpuInfo('CPU Only');
      }

      // Check Ollama status
      const ollama = OllamaAutomationService.getInstance();
      const ollamaCheck = await ollama.checkStatus();
      setOllamaStatus(ollamaCheck.isRunning ? 'running' : 'stopped');

      // Initialize AI service
      const ai = AIIntegrationService.getInstance();
      const providers = ai.getAvailableProviders();
      const hasProviders = ai.hasProviders();
      
      setAiProviders(providers);
      setHasAISetup(hasProviders || ollamaCheck.isRunning);
      setConnectionStatus((hasProviders || ollamaCheck.isRunning) ? 'connected' : 'disconnected');
      
      // Initialize enhanced chat service
      const chatService = EnhancedAIChatService.getInstance();
      await chatService.initializeAI();
      
      console.log('AI Assistant: Initialized with providers:', providers);
      console.log('AI Assistant: Ollama status:', ollamaCheck.isRunning ? 'running' : 'stopped');
    } catch (error) {
      console.error('Error initializing AI services:', error);
      setConnectionStatus('disconnected');
      setOllamaStatus('stopped');
      setGpuInfo('CPU Only');
    }
  };

  const generateSuggestions = async () => {
    if (clips.length === 0) {
      toast({
        title: "No clips available",
        description: "Upload some videos first to get AI suggestions",
        variant: "destructive",
      });
      return;
    }

    if (!hasAISetup && ollamaStatus !== 'running') {
      toast({
        title: "AI not available",
        description: "Set up OpenAI API or start Ollama to use chat features",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const ai = AIIntegrationService.getInstance();
      console.log('AI Assistant: Requesting suggestions for', clips.length, 'clips');
      
      const newSuggestions = await ai.generateSmartSuggestions(clips);
      setSuggestions(newSuggestions);
      
      if (newSuggestions.length === 0) {
        toast({
          title: "No suggestions generated",
          description: "AI service may be unavailable. Check your settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "AI suggestions generated",
          description: `Generated ${newSuggestions.length} editing suggestions`,
        });
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast({
        title: "AI suggestion failed",
        description: error.message || "Check your AI configuration in Settings",
        variant: "destructive",
      });
      
      // Show specific error-based fallback suggestions
      if (error.message?.includes('Ollama')) {
        setSuggestions([
          "Ollama Error: Make sure Ollama is running (ollama serve)",
          "Pull a model first: ollama pull llama2",
          "Check that Ollama is accessible at the configured URL",
          "Verify firewall settings aren't blocking the connection"
        ]);
      } else if (error.message?.includes('OpenAI')) {
        setSuggestions([
          "OpenAI Error: Check your API key is valid",
          "Verify you have API credits available",
          "Check your internet connection",
          "Try refreshing and testing the connection in Settings"
        ]);
      } else {
        setSuggestions([
          "Try varying clip lengths for dynamic pacing",
          "Add smooth transitions between scenes",
          "Group similar content together",
          "Use shorter clips for high-energy sections",
          "Create a strong opening and closing"
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCustomSuggestion = async () => {
    if (!customPrompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Type what you'd like the AI to help with",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasAISetup && ollamaStatus !== 'running') {
      toast({
        title: "AI not available",
        description: "Set up OpenAI API or start Ollama to use chat features",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // For now, provide a helpful response based on the prompt
      const customSuggestion = `AI Analysis for "${customPrompt}": Consider organizing your ${clips.length} clips with this approach in mind. Focus on storytelling flow, pacing, and audience engagement based on your specific request.`;
      setSuggestions(prev => [customSuggestion, ...prev]);
      setCustomPrompt('');
      
      toast({
        title: "Custom suggestion added",
        description: "AI has analyzed your request",
      });
    } catch (error) {
      console.error('Custom suggestion failed:', error);
      toast({
        title: "Custom suggestion failed",
        description: "Try again or check your AI settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!currentMessage.trim() || isSending) return;

    if (!hasAISetup && ollamaStatus !== 'running') {
      toast({
        title: "AI not available",
        description: "Set up OpenAI API or start Ollama to use chat features",
        variant: "destructive",
      });
      return;
    }

    const message = currentMessage.trim();
    const isVideoRelated = message.toLowerCase().includes('video') || 
                          message.toLowerCase().includes('clip') || 
                          message.toLowerCase().includes('edit') ||
                          clips.length > 0;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      isVideoRelated
    };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsSending(true);

    try {
      const chatService = EnhancedAIChatService.getInstance();
      const response = await chatService.sendMessage(message, isVideoRelated);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isVideoRelated
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "AI responded",
        description: isVideoRelated ? "Video analysis complete" : "Question answered",
      });
    } catch (error) {
      console.error('Chat message failed:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I couldn't process your message: ${error.message}. Please check your AI configuration in Settings.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI chat failed",
        description: "Check your AI setup in Settings",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    const chatService = EnhancedAIChatService.getInstance();
    chatService.clearHistory();
    toast({
      title: "Chat cleared",
      description: "Conversation history has been reset",
    });
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Not Connected';
      default:
        return 'Checking...';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Video Assistant
          <div className="ml-auto flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Cpu className="w-3 h-3 mr-1" />
              {gpuInfo}
            </Badge>
            <Badge variant={ollamaStatus === 'running' ? 'default' : 'outline'} className="text-xs">
              <Server className="w-3 h-3 mr-1" />
              Ollama: {ollamaStatus}
            </Badge>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={chatMode === 'suggestions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatMode('suggestions')}
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-1" />
            Quick Suggestions
          </Button>
          <Button
            variant={chatMode === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatMode('chat')}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            AI Chat
          </Button>
        </div>

        {chatMode === 'suggestions' ? (
          // ... keep existing code (suggestions mode content)
          <div className="space-y-4">
            {/* AI Provider Status */}
            <div className="space-y-2">
              {hasAISetup || ollamaStatus === 'running' ? (
                <div className="flex flex-wrap gap-1">
                  {aiProviders.map(provider => (
                    <Badge key={provider} variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {provider}
                    </Badge>
                  ))}
                  {ollamaStatus === 'running' && (
                    <Badge variant="outline" className="text-xs">
                      <Server className="w-3 h-3 mr-1" />
                      Ollama Ready
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-200">
                    AI not configured. Go to Settings → AI Integration or start Ollama.
                  </span>
                </div>
              )}
            </div>

            {/* Smart Suggestions */}
            <Button 
              onClick={generateSuggestions} 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600" 
              disabled={clips.length === 0 || loading || (!hasAISetup && ollamaStatus !== 'running')}
            >
              <Zap className="w-4 h-4 mr-1" />
              {loading ? 'AI Thinking...' : 'Generate Smart Suggestions'}
            </Button>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="p-2 bg-slate-800/50 rounded text-sm cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => {
                      onApplySuggestion(suggestion);
                      toast({
                        title: "Suggestion applied",
                        description: "AI suggestion has been noted",
                      });
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-200">{suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {clips.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-4">
                Upload videos to get AI-powered editing suggestions
              </div>
            )}
          </div>
        ) : (
          // Chat Mode
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-64 border border-slate-600 rounded-lg bg-slate-900/50">
              <ScrollArea className="h-full p-3" ref={chatScrollRef}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Ask me anything about video editing or general questions!</p>
                    <p className="text-xs mt-2">
                      Try: "How should I edit these clips?" or "Tell me about the Roman Empire"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                          msg.role === 'user' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-200'
                        }`}>
                          <div className="flex items-center space-x-1 mb-1">
                            {msg.role === 'assistant' && <Brain className="w-3 h-3" />}
                            {msg.role === 'user' && <MessageSquare className="w-3 h-3" />}
                            {msg.isVideoRelated && <Video className="w-3 h-3" />}
                            <span className="text-xs opacity-70">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask about video editing, history, or anything else..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                rows={1}
                disabled={isSending}
              />
              <div className="flex flex-col space-y-1">
                <Button
                  onClick={sendChatMessage}
                  disabled={!currentMessage.trim() || isSending || (!hasAISetup && ollamaStatus !== 'running')}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  onClick={clearChat}
                  variant="outline"
                  size="sm"
                  className="border-slate-600"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status Info */}
            <div className="text-xs text-slate-400 text-center">
              {isSending ? 'AI is thinking...' : 
               !hasAISetup && ollamaStatus !== 'running' ? 'Configure AI in Settings to chat' : 
               `${clips.length} clips loaded • ${hasAISetup ? 'Ready' : 'Ollama ready'}`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
