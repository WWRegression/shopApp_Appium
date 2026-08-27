import { expect } from '@wdio/globals';

type AssertableElement = ReturnType<typeof $>;

export async function assertElementDisplayed(
  element: AssertableElement,
  message?: string
): Promise<void> {
  await expect(element).toBeDisplayed({ message });
}

export async function assertElementTextContains(
  element: AssertableElement,
  expectedText: string
): Promise<void> {
  const text = await element.getText();
  expect(text).toContain(expectedText);
}

export function assertEqual<T>(actual: T, expected: T): void {
  expect(actual).toBe(expected);
}

export async function assertCurrentActivity(
  expectedActivity: string
): Promise<void> {
  const activity = await driver.getCurrentActivity();
  expect(activity).toContain(expectedActivity);
}
