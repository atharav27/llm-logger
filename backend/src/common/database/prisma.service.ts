import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const url = configService.get<string>('database.url')?.trim();
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Configure database.url (env DATABASE_URL).',
      );
    }
    // Pass PoolConfig so @prisma/adapter-pg owns the pool (avoids duplicate @types/pg vs root `pg`).
    const adapter = new PrismaPg({ connectionString: url });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}
