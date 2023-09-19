/**
 * @file Defines {@link HttpInfoError}.
 */

/**
 * {@link Error} to be thrown when there is a need to store a HTTP status code
 * in the {@link Error}.
 */
export default class HttpInfoError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message?: string) {
    super(message);

    this.statusCode = statusCode;
  }
}
