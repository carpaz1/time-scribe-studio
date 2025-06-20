
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
              content: 'You are a professional video editor AI. Analyze video clips and provide creative editing suggestions.'
            },
            {
              role: 'user',
              content: `I have ${clips.length} video clips. Suggest 5 creative ways to arrange and edit them for maximum impact.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.split('\n').filter((line: string) => line.trim());
    } catch (error) {
      console.error('OpenAI API error:', error);
      return ['Use quick cuts for energy', 'Add smooth transitions', 'Create rhythm with music'];
    }
  }

  async analyzeVideo(file: File): Promise<any> {
    // Simulated AI analysis for now
    return {
      scenes: [0, 15, 30, 45],
      highlights: [10, 25, 40],
      transitions: ['fade', 'cut', 'dissolve'],
      mood: 'energetic'
    };
  }

  async generateCaptions(audioBuffer: ArrayBuffer): Promise<string[]> {
    // Would integrate with Whisper API
    return ['AI-generated caption 1', 'AI-generated caption 2'];
  }
}

class LocalLLMProvider implements AIProvider {
  name = 'Local LLM';
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async generateClipSuggestions(clips: any[]): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2',
          prompt: `As a video editor AI, suggest 5 creative ways to edit ${clips.length} video clips:`,
          stream: false
        })
      });

      const data = await response.json();
      return data.response.split('\n').filter((line: string) => line.trim());
    } catch (error) {
      console.error('Local LLM error:', error);
      return ['Create dynamic pacing', 'Use smart transitions', 'Build emotional arc'];
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

  private constructor() {}

  static getInstance(): AIIntegrationService {
    if (!AIIntegrationService.instance) {
      AIIntegrationService.instance = new AIIntegrationService();
    }
    return AIIntegrationService.instance;
  }

  addOpenAIProvider(apiKey: string) {
    const provider = new OpenAIProvider(apiKey);
    this.providers.push(provider);
    if (!this.activeProvider) this.activeProvider = provider;
    console.log('AI: OpenAI provider added');
  }

  addLocalLLMProvider(baseUrl?: string) {
    const provider = new LocalLLMProvider(baseUrl);
    this.providers.push(provider);
    if (!this.activeProvider) this.activeProvider = provider;
    console.log('AI: Local LLM provider added');
  }

  async generateSmartSuggestions(clips: any[]): Promise<string[]> {
    if (!this.activeProvider) return [];
    return this.activeProvider.generateClipSuggestions(clips);
  }

  async analyzeVideoContent(file: File) {
    if (!this.activeProvider) return null;
    return this.activeProvider.analyzeVideo(file);
  }

  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name);
  }

  setActiveProvider(name: string) {
    const provider = this.providers.find(p => p.name === name);
    if (provider) {
      this.activeProvider = provider;
      console.log(`AI: Switched to ${name}`);
    }
  }
}

export default AIIntegrationService;
