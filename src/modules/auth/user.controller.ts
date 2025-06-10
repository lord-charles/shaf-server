import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserFilterDto } from './dto/filter.dto';
import { Request } from 'express';
import { NotificationService } from '../notifications/services/notification.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  // @Roles('admin', 'hr')
  @Get('/users')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all employees',
    description:
      'Returns paginated list of employees. All filters are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully',
  })
  async findAll(@Query() filterDto: UserFilterDto, @Req() req: Request) {
    const { status, page = 1, limit = 10 } = filterDto;
    return this.userService.findAll({
      status,
      page,
      limit,
    });
  }

  @Get('/users/basic-info')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all employees',
    description:
      'Returns paginated list of employees. All filters are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully',
  })
  async basicInfo() {
    return this.userService.basicInfo();
  }

  // Get user by ID - Returns detailed user information
  @Get('/user/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get employee by ID',
    description: 'Returns detailed information about a specific employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee details retrieved successfully',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  // Find user by National ID
  @Get('/user/national-id/:nationalId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find user by National ID',
    description: 'Returns user information based on National ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findByNationalId(
    @Param('nationalId') nationalId: string,
    @Req() req: any,
  ) {
    return this.userService.findByNationalId(nationalId);
  }

  // Update user details
  // @Roles('admin', 'hr')
  @Patch('/user/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update employee details',
    description:
      'Update employee information including personal and employment details',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.userService.update(id, updateUserDto, req);
  }

  // Delete user
  // @Roles('admin')
  @Delete('/user/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete employee',
    description: 'Permanently removes employee from the system',
  })
  @ApiResponse({
    status: 204,
    description: 'Employee deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.userService.remove(id, req);
  }

  @Post('/users/me/push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register Expo push token for the authenticated user',
    description:
      'Saves the Expo push notification token for the currently logged-in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid push token provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async registerPushToken(
    @Req() req: any,
    @Body() registerPushTokenDto: RegisterPushTokenDto,
  ) {
    const userId = req.user.id;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    const result = await this.notificationService.saveUserPushToken(
      userId,
      registerPushTokenDto.token,
    );
    if (!result) {
      return {
        success: false,
        message:
          'Failed to register push token. Invalid token or user not found.',
      };
    }
    return { success: true, message: 'Push token registered successfully.' };
  }
}
