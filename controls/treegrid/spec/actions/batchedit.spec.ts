import { TreeGrid } from '../../src/treegrid/base/treegrid';
import { createGrid, destroy } from '../base/treegridutil.spec';
import { sampleData, projectData } from '../base/datasource.spec';
import { Edit } from '../../src/treegrid/actions/edit';
import { Toolbar } from '../../src/treegrid/actions/toolbar';
import { profile, inMB, getMemoryProfile } from '../common.spec';
import { Sort } from '../../src/treegrid/actions/sort';
import { Filter } from '../../src/treegrid/actions/filter';
import { isNullOrUndefined } from '@syncfusion/ej2-base';

/**
 * Grid Batch Edit spec 
 */
TreeGrid.Inject(Edit, Toolbar, Sort, Filter);
describe('Batch Edit module', () => {
  beforeAll(() => {
    const isDef = (o: any) => o !== undefined && o !== null;
    if (!isDef(window.performance)) {
      console.log("Unsupported environment, window.performance.memory is unavailable");
      this.skip(); //Skips test (in Chai)
      return;
    }
  });

  describe('Hierarchy - Batch Add', () => {
    let gridObj: TreeGrid;
    let actionComplete: () => void;
    beforeAll((done: Function) => {
      gridObj = createGrid(
        {
          dataSource: sampleData,
          childMapping: 'subtasks',
          editSettings: { allowEditing: true, allowDeleting: true, allowAdding: true, mode: "Batch" },
          allowSorting: true,
          allowFiltering: true,
          treeColumnIndex: 1,
          toolbar: ['Add', 'Update', 'Delete', 'Cancel'],
          columns: [{ field: 'taskID', headerText: 'Task ID', isPrimaryKey: true },
          { field: 'taskName', headerText: 'Task Name' },
          { field: 'progress', headerText: 'Progress' },
          { field: 'startDate', headerText: 'Start Date' }
          ]
        },
        done
      );
    });
    it('Add - Batch Editing', (done: Function) => {
      actionComplete = (args?: Object): void => {
        if (args['requestType'] == "batchSave" ) {
          expect(gridObj.dataSource[3].taskID === 41).toBe(true);
        }
         done();
      }
      let addedRecords = 'addedRecords';
      gridObj.grid.actionComplete = actionComplete;
      (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_add' } });
      expect(gridObj.getRowByIndex(0).classList.contains('e-insertedrow')).toBe(true);
      (gridObj.element.querySelector('.e-editedbatchcell').querySelector('input') as any).value = 41;
      expect(gridObj.getBatchChanges()[addedRecords].length === 1).toBe(true);
      (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
      gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
    });
    afterAll(() => {
      destroy(gridObj);
    });
  });


  describe('Hirarchy editing - Batch Mode', () => {
    let gridObj: TreeGrid;
    beforeAll((done: Function) => {
      gridObj = createGrid(
        {
            dataSource: sampleData,
            childMapping: 'subtasks',
            editSettings: { allowEditing: true, mode: 'Batch', allowDeleting: true, allowAdding: true },

            treeColumnIndex: 1,
            toolbar: ['Add', 'Edit', 'Update'],
              columns: [{ field: 'taskID', headerText: 'Task ID', isPrimaryKey: true },
              { field: 'taskName', headerText: 'Task Name' },
              { field: 'progress', headerText: 'Progress' },
              { field: 'startDate', headerText: 'Start Date' }
              ]
        },
        done
      );
    });
    it('record double click', () => {
      let event: MouseEvent = new MouseEvent('dblclick', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      gridObj.getCellFromIndex(2, 1).dispatchEvent(event);
    });
    it('batch changeds and save record', () => {
      gridObj.grid.editModule.formObj.element.getElementsByTagName('input')[0].value = 'test';
      (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
      expect(gridObj.getBatchChanges()['changedRecords'].length === 1).toBe(true);
      gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
    });
    it('Batch Add Datasource check - Batch Editing', () => {
      expect(gridObj.dataSource[0].subtasks[1].taskName === 'test').toBe(true);
    });
    afterAll(() => {
        destroy(gridObj);
      });
    });


    describe('Filtering', () => {
      let gridObj: TreeGrid;
      let actionComplete: () => void;
      beforeAll((done: Function) => {
        gridObj = createGrid(
          {
            dataSource: sampleData,
            childMapping: 'subtasks',
            allowFiltering:true,
            treeColumnIndex: 1,
              editSettings: {
                  allowAdding: true,
                  allowEditing: true,
                  allowDeleting: true,
                  mode: 'Batch',
                  newRowPosition: 'Bottom' 
              },
              toolbar: ['Add', 'Delete', 'Update', 'Cancel'],
              columns: [{ field: 'taskID', headerText: 'Task ID', isPrimaryKey: true },
              { field: 'priority', headerText: 'priority' },
              { field: 'priority', headerText: 'Start Date'},
              { field: 'duration', headerText: 'duration' },
              ]
          },
          done
        );
      });
      it('Filtering with batch update', (done: Function) => {
        actionComplete = (args?: Object): void => {
          if (args['requestType'] == "batchSave" ) {
            expect(gridObj.dataSource[0].taskName === 'test').toBe(true);
          }
           done();
        }
        gridObj.filterByColumn('priority', 'equal', 'Normal', 'and', true);
        gridObj.grid.actionComplete = actionComplete;
        let event: MouseEvent = new MouseEvent('dblclick', {
          'view': window,
          'bubbles': true,
          'cancelable': true
        });
        gridObj.getCellFromIndex(0, 2).dispatchEvent(event);
        gridObj.grid.editModule.formObj.element.getElementsByTagName('input')[0].value = 'test';
        (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
        expect(gridObj.getBatchChanges()['changedRecords'].length === 1).toBe(true);
        gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
      });
      afterAll(() => {
        destroy(gridObj);
      });
    });

    
    describe('Sorting', () => {
      let gridObj: TreeGrid;
      let actionComplete: () => void;
      beforeAll((done: Function) => {
        gridObj = createGrid(
          {
            dataSource: sampleData,
            childMapping: 'subtasks',
            allowSorting: true,
            treeColumnIndex: 1,
              editSettings: {
                  allowAdding: true,
                  allowEditing: true,
                  allowDeleting: true,
                  mode: 'Batch'
              },
              toolbar: ['Add', 'Delete', 'Update', 'Cancel'],
              columns: [{ field: 'taskID', headerText: 'Task ID', isPrimaryKey: true },
              { field: 'priority', headerText: 'priority' },
              { field: 'priority', headerText: 'Start Date'},
              { field: 'duration', headerText: 'duration' },
              ]
          },
          done
        );
      });
      it('Sorting with batch update', (done: Function) => {
        actionComplete = (args?: Object): void => {
          if (args['requestType'] == "batchSave" ) {
            expect(gridObj.dataSource[2].taskName === 'test').toBe(true);
          }
           done();
        }
        gridObj.sortByColumn('taskID', 'Descending', false);
        gridObj.grid.actionComplete = actionComplete;
        let event: MouseEvent = new MouseEvent('dblclick', {
          'view': window,
          'bubbles': true,
          'cancelable': true
        });
        gridObj.getCellFromIndex(0, 2).dispatchEvent(event);
        gridObj.grid.editModule.formObj.element.getElementsByTagName('input')[0].value = 'test';
        (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
        expect(gridObj.getBatchChanges()['changedRecords'].length === 1).toBe(true);
        gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
      });
      afterAll(() => {
        destroy(gridObj);
      });
    });



    describe('FlatData - Batch Add', () => {
      let gridObj: TreeGrid;
      let actionComplete: () => void;
      beforeAll((done: Function) => {
        gridObj = createGrid(
          {
            dataSource: projectData,
            idMapping: 'TaskID',
            parentIdMapping: 'parentID',
            treeColumnIndex: 1,
            editSettings: { allowEditing: true, allowDeleting: true, allowAdding: true, mode: "Batch" },
            toolbar: ['Add', 'Delete', 'Update', 'Cancel'],
            columns: [
              { field: "TaskID", headerText: "Task ID", width: 90, isPrimaryKey: true },
              { field: 'TaskName', headerText: 'Task Name', width: 60 },
              { field: 'Progress', headerText: 'Progress', textAlign: 'Right', width: 90 },
            ]
          },
          done
        );
      });
      it('Add - Batch Editing', (done: Function) => {
        actionComplete = (args?: Object): void => {
          if (args['requestType'] == "batchSave" ) {
            expect(gridObj.dataSource[4].taskID === 41).toBe(true);
          }
           done();
        }
        let addedRecords = 'addedRecords';
        gridObj.grid.actionComplete = actionComplete;
        (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_add' } });
        expect(gridObj.getRowByIndex(0).classList.contains('e-insertedrow')).toBe(true);
        (gridObj.element.querySelector('.e-editedbatchcell').querySelector('input') as any).value = 41;
        expect(gridObj.getBatchChanges()[addedRecords].length === 1).toBe(true);
        (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
        gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
      });
      afterAll(() => {
        destroy(gridObj);
      });
    });
    
  describe('Flat data - Batch Add ', () => {
    let gridObj: TreeGrid;
    beforeAll((done: Function) => {
      gridObj = createGrid(
        {
          dataSource: projectData,
          idMapping: 'TaskID',
          parentIdMapping: 'parentID',
          treeColumnIndex: 1,
          editSettings: { allowEditing: true, allowDeleting: true, allowAdding: true, mode: "Batch" },
          toolbar: ['Add', 'Delete', 'Update', 'Cancel'],
          columns: [
            { field: "TaskID", headerText: "Task ID", width: 90, isPrimaryKey: true },
            { field: 'TaskName', headerText: 'Task Name', width: 60 },
            { field: 'Progress', headerText: 'Progress', textAlign: 'Right', width: 90 },
          ]
        },
        done
      );
    });
    it('record double click', () => {
      let event: MouseEvent = new MouseEvent('dblclick', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      gridObj.getCellFromIndex(2, 1).dispatchEvent(event);
    });
    it('batch changes and save record', () => {
      gridObj.grid.editModule.formObj.element.getElementsByTagName('input')[0].value = 'test';
      (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
      expect(gridObj.getBatchChanges()["changedRecords"].length === 1).toBe(true);
      gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
    });
    it('Batch Add Datasource check - Batch Editing', () => {
      expect(gridObj.dataSource[2].TaskName === 'test').toBe(true);
    });
    afterAll(() => {
        destroy(gridObj);
      });
  });

  describe('Filtering', () => {
    let gridObj: TreeGrid;
    let actionComplete: () => void;
    beforeAll((done: Function) => {
      gridObj = createGrid(
        {
          dataSource: projectData,
          idMapping: 'TaskID',
          parentIdMapping: 'parentID',
          treeColumnIndex: 1,
          allowFiltering: true,
          editSettings: { allowEditing: true, allowDeleting: true, allowAdding: true, mode: "Batch" },
          toolbar: ['Add', 'Delete', 'Update', 'Cancel'],
          columns: [
            { field: "TaskID", headerText: "Task ID", width: 90, isPrimaryKey: true },
            { field: 'TaskName', headerText: 'Task Name', width: 60 },
            { field: 'Progress', headerText: 'Progress', textAlign: 'Right', width: 90 },
          ]
        },
        done
      );
    });
    it('Filtering with batch update', (done: Function) => {
      actionComplete = (args?: Object): void => {
        if (args['requestType'] == "batchSave" ) {
          expect(gridObj.dataSource[0].TaskName === 'test').toBe(true);
        }
         done();
      }
      gridObj.filterByColumn('TaskName', 'equal', 'Parent Task 1', 'and', true);
      gridObj.grid.actionComplete = actionComplete;
      let event: MouseEvent = new MouseEvent('dblclick', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      gridObj.getCellFromIndex(0, 2).dispatchEvent(event);
      gridObj.grid.editModule.formObj.element.getElementsByTagName('input')[0].value = 'test';
      (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
      expect(gridObj.getBatchChanges()['changedRecords'].length === 1).toBe(true);
      gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
    });
    afterAll(() => {
      destroy(gridObj);
    });
  });


  describe('Sorting', () => {
    let gridObj: TreeGrid;
    let actionComplete: () => void;
    beforeAll((done: Function) => {
      gridObj = createGrid(
        {
          dataSource: projectData,
          idMapping: 'TaskID',
          parentIdMapping: 'parentID',
          treeColumnIndex: 1,
          allowSorting: true,
          editSettings: { allowEditing: true, allowDeleting: true, allowAdding: true, mode: "Batch" },
          toolbar: ['Add', 'Delete', 'Update', 'Cancel'],
          columns: [
            { field: "TaskID", headerText: "Task ID", width: 90, isPrimaryKey: true },
            { field: 'TaskName', headerText: 'Task Name', width: 60 },
            { field: 'Progress', headerText: 'Progress', textAlign: 'Right', width: 90 },
          ]
        },
        done
      );
    });
    it('Sorting with batch update', (done: Function) => {
      actionComplete = (args?: Object): void => {
        if (args['requestType'] == "batchSave" ) {
          expect(gridObj.dataSource[3].TaskName === 'test').toBe(true);
        }
         done();
      }
      gridObj.sortByColumn('TaskID', 'Descending', false);
      gridObj.grid.actionComplete = actionComplete;
      let event: MouseEvent = new MouseEvent('dblclick', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      gridObj.getCellFromIndex(0, 1).dispatchEvent(event);
      gridObj.grid.editModule.formObj.element.getElementsByTagName('input')[0].value = 'test';
      (<any>gridObj.grid.toolbarModule).toolbarClickHandler({ item: { id: gridObj.grid.element.id + '_update' } });
      expect(gridObj.getBatchChanges()['changedRecords'].length === 1).toBe(true);
      gridObj.element.querySelector('#' + gridObj.element.id + '_gridcontrol' + 'EditConfirm').querySelectorAll('button')[0].click();
    });
    afterAll(() => {
      destroy(gridObj);
    });
  });

  it('memory leak', () => {
    profile.sample();
    let average: any = inMB(profile.averageChange)
    //Check average change in memory samples to not be over 10MB
    expect(average).toBeLessThan(10);
    let memory: any = inMB(getMemoryProfile())
    //Check the final memory usage against the first usage, there should be little change if everything was properly deallocated
    expect(memory).toBeLessThan(profile.samples[0] + 0.25);
  });
});