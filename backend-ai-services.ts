// backend/src/utils/redis.ts
import { Redis } from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');

let redisClient: Redis | null = null;

/**
 * Get Redis connection for BullMQ
 * Creates singleton Redis client
 */
export const getRedisConnection = (): Redis => {
  if (!redisClient) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    
    logger.info(`Connecting to Redis at ${redisHost}:${redisPort}`);
    
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: 3
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
  }
  
  return redisClient;
};

/**
 * Close Redis connection
 * Should be called during graceful shutdown
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    logger.info('Closing Redis connection');
    await redisClient.quit();
    redisClient = null;
  }
};

// backend/src/services/ai/factory.ts
import { createLogger } from '../../utils/logger';
import { OpenAIService } from './openai';
import { ClaudeService } from './claude';
// Add imports for other AI services as they are implemented

const logger = createLogger('ai-factory');

// AI service types
export enum AIServiceType {
  GPT4 = 'gpt4',
  GPT3 = 'gpt3',
  CLAUDE = 'claude',
  LLAMA = 'llama'
}

// Interface for AI service
export interface AIService {
  generateArticle(title: string, config: any): Promise<string>;
  generateTitleIdeas(topic: string, count: number): Promise<string[]>;
  generateOutline(title: string, config: any): Promise<string[]>;
  expandOutline(title: string, outline: string[], config: any): Promise<Record<string, string>>;
  generateFAQs(title: string, content: string, count: number): Promise<Array<{ question: string, answer: string }>>;
}

// AI Service Factory
export class AIServiceFactory {
  private static instance: AIServiceFactory;
  private services: Map<AIServiceType, AIService>;

  private constructor() {
    this.services = new Map();
    this.initializeServices();
  }

  private initializeServices(): void {
    // Initialize OpenAI services
    this.services.set(AIServiceType.GPT4, new OpenAIService('gpt-4-turbo'));
    this.services.set(AIServiceType.GPT3, new OpenAIService('gpt-3.5-turbo'));
    
    // Initialize Claude service
    this.services.set(AIServiceType.CLAUDE, new ClaudeService());
    
    // Add more AI services as they are implemented
  }

  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    
    return AIServiceFactory.instance;
  }

  public getService(type: AIServiceType | string): AIService {
    const serviceType = typeof type === 'string' ? 
      (type as AIServiceType) : 
      type;
    
    const service = this.services.get(serviceType);
    
    if (!service) {
      logger.warn(`AI service ${serviceType} not found, falling back to GPT-4`);
      return this.services.get(AIServiceType.GPT4)!;
    }
    
    return service;
  }
}

// Helper function to get AI service
export const getAIService = (type: AIServiceType | string): AIService => {
  return AIServiceFactory.getInstance().getService(type);
};

// backend/src/services/ai/openai.ts
import OpenAI from 'openai';
import { AIService } from './factory';
import { createLogger } from '../../utils/logger';

const logger = createLogger('openai-service');

export class OpenAIService implements AIService {
  private openai: OpenAI;
  private model: string;

  constructor(model: string = 'gpt-4-turbo') {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = model;
  }

  /**
   * Generate a complete article based on title and configuration
   */
  public async generateArticle(title: string, config: any): Promise<string> {
    try {
      // Create prompt based on configuration
      const prompt = this.createArticlePrompt(title, config);
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: this.getMaxTokens(config.length),
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('Error generating article with OpenAI:', error);
      throw new Error('Failed to generate article');
    }
  }

  /**
   * Generate title ideas based on topic
   */
  public async generateTitleIdeas(topic: string, count: number = 20): Promise<string[]> {
    try {
      const prompt = `Generate ${count} unique and engaging blog post title ideas about "${topic}". 
      The titles should be SEO-friendly, descriptive, and attract readers. 
      Each title should be at least 5 words long and no more than 15 words.
      Provide each title on a new line without numbering.`;
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content || '';
      const titles = content.split('\n').filter(line => line.trim().length > 0);
      
      return titles.slice(0, count);
    } catch (error) {
      logger.error('Error generating title ideas with OpenAI:', error);
      throw new Error('Failed to generate title ideas');
    }
  }

  /**
   * Generate an outline for an article
   */
  public async generateOutline(title: string, config: any): Promise<string[]> {
    try {
      const prompt = `Create a detailed outline for an article titled "${title}".
      The article style is "${config.style}" and the tone is "${config.tone}".
      Include an introduction, main sections with subsections, and a conclusion.
      For a ${config.length} article, provide an appropriate level of detail.
      Return the outline as a list of main points, with no additional explanation.`;
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content || '';
      const outline = content.split('\n').filter(line => line.trim().length > 0);
      
      return outline;
    } catch (error) {
      logger.error('Error generating outline with OpenAI:', error);
      throw new Error('Failed to generate outline');
    }
  }

  /**
   * Expand an outline into section content
   */
  public async expandOutline(title: string, outline: string[], config: any): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    
    try {
      // Process each outline section
      for (const section of outline) {
        const prompt = `Write content for the section "${section}" of an article titled "${title}".
        The article style is "${config.style}" and the tone is "${config.tone}".
        Write in ${config.pointOfView} person perspective.
        If bold text is needed, use markdown **bold** format.
        The content should be detailed, informative, and engaging.
        Write approximately ${this.getSectionLength(config.length)} words for this section.`;
        
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: this.getSectionMaxTokens(config.length),
        });

        result[section] = response.choices[0].message.content || '';
      }
      
      return result;
    } catch (error) {
      logger.error('Error expanding outline with OpenAI:', error);
      throw new Error('Failed to expand outline');
    }
  }

  /**
   * Generate FAQs for an article
   */
  public async generateFAQs(title: string, content: string, count: number): Promise<Array<{ question: string, answer: string }>> {
    try {
      // Create a summary of the content to use in the prompt
      const contentSummary = content.length > 2000 ? 
        `${content.substring(0, 2000)}...` : 
        content;
      
      const prompt = `Based on the article titled "${title}" with the following content summary:
      
      ${contentSummary}
      
      Generate ${count} frequently asked questions (FAQs) with detailed answers that readers might have about this topic.
      Each question should be specific and directly related to the content.
      Each answer should be 2-3 sentences long and provide valuable information.
      
      Format the response as a JSON array with 'question' and 'answer' fields.`;
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content || '';
      try {
        const faqs = JSON.parse(content).faqs || [];
        return faqs.slice(0, count);
      } catch (parseError) {
        logger.error('Error parsing FAQ JSON:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('Error generating FAQs with OpenAI:', error);
      throw new Error('Failed to generate FAQs');
    }
  }

  /**
   * Helper method to create article prompt based on configuration
   */
  private createArticlePrompt(title: string, config: any): string {
    let prompt = `Write a comprehensive article titled "${title}".`;
    
    // Add style instruction
    prompt += `\nThe article should be in ${config.style} style.`;
    
    // Add tone instruction
    prompt += `\nUse a ${config.tone} tone throughout the article.`;
    
    // Add point of view instruction
    prompt += `\nWrite in ${config.pointOfView} person perspective.`;
    
    // Add formatting instructions
    if (config.boldText) {
      prompt += `\nUse markdown **bold** format for important points and key phrases.`;
    }
    
    // Add structure instructions based on article length
    switch (config.length) {
      case 'short':
        prompt += `\nWrite a concise article of approximately 800-1000 words with an introduction, 3-4 main points, and a conclusion.`;
        break;
      case 'medium':
        prompt += `\nWrite a detailed article of approximately 1500-2000 words with an introduction, 5-6 main sections, and a conclusion.`;
        break;
      case 'long':
        prompt += `\nWrite a comprehensive article of approximately 2500-3000 words with an introduction, 7-8 main sections with subsections, and a conclusion.`;
        break;
      default:
        prompt += `\nWrite a detailed article of approximately 1500-2000 words.`;
    }
    
    // Add takeaways instruction if needed
    if (config.takeaways && config.takeaways > 0) {
      prompt += `\nInclude a "Key Takeaways" section at the beginning with ${config.takeaways} bullet points summarizing the main insights.`;
    }
    
    // Ensure SEO-friendliness
    if (config.seoFix) {
      prompt += `\nEnsure the article is SEO-friendly with a good keyword density for "${title}" and related terms, without keyword stuffing.`;
    }
    
    // Final instructions
    prompt += `\nThe article should be informative, engaging, and valuable to readers interested in this topic.`;
    prompt += `\nAvoid phrases like "In this article" or "As I mentioned earlier".`;
    prompt += `\nDo not mention that you are an AI or that this is an AI-generated article.`;
    
    return prompt;
  }

  /**
   * Get max tokens based on article length
   */
  private getMaxTokens(length: string): number {
    switch (length) {
      case 'short':
        return 2000;
      case 'medium':
        return 3500;
      case 'long':
        return 6000;
      default:
        return 3500;
    }
  }

  /**
   * Get section max tokens based on article length
   */
  private getSectionMaxTokens(length: string): number {
    switch (length) {
      case 'short':
        return 800;
      case 'medium':
        return 1200;
      case 'long':
        return 1800;
      default:
        return 1200;
    }
  }

  /**
   * Get section length in words based on article length
   */
  private getSectionLength(length: string): string {
    switch (length) {
      case 'short':
        return '150-250';
      case 'medium':
        return '300-400';
      case 'long':
        return '500-600';
      default:
        return '300-400';
    }
  }
}

// backend/src/services/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk';
import { AIService } from './factory';
import { createLogger } from '../../utils/logger';

const logger = createLogger('claude-service');

export class ClaudeService implements AIService {
  private anthropic: Anthropic;
  private model: string;

  constructor(model: string = 'claude-3-sonnet-20240229') {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = model;
  }

  /**
   * Generate a complete article based on title and configuration
   */
  public async generateArticle(title: string, config: any): Promise<string> {
    try {
      // Create prompt based on configuration
      const prompt = this.createArticlePrompt(title, config);
      
      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.getMaxTokens(config.length),
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text;
    } catch (error) {
      logger.error('Error generating article with Claude:', error);
      throw new Error('Failed to generate article');
    }
  }

  /**
   * Generate title ideas based on topic
   */
  public async generateTitleIdeas(topic: string, count: number = 20): Promise<string[]> {
    try {
      const prompt = `Generate ${count} unique and engaging blog post title ideas about "${topic}". 
      The titles should be SEO-friendly, descriptive, and attract readers. 
      Each title should be at least 5 words long and no more than 15 words.
      Provide each title on a new line without numbering.`;
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].text;
      const titles = content.split('\n').filter(line => line.trim().length > 0);
      
      return titles.slice(0, count);
    } catch (error) {
      logger.error('Error generating title ideas with Claude:', error);
      throw new Error('Failed to generate title ideas');
    }
  }

  /**
   * Generate an outline for an article
   */
  public async generateOutline(title: string, config: any): Promise<string[]> {
    try {
      const prompt = `Create a detailed outline for an article titled "${title}".
      The article style is "${config.style}" and the tone is "${config.tone}".
      Include an introduction, main sections with subsections, and a conclusion.
      For a ${config.length} article, provide an appropriate level of detail.
      Return the outline as a list of main points, with no additional explanation.`;
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].text;
      const outline = content.split('\n').filter(line => line.trim().length > 0);
      
      return outline;
    } catch (error) {
      logger.error('Error generating outline with Claude:', error);
      throw new Error('Failed to generate outline');
    }
  }

  /**
   * Expand an outline into section content
   */
  public async expandOutline(title: string, outline: string[], config: any): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    
    try {
      // Process each outline section
      for (const section of outline) {
        const prompt = `Write content for the section "${section}" of an article titled "${title}".
        The article style is "${config.style}" and the tone is "${config.tone}".
        Write in ${config.pointOfView} person perspective.
        If bold text is needed, use markdown **bold** format.
        The content should be detailed, informative, and engaging.
        Write approximately ${this.getSectionLength(config.length)} words for this section.`;
        
        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: this.getSectionMaxTokens(config.length),
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });

        result[section] = response.content[0].text;
      }
      
      return result;
    } catch (error) {
      logger.error('Error expanding outline with Claude:', error);
      throw new Error('Failed to expand outline');
    }
  }

  /**
   * Generate FAQs for an article
   */
  public async generateFAQs(title: string, content: string, count: number): Promise<Array<{ question: string, answer: string }>> {
    try {
      // Create a summary of the content to use in the prompt
      const contentSummary = content.length > 2000 ? 
        `${content.substring(0, 2000)}...` : 
        content;
      
      const prompt = `Based on the article titled "${title}" with the following content summary:
      
      ${contentSummary}
      
      Generate ${count} frequently asked questions (FAQs) with detailed answers that readers might have about this topic.
      Each question should be specific and directly related to the content.
      Each answer should be 2-3 sentences long and provide valuable information.
      
      Format the response as a JSON array with 'question' and 'answer' fields.`;
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].text;
      try {
        // Extract JSON part from response
        const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          const faqs = JSON.parse(jsonMatch[0]);
          return faqs.slice(0, count);
        }
        
        // Fallback parsing if JSON is not properly formatted
        const faqs = [];
        const questionMatches = content.matchAll(/question[\s\S]*?:\s*["'](.+?)["']/gi);
        const answerMatches = content.matchAll(/answer[\s\S]*?:\s*["'](.+?)["']/gi);
        
        const questions = Array.from(questionMatches).map(match => match[1]);
        const answers = Array.from(answerMatches).map(match => match[1]);
        
        for (let i = 0; i < Math.min(questions.length, answers.length, count); i++) {
          faqs.push({
            question: questions[i],
            answer: answers[i]
          });
        }
        
        return faqs;
      } catch (parseError) {
        logger.error('Error parsing FAQ JSON from Claude:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('Error generating FAQs with Claude:', error);
      throw new Error('Failed to generate FAQs');
    }
  }

  /**
   * Helper method to create article prompt based on configuration
   */
  private createArticlePrompt(title: string, config: any): string {
    let prompt = `Write a comprehensive article titled "${title}".`;
    
    // Add style instruction
    prompt += `\nThe article should be in ${config.style} style.`;
    
    // Add tone instruction
    prompt += `\nUse a ${config.tone} tone throughout the article.`;
    
    // Add point of view instruction
    prompt += `\nWrite in ${config.pointOfView} person perspective.`;
    
    // Add formatting instructions
    if (config.boldText) {
      prompt += `\nUse markdown **bold** format for important points and key phrases.`;
    }
    
    // Add structure instructions based on article length
    switch (config.length) {
      case 'short':
        prompt += `\nWrite a concise article of approximately 800-1000 words with an introduction, 3-4 main points, and a conclusion.`;
        break;
      case 'medium':
        prompt += `\nWrite a detailed article of approximately 1500-2000 words with an introduction, 5-6 main sections, and a conclusion.`;
        break;
      case 'long':
        prompt += `\nWrite a comprehensive article of approximately 2500-3000 words with an introduction, 7-8 main sections with subsections, and a conclusion.`;
        break;
      default:
        prompt += `\nWrite a detailed article of approximately 1500-2000 words.`;
    }
    
    // Add takeaways instruction if needed
    if (config.takeaways && config.takeaways > 0) {
      prompt += `\nInclude a "Key Takeaways" section at the beginning with ${config.takeaways} bullet points summarizing the main insights.`;
    }
    
    // Ensure SEO-friendliness
    if (config.seoFix) {
      prompt += `\nEnsure the article is SEO-friendly with a good keyword density for "${title}" and related terms, without keyword stuffing.`;
    }
    
    // Final instructions
    prompt += `\nThe article should be informative, engaging, and valuable to readers interested in this topic.`;
    prompt += `\nAvoid phrases like "In this article" or "As I mentioned earlier".`;
    prompt += `\nDo not mention that you are an AI or that this is an AI-generated article.`;
    
    return prompt;
  }

  /**
   * Get max tokens based on article length
   */
  private getMaxTokens(length: string): number {
    switch (length) {
      case 'short':
        return 2000;
      case 'medium':
        return 3500;
      case 'long':
        return 6000;
      default:
        return 3500;
    }
  }

  /**
   * Get section max tokens based on article length
   */
  private getSectionMaxTokens(length: string): number {
    switch (length) {
      case 'short':
        return 800;
      case 'medium':
        return 1200;
      case 'long':
        return 1800;
      default:
        return 1200;
    }
  }

  /**
   * Get section length in words based on article length
   */
  private getSectionLength(length: string): string {
    switch (length) {
      case 'short':
        return '150-250';
      case 'medium':
        return '300-400';
      case 'long':
        return '500-600';
      default:
        return '300-400';
    }
  }
}
