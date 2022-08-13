import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

@Controller()
export class AppController {
    @Get() root() {
        return this.healthCheck();
    }
    @Get('/health') healthCheck() {
        return { message: 'running' };
    }
    @Get('/dummy-error') dummyError() {
        throw new InternalServerErrorException('You want errors? Here you go!');
    }
}
