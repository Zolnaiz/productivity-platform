import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { DatabaseModule } from '../shared/database/database.module';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationsService } from '../organizations/organizations.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, Organization]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, OrganizationsService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
