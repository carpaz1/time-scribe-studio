
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Key, Server, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIIntegrationService from '@/services/aiIntegration';

const AISettingsPanel: React.FC = () => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<'none' | 'success' | 'error'>('none');
  const [ollamaStatus, setOllamaStatus] = useState<'none' | 'success' | 'error'>('none');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings
    const savedOpenAI = localStorage.getItem('openai_api_key');
    const savedOllama = localStorage.getItem('ollama_url');
    
    if (savedOpenAI) {
      setOpenaiKey(savedOpenAI);
      setOpenaiStatus('success');
    }
    if (savedOllama) {
      setOllamaUrl(savedOllama);
    }
    
    // Get current providers
    const ai = AIIntegrationService.getInstance();
    setAvailableProviders(ai.getAvailableProviders());
  }, []);

  const testOpenAI = async () => {
    if (!openaiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key first",
        variant: "destructive",
      });
      return;
    }

    setTestingOpenAI(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
      });

      if (response.ok) {
        setOpenaiStatus('success');
        localStorage.setItem('openai_api_key', openaiKey);
        
        const ai = AIIntegrationService.getInstance();
        ai.addOpenAIProvider(openaiKey);
        setAvailableProviders(ai.getAvailableProviders());
        
        toast({
          title: "OpenAI Connected",
          description: "Successfully connected to OpenAI API",
        });
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      setOpenaiStatus('error');
      toast({
        title: "OpenAI Connection Failed",
        description: "Please check your API key and try again",
        variant: "destructive",
      });
    } finally {
      setTestingOpenAI(false);
    }
  };

  const testOllama = async () => {
    setTestingOllama(true);
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      
      if (response.ok) {
        setOllamaStatus('success');
        localStorage.setItem('ollama_url', ollamaUrl);
        
        const ai = AIIntegrationService.getInstance();
        ai.addLocalLLMProvider(ollamaUrl);
        setAvailableProviders(ai.getAvailableProviders());
        
        toast({
          title: "Ollama Connected",
          description: "Successfully connected to local Ollama instance",
        });
      } else {
        throw new Error(`Connection failed`);
      }
    } catch (error) {
      setOllamaStatus('error');
      toast({
        title: "Ollama Connection Failed",
        description: "Make sure Ollama is running and accessible",
        variant: "destructive",
      });
    } finally {
      setTestingOllama(false);
    }
  };

  const copyOllamaCommand = () => {
    navigator.clipboard.writeText('ollama serve');
    toast({
      title: "Copied to clipboard",
      description: "Command copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Brain className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">AI Integration Settings</h2>
      </div>

      {availableProviders.length > 0 && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            Active AI Providers: {availableProviders.map(p => (
              <Badge key={p} variant="outline" className="ml-1 border-green-400 text-green-300">
                {p}
              </Badge>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="openai" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="openai" className="flex items-center">
            <Key className="w-4 h-4 mr-2" />
            OpenAI API
          </TabsTrigger>
          <TabsTrigger value="ollama" className="flex items-center">
            <Server className="w-4 h-4 mr-2" />
            Local Ollama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="openai" className="space-y-4">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Key className="w-5 h-5 mr-2" />
                OpenAI API Setup
                {openaiStatus === 'success' && <CheckCircle className="w-5 h-5 ml-2 text-green-400" />}
                {openaiStatus === 'error' && <AlertCircle className="w-5 h-5 ml-2 text-red-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Step 1: Get your OpenAI API Key</Label>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>1. Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">platform.openai.com/api-keys</a></p>
                  <p>2. Click "Create new secret key"</p>
                  <p>3. Copy the generated key (starts with "sk-")</p>
                  <p>4. Paste it below and click "Test Connection"</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Step 2: Enter API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={testOpenAI}
                    disabled={testingOpenAI}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {testingOpenAI ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </div>

              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  <strong>Features with OpenAI:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Smart video clip suggestions</li>
                    <li>Automatic scene detection</li>
                    <li>AI-powered transitions</li>
                    <li>Content analysis and tagging</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ollama" className="space-y-4">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Local Ollama Setup
                {ollamaStatus === 'success' && <CheckCircle className="w-5 h-5 ml-2 text-green-400" />}
                {ollamaStatus === 'error' && <AlertCircle className="w-5 h-5 ml-2 text-red-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Step 1: Install Ollama</Label>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>1. Download Ollama from <a href="https://ollama.ai/download" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ollama.ai/download</a></p>
                  <p>2. Install and run the application</p>
                  <p>3. Pull a model (recommended: llama2, codellama, or mistral)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Step 2: Start Ollama Server</Label>
                <div className="flex items-center space-x-2">
                  <code className="bg-slate-700 px-2 py-1 rounded text-sm text-slate-300 flex-1">
                    ollama serve
                  </code>
                  <Button
                    onClick={copyOllamaCommand}
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Run this command in your terminal to start the Ollama server</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Step 3: Configure Connection</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="http://localhost:11434"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={testOllama}
                    disabled={testingOllama}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {testingOllama ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </div>

              <Alert className="border-purple-500/50 bg-purple-500/10">
                <AlertCircle className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-200">
                  <strong>Benefits of Local AI:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Complete privacy - no data leaves your computer</li>
                    <li>No API costs or rate limits</li>
                    <li>Works offline</li>
                    <li>Customizable models</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AISettingsPanel;
