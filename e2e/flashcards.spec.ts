import { expect, test } from '@playwright/test'

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 5: flashcard flow', () => {
  test.beforeEach(() => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')
  })

  test('student can open flashcards and rate a card', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/flashcards')

    const doneCard = page.getByText(/kom tilbake i morgen/i)
    if (await doneCard.isVisible()) {
      test.skip(true, 'No due/new cards available in seed data')
    }

    await expect(page.getByText(/fremdrift/i)).toBeVisible()

    await page.keyboard.press('Space')

    const forgotButton = page.getByRole('button', { name: /glemte/i })
    await expect(forgotButton).toBeVisible()
    await forgotButton.click()

    await expect(page.getByText(/fremdrift/i)).toBeVisible()
  })

  test('mobile swipe-like gesture marks card as forgot', async ({ page }) => {
    await loginAsStudent(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/flashcards')

    const doneCard = page.getByText(/kom tilbake i morgen/i)
    if (await doneCard.isVisible()) {
      test.skip(true, 'No due/new cards available in seed data')
    }

    const card = page.locator('[role="button"]').first()
    await expect(card).toBeVisible()

    const box = await card.boundingBox()
    if (!box) test.skip(true, 'Card bounding box unavailable')

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2 - 160, box!.y + box!.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect(page.getByText(/fremdrift/i)).toBeVisible()
  })
})
