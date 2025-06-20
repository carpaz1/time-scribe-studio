
interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  modified_at: string;
}

interface OllamaStatus {
  isRunning: boolean;
  models: OllamaModel[];
  error?: string;
}

export class OllamaAutomationService {
  private static instance: OllamaAutomationService;
  private baseUrl: string = 'http://localhost:11434';
  private autoStartAttempted: boolean = false;

  private constructor() {}

  static getInstance(): OllamaAutomationService {
    if (!OllamaAutomationService.instance) {
      OllamaAutomationService.instance = new OllamaAutomationService();
    }
    return OllamaAutomationService.instance;
  }

  async checkStatus(): Promise<OllamaStatus> {
    try {
      console.log('Ollama: Checking status...');
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Ollama: Status check successful, models:', data.models?.length || 0);
      
      return {
        isRunning: true,
        models: data.models || []
      };
    } catch (error) {
      console.log('Ollama: Not running or not accessible:', error.message);
      return {
        isRunning: false,
        models: [],
        error: error.message
      };
    }
  }

  async autoStartOllama(): Promise<boolean> {
    if (this.autoStartAttempted) {
      console.log('Ollama: Auto-start already attempted this session');
      return false;
    }

    this.autoStartAttempted = true;
    console.log('Ollama: Attempting to auto-start...');

    try {
      // First check if it's already running
      const status = await this.checkStatus();
      if (status.isRunning) {
        console.log('Ollama: Already running');
        return true;
      }

      // Try to start Ollama using different methods
      const startCommands = [
        'ollama serve',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Ollama\\ollama.exe serve',
        '/usr/local/bin/ollama serve',
        '/opt/homebrew/bin/ollama serve'
      ];

      // Note: We can't actually execute commands from the browser for security reasons
      // This is more of a detection and guidance system
      console.log('Ollama: Cannot auto-start from browser. User needs to manually start Ollama.');
      
      return false;
    } catch (error) {
      console.error('Ollama: Auto-start failed:', error);
      return false;
    }
  }

  async ensureModelAvailable(preferredModel: string = 'llama2'): Promise<string | null> {
    const status = await this.checkStatus();
    
    if (!status.isRunning) {
      console.log('Ollama: Server not running, cannot check models');
      return null;
    }

    if (status.models.length === 0) {
      console.log('Ollama: No models available. User needs to pull a model.');
      return null;
    }

    // Check if preferred model exists
    const hasPreferred = status.models.some(m => m.name.includes(preferredModel));
    if (hasPreferred) {
      const model = status.models.find(m => m.name.includes(preferredModel));
      console.log(`Ollama: Using preferred model: ${model?.name}`);
      return model?.name || null;
    }

    // Use first available model
    const firstModel = status.models[0];
    console.log(`Ollama: Using available model: ${firstModel.name}`);
    return firstModel.name;
  }

  getStartupInstructions(): string[] {
    const isWindows = navigator.platform.toLowerCase().includes('win');
    const isMac = navigator.platform.toLowerCase().includes('mac');
    
    if (isWindows) {
      return [
        '1. Open Command Prompt or PowerShell as Administrator',
        '2. Run: ollama serve',
        '3. In a new terminal, run: ollama pull llama2',
        '4. Refresh this page and test the connection'
      ];
    } else if (isMac) {
      return [
        '1. Open Terminal',
        '2. Run: ollama serve',
        '3. In a new terminal tab, run: ollama pull llama2',
        '4. Refresh this page and test the connection'
      ];
    } else {
      return [
        '1. Open Terminal',
        '2. Run: ollama serve',
        '3. In a new terminal, run: ollama pull llama2',
        '4. Refresh this page and test the connection'
      ];
    }
  }
}

export default OllamaAutomationService;
