import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { BYPASS_KEY } from 'src/decorators/bypass-auth.decorator';

@Injectable()
export class AuthGuardExtended extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }
    canActivate(context: ExecutionContext) {
        return this.shouldBypassAuth(context, this.reflector) || super.canActivate(context);
    }

    private shouldBypassAuth(context: ExecutionContext, reflector: Reflector) {
        return reflector.get<boolean>(BYPASS_KEY, context.getHandler());
    }
}
