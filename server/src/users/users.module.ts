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
    controllers: [AuthController, UsersController, FriendshipsController],
    providers: [UsersService, PrismaService, JwtStrategy],
    exports: [JwtStrategy, PassportModule, UsersService, JwtModule],
})
export class UsersModule {}
