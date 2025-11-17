'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Code2, Palette, MessageSquare, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WidgetCustomizerProps {
  agentSlug: string;
  baseUrl?: string;
}

export default function WidgetCustomizer({ agentSlug, baseUrl }: WidgetCustomizerProps) {
  const [config, setConfig] = useState({
    enabled: true,
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    textColor: '#ffffff',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    greeting: 'Hi! How can I help you today?',
    avatarUrl: '',
    autoStart: false,
  });

  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const generateVanillaCode = () => {
    const configObj = {
      baseUrl: baseUrl || window.location.origin,
      agentId: agentSlug,
      position: config.position,
      theme: {
        primaryColor: config.primaryColor,
        textColor: config.textColor,
        backgroundColor: config.backgroundColor,
        borderRadius: config.borderRadius,
      },
      greeting: config.greeting,
      avatarUrl: config.avatarUrl || undefined,
      autoStart: config.autoStart,
    };

    return `<!-- Vociant Widget -->
<script src="https://unpkg.com/@vociant/sdk-js@latest/dist/index.umd.js"></script>
<script>
  const widget = new Vociant.VociantWidget(${JSON.stringify(configObj, null, 2)});
</script>`;
  };

  const generateReactCode = () => {
    const configObj = {
      baseUrl: baseUrl || 'YOUR_VOCIANT_URL',
      agentId: agentSlug,
      position: config.position,
      theme: {
        primaryColor: config.primaryColor,
        textColor: config.textColor,
        backgroundColor: config.backgroundColor,
        borderRadius: config.borderRadius,
      },
      greeting: config.greeting,
      avatarUrl: config.avatarUrl || undefined,
      autoStart: config.autoStart,
    };

    return `import { VociantWidget } from '@vociant/react';

function App() {
  return (
    <div>
      <VociantWidget {...${JSON.stringify(configObj, null, 2)}} />
    </div>
  );
}`;
  };

  const generateNPMInstallCommand = (type: 'vanilla' | 'react') => {
    return type === 'react' ? 'npm install @vociant/react' : 'npm install @vociant/sdk-js';
  };

  return (
    <div className="space-y-6">
      {/* Customization Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Widget Configuration
          </CardTitle>
          <CardDescription>
            Customize the appearance and behavior of your voice widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="content">
                <MessageSquare className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="behavior">
                <Settings className="h-4 w-4 mr-2" />
                Behavior
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <select
                    value={config.position}
                    onChange={(e) => handleConfigChange('position', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Border Radius</label>
                  <input
                    type="number"
                    value={config.borderRadius}
                    onChange={(e) => handleConfigChange('borderRadius', parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    min="0"
                    max="24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="h-10 w-12 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Text Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => handleConfigChange('textColor', e.target.value)}
                      className="h-10 w-12 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.textColor}
                      onChange={(e) => handleConfigChange('textColor', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Background</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                      className="h-10 w-12 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Greeting Message</label>
                <textarea
                  value={config.greeting}
                  onChange={(e) => handleConfigChange('greeting', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Hi! How can I help you today?"
                />
                <p className="text-xs text-gray-500 mt-1">
                  First message shown to users when they open the widget
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Avatar URL (optional)</label>
                <input
                  type="url"
                  value={config.avatarUrl}
                  onChange={(e) => handleConfigChange('avatarUrl', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/avatar.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom avatar image for your agent
                </p>
              </div>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.autoStart}
                    onChange={(e) => handleConfigChange('autoStart', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Auto-start conversation</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Automatically open widget and begin conversation when page loads
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Widget Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-100 rounded-lg p-8 min-h-[400px]">
            <div
              className="absolute"
              style={{
                [config.position.includes('bottom') ? 'bottom' : 'top']: '20px',
                [config.position.includes('right') ? 'right' : 'left']: '20px',
              }}
            >
              {/* Widget Button */}
              <div
                className="flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: config.primaryColor,
                  color: config.textColor,
                }}
              >
                {config.avatarUrl ? (
                  <img
                    src={config.avatarUrl}
                    alt="Agent"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" x2="12" y1="19" y2="22"></line>
                  </svg>
                )}
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm">
              Preview of widget position and appearance
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Embed Code
          </CardTitle>
          <CardDescription>
            Copy and paste this code into your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="vanilla">
            <TabsList>
              <TabsTrigger value="vanilla">Vanilla JS</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
            </TabsList>

            {/* Vanilla JS */}
            <TabsContent value="vanilla" className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Installation</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generateNPMInstallCommand('vanilla'), 'vanilla-install')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copiedType === 'vanilla-install' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateNPMInstallCommand('vanilla')}</code>
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Usage</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generateVanillaCode(), 'vanilla-code')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copiedType === 'vanilla-code' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                  <code>{generateVanillaCode()}</code>
                </pre>
              </div>
            </TabsContent>

            {/* React */}
            <TabsContent value="react" className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Installation</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generateNPMInstallCommand('react'), 'react-install')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copiedType === 'react-install' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateNPMInstallCommand('react')}</code>
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Usage</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generateReactCode(), 'react-code')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copiedType === 'react-code' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                  <code>{generateReactCode()}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> For production use, generate a signed URL token for enhanced security.{' '}
              <a href="/docs/authentication" className="underline">
                Learn more
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
