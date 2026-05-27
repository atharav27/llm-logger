import { Module } from '@nestjs/common';

import { CommonModule } from 'src/common/common.module';
import { AnalyticsModule } from 'src/modules/analytics/analytics.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ChatModule } from 'src/modules/chat/chat.module';

@Module({
  imports: [CommonModule, AuthModule, ChatModule, AnalyticsModule],
})
export class AppModule {}
