/**
 * @file Defines {@link UserCredential}.
 */
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import UserProfile from './user_profile';

/** Entity in the database for storing user credentials. */
@Entity({ name: 'user_credential' })
export default class UserCredential {
  /** Profile of user who owns the credential. */
  @OneToOne(() => UserProfile, (userProfile) => userProfile.userId, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  public userProfile: UserProfile;

  /** User ID corresponding to {@link userProfile}. */
  @PrimaryColumn({ name: 'user_id' })
  public userId: number;

  /** Password hash. */
  @Column({ name: 'password_hash', type: 'char', length: 60, nullable: false })
  public passwordHash: string;

  public constructor(userProfile: UserProfile, passwordHash: string) {
    this.userProfile = userProfile;
    this.userId = userProfile?.userId;
    this.passwordHash = passwordHash;
  }
}
