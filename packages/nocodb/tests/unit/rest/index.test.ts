import 'mocha';
import authTests from './tests/auth.test';
import orgTests from './tests/org.test';
import projectTests from './tests/project.test';
import columnTypeSpecificTests from './tests/columnTypeSpecific.test';
import tableTests from './tests/table.test';
import tableRowTests from './tests/tableRow.test';
import viewRowTests from './tests/viewRow.test';
import apiTokenTests from './tests/apiToken.test';
import attachmentTests from './tests/attachment.test';
import auditTests from './tests/audit.test';
import columnTests from './tests/column.test';
import ProjectUserTests from './tests/projectUser.test';
import PluginTests from './tests/plugin.test';
import ViewTests from './tests/view.test';
import ViewColumnTests from './tests/viewColumn.test';
import FormViewTests from './tests/formview.test';
import GalleryViewTests from './tests/galleryView.test';
import GridViewTests from './tests/gridView.test';
import KanbanViewTests from './tests/kanbanView.test';
import SortTests from './tests/sort.test';
import FilterTests from './tests/filter.test';
import chai from 'chai';
chai.use(require('chai-subset'));

function restTests() {
  authTests();
  orgTests();
  projectTests();
  tableTests();
  tableRowTests();
  viewRowTests();
  columnTypeSpecificTests();
  apiTokenTests();
  attachmentTests();
  auditTests();
  columnTests();
  ProjectUserTests();
  PluginTests();
  ViewTests();
  ViewColumnTests();
  FormViewTests();
  GalleryViewTests();
  GridViewTests();
  KanbanViewTests();
  SortTests();
  FilterTests();
}

export default function () {
  describe('Rest', restTests);
}
