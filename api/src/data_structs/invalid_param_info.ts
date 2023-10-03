/**
 * @file Defines {@link InvalidParamInfo}.
 */

/** Information on an invalid query or path parameter. */
export default interface InvalidParamInfo {
  /** Name of the parameter. */
  readonly param: string;

  /** Message containing the reason for the parameter being invalid. */
  readonly message: string;
}
