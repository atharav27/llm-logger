import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationStatus, Prisma, Provider } from '@prisma/client';

import { PrismaService } from 'src/common/database/prisma.service';

import { CreateConversationDto } from './dtos/create-conversation.dto';
import { ListConversationsDto } from './dtos/list-conversations.dto';
import { resolveProviderModel } from './llm/llm-catalog';

@Injectable()
export class ChatService {
  private readonly contextWindow: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.contextWindow =
      this.configService.get<number>('llm.contextWindow') ?? 20;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const { provider, model } = resolveProviderModel(dto.provider, dto.model);

    return this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title ?? 'New Conversation',
        provider,
        model,
        systemPrompt: dto.systemPrompt,
        status: ConversationStatus.ACTIVE,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
      },
    });
  }

  async updateConversationLlm(
    conversationId: string,
    provider: Provider,
    model: string,
  ) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { provider, model, updatedAt: new Date() },
    });
  }

  async listConversations(userId: string, query: ListConversationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, conversations] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            orderBy: { sequenceNumber: 'desc' },
            take: 1,
            select: {
              role: true,
              contentPreview: true,
              createdAt: true,
            },
          },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    const data = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      status: conv.status,
      model: conv.model,
      provider: conv.provider,
      totalInputTokens: conv.totalInputTokens,
      totalOutputTokens: conv.totalOutputTokens,
      totalCostUsd: conv.totalCostUsd,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0] ?? null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { sequenceNumber: 'asc' },
          include: {
            inferenceLog: {
              select: {
                id: true,
                latencyMs: true,
                timeToFirstTokenMs: true,
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                costUsd: true,
                model: true,
                provider: true,
                status: true,
                stopReason: true,
                requestAt: true,
                responseAt: true,
                isStreaming: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return conversation;
  }

  async archiveConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    await this.findAndValidateOwnership(userId, conversationId);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.ARCHIVED,
        updatedAt: new Date(),
      },
    });
  }

  async saveMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const lastMessage = await tx.message.findFirst({
        where: { conversationId: data.conversationId },
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true },
      });

      const nextSeq = (lastMessage?.sequenceNumber ?? 0) + 1;

      const message = await tx.message.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          contentPreview: data.content.slice(0, 200),
          sequenceNumber: nextSeq,
        },
      });

      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async getContextMessages(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sequenceNumber: 'desc' },
      take: this.contextWindow,
      select: { role: true, content: true },
    });

    return messages.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  async validateOwnership(userId: string, conversationId: string) {
    return this.findAndValidateOwnership(userId, conversationId);
  }

  private async findAndValidateOwnership(
    userId: string,
    conversationId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return conversation;
  }
}
