import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { LoginCredentialsDTO, SignupCredentialsDTO } from './dto/auth-credetials.dto';
import { GetUser } from './get-user.decorator';
import { UsersService } from './users.service';

@Controller('auth')
export class AuthController {
    constructor(private usersService: UsersService) {}

    private logger = new Logger('AuthController');

    @Post('/signup') signUp(@Body() credentials: SignupCredentialsDTO) {
        this.logger.verbose(`New user signing up: '${credentials.username}'`);
        return this.usersService.signup(credentials);
    }

    @Post('/login') login(@Body() credentials: LoginCredentialsDTO) {
        this.logger.verbose(`User logging in: '${credentials.usernameOrEmail}'`);
        return this.usersService.login(credentials);
    }

    @UseGuards(AuthGuard())
    @Get('/me')
    meQuery(@GetUser() user: User) {
        this.logger.verbose(`meQuery from: '${user.username}'`);
        return this.usersService.me(user);
    }
}
