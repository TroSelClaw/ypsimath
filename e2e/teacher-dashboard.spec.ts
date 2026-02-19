import { expect, test } from '@playwright/test'

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(email)
  await page.getByLabel('Passord').fill(password)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 4: teacher dashboard', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_TEACHER_EMAIL ||
        !process.env.E2E_TEACHER_PASSWORD ||
        !process.env.E2E_ADMIN_EMAIL ||
        !process.env.E2E_ADMIN_PASSWORD ||
        !process.env.E2E_STUDENT_EMAIL,
      'Missing E2E credentials for teacher/admin/student',
    )
  })

  test('teacher opens heatmap and navigates to student detail', async ({ page }) => {
    await login(page, process.env.E2E_TEACHER_EMAIL!, process.env.E2E_TEACHER_PASSWORD!)
    await page.goto('/laerer')

    const studentLink = page.getByRole('link', { name: /åpne elev/i }).first()
    await expect(studentLink).toBeVisible()
    await studentLink.click()

    await expect(page).toHaveURL(/\/laerer\/elev\/[0-9a-f-]+/i)
    await expect(page.getByText(/elevprofil|aktivitet siste 30 dager/i).first()).toBeVisible()
  })

  test('teacher note persists after reload', async ({ page }) => {
    await login(page, process.env.E2E_TEACHER_EMAIL!, process.env.E2E_TEACHER_PASSWORD!)
    await page.goto('/laerer')

    await page.getByRole('link', { name: /åpne elev/i }).first().click()

    const note = `E2E note ${Date.now()}`
    const textarea = page.getByPlaceholder(/skriv notater om elevens progresjon/i)
    await textarea.fill(note)
    await textarea.blur()

    await page.reload()
    await expect(textarea).toHaveValue(note)
  })

  test('teacher generates assessment report and can edit', async ({ page }) => {
    await login(page, process.env.E2E_TEACHER_EMAIL!, process.env.E2E_TEACHER_PASSWORD!)
    await page.goto('/laerer')

    await page.getByRole('link', { name: /åpne elev/i }).first().click()

    await page.getByRole('button', { name: /generer vurderingsrapport/i }).click()
    await expect(page.getByText(/ai-generert utkast/i)).toBeVisible({ timeout: 90_000 })

    const reportArea = page.getByRole('textbox', { name: /vurderingsrapport/i })
    await reportArea.fill('AI-generert utkast. Manuelt redigert i e2e-test.')
    await page.getByRole('button', { name: /lagre rapport/i }).click()

    await expect(page.getByText(/rapport lagret/i)).toBeVisible()
  })

  test('admin can change user role from user admin panel', async ({ page }) => {
    await login(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!)
    await page.goto('/admin/brukere')

    const row = page.getByRole('row').filter({ hasText: process.env.E2E_STUDENT_EMAIL! }).first()
    await expect(row).toBeVisible()

    await row.locator('select[name="role"]').selectOption('teacher')
    await row.getByRole('button', { name: /lagre/i }).click()

    await page.reload()
    await expect(row.locator('select[name="role"]')).toHaveValue('teacher')

    // restore baseline role to avoid side effects between runs
    await row.locator('select[name="role"]').selectOption('student')
    await row.getByRole('button', { name: /lagre/i }).click()
  })
})
