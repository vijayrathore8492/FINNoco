import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/Dashboard';
import { GridPage } from '../pages/Dashboard/Grid';
import setup from '../setup';

test.describe('Visibility rules', () => {
  let dashboard: DashboardPage, grid: GridPage;
  let context: any;

  test.beforeEach(async ({ page }) => {
    context = await setup({ page });
    dashboard = new DashboardPage(page, context.project);
    grid = dashboard.grid;

    await dashboard.treeView.createTable({ title: 'sheet1' });
  });

  test('Set visibility rules', async () => {
    await grid.column.create({
      title: 'SingleLineTextTest',
      type: 'SingleLineText',
      visibilityRules: { editor: 'deny' },
    });

    await dashboard.grid.addNewRow({
      index: 0,
      columnHeader: 'SingleLineTextTest',
      value: 'Row 0',
      networkValidation: false,
    });

    const cell = dashboard.grid.cell.get({ index: 0, columnHeader: 'SingleLineTextTest' });

    await expect(cell).toHaveText('Row 0');

    await dashboard.grid.projectMenu.toggle();
    await dashboard.grid.projectMenu.click({
      menu: 'Preview as',
      subMenu: 'editor',
    });

    // wait for preview mode to be enabled
    await dashboard.rootPage.locator('.nc-preview-btn-exit-to-app').waitFor();

    await dashboard.validateProjectMenu({
      role: 'editor',
    });

    await expect(cell).toHaveText('');
    await cell.hover();
    await expect(dashboard.rootPage.getByTestId('no-access-to-column-message')).toBeVisible();
  });
});
