/**
 * @file Defines {@link InvalidParamInfo}.
 */

/** Information on an invalid query or path parameter. */
export default interface InvalidParamInfo {
  readonly field: string;
  readonly message: string;
}
