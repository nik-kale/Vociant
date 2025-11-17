import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default async function AgentBuilderPage({
  params,
}: {
  params: { slug: string };
}) {
  const agent = await db.agent.findUnique({
    where: { slug: params.slug },
    include: {
      agentKnowledgeBases: {
        include: {
          knowledgeSource: true,
        },
      },
      agentTools: {
        include: {
          tool: true,
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                {agent.status}
              </Badge>
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Agent Builder Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="persona">Persona</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="flow">Flow</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
                <CardDescription>
                  Basic details about your agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    defaultValue={agent.name}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    defaultValue={agent.description || ''}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    defaultValue={agent.status}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Persona Tab */}
          <TabsContent value="persona" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>
                  Define your agent's personality and behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  defaultValue={agent.systemPrompt}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={12}
                  placeholder="You are a helpful assistant..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversation Style</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  defaultValue={agent.style || 'professional'}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="supportive">Supportive</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                </select>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>TTS Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <select
                    defaultValue={agent.ttsProvider}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="google">Google Cloud TTS</option>
                    <option value="deepgram">Deepgram</option>
                    <option value="openai">OpenAI TTS</option>
                    <option value="mock">Mock (Testing)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Voice ID</label>
                  <input
                    type="text"
                    defaultValue={agent.voiceProfileId || ''}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="e.g., 21m00Tcm4TlvDq8ikWAM"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>STT Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  defaultValue={agent.sttProvider}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="elevenlabs">ElevenLabs Scribe</option>
                  <option value="deepgram">Deepgram</option>
                  <option value="google">Google Cloud STT</option>
                  <option value="openai-whisper">OpenAI Whisper</option>
                  <option value="mock">Mock (Testing)</option>
                </select>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversation Flow Tab */}
          <TabsContent value="flow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Flow Settings</CardTitle>
                <CardDescription>
                  Control how your agent responds to user input
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Silence Timeout (ms)</label>
                  <input
                    type="number"
                    defaultValue={agent.silenceTimeoutMs}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long to wait before prompting the user
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={agent.interruptionsEnabled}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Enable Interruptions</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow users to interrupt agent speech
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Turn Eagerness</label>
                  <select
                    defaultValue={agent.turnEagerness}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low - Waits for clear pauses</option>
                    <option value="medium">Medium - Balanced</option>
                    <option value="high">High - Responds quickly</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  Attach knowledge sources for RAG
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.agentKnowledgeBases.length === 0 ? (
                  <p className="text-sm text-gray-500">No knowledge sources attached</p>
                ) : (
                  <div className="space-y-2">
                    {agent.agentKnowledgeBases.map((akb) => (
                      <div
                        key={akb.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{akb.knowledgeSource.name}</p>
                          <p className="text-sm text-gray-500">
                            {akb.knowledgeSource.type} • {akb.knowledgeSource.status}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button className="mt-4">Add Knowledge Source</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tools & Functions</CardTitle>
                <CardDescription>
                  Enable your agent to take actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.agentTools.length === 0 ? (
                  <p className="text-sm text-gray-500">No tools attached</p>
                ) : (
                  <div className="space-y-2">
                    {agent.agentTools.map((at) => (
                      <div
                        key={at.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{at.tool.name}</p>
                          <p className="text-sm text-gray-500">
                            {at.tool.category} • {at.tool.description}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button className="mt-4">Add Tool</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Web Widget</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={agent.webWidgetEnabled}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Enable Web Widget</span>
                </label>
                {agent.webWidgetEnabled && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Embed Code:</p>
                    <code className="text-xs block bg-white p-3 rounded border">
                      {`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget.js"></script>\n<div id="vociant-widget" data-agent="${agent.slug}"></div>`}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
