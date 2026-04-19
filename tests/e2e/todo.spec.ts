import { test, expect } from '@playwright/test';

const unique = (label: string) => `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

test('shows heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Todos' })).toBeVisible();
});

test('creates a todo', async ({ page }) => {
  const title = unique('create');
  await page.goto('/');
  await page.getByLabel('New todo').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText(title)).toBeVisible();
});

test('toggles a todo', async ({ page }) => {
  const title = unique('toggle');
  await page.goto('/');
  await page.getByLabel('New todo').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();

  const checkbox = page.getByRole('checkbox', { name: new RegExp(title) });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
});

test('edits a todo', async ({ page }) => {
  const title = unique('edit');
  const next = unique('edited');
  await page.goto('/');
  await page.getByLabel('New todo').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByRole('button', { name: new RegExp(`Edit "${title}"`) }).click();
  const field = page.getByLabel(new RegExp(`Edit todo "${title}"`));
  await field.fill(next);
  await field.press('Enter');
  await expect(page.getByText(next)).toBeVisible();
});

test('deletes a todo', async ({ page }) => {
  const title = unique('delete');
  await page.goto('/');
  await page.getByLabel('New todo').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('button', { name: new RegExp(`Delete "${title}"`) }).click();
  await expect(page.getByText(title)).not.toBeVisible();
});

test('persists across reload', async ({ page }) => {
  const title = unique('persist');
  await page.goto('/');
  await page.getByLabel('New todo').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test('shows error on empty submit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('alert')).toContainText(/enter a todo/i);
});
