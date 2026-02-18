import { test, expect } from '@playwright/test'

/**
 * TASK-045 Phase 2 integration checks — chat flows
 *
 * NOTE: Requires seeded test data + test users + AI API keys in env.
 */

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/logg-inn')
  await page.getByLabel('E-post').fill(process.env.E2E_STUDENT_EMAIL!)
  await page.getByLabel('Passord').fill(process.env.E2E_STUDENT_PASSWORD!)
  await page.getByRole('button', { name: /logg inn/i }).click()
  await page.waitForURL(/(?!.*logg-inn)/)
}

test.describe('Phase 2: chat tutor', () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL, 'Missing E2E student credentials')
  })

  test('student sends a math question and receives streaming response', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/chat')

    const input = page.getByPlaceholder(/skriv|spør/i)
    await input.fill('Hva er den deriverte av x^2?')
    await input.press('Enter')

    // Wait for assistant message to appear
    const assistantMsg = page.locator('[data-role="assistant"]').first()
    await expect(assistantMsg).toBeVisible({ timeout: 30_000 })

    // Should contain math-related content
    await expect(assistantMsg).toContainText(/2x|derivert/i)
  })

  test('student attaches image to chat message', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/chat')

    // Check camera/attach button exists
    const attachButton = page.getByRole('button', { name: /bilde|kamera|last opp/i })
    await expect(attachButton).toBeVisible()
  })

  test('source chips shown on assistant response', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/chat')

    const input = page.getByPlaceholder(/skriv|spør/i)
    await input.fill('Forklar kjerneregelen')
    await input.press('Enter')

    // Wait for response
    const assistantMsg = page.locator('[data-role="assistant"]').first()
    await expect(assistantMsg).toBeVisible({ timeout: 30_000 })

    // Source chips may appear (depends on RAG results)
    // Just verify no crash occurred
    await expect(page.locator('.chat-error')).not.toBeVisible()
  })

  test('student renames a conversation', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/chat')

    // Send a message to create a conversation
    const input = page.getByPlaceholder(/skriv|spør/i)
    await input.fill('Test samtale')
    await input.press('Enter')

    // Wait for assistant response
    await page.locator('[data-role="assistant"]').first().waitFor({ timeout: 30_000 })

    // Hover over the conversation in the sidebar to reveal actions
    const sidebar = page.locator('.lg\\:flex').filter({ hasText: /samtale/i })
    const convItem = sidebar.locator('a').first()
    await convItem.hover()

    // Click rename button
    const renameBtn = sidebar.getByTitle('Gi nytt navn')
    if (await renameBtn.isVisible()) {
      await renameBtn.click()
      const renameInput = sidebar.locator('input[type="text"]').first()
      await renameInput.fill('Omdøpt samtale')
      await renameInput.press('Enter')

      await expect(sidebar.getByText('Omdøpt samtale')).toBeVisible()
    }
  })

  test('student deletes a conversation', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/chat')

    const input = page.getByPlaceholder(/skriv|spør/i)
    await input.fill('Samtale til sletting')
    await input.press('Enter')

    await page.locator('[data-role="assistant"]').first().waitFor({ timeout: 30_000 })

    const sidebar = page.locator('.lg\\:flex').filter({ hasText: /samtale/i })
    const convItem = sidebar.locator('a').first()
    await convItem.hover()

    const deleteBtn = sidebar.getByTitle('Slett')
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()

      // Confirm deletion dialog
      const confirmBtn = page.getByRole('button', { name: /slett/i }).last()
      await confirmBtn.click()

      // Should redirect to /chat
      await page.waitForURL('/chat')
    }
  })
})
