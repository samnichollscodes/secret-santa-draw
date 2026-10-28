import { test as base, expect } from '@playwright/test'

// Every test imports `test` and `expect` from here rather than
// @playwright/test, so these checks apply everywhere.
export const test = base.extend<{ noNativePopups: undefined }>({
  // Native pop-ups (confirm, prompt, alert) are silently answered "Cancel" by
  // some embedded and in-app browsers, so the app must never rely on them.
  // Dismiss any that appear, like those browsers do, and fail the test.
  noNativePopups: [
    async ({ page }, use) => {
      const popups: string[] = []
      page.on('dialog', (dialog) => {
        popups.push(`${dialog.type()}: ${dialog.message()}`)
        void dialog.dismiss()
      })
      await use(undefined)
      expect(popups, 'the app opened a native pop-up').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
