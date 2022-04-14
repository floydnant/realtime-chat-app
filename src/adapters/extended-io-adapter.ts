import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io/';
import { Server, ServerOptions } from 'socket.io';

export class ExtendedIoAdapter extends IoAdapter {
    constructor(app: INestApplication, private corsConfig: ServerOptions['cors']) {
        super(app);
    }
    createIOServer(port: number, options: ServerOptions) {
        // console.log(this);
        // if (this.httpServer && port === 0) {
        //     return new Server(this.httpServer, options);
        // }
        // const server = new Server(port, options);
        // console.log(server.engine);
        return super.createIOServer(port, { ...options, cors: this.corsConfig });
    }
}
