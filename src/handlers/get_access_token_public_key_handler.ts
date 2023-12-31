/**
 * @file Defines {@link GetAccessTokenPublicKeyHandler}.
 */
import express from 'express';

import Handler, { HttpMethod } from './handler';

/**
 * Handles REST API requests for getting the public key for verifying access
 * tokens.
 */
export default class GetAccessTokenPublicKeyHandler extends Handler {
  private readonly _accessTokenPublicKey: string;

  /**
   * @param accessTokenPublicKey - Public key for verifying access tokens.
   */
  public constructor(accessTokenPublicKey: string) {
    super();
    this._accessTokenPublicKey = accessTokenPublicKey;
  }

  /** @inheritdoc */
  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  /** @inheritdoc */
  public override get subPath(): string {
    return 'access-token-public-key';
  }

  /**
   * Gets the public key for verifying access tokens. Sends a HTTP 200 response
   * whose body is the public key.
   * @param req - Information about the request.
   * @param res - For creating and sending the response.
   * @throws {HttpErrorInfo} Error 500 if an unexpected error occurs.
   */
  public override async handleLogic(
    req: express.Request,
    res: express.Response,
  ): Promise<void> {
    res.status(200).send(this._accessTokenPublicKey);
  }
}
