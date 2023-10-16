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
  @PrimaryColumn({ name: 'session_token', type: 'char', length: '36' })
  public sessionToken: string;

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
  @Column({ name: 'session_expiry', nullable: false })
  public sessionExpiry: Date;

  public constructor(
    sessionToken: string,
    userProfile: UserProfile,
    loginTime: Date,
    sessionExpiry: Date,
  ) {
    this.sessionToken = sessionToken;
    this.userProfile = userProfile;
    this.userId = userProfile?.userId;
    this.loginTime = loginTime;
    this.sessionExpiry = sessionExpiry;
  }
}
