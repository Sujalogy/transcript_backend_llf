import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // hostedDomain: configService.get<string>('ALLOWED_DOMAIN'), // Restricts to specific domain
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    
    // Verify domain if needed even with hostedDomain option
    const email = emails[0].value;
    const domain = email.split('@')[1];
    const allowedDomain = this.configService.get<string>('ALLOWED_DOMAIN');
    
    // if (domain !== allowedDomain) {
    //   return done(new Error('Unauthorized domain'), null);
    // }

    const user = await this.authService.validateOAuthLogin({
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      googleId: profile.id,
    });

    return done(null, user);
  }
}