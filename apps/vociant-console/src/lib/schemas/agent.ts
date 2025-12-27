import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  systemPrompt: z.string().min(10).max(10000).optional(),
  voiceId: z.string().optional(),
  language: z.string().default('en'),
  turnTimeoutSeconds: z.number().min(1).max(30).default(10),

  // Enums as strings for now, could be tighter
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  ttsProvider: z.string().default('mock'),
  sttProvider: z.string().default('mock'),
  llmProvider: z.string().default('openai'),
});

export const updateAgentSchema = createAgentSchema.partial();

