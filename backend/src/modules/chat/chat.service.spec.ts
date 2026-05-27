import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { PrismaService } from 'src/common/database/prisma.service';

import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  const prismaMock = {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(20) },
        },
      ],
    }).compile();

    service = moduleRef.get(ChatService);
  });

  describe('getConversation', () => {
    it('throws 404 when conversation does not exist', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      await expect(service.getConversation('user-1', 'conv-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 403 when conversation belongs to another user', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: 'other-user',
        messages: [],
      });

      await expect(service.getConversation('user-1', 'conv-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('saveMessage', () => {
    it('assigns incrementing sequence numbers', async () => {
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            message: {
              findFirst: jest.fn().mockResolvedValue({ sequenceNumber: 3 }),
              create: jest.fn().mockResolvedValue({
                id: 'msg-4',
                sequenceNumber: 4,
              }),
            },
            conversation: {
              update: jest.fn().mockResolvedValue({}),
            },
          };
          return fn(tx);
        },
      );

      const message = await service.saveMessage({
        conversationId: 'conv-1',
        role: 'user',
        content: 'Hello',
      });

      expect(message.sequenceNumber).toBe(4);
    });
  });
});
