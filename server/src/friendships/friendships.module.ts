import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma-abstractions/prisma.module';
import { SocketModule } from 'src/socket/socket.module';
import { UsersModule } from 'src/users/users.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';

@Module({
    imports: [SocketModule, PrismaModule, UsersModule],
    controllers: [FriendshipsController],
    providers: [FriendshipsService],
    exports: [FriendshipsService],
})
export class FriendshipsModule {}
