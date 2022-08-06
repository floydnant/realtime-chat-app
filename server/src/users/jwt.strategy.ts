import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';
import { PrismaService } from 'src/prisma-abstractions/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prismaService: PrismaService, private configService: ConfigService) {
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate({ id }: JwtPayload) {
        const user = await this.prismaService.user.findUnique({ where: { id } });

        if (!user) throw new UnauthorizedException();

        return user;
    }
}
