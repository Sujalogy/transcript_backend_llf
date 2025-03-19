import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  googleId: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreateUser(googleUser: GoogleUser): Promise<User> {
    let user = await this.usersRepository.findOne({ 
      where: { email: googleUser.email } 
    });

    if (!user) {
      user = this.usersRepository.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        profilePicture: googleUser.picture,
        googleId: googleUser.googleId,
      });
      await this.usersRepository.save(user);
    } else {
      // Update existing user with latest information
      user.firstName = googleUser.firstName;
      user.lastName = googleUser.lastName;
      user.profilePicture = googleUser.picture;
      user.googleId = googleUser.googleId;
      await this.usersRepository.save(user);
    }

    return user;
  }

  async findById(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }
}