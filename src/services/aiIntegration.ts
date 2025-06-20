
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
}

class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateClipSuggestions(clips: any[]): Promise<string[]> {
    try {
      console.log('OpenAI: Generating suggestions for', clips.length, 'clips');
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
              content: 'You are a professional video editor AI. Provide exactly 5 creative editing suggestions as a numbered list.'
            },
            {
              role: 'user',
              content: `I have ${clips.length} video clips with names: ${clips.map(c => c.name).join(', ')}. Give me 5 creative ways to arrange and edit them for maximum impact.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
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
      
      console.log('OpenAI: Generated', suggestions.length, 'suggestions');
      return suggestions.length > 0 ? suggestions : [
        'Create a strong opening hook with your best content',
        'Use quick cuts to build energy and momentum',
        'Group similar content together for better flow',
        'Add smooth transitions between different scenes',
        'End with a memorable conclusion'
      ];
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
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
      console.log('Ollama: Generating suggestions for', clips.length, 'clips');
      
      // First, check if Ollama is running and get available models
      const modelsResponse = await fetch(`${this.baseUrl}/api/tags`);
      if (!modelsResponse.ok) {
        throw new Error('Ollama server not responding');
      }
      
      const modelsData = await modelsResponse.json();
      console.log('Ollama: Available models:', modelsData.models?.map(m => m.name) || []);
      
      if (!modelsData.models || modelsData.models.length === 0) {
        throw new Error('No models available in Ollama. Please pull a model first (e.g., ollama pull llama2)');
      }

      // Use the first available model
      const modelName = modelsData.models[0].name;
      console.log('Ollama: Using model:', modelName);

      const prompt = `You are a professional video editor AI. I have ${clips.length} video clips with the following names: ${clips.map(c => c.name).join(', ')}.

Please provide exactly 5 creative video editing suggestions as a numbered list. Focus on:
- Clip arrangement and sequencing
- Pacing and rhythm
- Transitions and effects
- Storytelling flow
- Audience engagement

Format as:
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
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Ollama: Raw response:', data.response);
      
      const suggestions = data.response
        .split('\n')
        .filter((line: string) => line.trim() && /^\d+/.test(line.trim()))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 10);
      
      console.log('Ollama: Parsed', suggestions.length, 'suggestions');
      
      return suggestions.length > 0 ? suggestions : [
        'Start with your most engaging clip to hook viewers immediately',
        'Create dynamic pacing by alternating between fast and slow segments', 
        'Group related content together while maintaining variety',
        'Use audio cues to guide your editing rhythm and transitions',
        'Build to a climax and end with a strong memorable moment'
      ];
    } catch (error) {
      console.error('Ollama error:', error);
      throw error;
    }
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
    // Remove existing OpenAI provider
    this.providers = this.providers.filter(p => !p.name.includes('OpenAI'));
    
    const provider = new OpenAIProvider(apiKey);
    this.providers.push(provider);
    if (!this.activeProvider) this.activeProvider = provider;
    console.log('AI: OpenAI provider added and activated');
  }

  addLocalLLMProvider(baseUrl?: string) {
    // Remove existing Ollama provider
    this.providers = this.providers.filter(p => !p.name.includes('Ollama'));
    
    const provider = new LocalLLMProvider(baseUrl);
    this.providers.push(provider);
    if (!this.activeProvider) this.activeProvider = provider;
    console.log('AI: Ollama provider added and activated');
  }

  async generateSmartSuggestions(clips: any[]): Promise<string[]> {
    this.initializeFromStorage(); // Ensure providers are loaded
    
    if (!this.activeProvider) {
      console.log('AI: No active provider, checking storage...');
      throw new Error('No AI provider configured. Please set up OpenAI or Ollama in Settings.');
    }
    
    console.log('AI: Generating suggestions with provider:', this.activeProvider.name);
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
}

export default AIIntegrationService;
