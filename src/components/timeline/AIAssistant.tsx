
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Zap, Sparkles, Settings, Cpu, MessageSquare } from 'lucide-react';
import { VideoClip } from '@/types/timeline';
import AIIntegrationService from '@/services/aiIntegration';
import GPUAccelerator from '@/services/gpuAccelerator';

interface AIAssistantProps {
  clips: VideoClip[];
  onApplySuggestion: (suggestion: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ clips, onApplySuggestion }) => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpuInfo, setGpuInfo] = useState('Initializing...');
  const [aiProviders, setAiProviders] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    // Initialize GPU acceleration
    const gpu = GPUAccelerator.getInstance();
    const gpuReady = await gpu.initialize();
    setGpuInfo(gpu.getGPUInfo());

    // Initialize AI services
    const ai = AIIntegrationService.getInstance();
    
    // Try to connect to local LLM (Ollama)
    try {
      ai.addLocalLLMProvider();
    } catch (error) {
      console.log('Local LLM not available');
    }

    setAiProviders(ai.getAvailableProviders());
  };

  const addOpenAI = () => {
    if (openaiKey.trim()) {
      const ai = AIIntegrationService.getInstance();
      ai.addOpenAIProvider(openaiKey);
      setAiProviders(ai.getAvailableProviders());
      setOpenaiKey('');
    }
  };

  const generateSuggestions = async () => {
    if (clips.length === 0) return;
    
    setLoading(true);
    try {
      const ai = AIIntegrationService.getInstance();
      const newSuggestions = await ai.generateSmartSuggestions(clips);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCustomSuggestion = async () => {
    if (!customPrompt.trim()) return;
    
    setLoading(true);
    try {
      // This would integrate with the AI service using the custom prompt
      const newSuggestion = `Custom AI suggestion based on: "${customPrompt}"`;
      setSuggestions(prev => [newSuggestion, ...prev]);
    } catch (error) {
      console.error('Custom suggestion failed:', error);
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
        {/* AI Provider Setup */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              type="password"
              placeholder="OpenAI API Key (optional)"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button onClick={addOpenAI} size="sm" disabled={!openaiKey.trim()}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {aiProviders.map(provider => (
              <Badge key={provider} variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {provider}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom AI Prompt */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ask AI anything about your video editing..."
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
                onClick={() => onApplySuggestion(suggestion)}
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
