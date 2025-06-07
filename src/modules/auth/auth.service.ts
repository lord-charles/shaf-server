import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { LoginUserDto } from './dto/login.dto';
import {
  RequestPasswordResetDto,
  ConfirmPasswordResetDto,
} from './dto/reset-password.dto';
import {
  JwtPayload,
  AuthResponse,
  TokenPayload,
} from './interfaces/auth.interface';
import { User, UserDocument } from './schemas/user.schema';
import { SystemLogsService } from '../system-logs/services/system-logs.service';
import { LogSeverity } from '../system-logs/schemas/system-log.schema';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notifications/services/notification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly systemLogsService: SystemLogsService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
    req?: Request,
  ): Promise<AuthResponse> {
    try {
      const user = await this.userService.register(createUserDto);

      const token = await this.generateToken(user);

      await this.systemLogsService.createLog(
        'User Registration',
        `New user registered: ${user.firstName} ${user.lastName} (${user.email})`,
        LogSeverity.INFO,
        user.employeeId.toString(),
        req,
      );

      return {
        user: this.sanitizeUser(user),
        token: token.token,
      };
    } catch (error) {
      await this.systemLogsService.createLog(
        'Registration Failed',
        `Registration failed for email ${createUserDto.email}: ${error.message}`,
        LogSeverity.ERROR,
        undefined,
        req,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(
    loginUserDto: LoginUserDto,
    req?: Request,
  ): Promise<AuthResponse> {
    try {
      const user = await this.userService.findByEmail(loginUserDto.email, true);

      if (!user) {
        await this.systemLogsService.createLog(
          'Ofgen Login Failed',
          `User not found with email: ${loginUserDto.email}`,
          LogSeverity.WARNING,
          undefined,
          req,
        );
        throw new UnauthorizedException(
          'Ofgen: Invalid credentials or user not found.',
        );
      }

      if (user.status !== 'active') {
        await this.systemLogsService.createLog(
          'Inactive Account Login',
          `Login attempt on inactive account: ${user.firstName} ${user.lastName}`,
          LogSeverity.WARNING,
          user.employeeId.toString(),
          req,
        );
        throw new UnauthorizedException('Account is not active');
      }

      if (!user.password) {
        await this.systemLogsService.createLog(
          'Ofgen Login Error',
          `Password field not loaded for user: ${user.email}`,
          LogSeverity.ERROR,
          user.employeeId?.toString(),
          req,
        );
        throw new UnauthorizedException('Ofgen: Authentication process error.');
      }
      const isValidPassword = await bcrypt.compare(
        loginUserDto.password,
        user.password,
      );
      if (!isValidPassword) {
        await this.systemLogsService.createLog(
          'Ofgen Invalid Password',
          `Invalid password for user: ${user.firstName} ${user.lastName} (${user.email})`,
          LogSeverity.WARNING,
          user.employeeId?.toString(),
          req,
        );
        throw new UnauthorizedException('Ofgen: Invalid credentials.');
      }

      const token = await this.generateToken(user);

      await this.systemLogsService.createLog(
        'Ofgen User Login',
        `User ${user.firstName} ${user.lastName} (${user.email}) logged in successfully for Ofgen.`,
        LogSeverity.INFO,
        user.employeeId?.toString(),
        req,
      );

      return {
        user: this.sanitizeUser(user),
        token: token.token,
      };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        await this.systemLogsService.createLog(
          'Login Error',
          `Unexpected error during login: ${error.message}`,
          LogSeverity.ERROR,
          undefined,
          req,
        );
      }
      throw error;
    }
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
    req?: Request,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userService.findByEmail(
        requestPasswordResetDto.email,
      );
      if (!user) {
        await this.systemLogsService.createLog(
          'Ofgen Password Reset Request Failed',
          `Password reset attempt for non-existent email: ${requestPasswordResetDto.email}`,
          LogSeverity.WARNING,
          undefined,
          req,
        );
        return {
          message:
            'Ofgen: If your email is registered, you will receive a password reset PIN.',
        };
      }

      const resetPin = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // PIN expires in 10 minutes

      user.resetPasswordPin = resetPin;
      user.resetPasswordExpires = expiryDate;
      await (user as UserDocument).save();

      const resetMessage = `Your Ofgen password reset PIN is: ${resetPin}. This PIN will expire in 10 minutes. Please keep this PIN secure and do not share it with anyone.`;
      await this.notificationService.sendRegistrationPassword(
        user.phoneNumber,
        user.email,
        resetMessage,
      );

      await this.systemLogsService.createLog(
        'Ofgen Password Reset Requested',
        `Password reset PIN generated for user: ${user.firstName} ${user.lastName} (${user.email})`,
        LogSeverity.INFO,
        user.employeeId?.toString(),
        req,
      );

      return {
        message:
          'Ofgen: If your email is registered, you will receive a password reset PIN.',
      };
    } catch (error) {
      await this.systemLogsService.createLog(
        'Ofgen Password Reset Request Error',
        `Error during password reset request for ${requestPasswordResetDto.email}: ${error.message}`,
        LogSeverity.ERROR,
        undefined,
        req,
      );
      throw new BadRequestException(
        'Ofgen: Could not process password reset request. Please try again later.',
      );
    }
  }

  async confirmPasswordReset(
    confirmPasswordResetDto: ConfirmPasswordResetDto,
    req?: Request,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userService.findByEmail(
        confirmPasswordResetDto.email,
        true,
      );

      if (!user || !user.resetPasswordPin || !user.resetPasswordExpires) {
        throw new BadRequestException(
          'Ofgen: Invalid or expired password reset PIN.',
        );
      }

      if (user.resetPasswordExpires < new Date()) {
        await this.systemLogsService.createLog(
          'Ofgen Password Reset PIN Expired',
          `Expired PIN used for ${user.email}`,
          LogSeverity.WARNING,
          user.employeeId?.toString(),
          req,
        );
        throw new BadRequestException('Ofgen: Password reset PIN has expired.');
      }

      if (user.resetPasswordPin !== confirmPasswordResetDto.resetToken) {
        throw new BadRequestException('Ofgen: Invalid password reset PIN.');
      }

      user.password = confirmPasswordResetDto.newPassword;
      user.resetPasswordPin = undefined;
      user.resetPasswordExpires = undefined;
      await (user as UserDocument).save();

      await this.systemLogsService.createLog(
        'Ofgen Password Reset Confirmed',
        `Password successfully reset for user: ${user.firstName} ${user.lastName} (${user.email})`,
        LogSeverity.INFO,
        user.employeeId?.toString(),
        req,
      );

      return { message: 'Ofgen: Your password has been successfully reset.' };
    } catch (error) {
      await this.systemLogsService.createLog(
        'Ofgen Password Reset Confirmation Failed',
        `Error confirming password reset for ${confirmPasswordResetDto.email}: ${error.message}`,
        LogSeverity.ERROR,
        undefined,
        req,
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'Ofgen: Could not reset password. Please try again.',
      );
    }
  }

  private async generateToken(user: User): Promise<TokenPayload> {
    const payload: JwtPayload = {
      sub: (user as UserDocument)._id.toString(),
      email: user.email,
      roles: user.roles,
    };

    // For 1 year: 365 days * 24 hours * 60 minutes * 60 seconds
    const token = this.jwtService.sign(payload, {
      expiresIn: 365 * 24 * 60 * 60,
    });

    return {
      token,
      expiresIn: 365 * 24 * 60 * 60,
    };
  }

  /**
   * Remove sensitive information from user object
   */
  sanitizeUser(user: User | UserDocument): Partial<User> {
    const userObj = 'toObject' in user ? user.toObject() : user;
    // Ensure all sensitive fields are excluded
    const {
      password,
      pin,
      resetPasswordPin,
      resetPasswordExpires,
      ...sanitizedUser
    } = userObj as any;
    return sanitizedUser;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Ofgen: User not found');
    }
    return this.sanitizeUser(user);
  }
}
