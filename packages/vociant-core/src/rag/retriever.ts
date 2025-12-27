/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Implementation for retrieving relevant knowledge chunks using Vector Search
 */

import { KnowledgeChunk, RAGConfig } from '../types';
import OpenAI from 'openai';

export class KnowledgeRetriever {
  private chunks: Map<string, KnowledgeChunk[]> = new Map();
  private config: RAGConfig;
  private openai: OpenAI;

  constructor(config: RAGConfig) {
    this.config = config;
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || 'dummy' 
    });
  }

  /**
   * Index a knowledge source
   */
  async indexSource(sourceId: string, documents: string[]): Promise<void> {
    const chunks: KnowledgeChunk[] = [];

    for (const doc of documents) {
      const docChunks = this.chunkDocument(doc);

      for (const content of docChunks) {
        // Generate embedding
        let embedding: number[] | undefined;
        try {
            embedding = await this.generateEmbedding(content);
        } catch (e) {
            console.warn(`Failed to generate embedding for chunk in source ${sourceId}`, e);
        }

        chunks.push({
          id: `chunk-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          sourceId,
          content,
          embedding, 
          metadata: {
            length: content.length,
          },
        });
      }
    }

    this.chunks.set(sourceId, chunks);
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
      // If no key or mock provider, return mock embedding if needed, or fail
      if (!process.env.OPENAI_API_KEY) {
          // Return random vector for testing/mock
          return Array(1536).fill(0).map(() => Math.random());
      }

      const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
      });
      return response.data[0].embedding;
  }

  /**
   * Retrieve relevant chunks for a query using Cosine Similarity
   */
  async retrieve(query: string, sourceIds: string[]): Promise<KnowledgeChunk[]> {
    const allChunks: KnowledgeChunk[] = [];

    for (const sourceId of sourceIds) {
      const sourceChunks = this.chunks.get(sourceId) || [];
      allChunks.push(...sourceChunks);
    }

    if (allChunks.length === 0) return [];

    let queryEmbedding: number[];
    try {
        queryEmbedding = await this.generateEmbedding(query);
    } catch (e) {
        console.error("Failed to generate query embedding", e);
        return [];
    }

    // Calculate similarity
    const scoredChunks = allChunks.map(chunk => {
        if (!chunk.embedding) return { chunk, score: -1 };
        const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        return { chunk, score };
    });

    // Sort by score desc
    const relevantChunks = scoredChunks
      .filter(item => item.score > 0.5) // Threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.topK)
      .map(item => item.chunk);

    return relevantChunks;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
      if (vecA.length !== vecB.length) return 0;
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
      }
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Chunk a document into smaller pieces
   */
  private chunkDocument(document: string): string[] {
    const chunks: string[] = [];
    const { chunkSize, chunkOverlap } = this.config;

    let start = 0;

    while (start < document.length) {
      const end = Math.min(start + chunkSize, document.length);
      const chunk = document.substring(start, end);
      chunks.push(chunk);
      start += chunkSize - chunkOverlap;
    }

    return chunks;
  }

  /**
   * Format retrieved chunks for LLM context
   */
  formatContextForLLM(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }

    const formatted = chunks
      .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
      .join('\n\n');

    return `Here is relevant knowledge that may help answer the user's question:\n\n${formatted}\n\n---\n\n`;
  }
}
