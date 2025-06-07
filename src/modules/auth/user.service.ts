import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import { NotificationService } from '../notifications/services/notification.service';
import { SystemLogsService } from '../system-logs/services/system-logs.service';
import { LogSeverity } from '../system-logs/schemas/system-log.schema';
import { Request } from 'express';
import { UserFilterDto } from './dto/filter.dto';
import { error } from 'console';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly systemLogsService: SystemLogsService,
  ) { }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { phoneNumber: createUserDto.phoneNumber },
        { nationalId: createUserDto.nationalId },
      ],
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with provided details already exists',
      );
    }

    const { roles, ...userData } = createUserDto;

    const newUser = new this.userModel({
      ...userData,
      roles: Array.isArray(roles) && roles.length > 0 ? roles : ['employee'],
    });

    const savedUser = await newUser.save();

    return savedUser;
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ token: string; user: User }> {
    const user = await this.userModel.findOne({ email: loginUserDto.email }).select('+password');

    if (!user || !user.password || !(await bcrypt.compare(loginUserDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user };
  }

  async findAll(filterDto: UserFilterDto): Promise<{ users: User[] }> {
    const { status, page = 1, limit = 10 } = filterDto;
    const query = this.userModel.find();
    const users = await query.skip((page - 1) * limit).limit(limit).exec();
    return { users };
  }

  async basicInfo(): Promise<{ users: User[] }> {
    try {
      const users = await this.userModel.find().select('firstName lastName email phoneNumber nationalId').exec();
      return { users };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }
  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string, selectSensitive: boolean = false): Promise<UserDocument | null> {
    let query = this.userModel.findOne({ email });
    if (selectSensitive) {
      query = query.select('+password +resetPasswordPin +resetPasswordExpires');
    }
    const user = await query.exec();
    if (!user) {
      throw new NotFoundException(`Ofgen: User with email ${email} not found`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    req?: Request,
  ): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    );
    if (!updatedUser) throw new NotFoundException('User not found');

    await this.systemLogsService.createLog(
      'User Update',
      `User ${updatedUser.firstName} ${updatedUser.lastName} details updated`,
      LogSeverity.INFO,
      updatedUser.employeeId?.toString(),
      req,
    );

    return updatedUser;
  }

  async remove(id: string, req?: Request): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');

    await this.systemLogsService.createLog(
      'User Deletion',
      `User ${user.firstName} ${user.lastName} was deleted`,
      LogSeverity.WARNING,
      user.employeeId?.toString(),
      req,
    );
  }

  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
    req?: Request,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(updatePasswordDto.userId).select('+password');

    if (!user || !user.password || !(await bcrypt.compare(updatePasswordDto.currentPassword, user.password))) {
      if (user) {
        await this.systemLogsService.createLog(
          'Password Update Failed',
          `Failed password update for user ${user.firstName} ${user.lastName} (Ofgen). Invalid current password.`,
          LogSeverity.WARNING,
          user.employeeId?.toString(),
          req,
        );
      }
      throw new BadRequestException('Invalid current password');
    }

    user.password = updatePasswordDto.newPassword;
    await user.save();

    await this.systemLogsService.createLog(
      'Password Update Successful',
      `Password updated for user ${user.firstName} ${user.lastName} (Ofgen).`,
      LogSeverity.INFO,
      user.employeeId?.toString(),
      req,
    );

    return { message: 'Ofgen: Password updated successfully' };
  }

  async findByNationalId(nationalId: string): Promise<User | null> {
    const user = await this.userModel.findOne({ nationalId }).exec();
    if (!user) {
      throw new NotFoundException(`Ofgen: User with National ID ${nationalId} not found`);
    }
    return user;
  }
}
