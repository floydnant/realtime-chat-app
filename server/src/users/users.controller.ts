import { Body, Controller, Delete, Logger, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { UpdatePasswordDTO, UpdateUserDTO } from './dto/update-user.dto';
import { GetUser } from './get-user.decorator';
import { UsersService } from './users.service';

@UseGuards(AuthGuard())
@Controller('user')
export class UsersController {
    constructor(private usersService: UsersService) {}

    private logger = new Logger('AuthController');

    @Patch()
    updateUser(@GetUser() user: User, @Body() updateUserDTO: UpdateUserDTO) {
        this.logger.verbose(`${user.username} wants to change ${Object.keys(updateUserDTO).join(', ')}`);
        return this.usersService.updateUser(user, updateUserDTO);
    }

    @Patch('/password')
    updatePassword(@GetUser() user: User, @Body() updatePasswordDTO: UpdatePasswordDTO) {
        this.logger.verbose(`${user.username} wants to change the password`);
        return this.usersService.updatePassword(user, updatePasswordDTO);
    }

    @Delete()
    deleteUser(@GetUser() user: User, @Body() { password }: { password: string }) {
        this.logger.verbose(`deleting user '${user.username}'`);
        return this.usersService.deleteUser(user, password);
    }
}
