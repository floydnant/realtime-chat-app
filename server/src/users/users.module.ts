import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/services/prisma.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FriendshipsController } from './friendships/friendships.controller';
import { ChatPreviewsController } from './chat-previews/chat-previews.controller';
import { ChatPreviewsService } from './chat-previews/chat-previews.service';
import { FriendshipsService } from './friendships/friendships.service';

@Module({
    imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: 60 * 60 * 24 * 31, // one month
                },
            }),
        }),
    ],
    controllers: [AuthController, UsersController, FriendshipsController, ChatPreviewsController],
    providers: [UsersService, PrismaService, JwtStrategy, ChatPreviewsService, FriendshipsService],
    exports: [JwtStrategy, PassportModule, UsersService, JwtModule],
})
export class UsersModule {}
