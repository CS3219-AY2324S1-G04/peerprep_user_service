/**
 * @file Defines {@link PasswordHash}.
 */
import bcrypt from 'bcrypt';
import Password from './password';

/** Password hash. */
export default class PasswordHash {
  public readonly passwordHash: string;

  public constructor(passwordHash: string) {
    this.passwordHash = passwordHash;
  }

  /**
   * Hashes password {@link password} and produces a password hash.
   * @param password - Password.
   * @param hashCost - Hash cost.
   * @returns Hash of the password.
   */
  public static async hash(
    password: Password,
    hashCost: number,
  ): Promise<PasswordHash> {
    return new PasswordHash(
      await bcrypt.hash(password.toString(), await bcrypt.genSalt(hashCost)),
    );
  }

  /**
   * @param password - Password to check.
   * @returns True if {@link password} matches this hash. Otherwise, returns
   * false.
   */
  public async isMatch(password: Password): Promise<boolean> {
    return await bcrypt.compare(password.toString(), this.passwordHash);
  }

  public toString(): string {
    return this.passwordHash;
  }
}
