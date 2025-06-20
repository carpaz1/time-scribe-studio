
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Clock } from 'lucide-react';

interface WorkflowControlsProps {
  selectedDuration: 1 | 2 | 5;
  onDurationChange: (duration: 1 | 2 | 5) => void;
  onQuickGenerate: () => void;
  onCompile: () => void;
  isProcessing: boolean;
  sourceVideosLength: number;
  activeWorkflow: 'quick' | 'ai' | 'custom';
  onWorkflowChange: (workflow: 'quick' | 'ai' | 'custom') => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  selectedDuration,
  onDurationChange,
  onQuickGenerate,
  onCompile,
  isProcessing,
  sourceVideosLength,
  activeWorkflow,
  onWorkflowChange,
}) => {
  return (
    <Tabs value={activeWorkflow} onValueChange={onWorkflowChange}>
      <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 h-8">
        <TabsTrigger value="ai" className="text-xs flex items-center">
          <Brain className="w-3 h-3 mr-1" />
          AI Auto
        </TabsTrigger>
        <TabsTrigger value="quick" className="text-xs flex items-center">
          <Zap className="w-3 h-3 mr-1" />
          Quick
        </TabsTrigger>
        <TabsTrigger value="custom" className="text-xs flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Manual
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="ai" className="space-y-3 mt-3">
        <Select 
          value={selectedDuration.toString()} 
          onValueChange={(value) => onDurationChange(Number(value) as 1 | 2 | 5)}
          disabled={isProcessing}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">🧠 1 min - AI Smart Cuts</SelectItem>
            <SelectItem value="2">🎯 2 min - AI Balanced Flow</SelectItem>
            <SelectItem value="5">🎬 5 min - AI Cinematic</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={onQuickGenerate}
          disabled={isProcessing || sourceVideosLength === 0}
          className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-xs px-2 py-1 h-8"
        >
          <Brain className="w-3 h-3 mr-1" />
          {isProcessing ? 'AI Processing...' : `AI Generate ${selectedDuration}min Video`}
        </Button>
        {!isProcessing && (
          <div className="text-xs text-slate-400 text-center">
            🧠 GPU-accelerated AI with smart scene detection & transitions
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="quick" className="space-y-3 mt-3">
        <Select 
          value={selectedDuration.toString()} 
          onValueChange={(value) => onDurationChange(Number(value) as 1 | 2 | 5)}
          disabled={isProcessing}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">⚡ 1 min (60 clips) - Fast & Sharp</SelectItem>
            <SelectItem value="2">🎯 2 min (120 clips) - Balanced</SelectItem>
            <SelectItem value="5">🎬 5 min (300 clips) - Extended</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={onQuickGenerate}
          disabled={isProcessing || sourceVideosLength === 0}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs px-2 py-1 h-8"
        >
          <Zap className="w-3 h-3 mr-1" />
          {isProcessing ? 'GPU Processing...' : `Quick Generate ${selectedDuration}min`}
        </Button>
      </TabsContent>
      
      <TabsContent value="custom" className="space-y-3 mt-3">
        <div className="text-xs text-slate-400 p-2 bg-slate-700/20 rounded">
          Manual timeline creation with AI assistance available
        </div>
        <Button
          onClick={onCompile}
          disabled={isProcessing || sourceVideosLength === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs px-2 py-1 h-8"
        >
          Compile Timeline
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default WorkflowControls;
