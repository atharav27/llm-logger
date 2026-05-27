import { Module } from '@nestjs/common';

import { JwtAuthModule } from 'src/common/auth/jwt-auth.module';
import { IngestModule } from 'src/modules/ingest/ingest.module';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmCatalogController } from './llm/llm-catalog.controller';
import { LlmService } from './llm/llm.service';
import { GeminiProvider } from './llm/providers/gemini.provider';
import { GroqProvider } from './llm/providers/groq.provider';
import { OpenRouterProvider } from './llm/providers/openrouter.provider';

@Module({
  imports: [JwtAuthModule, IngestModule],
  controllers: [ChatController, LlmCatalogController],
  providers: [
    ChatService,
    LlmService,
    GeminiProvider,
    GroqProvider,
    OpenRouterProvider,
  ],
  exports: [ChatService, LlmService],
})
export class ChatModule {}
