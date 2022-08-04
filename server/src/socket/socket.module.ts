import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SocketManagerService } from './socket-manager.service';
import { SocketGateway } from './socket.gateway';

@Module({
    imports: [UsersModule],
    providers: [SocketGateway, SocketManagerService],
    exports: [SocketManagerService],
})
export class SocketModule {}
