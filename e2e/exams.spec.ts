import { test, expect } from '@playwright/test'

async function loginAsTeacher(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_TEACHER_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_TEACHER_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 3: exam workflow', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_STUDENT_EMAIL,
      'Missing E2E teacher/student credentials',
    )
  })

  test('teacher creates exam and can open PDF export', async ({ page }) => {
    await loginAsTeacher(page)
    await page.goto('/laerer/prover/ny')

    await page.getByLabel('Tittel').fill(`E2E prøve ${Date.now()}`)
    await page.getByText('R1-01').click()
    await page.getByText('R1-02').click()
    await page.getByRole('button', { name: /generer prøve/i }).click()

    await page.waitForURL(/\/laerer\/prover\/[0-9a-f-]+/i, { timeout: 90_000 })

    const pdfRes = await page.request.get(`${page.url().replace(/\/$/, '')}/../../api/exams/${page.url().split('/').pop()}/pdf?type=exam`)
    expect(pdfRes.ok()).toBeTruthy()
  })

  test('teacher can open scanned upload mapping page', async ({ page }) => {
    await loginAsTeacher(page)
    await page.goto('/laerer/prover/ny')

    await page.getByLabel('Tittel').fill(`E2E retteflyt ${Date.now()}`)
    await page.getByText('R1-03').click()
    await page.getByRole('button', { name: /generer prøve/i }).click()

    await page.waitForURL(/\/laerer\/prover\/[0-9a-f-]+/i, { timeout: 90_000 })
    const examId = page.url().split('/').pop()!

    await page.goto(`/laerer/prover/${examId}/rett`)
    await expect(page.getByText(/last opp|pdf|sider/i).first()).toBeVisible()
  })

  test('student generates practice exam and can download PDF', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/oving-prove')

    await page.getByText('R1-01').click()
    await page.getByRole('button', { name: /generer øvingsprøve/i }).click()

    await expect(page.getByText(/øvingsprøven er klar/i)).toBeVisible({ timeout: 90_000 })

    const pdfLink = page.getByRole('link', { name: /last ned pdf/i })
    await expect(pdfLink).toBeVisible()
  })
})
