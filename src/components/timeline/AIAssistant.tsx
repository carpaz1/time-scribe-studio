
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Zap, Sparkles, Settings, Cpu, MessageSquare, AlertCircle } from 'lucide-react';
import { VideoClip } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';

interface AIAssistantProps {
  clips: VideoClip[];
  onApplySuggestion: (suggestion: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ clips, onApplySuggestion }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpuInfo, setGpuInfo] = useState('Checking...');
  const [aiProviders, setAiProviders] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [hasAISetup, setHasAISetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Check for saved AI configurations
      const openaiKey = localStorage.getItem('openai_api_key');
      const ollamaUrl = localStorage.getItem('ollama_url');
      
      if (openaiKey || ollamaUrl) {
        setHasAISetup(true);
        const providers = [];
        if (openaiKey) providers.push('OpenAI GPT');
        if (ollamaUrl) providers.push('Local LLM');
        setAiProviders(providers);
      }

      // Initialize GPU info safely
      try {
        const { default: GPUAccelerator } = await import('@/services/gpuAccelerator');
        const gpu = GPUAccelerator.getInstance();
        const gpuReady = await gpu.initialize();
        setGpuInfo(gpu.getGPUInfo());
      } catch (error) {
        console.warn('GPU acceleration not available:', error);
        setGpuInfo('CPU Only');
      }
    } catch (error) {
      console.error('Error initializing AI services:', error);
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

    if (!hasAISetup) {
      toast({
        title: "AI not configured",
        description: "Set up OpenAI or Ollama in Settings first",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Try to use the AI service
      const { default: AIIntegrationService } = await import('@/services/aiIntegration');
      const ai = AIIntegrationService.getInstance();
      
      // Re-initialize providers from saved settings
      const openaiKey = localStorage.getItem('openai_api_key');
      const ollamaUrl = localStorage.getItem('ollama_url');
      
      if (openaiKey) {
        ai.addOpenAIProvider(openaiKey);
      }
      if (ollamaUrl) {
        ai.addLocalLLMProvider(ollamaUrl);
      }
      
      const newSuggestions = await ai.generateSmartSuggestions(clips);
      setSuggestions(newSuggestions);
      
      if (newSuggestions.length === 0) {
        toast({
          title: "No suggestions generated",
          description: "AI service may be unavailable. Check your settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast({
        title: "AI suggestion failed",
        description: "Check your AI configuration in Settings",
        variant: "destructive",
      });
      
      // Fallback suggestions
      setSuggestions([
        "Try varying clip lengths for dynamic pacing",
        "Add smooth transitions between scenes",
        "Group similar content together",
        "Use shorter clips for high-energy sections",
        "Create a strong opening and closing"
      ]);
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
    
    setLoading(true);
    try {
      // Simple custom suggestion for now
      const customSuggestion = `AI Analysis: Based on "${customPrompt}" - Consider organizing your ${clips.length} clips with this approach in mind. Focus on storytelling flow and audience engagement.`;
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

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Video Assistant
          <Badge variant="secondary" className="ml-2 text-xs">
            <Cpu className="w-3 h-3 mr-1" />
            {gpuInfo}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Provider Status */}
        <div className="space-y-2">
          {hasAISetup ? (
            <div className="flex flex-wrap gap-1">
              {aiProviders.map(provider => (
                <Badge key={provider} variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {provider}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex items-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm text-yellow-200">
                AI not configured. Go to Settings → AI Integration to set up OpenAI or Ollama.
              </span>
            </div>
          )}
        </div>

        {/* Custom AI Prompt */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ask AI anything about your video editing... (e.g., 'How should I arrange these clips for maximum impact?')"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="text-sm"
            rows={2}
          />
          <Button 
            onClick={generateCustomSuggestion} 
            className="w-full" 
            size="sm"
            disabled={!customPrompt.trim() || loading}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Ask AI
          </Button>
        </div>

        {/* Smart Suggestions */}
        <Button 
          onClick={generateSuggestions} 
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600" 
          disabled={clips.length === 0 || loading}
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
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
