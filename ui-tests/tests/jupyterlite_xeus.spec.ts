import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

test.describe('General Tests', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultTimeout(600000);

    page.on('console', message => {
      console.log('CONSOLE MSG ---', message.text());
    });
  });

  test('Launcher should contain xeus-python and xeus-lua kernels', async ({
    page
  }) => {
    await page.goto('lab/index.html');

    const notebookSection = page.locator('.jp-Launcher-section').first();
    expect(await notebookSection.screenshot()).toMatchSnapshot(
      'jupyter-xeus-launcher.png'
    );
  });

  test('xeus-python should execute some code', async ({ page }) => {
    await page.goto('lab/index.html');

    const xpython = page.locator('[title="Python 3.11 (XPython)"]').first();
    await xpython.click();

    // Wait for kernel to be idle
    await page.locator('#jp-main-statusbar').getByText('Idle').waitFor();

    await page.notebook.addCell('code', 'import bqplot; print("ok")');
    await page.notebook.runCell(1);

    // Wait for kernel to be idle
    await page.locator('#jp-main-statusbar').getByText('Idle').waitFor();

    const cell = await page.notebook.getCellOutput(1);

    expect(await cell?.screenshot()).toMatchSnapshot(
      'jupyter-xeus-execute.png'
    );
  });

  test('the kernel should have access to the file system', async ({ page }) => {
    await page.goto('lab/index.html');

    // Create a Python notebook
    const xpython = page.locator('[title="Python 3.11 (XPython)"]').first();
    await xpython.click();

    await page.notebook.save();

    await page.notebook.setCell(0, 'code', 'import os; os.listdir()');
    await page.notebook.runCell(0);

    const cell = await page.notebook.getCellOutput(0);
    const cellContent = await cell?.textContent();
    const name = 'Untitled.ipynb';
    expect(cellContent).toContain(name);
  });
});
