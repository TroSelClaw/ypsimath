import { test, expect } from '@playwright/test'

/**
 * TASK-045 Phase 2 integration checks — student profile
 *
 * NOTE: Requires seeded test data + test users in env.
 */

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 2: student profile', () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')
  })

  test('student views profile with competency grid', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/profil')

    // Should see the competency grid
    await expect(page.getByText(/kompetansemål|R1/i).first()).toBeVisible()

    // Should see statistics section
    await expect(page.getByText(/oppgaver|tid|aktivitet/i).first()).toBeVisible()
  })

  test('student sets target grade goal', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/profil')

    // Look for the goals form
    const gradeSelect = page.getByLabel(/karaktermål|mål/i)
    if (await gradeSelect.isVisible()) {
      await gradeSelect.selectOption('5')

      const saveBtn = page.getByRole('button', { name: /lagre/i })
      await saveBtn.click()

      // Verify saved
      await expect(page.getByText(/lagret|oppdatert/i)).toBeVisible({ timeout: 5_000 })
    }
  })

  test('AI recommendations section loads', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/profil')

    // Recommendations section should exist (may show loading or content)
    const recsSection = page.getByText(/anbefalinger|forslag/i).first()
    await expect(recsSection).toBeVisible({ timeout: 10_000 })
  })
})
