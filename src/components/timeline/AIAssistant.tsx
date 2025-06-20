
import React from 'react';
import { VideoClip } from '@/types/timeline';
import EnhancedAIAssistant from './EnhancedAIAssistant';

interface AIAssistantProps {
  clips: VideoClip[];
  onApplySuggestion: (suggestion: string) => void;
  onApplyEdit?: (clips: VideoClip[]) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  clips, 
  onApplySuggestion,
  onApplyEdit = () => {}
}) => {
  return (
    <EnhancedAIAssistant
      clips={clips}
      onApplyEdit={onApplyEdit}
      onApplySuggestion={onApplySuggestion}
    />
  );
};

export default AIAssistant;
