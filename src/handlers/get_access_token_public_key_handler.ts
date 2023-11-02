/**
 * @file Defines {@link GetAccessTokenPublicKeyHandler}.
 */
import express from 'express';

import Handler, { HttpMethod } from './handler';

/** Handles getting the public key for verifying access tokens. */
export default class GetAccessTokenPublicKeyHandler extends Handler {
  private readonly _accessTokenPublicKey: string;

  public constructor(accessTokenPublicKey: string) {
    super();
    this._accessTokenPublicKey = accessTokenPublicKey;
  }

  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

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
