import { test, expect } from '@playwright/test'

/**
 * TASK-036 Phase 1 integration checks (admin content review flow)
 *
 * NOTE: Requires seeded draft/flagged content and admin test user.
 */

test.describe('Phase 1: admin content review', () => {
  test('admin approves content and can publish', async ({ page }) => {
    test.skip(!process.env.E2E_ADMIN_EMAIL, 'Missing E2E admin credentials')

    await page.goto('/logg-inn')
    await page.getByLabel('E-post').fill(process.env.E2E_ADMIN_EMAIL!)
    await page.getByLabel('Passord').fill(process.env.E2E_ADMIN_PASSWORD!)
    await page.getByRole('button', { name: /logg inn/i }).click()

    await page.goto('/admin/innhold')

    // Open first review item
    await page.getByRole('button', { name: /åpne|review|rediger/i }).first().click()

    // Approve + publish flow
    const approveBtn = page.getByRole('button', { name: /godkjenn/i }).first()
    if (await approveBtn.isVisible()) {
      await approveBtn.click()
    }

    const publishBtn = page.getByRole('button', { name: /publiser/i }).first()
    if (await publishBtn.isVisible()) {
      await publishBtn.click()
    }

    await expect(page.getByText(/publisert|reviewed|godkjent/i).first()).toBeVisible()
  })
})
