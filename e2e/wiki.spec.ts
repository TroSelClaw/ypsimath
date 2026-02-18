import { test, expect } from '@playwright/test'

/**
 * TASK-036 Phase 1 integration checks (student flows)
 *
 * NOTE: Requires seeded test data + test users in Supabase.
 */

test.describe('Phase 1: wiki + student interactions', () => {
  test('student opens wiki topic and sees core blocks', async ({ page }) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')

    await page.goto('/logg-inn')
    await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
    await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
    await page.getByRole('button', { name: /logg inn/i }).click()

    await page.goto('/wiki/r1/derivasjon')

    await expect(page.getByText(/teori|regel|eksempel/i).first()).toBeVisible()
  })

  test('student exercise interaction flow', async ({ page }) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')

    await page.goto('/logg-inn')
    await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
    await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
    await page.getByRole('button', { name: /logg inn/i }).click()

    await page.goto('/wiki/r1/derivasjon')

    await page.getByRole('button', { name: /vis hint/i }).first().click()
    await page.getByRole('button', { name: /vis fasit/i }).first().click()
    await page.getByRole('button', { name: /fikk til/i }).first().click()

    await expect(page.getByText(/registrert|lagret|fikk til/i).first()).toBeVisible()
  })

  test('student can navigate from planet map to wiki topic', async ({ page }) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')

    await page.goto('/logg-inn')
    await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
    await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
    await page.getByRole('button', { name: /logg inn/i }).click()

    await page.goto('/fremgang')
    await page.getByRole('link', { name: /tema|planet/i }).first().click()

    await expect(page).toHaveURL(/\/wiki\/r1\//)
  })
})
