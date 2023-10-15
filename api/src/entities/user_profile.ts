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

  /** Email. */
  @Column({ name: 'email', type: 'text', unique: true, nullable: false })
  public email: string;

  /** Role. */
  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    nullable: false,
    default: UserRole.user,
  })
  public role: UserRole;

  public constructor(
    userId: number,
    username: string,
    email: string,
    role: UserRole,
  ) {
    this.userId = userId;
    this.username = username;
    this.email = email;
    this.role = role;
  }
}
