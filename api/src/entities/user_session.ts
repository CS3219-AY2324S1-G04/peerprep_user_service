/**
 * @file Defines {@link UserSession}.
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import UserProfile from './user_profile';

/** Entity in the database for storing user sessions. */
@Entity({ name: 'user_session' })
export default class UserSession {
  /** Session token. */
  @PrimaryColumn({ name: 'token', type: 'char', length: '36' })
  public token: string;

  /** Profile of user who owns the session. */
  @ManyToOne(() => UserProfile, (userProfile) => userProfile.userId, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  public userProfile: UserProfile;

  /** User ID corresponding to {@link userProfile}. */
  @Column({ name: 'user_id', nullable: false })
  public userId: number;

  /** Login time. */
  @CreateDateColumn({ name: 'login_time', nullable: false })
  public loginTime: Date;

  /** Session expiry time. */
  @Column({ name: 'expire_time', nullable: false })
  public expireTime: Date;

  public constructor(
    token: string,
    userProfile: UserProfile,
    loginTime: Date,
    expireTime: Date,
  ) {
    this.token = token;
    this.userProfile = userProfile;
    this.userId = userProfile?.userId;
    this.loginTime = loginTime;
    this.expireTime = expireTime;
  }
}
