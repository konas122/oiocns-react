export class AssertResult<A = unknown> {
  success = true;
  message = '校验成功';
  readonly expected: A;
  readonly actual: A;

  private constructor(expected: A, actual: A) {
    this.expected = expected;
    this.actual = actual;
  }

  static success<A>(expected: A, actual: A): AssertResult<A> {
    return new AssertResult<A>(expected, actual);
  }

  static fail<A>(expected: A, actual: A): AssertResult<A> {
    const ret = new AssertResult<A>(expected, actual);
    ret.success = false;
    ret.message =
      `\n  期待值: ${JSON.stringify(expected, null, 2)}` +
      `\n  实际值: ${JSON.stringify(actual, null, 2)}`;
    return ret;
  }
}

export function predicate<A>(
  result: boolean,
  expected: A,
  actual: A,
): AssertResult<A> {
  if (result) {
    return AssertResult.success(expected, actual);
  } else {
    return AssertResult.fail(expected, actual);
  }
}
