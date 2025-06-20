
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Zap, Sparkles, Wand2 } from 'lucide-react';
import { VideoClip } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';
import { AIEditingService, EditSuggestion } from '@/services/aiEditingService';

interface EnhancedAIAssistantProps {
  clips: VideoClip[];
  onApplyEdit: (clips: VideoClip[]) => void;
  onApplySuggestion: (suggestion: string) => void;
}

const EnhancedAIAssistant: React.FC<EnhancedAIAssistantProps> = ({ 
  clips, 
  onApplyEdit,
  onApplySuggestion 
}) => {
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const generateEditSuggestions = async () => {
    if (clips.length === 0) {
      toast({
        title: "No clips available",
        description: "Upload some videos first to get AI suggestions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const aiEditing = AIEditingService.getInstance();
      const newSuggestions = await aiEditing.generateEditSuggestions(clips);
      setSuggestions(newSuggestions);
      
      toast({
        title: "AI editing suggestions generated",
        description: `Generated ${newSuggestions.length} smart editing suggestions`,
      });
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast({
        title: "AI suggestion failed",
        description: "Could not generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNaturalLanguageEdit = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const aiEditing = AIEditingService.getInstance();
      const commands = await aiEditing.generateNaturalLanguageEdit(message, clips);
      
      let editedClips = [...clips];
      commands.forEach(command => {
        editedClips = aiEditing.applyEditCommand(editedClips, command);
      });
      
      onApplyEdit(editedClips);
      setMessage('');
      
      toast({
        title: "AI edit applied",
        description: `Applied ${commands.length} editing commands`,
      });
    } catch (error) {
      console.error('Failed to apply natural language edit:', error);
      toast({
        title: "AI edit failed",
        description: "Could not understand the editing request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: EditSuggestion) => {
    const aiEditing = AIEditingService.getInstance();
    let editedClips = [...clips];
    
    suggestion.commands.forEach(command => {
      editedClips = aiEditing.applyEditCommand(editedClips, command);
    });
    
    onApplyEdit(editedClips);
    toast({
      title: "Suggestion applied",
      description: suggestion.description,
    });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Video Editor
          <Badge variant="default" className="ml-auto text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Enhanced
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Natural Language Editing */}
        <div className="space-y-2">
          <div className="text-sm text-purple-200 mb-2">Tell me what to edit:</div>
          <div className="flex space-x-2">
            <Textarea
              placeholder="e.g., 'Make all clips faster', 'Trim long clips', 'Reorder for better flow'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 min-h-[60px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleNaturalLanguageEdit}
              disabled={!message.trim() || loading || clips.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Smart Suggestions */}
        <Button 
          onClick={generateEditSuggestions} 
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600" 
          disabled={clips.length === 0 || loading}
        >
          <Zap className="w-4 h-4 mr-1" />
          {loading ? 'AI Thinking...' : 'Generate Smart Edits'}
        </Button>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="p-3 bg-slate-800/50 rounded border border-purple-500/20 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-200 font-medium">{suggestion.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {suggestion.commands.length} edit{suggestion.commands.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      className="bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Status */}
        <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-700">
          {clips.length > 0 
            ? `${clips.length} clips • AI enhanced editing ready`
            : 'Upload videos to start AI editing'
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAIAssistant;
