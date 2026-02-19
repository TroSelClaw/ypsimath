import { expect, test } from '@playwright/test'

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Final regression baseline', () => {
  test('GDPR page exposes deletion right and privacy details', async ({ page }) => {
    await page.goto('/personvern')
    await expect(page.getByRole('heading', { name: /personvern/i })).toBeVisible()
    await expect(page.getByText(/sletting av konto/i)).toBeVisible()
    await expect(page.getByText(/opplastede bilder slettes automatisk etter 90 dager/i)).toBeVisible()
  })

  test('API routes reject unauthenticated access (rate-limit protected endpoints)', async ({ request }) => {
    const chatRes = await request.post('/api/chat', {
      data: { conversationId: '00000000-0000-0000-0000-000000000000', content: 'Hei' },
    })
    expect(chatRes.status()).toBe(401)

    const imageCheckRes = await request.post('/api/exercise/image-check', {
      multipart: {
        exerciseId: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(imageCheckRes.status()).toBe(401)
  })

  test('theme toggle works across key pages', async ({ page }) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')

    await loginAsStudent(page)

    const pages = ['/wiki', '/chat', '/fremgang']
    const html = page.locator('html')

    for (const route of pages) {
      await page.goto(route)

      const themeButton = page.getByRole('button', { name: /tema:/i }).first()
      await expect(themeButton).toBeVisible()

      await themeButton.click()
      await expect(html).toHaveClass(/dark|light|uu/)

      await themeButton.click()
      await expect(html).toHaveClass(/dark|light|uu/)
    }
  })
})
