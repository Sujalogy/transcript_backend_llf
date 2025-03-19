import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // The guard will handle the redirect
    return { msg: 'Google Authentication' };
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(@Req() req, @Res() res: Response) {
    const { accessToken } = await this.authService.login(req.user);

    // Set JWT as HTTP-only cookie
    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: true, // Set to true even in development when using ngrok
      sameSite: 'none', // Required for cross-domain cookies with ngrok
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    // res.header('Access-Control-Allow-Credentials', 'true');

    // Redirect to frontend
    res.redirect(this.configService.get('FRONTEND_URL'));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: User) {
    return user;
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard) // Protect logout route
  logout(@Res() res: Response) {
    // Clear the auth cookie with the same settings used to create it
    res.cookie('auth_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0, // Expire immediately
    });
  
    // Clear the cookie normally as well
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  
    return res.status(HttpStatus.OK).json({ 
      message: 'Logged out successfully',
      success: true 
    });
  }
}
