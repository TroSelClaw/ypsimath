import { expect, test } from '@playwright/test'

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 5: wiki video flow', () => {
  test.beforeEach(() => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')
  })

  test('wiki page with video allows playback', async ({ page }) => {
    await loginAsStudent(page)

    // Navigate to a likely published wiki topic.
    // If seed has no ready videos yet, test is skipped.
    await page.goto('/wiki/r1')
    const topicLink = page.locator('a[href^="/wiki/r1/"]').first()
    await expect(topicLink).toBeVisible()
    await topicLink.click()

    const video = page.locator('video')
    if (!(await video.first().isVisible().catch(() => false))) {
      test.skip(true, 'No ready video on current seed/topic')
    }

    await expect(video.first()).toBeVisible()
    const pausedBefore = await video.first().evaluate((el) => (el as HTMLVideoElement).paused)
    expect(pausedBefore).toBeTruthy()

    await video.first().evaluate((el) => {
      const videoEl = el as HTMLVideoElement
      videoEl.muted = true
      void videoEl.play()
    })

    await expect
      .poll(async () => video.first().evaluate((el) => (el as HTMLVideoElement).paused), {
        timeout: 5000,
      })
      .toBeFalsy()
  })
})
