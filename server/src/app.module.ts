import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { configValidationSchema } from './config.schema';
import { PrismaService } from './services/prisma.service';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [`.env`, `.env.${process.env.STAGE}`],
            validationSchema: configValidationSchema,
        }),
        ChatModule,
        UsersModule,
    ],
    controllers: [],
    providers: [PrismaService],
    exports: [ConfigModule],
})
export class AppModule {}
