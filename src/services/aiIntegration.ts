
interface AIProvider {
  name: string;
  generateClipSuggestions(clips: any[]): Promise<string[]>;
  analyzeVideo(file: File): Promise<{
    scenes: number[];
    highlights: number[];
    transitions: string[];
    mood: string;
  }>;
  generateCaptions(audioBuffer: ArrayBuffer): Promise<string[]>;
  generateAdvancedSuggestions(clips: any[], context?: string): Promise<string[]>;
}

class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateClipSuggestions(clips: any[]): Promise<string[]> {
    try {
      console.log('OpenAI: Generating enhanced suggestions for', clips.length, 'clips');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional video editor AI with expertise in modern editing techniques, storytelling, and audience engagement. Provide exactly 7 creative editing suggestions.'
            },
            {
              role: 'user',
              content: `I have ${clips.length} video clips: ${clips.map(c => c.name).join(', ')}. Give me 7 creative, modern editing suggestions focusing on pacing, transitions, storytelling flow, and audience retention.`
            }
          ],
          max_tokens: 600,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestions = data.choices[0].message.content
        .split('\n')
        .filter((line: string) => line.trim() && /^\d+/.test(line.trim()))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
      
      console.log('OpenAI: Generated', suggestions.length, 'enhanced suggestions');
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async generateAdvancedSuggestions(clips: any[], context?: string): Promise<string[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an advanced AI video editor specializing in cutting-edge techniques, psychological engagement patterns, and viral content creation.'
            },
            {
              role: 'user',
              content: `Advanced editing request for ${clips.length} clips${context ? ` with context: ${context}` : ''}. Provide 5 sophisticated editing techniques focusing on: 1) Psychological engagement hooks 2) Advanced transition techniques 3) Rhythm and tempo manipulation 4) Color grading suggestions 5) Audio sync optimization.`
            }
          ],
          max_tokens: 700,
          temperature: 0.9
        })
      });

      const data = await response.json();
      return data.choices[0].message.content
        .split('\n')
        .filter((line: string) => line.trim() && /^\d+/.test(line.trim()))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
    } catch (error) {
      console.error('OpenAI advanced suggestions error:', error);
      return this.getFallbackAdvancedSuggestions();
    }
  }

  private getFallbackSuggestions(): string[] {
    return [
      'Create a strong opening hook with your best content',
      'Use quick cuts to build energy and momentum',
      'Group similar content together for better flow',
      'Add smooth transitions between different scenes',
      'End with a memorable conclusion',
      'Use color grading to enhance mood consistency',
      'Add subtle zoom effects to maintain visual interest'
    ];
  }

  private getFallbackAdvancedSuggestions(): string[] {
    return [
      'Implement the "3-second rule" - capture attention within first 3 seconds',
      'Use J-cuts and L-cuts for natural dialogue flow',
      'Apply the "rule of thirds" in your shot composition',
      'Use color psychology - warm tones for energy, cool for calm',
      'Sync cuts to musical beats for rhythmic engagement'
    ];
  }

  async analyzeVideo(file: File): Promise<any> {
    return {
      scenes: [0, 15, 30, 45],
      highlights: [10, 25, 40],
      transitions: ['fade', 'cut', 'dissolve'],
      mood: 'energetic'
    };
  }

  async generateCaptions(audioBuffer: ArrayBuffer): Promise<string[]> {
    return ['AI-generated caption 1', 'AI-generated caption 2'];
  }
}

class LocalLLMProvider implements AIProvider {
  name = 'Local LLM (Ollama)';
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async generateClipSuggestions(clips: any[]): Promise<string[]> {
    try {
      console.log('Ollama: Generating enhanced suggestions for', clips.length, 'clips');
      
      const modelsResponse = await fetch(`${this.baseUrl}/api/tags`);
      if (!modelsResponse.ok) {
        throw new Error('Ollama server not responding');
      }
      
      const modelsData = await modelsResponse.json();
      if (!modelsData.models || modelsData.models.length === 0) {
        throw new Error('No models available in Ollama');
      }

      const modelName = modelsData.models[0].name;
      console.log('Ollama: Using model:', modelName);

      const prompt = `You are a professional video editor AI. I have ${clips.length} video clips: ${clips.map(c => c.name).join(', ')}.

Provide exactly 7 creative video editing suggestions focusing on:
1. Modern editing techniques and pacing
2. Storytelling flow and narrative structure  
3. Audience engagement and retention
4. Smooth transitions and effects
5. Color grading and visual consistency
6. Audio synchronization
7. Platform-specific optimization

Format as numbered list:
1. [suggestion]
2. [suggestion]
etc.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8,
            top_p: 0.9,
            max_tokens: 600
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestions = data.response
        .split('\n')
        .filter((line: string) => line.trim() && /^\d+/.test(line.trim()))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 10);
      
      console.log('Ollama: Parsed', suggestions.length, 'enhanced suggestions');
      
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions();
    } catch (error) {
      console.error('Ollama error:', error);
      throw error;
    }
  }

  async generateAdvancedSuggestions(clips: any[], context?: string): Promise<string[]> {
    try {
      const modelsResponse = await fetch(`${this.baseUrl}/api/tags`);
      const modelsData = await modelsResponse.json();
      const modelName = modelsData.models[0].name;

      const prompt = `Advanced video editing consultation for ${clips.length} clips${context ? ` - Context: ${context}` : ''}.

Provide 5 sophisticated editing techniques:
1. Advanced psychological engagement patterns
2. Professional transition techniques beyond basic cuts
3. Rhythm manipulation and tempo control strategies
4. Color theory and grading for mood enhancement
5. Audio-visual synchronization optimization

Be specific and actionable.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.9, max_tokens: 700 }
        })
      });

      const data = await response.json();
      return data.response
        .split('\n')
        .filter((line: string) => line.trim() && /^\d+/.test(line.trim()))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
    } catch (error) {
      return this.getFallbackAdvancedSuggestions();
    }
  }

  private getFallbackSuggestions(): string[] {
    return [
      'Start with your most engaging clip to hook viewers immediately',
      'Create dynamic pacing by alternating between fast and slow segments', 
      'Group related content together while maintaining variety',
      'Use audio cues to guide your editing rhythm and transitions',
      'Build to a climax and end with a strong memorable moment',
      'Apply consistent color grading for professional look',
      'Use subtle zoom and pan effects to add visual interest'
    ];
  }

  private getFallbackAdvancedSuggestions(): string[] {
    return [
      'Implement match cuts to create visual continuity between scenes',
      'Use the Kuleshov effect - juxtapose clips for emotional impact',
      'Apply the 180-degree rule for spatial consistency',
      'Use cross-cutting to build tension between parallel actions',
      'Employ color contrast to guide viewer attention'
    ];
  }

  async analyzeVideo(file: File): Promise<any> {
    return {
      scenes: [0, 12, 28, 42],
      highlights: [8, 22, 38],
      transitions: ['cut', 'fade', 'wipe'],
      mood: 'cinematic'
    };
  }

  async generateCaptions(audioBuffer: ArrayBuffer): Promise<string[]> {
    return ['Local AI caption 1', 'Local AI caption 2'];
  }
}

export class AIIntegrationService {
  private static instance: AIIntegrationService;
  private providers: AIProvider[] = [];
  private activeProvider: AIProvider | null = null;
  private initialized = false;

  private constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): AIIntegrationService {
    if (!AIIntegrationService.instance) {
      AIIntegrationService.instance = new AIIntegrationService();
    }
    return AIIntegrationService.instance;
  }

  private initializeFromStorage() {
    if (this.initialized) return;
    
    try {
      const openaiKey = localStorage.getItem('openai_api_key');
      const ollamaUrl = localStorage.getItem('ollama_url');
      
      if (openaiKey) {
        console.log('AI: Initializing OpenAI provider from storage');
        this.addOpenAIProvider(openaiKey);
      }
      
      if (ollamaUrl) {
        console.log('AI: Initializing Ollama provider from storage');
        this.addLocalLLMProvider(ollamaUrl);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('AI: Error initializing from storage:', error);
    }
  }

  addOpenAIProvider(apiKey: string) {
    this.providers = this.providers.filter(p => !p.name.includes('OpenAI'));
    
    const provider = new OpenAIProvider(apiKey);
    this.providers.push(provider);
    if (!this.activeProvider) this.activeProvider = provider;
    console.log('AI: OpenAI provider added and activated');
  }

  addLocalLLMProvider(baseUrl?: string) {
    this.providers = this.providers.filter(p => !p.name.includes('Ollama'));
    
    const provider = new LocalLLMProvider(baseUrl);
    this.providers.push(provider);
    if (!this.activeProvider) this.activeProvider = provider;
    console.log('AI: Ollama provider added and activated');
  }

  async generateSmartSuggestions(clips: any[]): Promise<string[]> {
    this.initializeFromStorage();
    
    if (!this.activeProvider) {
      console.log('AI: No active provider, returning enhanced fallback suggestions');
      return [
        'Create a compelling opening hook within the first 3 seconds',
        'Use dynamic pacing - alternate between quick cuts and longer shots',
        'Apply the rule of thirds for better visual composition',
        'Group similar content while maintaining narrative progression',
        'Use smooth transitions that match the energy of your content',
        'Add color grading for mood consistency and professional look',
        'End with a strong call-to-action or memorable conclusion'
      ];
    }
    
    console.log('AI: Generating enhanced suggestions with provider:', this.activeProvider.name);
    return this.activeProvider.generateClipSuggestions(clips);
  }

  async generateAdvancedSuggestions(clips: any[], context?: string): Promise<string[]> {
    this.initializeFromStorage();
    
    if (!this.activeProvider) {
      throw new Error('No AI provider configured for advanced suggestions');
    }
    
    if ('generateAdvancedSuggestions' in this.activeProvider) {
      return this.activeProvider.generateAdvancedSuggestions(clips, context);
    }
    
    return this.activeProvider.generateClipSuggestions(clips);
  }

  async analyzeVideoContent(file: File) {
    if (!this.activeProvider) return null;
    return this.activeProvider.analyzeVideo(file);
  }

  getAvailableProviders(): string[] {
    this.initializeFromStorage();
    return this.providers.map(p => p.name);
  }

  setActiveProvider(name: string) {
    const provider = this.providers.find(p => p.name === name);
    if (provider) {
      this.activeProvider = provider;
      console.log(`AI: Switched to ${name}`);
    }
  }

  hasProviders(): boolean {
    this.initializeFromStorage();
    return this.providers.length > 0;
  }

  getActiveProviderName(): string {
    return this.activeProvider?.name || 'None';
  }
}

export default AIIntegrationService;
