import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  googleId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateOAuthLogin(googleUser: GoogleUser): Promise<User> {
    const user = await this.usersService.findOrCreateUser(googleUser);
    return user;
  }

  async login(user: User) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async validateUser(userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }
}