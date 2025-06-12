import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DelegatesService } from 'src/modules/delegates/delegate.service';
import { DelegateStatus } from 'src/modules/delegates/delegates.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private delegateService: DelegatesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.delegateService.findById(payload.sub);
    console.log(payload);
    if (!user) {
      throw new UnauthorizedException('Delegate not found');
    }
    if (user.status !== DelegateStatus.APPROVED) {
      throw new UnauthorizedException('Delegate account is not approved');
    }
    return user;
  }
}
