import { expect, test } from '@playwright/test'

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 6: accessibility baseline', () => {
  test('pages include skip-to-content and keyboard focus flow', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.getByRole('link', { name: /hopp til hovedinnhold/i })
    await expect(skipLink).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()

    await page.keyboard.press('Enter')
    const main = page.locator('#main-content')
    await expect(main).toBeVisible()
  })

  test('student core pages render with accessible landmarks', async ({ page }) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')

    await loginAsStudent(page)

    for (const route of ['/wiki/r1', '/chat', '/fremgang', '/flashcards']) {
      await page.goto(route)
      await expect(page.locator('main#main-content')).toBeVisible()
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })
})
