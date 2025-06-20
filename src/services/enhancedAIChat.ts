
import AIIntegrationService from './aiIntegration';
import OllamaAutomationService from './ollamaAutomation';
import { VideoClip } from '@/types/timeline';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface VideoAnalysis {
  clipCount: number;
  totalDuration: number;
  suggestions: string[];
  transitions: string[];
  pacing: string;
}

export class EnhancedAIChatService {
  private static instance: EnhancedAIChatService;
  private chatHistory: ChatMessage[] = [];
  private currentVideoContext: VideoClip[] = [];

  private constructor() {}

  static getInstance(): EnhancedAIChatService {
    if (!EnhancedAIChatService.instance) {
      EnhancedAIChatService.instance = new EnhancedAIChatService();
    }
    return EnhancedAIChatService.instance;
  }

  async initializeAI(): Promise<boolean> {
    console.log('Enhanced AI: Initializing...');
    
    // Try to auto-start Ollama
    const ollama = OllamaAutomationService.getInstance();
    await ollama.autoStartOllama();
    
    // Check if any AI providers are available
    const ai = AIIntegrationService.getInstance();
    const hasProviders = ai.hasProviders();
    
    if (!hasProviders) {
      console.log('Enhanced AI: No providers configured');
      return false;
    }
    
    console.log('Enhanced AI: Initialized successfully');
    return true;
  }

  setVideoContext(clips: VideoClip[]) {
    this.currentVideoContext = clips;
    console.log(`Enhanced AI: Video context updated with ${clips.length} clips`);
  }

  async sendMessage(message: string, isVideoRelated: boolean = false): Promise<string> {
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.chatHistory.push(userMessage);

    try {
      let response: string;
      
      if (isVideoRelated && this.currentVideoContext.length > 0) {
        response = await this.handleVideoQuery(message);
      } else {
        response = await this.handleGeneralQuery(message);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      this.chatHistory.push(assistantMessage);

      return response;
    } catch (error) {
      console.error('Enhanced AI: Message failed:', error);
      throw new Error(`AI response failed: ${error.message}`);
    }
  }

  private async handleVideoQuery(message: string): Promise<string> {
    console.log('Enhanced AI: Handling video-related query');
    
    const videoContext = this.analyzeVideoContext();
    const contextPrompt = this.buildVideoContextPrompt(message, videoContext);
    
    const ai = AIIntegrationService.getInstance();
    
    try {
      // Try to use the AI integration for video analysis
      const suggestions = await ai.generateSmartSuggestions(this.currentVideoContext);
      
      // Combine suggestions with user query
      return this.formatVideoResponse(message, suggestions, videoContext);
    } catch (error) {
      // Fallback to local analysis
      return this.generateLocalVideoResponse(message, videoContext);
    }
  }

  private async handleGeneralQuery(message: string): Promise<string> {
    console.log('Enhanced AI: Handling general query');
    
    const ai = AIIntegrationService.getInstance();
    const providers = ai.getAvailableProviders();
    
    if (providers.length === 0) {
      return "I need an AI provider (OpenAI or Ollama) to be configured first. Please set one up in Settings → AI Integration.";
    }

    // Build conversation context
    const conversationHistory = this.chatHistory.slice(-6); // Last 6 messages for context
    const contextPrompt = this.buildGeneralContextPrompt(message, conversationHistory);
    
    try {
      // Use a mock response for now - in a real implementation, this would call the AI provider directly
      return await this.generateGeneralResponse(message, contextPrompt);
    } catch (error) {
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  private analyzeVideoContext(): VideoAnalysis {
    const clips = this.currentVideoContext;
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
    
    return {
      clipCount: clips.length,
      totalDuration,
      suggestions: [
        `You have ${clips.length} clips with ${totalDuration.toFixed(1)}s total duration`,
        'Consider varying clip lengths for dynamic pacing',
        'Use short clips (1-2s) for high energy sections',
        'Longer clips (3-5s) work well for story moments'
      ],
      transitions: ['cut', 'fade', 'dissolve', 'wipe'],
      pacing: clips.length > 10 ? 'fast' : clips.length > 5 ? 'medium' : 'slow'
    };
  }

  private buildVideoContextPrompt(message: string, analysis: VideoAnalysis): string {
    return `Video Analysis Context:
- ${analysis.clipCount} video clips
- ${analysis.totalDuration.toFixed(1)} seconds total duration
- Current pacing: ${analysis.pacing}

User Question: ${message}

Please provide specific advice for creating engaging video content with these clips.`;
  }

  private buildGeneralContextPrompt(message: string, history: ChatMessage[]): string {
    const context = history.length > 0 ? 
      `Previous conversation:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n` : '';
    
    return `${context}Current question: ${message}

Please provide a helpful and informative response.`;
  }

  private formatVideoResponse(message: string, suggestions: string[], analysis: VideoAnalysis): string {
    return `🎬 **Video Analysis Response**

**Your Question:** ${message}

**Current Setup:** ${analysis.clipCount} clips, ${analysis.totalDuration.toFixed(1)}s total

**AI Suggestions:**
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Pro Tips for Bangers:**
• Use quick cuts (0.5-1s) for energy and impact
• Layer complementary audio for transitions
• Create rhythm with your cuts to match any music
• Start strong - first 3 seconds are crucial
• Build tension then release with pacing changes

Want me to analyze specific aspects of your clips or help with transitions?`;
  }

  private generateLocalVideoResponse(message: string, analysis: VideoAnalysis): string {
    const tips = [
      "Start with your strongest clip to hook viewers immediately",
      "Use the 'rule of thirds' - vary your pacing every 3 clips",
      "Quick cuts create energy, longer holds build anticipation",
      "Match your edit rhythm to any background music",
      "End with impact - your strongest moment should be last"
    ];

    return `🎬 **Video Editing Assistant**

**Your Setup:** ${analysis.clipCount} clips (${analysis.totalDuration.toFixed(1)}s)

**For Your Question:** "${message}"

**Banger Video Tips:**
${tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**Transition Suggestions:**
• Fast cuts for action/energy
• Fade transitions for mood changes  
• Match cuts for seamless flow
• Jump cuts for comedy/surprise

Would you like specific advice on pacing, transitions, or clip arrangement?`;
  }

  private async generateGeneralResponse(message: string, context: string): Promise<string> {
    // This would typically call the actual AI provider
    // For now, providing intelligent fallback responses
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('history')) {
      return `I'd be happy to help with history questions! However, I need either OpenAI API or Ollama running to provide detailed historical information. 

For now, I can help with:
• Video editing techniques and strategies
• General creative advice
• Technical assistance with the video editor

To get full AI capabilities for history questions, please:
1. Set up OpenAI API in Settings, OR
2. Install and run Ollama with: \`ollama serve\` and \`ollama pull llama2\`

What specific historical topic interests you?`;
    }
    
    if (lowerMessage.includes('video') || lowerMessage.includes('edit')) {
      return `🎥 **Video Editing Help**

I can help you create amazing videos! Here's what I can assist with:

**Creative Techniques:**
• Pacing and rhythm for maximum impact
• Transition styles and when to use them
• Building narrative flow and tension
• Color grading and visual consistency

**Technical Advice:**
• Optimal clip lengths for different content types
• Audio synchronization and layering
• Export settings for different platforms
• Performance optimization tips

What specific aspect of video editing would you like to explore?`;
    }
    
    return `I'm your AI video assistant! I can help with both video editing and general questions, but I need an AI provider set up for more detailed responses.

**Currently I can help with:**
• Video editing techniques and creative advice
• Technical video production questions
• General guidance on content creation

**For advanced AI chat (history, complex questions):**
• Set up OpenAI API in Settings → AI Integration, OR
• Install Ollama locally for free AI chat

What would you like to know about?`;
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  clearHistory() {
    this.chatHistory = [];
    console.log('Enhanced AI: Chat history cleared');
  }
}

export default EnhancedAIChatService;
