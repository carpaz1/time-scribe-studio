
import { VideoClip } from '@/types/timeline';

export interface EditCommand {
  type: 'move' | 'trim' | 'split' | 'delete' | 'add_transition' | 'adjust_speed' | 'reorder';
  clipId?: string;
  parameters?: Record<string, any>;
}

export interface EditSuggestion {
  id: string;
  description: string;
  commands: EditCommand[];
  preview?: string;
}

export class AIEditingService {
  private static instance: AIEditingService;

  static getInstance(): AIEditingService {
    if (!AIEditingService.instance) {
      AIEditingService.instance = new AIEditingService();
    }
    return AIEditingService.instance;
  }

  async generateEditSuggestions(clips: VideoClip[]): Promise<EditSuggestion[]> {
    if (clips.length === 0) return [];

    const suggestions: EditSuggestion[] = [];
    
    // Analyze clip patterns and generate smart suggestions
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
    const avgClipLength = totalDuration / clips.length;

    // Pacing suggestions
    if (avgClipLength > 3) {
      suggestions.push({
        id: 'trim-long-clips',
        description: 'Trim longer clips to improve pacing',
        commands: clips
          .filter(clip => clip.duration > 4)
          .map(clip => ({
            type: 'trim' as const,
            clipId: clip.id,
            parameters: { duration: Math.min(clip.duration * 0.7, 3) }
          }))
      });
    }

    // Transition suggestions
    if (clips.length > 2) {
      suggestions.push({
        id: 'add-transitions',
        description: 'Add smooth transitions between clips',
        commands: clips.slice(0, -1).map((clip, index) => ({
          type: 'add_transition' as const,
          clipId: clip.id,
          parameters: { 
            type: index % 2 === 0 ? 'fade' : 'dissolve',
            duration: 0.5 
          }
        }))
      });
    }

    // Reordering suggestions
    if (clips.length > 3) {
      const reorderedClips = this.suggestOptimalOrder(clips);
      if (JSON.stringify(reorderedClips) !== JSON.stringify(clips.map(c => c.id))) {
        suggestions.push({
          id: 'reorder-clips',
          description: 'Reorder clips for better narrative flow',
          commands: [{
            type: 'reorder' as const,
            parameters: { newOrder: reorderedClips }
          }]
        });
      }
    }

    return suggestions;
  }

  private suggestOptimalOrder(clips: VideoClip[]): string[] {
    // Simple heuristic: start with longest clip, alternate between long and short
    const sorted = [...clips].sort((a, b) => b.duration - a.duration);
    const result: string[] = [];
    const long = sorted.filter((_, i) => i % 2 === 0);
    const short = sorted.filter((_, i) => i % 2 === 1);
    
    for (let i = 0; i < Math.max(long.length, short.length); i++) {
      if (long[i]) result.push(long[i].id);
      if (short[i]) result.push(short[i].id);
    }
    
    return result;
  }

  applyEditCommand(clips: VideoClip[], command: EditCommand): VideoClip[] {
    const newClips = [...clips];
    
    switch (command.type) {
      case 'trim':
        const trimIndex = newClips.findIndex(c => c.id === command.clipId);
        if (trimIndex !== -1 && command.parameters?.duration) {
          newClips[trimIndex] = {
            ...newClips[trimIndex],
            duration: command.parameters.duration
          };
        }
        break;
        
      case 'delete':
        return newClips.filter(c => c.id !== command.clipId);
        
      case 'reorder':
        if (command.parameters?.newOrder) {
          const orderMap = new Map(newClips.map(clip => [clip.id, clip]));
          return command.parameters.newOrder
            .map((id: string) => orderMap.get(id))
            .filter(Boolean);
        }
        break;
        
      case 'adjust_speed':
        const speedIndex = newClips.findIndex(c => c.id === command.clipId);
        if (speedIndex !== -1 && command.parameters?.speed) {
          const speed = command.parameters.speed;
          newClips[speedIndex] = {
            ...newClips[speedIndex],
            duration: newClips[speedIndex].duration / speed,
            playbackSpeed: speed
          };
        }
        break;
    }
    
    return newClips;
  }

  async generateNaturalLanguageEdit(description: string, clips: VideoClip[]): Promise<EditCommand[]> {
    const commands: EditCommand[] = [];
    const lower = description.toLowerCase();
    
    if (lower.includes('speed up') || lower.includes('faster')) {
      clips.forEach(clip => {
        commands.push({
          type: 'adjust_speed',
          clipId: clip.id,
          parameters: { speed: 1.5 }
        });
      });
    }
    
    if (lower.includes('trim') || lower.includes('shorter')) {
      clips.forEach(clip => {
        if (clip.duration > 2) {
          commands.push({
            type: 'trim',
            clipId: clip.id,
            parameters: { duration: clip.duration * 0.8 }
          });
        }
      });
    }
    
    if (lower.includes('reorder') || lower.includes('rearrange')) {
      const newOrder = this.suggestOptimalOrder(clips);
      commands.push({
        type: 'reorder',
        parameters: { newOrder }
      });
    }
    
    return commands;
  }
}
