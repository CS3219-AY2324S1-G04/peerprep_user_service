/**
 * @file Defines {@link UserProfile}.
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import UserRole from '../enums/user_role';

/** Entity in the database for storing user profiles. */
@Entity({ name: 'user_profile' })
export default class UserProfile {
  /** User ID. */
  @PrimaryGeneratedColumn({ name: 'user_id' })
  public userId: number;

  /** Username. */
  @Column({ name: 'username', type: 'text', unique: true, nullable: false })
  public username: string;

  /** Email address. */
  @Column({
    name: 'email_address',
    type: 'text',
    unique: true,
    nullable: false,
  })
  public emailAddress: string;

  /** User role. */
  @Column({
    name: 'user_role',
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    nullable: false,
    default: UserRole.user,
  })
  public userRole: UserRole;

  public constructor(
    userId: number,
    username: string,
    emailAddress: string,
    userRole: UserRole,
  ) {
    this.userId = userId;
    this.username = username;
    this.emailAddress = emailAddress;
    this.userRole = userRole;
  }
}
