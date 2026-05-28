import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ConversationStatus } from '@prisma/client';
import { Request, Response } from 'express';

import { ChatService } from './chat.service';
import { IngestService } from '../ingest/ingest.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { ListConversationsDto } from './dtos/list-conversations.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { UpdateConversationStatusDto } from './dtos/update-conversation-status.dto';
import { resolveMessageProviderModel } from './llm/llm-catalog';
import { LlmService } from './llm/llm.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../../common/auth/guards/jwt-access.guard';
import { PrismaService } from '../../common/database/prisma.service';
import { ApiAuth } from '../../common/doc/decorators/api-auth.decorator';
import { SkipResponseTransform } from '../../common/response/decorators/skip-response-transform.decorator';

@ApiTags('Chat')
@ApiAuth()
@UseGuards(JwtAccessGuard)
@Controller({ path: 'conversations', version: '1' })
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly llmService: LlmService,
    private readonly ingestService: IngestService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  createConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List conversations (paginated)' })
  listConversations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListConversationsDto,
  ) {
    return this.chatService.listConversations(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get conversation with all messages and inference logs',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getConversation(user.id, id);
  }

  @Delete(':id')
  @SkipResponseTransform()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive (soft-delete) a conversation' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async archiveConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.chatService.archiveConversation(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation status (cancel/resume)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  updateConversationStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationStatusDto,
  ) {
    return this.chatService.updateConversationStatus(user.id, id, dto.status);
  }

  @Post(':id/message')
  @SkipResponseTransform()
  @ApiOperation({
    summary: 'Send a message — streams assistant response via SSE',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const conversation = await this.chatService.validateOwnership(user.id, id);

    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot send to a ${conversation.status.toLowerCase()} conversation`,
      );
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (payload: Record<string, unknown>): void => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    await this.chatService.saveMessage({
      conversationId: id,
      role: 'user',
      content: dto.content,
    });

    const contextMessages = await this.chatService.getContextMessages(id);

    let clientDisconnected = false;
    let abortStream: (() => void) | null = null;
    let logId: string | null = null;

    req.on('close', () => {
      if (res.writableEnded) {
        return;
      }
      clientDisconnected = true;
      if (abortStream) {
        abortStream();
        this.logger.log(`Client disconnected — aborted log ${logId}`);
      }
    });

    try {
      const { provider, model } = resolveMessageProviderModel(
        conversation.provider,
        conversation.model,
        dto.provider,
        dto.model,
      );

      if (provider !== conversation.provider || model !== conversation.model) {
        await this.chatService.updateConversationLlm(id, provider, model);
      }

      const result = await this.llmService.sendMessage({
        conversationId: id,
        params: {
          provider,
          model,
          messages: contextMessages,
          systemPrompt: conversation.systemPrompt ?? undefined,
        },
      });

      abortStream = result.abort;
      logId = result.logId;

      let fullResponse = '';

      for await (const chunk of result.stream) {
        if (clientDisconnected) {
          break;
        }

        fullResponse += chunk;
        sendEvent({ type: 'chunk', content: chunk });
      }

      if (clientDisconnected) {
        res.end();
        return;
      }

      const assistantMessage = await this.chatService.saveMessage({
        conversationId: id,
        role: 'assistant',
        content: fullResponse,
      });

      if (logId) {
        await this.ingestService.linkMessageToLog(logId, assistantMessage.id);
      }

      if (logId) {
        const finalLog = await this.prisma.inferenceLog.findUnique({
          where: { id: logId },
          select: {
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
        });

        sendEvent({ type: 'metadata', log: finalLog });
      }

      sendEvent({ type: 'done' });
      res.end();
    } catch (error) {
      this.logger.error(`SSE error for conversation ${id}`, error);

      if (!res.writableEnded) {
        sendEvent({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
        res.end();
      }
    }
  }
}
