import { Gantt } from '../base/gantt';
import {
    createElement, formatUnit, EventHandler, Browser, KeyboardEvents, isBlazor, getElement,
    KeyboardEventArgs
} from '@syncfusion/ej2-base';
import { isNullOrUndefined, closest, addClass, removeClass, getValue, setValue } from '@syncfusion/ej2-base';
import * as cls from '../base/css-constants';
import { ChartScroll } from '../actions/chart-scroll';
import { IGanttData } from '../base/interface';
import { click } from '@syncfusion/ej2-grids';
import { ITaskbarClickEventArgs, RecordDoubleClickEventArgs, IMouseMoveEventArgs, IIndicator } from '../base/interface';
import { TooltipEventArgs } from '@syncfusion/ej2-popups';
import { FocusStrategy } from '@syncfusion/ej2-grids/src/grid/services/focus-strategy';

/**
 * module to render gantt chart - project view
 */

export class GanttChart {
    private parent: Gantt;
    public chartElement: HTMLElement;
    public chartTimelineContainer: HTMLElement;
    public chartBodyContainer: HTMLElement;
    public chartBodyContent: HTMLElement;
    public scrollElement: HTMLElement;
    public scrollObject: ChartScroll;
    public isExpandCollapseFromChart: boolean = false;
    public isExpandAll: boolean = false;
    private focusedElement: HTMLElement;
    public keyboardModule: KeyboardEvents;
    constructor(parent: Gantt) {
        this.parent = parent;
        this.chartTimelineContainer = null;
        this.addEventListener();
    }

    private addEventListener(): void {
        this.parent.on('renderPanels', this.renderChartContainer, this);
        this.parent.on('recordsUpdated', this.renderChartElements, this);
        this.parent.on('dataReady', this.renderInitialContents, this);
        this.parent.on('tree-grid-created', this.renderChartContents, this);
        this.parent.on('destroy', this.destroy, this);
    }

    private renderChartContents(): void {
        this.parent.notify('refreshDayMarkers', {});
        this.wireEvents();
    }
    /**
     * Method to render top level containers in Gantt chart
     * @private
     */
    public renderChartContainer(): void {
        this.chartElement = createElement('div', { id: this.parent.element.id + 'GanttChart', className: cls.ganttChart });
        this.parent.chartPane.appendChild(this.chartElement);
        this.renderTimelineContainer();
        this.renderBodyContainers();
        // render top level div header and content
        // Get timeline header from timeline class file and append to header div
        // render content div
        // Render scroll able div
        // Render container for all element like, table, weekend and holidays
        // Get rows element from rows renderer class
        // Get label related info label renderer class
        // Get baseline from baseline renderer class
        // Get weekend elements from weekend-holidays renderer class
    }
    /**
     * method to render timeline, holidays, weekends at load time
     */
    private renderInitialContents(): void {
        this.parent.timelineModule.createTimelineSeries();
    }
    private renderChartElements(): void {
        this.parent.chartRowsModule.renderChartRows();
        this.parent.connectorLineModule.renderConnectorLines(this.parent.updatedConnectorLineCollection);
        this.updateWidthAndHeight();
        this.parent.notify('selectRowByIndex', {});
    }
    /**
     * @private
     */
    public renderTimelineContainer(): void {
        this.chartTimelineContainer =
            createElement('div', { className: cls.timelineHeaderContainer });
        this.chartElement.appendChild(this.chartTimelineContainer);
    }

    /**
     * initiate chart container
     */
    private renderBodyContainers(): void {
        this.chartBodyContainer = createElement('div', { className: cls.chartBodyContainer });
        this.chartElement.appendChild(this.chartBodyContainer);
        this.scrollElement = createElement('div', {
            className: cls.chartScrollElement + ' ' + cls.scrollContent, styles: 'position:relative;'
        });
        this.chartBodyContainer.appendChild(this.scrollElement);
        this.chartBodyContent = createElement('div', { className: cls.chartBodyContent, styles: 'position:relative; overflow: hidden;' });
        this.scrollElement.appendChild(this.chartBodyContent);
        // this.parent.chartRowsModule.createChartTable();
        this.scrollObject = new ChartScroll(this.parent);
        //this.scrollObject.setWidth(this.chartProperties.width);
        let toolbarHeight: number = 0;
        if (!isNullOrUndefined(this.parent.toolbarModule) && !isNullOrUndefined(this.parent.toolbarModule.element)) {
            toolbarHeight = this.parent.toolbarModule.element.offsetHeight;
        }
        this.scrollObject.
            setHeight(this.parent.ganttHeight - this.chartTimelineContainer.offsetHeight - toolbarHeight);
    }

    private updateWidthAndHeight(): void {
        this.chartBodyContent.style.height = formatUnit(this.parent.contentHeight);
        //let element: HTMLElement = this.chartTimelineContainer.querySelector('.' + cls.timelineHeaderTableContainer);
        this.chartBodyContent.style.width = formatUnit(this.parent.timelineModule.totalTimelineWidth);
        this.parent.notify('updateHeight', {});
        this.parent.updateGridLineContainerHeight();
        this.updateLastRowBottomWidth();
    }
    /**
     * Method to update bottom border for chart rows
     */
    public updateLastRowBottomWidth(): void {
        if (this.parent.currentViewData.length > 0 && this.parent.height !== 'auto') {
            let expandedRecords: IGanttData[] = this.parent.getExpandedRecords(this.parent.currentViewData);
            let lastExpandedRow: IGanttData = expandedRecords[expandedRecords.length - 1];
            let lastExpandedRowIndex: number = this.parent.currentViewData.indexOf(lastExpandedRow);
            let lastRow: HTMLElement = this.parent.getRowByIndex(lastExpandedRowIndex);
            let table: Element = this.parent.chartRowsModule.ganttChartTableBody;
            if (table.querySelectorAll('.e-chart-row-cell.e-chart-row-border.e-lastrow')) {
                removeClass(table.querySelectorAll('.e-chart-row-cell.e-chart-row-border.e-lastrow'), 'e-lastrow');
            }
            if (this.chartBodyContent.clientHeight < this.chartBodyContainer.clientHeight) {
                if (lastRow) {
                    addClass(lastRow.querySelectorAll('td'), 'e-lastrow');
                    this.chartBodyContent.style.height = formatUnit(this.parent.contentHeight + 1);
                }
            }
        }
    }

    private removeEventListener(): void {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off('renderPanels', this.renderChartContainer);
        this.parent.off('recordsUpdated', this.renderChartElements);
        this.parent.off('dataReady', this.renderInitialContents);
        this.parent.off('tree-grid-created', this.renderChartContents);
        this.parent.off('destroy', this.destroy);
    }
    /**
     * Click event handler in chart side
     */
    private ganttChartMouseDown(e: PointerEvent): void {
        if (e.which !== 3) {
            this.parent.notify('chartMouseDown', e);
            this.parent.element.tabIndex = 0;
        }
    }

    private ganttChartMouseClick(e: PointerEvent): void {
        if (this.parent.autoFocusTasks) {
            this.scrollToTarget(e); /** Scroll to task */
        }
        this.parent.notify('chartMouseClick', e);
    }

    private ganttChartMouseUp(e: PointerEvent): void {
        this.parent.notify('chartMouseUp', e);
    }

    /**
     *
     * @param e
     */
    private scrollToTarget(e: PointerEvent): void {
        let row: Element = closest(e.target as Element, 'tr');
        if (row && this.parent.element.contains(row) &&
            (this.parent.element.querySelectorAll('.e-chart-rows-container')[0].contains(e.target as Element) ||
                this.parent.element.querySelectorAll('.e-gridcontent')[0].contains(e.target as Element)) &&
            this.parent.currentViewData.length > 0) {
            let rowIndex: number = getValue('rowIndex', closest(e.target as Element, 'tr'));
            let dateObject: Date = this.parent.currentViewData[rowIndex].ganttProperties.startDate;
            if (!isNullOrUndefined(dateObject)) {
                let left: number = this.parent.dataOperation.getTaskLeft(dateObject, false);
                if (this.parent.autoFocusTasks) {
                    this.updateScrollLeft(left);
                }
            }
        }
    }
    /**
     * To focus selected task in chart side
     * @private
     */
    public updateScrollLeft(scrollLeft: number): void {
        scrollLeft = scrollLeft - 50 > 0 ? scrollLeft - 50 : 0;
        scrollLeft = this.scrollElement.scrollWidth <= scrollLeft ? this.scrollElement.scrollWidth : scrollLeft;
        if ((this.scrollElement.offsetWidth + this.parent.ganttChartModule.scrollElement.scrollLeft) < scrollLeft
            || (this.scrollElement.scrollLeft > scrollLeft)) {
            this.scrollObject.setScrollLeft(scrollLeft);
        }
    }

    /**
     *  Method trigger while perform mouse up action.
     * @return {void}
     * @private
     */
    private documentMouseUp(e: PointerEvent): void {
        if (this.parent.allowRowDragAndDrop) {
            let ganttDragElemet: HTMLElement = this.parent.element.querySelector('.e-ganttdrag');
            if (ganttDragElemet) {
                ganttDragElemet.remove();
            }
        }
        if (this.parent.isDestroyed || e.which === 3) {
            return;
        }
        let isTaskbarEdited: boolean = false;
        if (this.parent.editSettings.allowTaskbarEditing &&
            getValue('editModule.taskbarEditModule.isMouseDragged', this.parent) &&
            getValue('editModule.taskbarEditModule.taskBarEditAction', this.parent)) {
            isTaskbarEdited = true;
        }
        this.parent.notify('chartMouseUp', e);
        if (this.parent.showActiveElement) {
            if (this.focusedElement) {
                this.focusedElement.tabIndex = this.focusedElement.tabIndex === 0 ? -1 : this.focusedElement.tabIndex;
                removeClass([this.focusedElement], 'e-active-container');
            }
        }
        if (!isTaskbarEdited) {
            /** Expand/collapse action */
            let target: EventTarget = e.target;
            let isOnTaskbarElement: boolean | Element = (e.target as HTMLElement).classList.contains(cls.taskBarMainContainer)
                || closest(e.target as Element, '.' + cls.taskBarMainContainer);
            if (closest((<HTMLElement>target), '.e-gantt-parent-taskbar')) {
                this.chartExpandCollapseRequest(e);
            } else if (!isOnTaskbarElement && this.parent.autoFocusTasks) {
                this.scrollToTarget(e); /** Scroll to task */
            }
        }
        if (this.parent.editModule && this.parent.editModule.taskbarEditModule) {
            this.parent.editModule.taskbarEditModule.removeFalseLine(true);
        }
        if (!isNullOrUndefined(this.parent.onTaskbarClick) && !isTaskbarEdited) {
            let target: EventTarget = e.target;
            let taskbarElement: Element =
                closest((<HTMLElement>target), '.e-gantt-parent-taskbar,.e-gantt-child-taskbar,.e-gantt-milestone');
            if (taskbarElement) {
                this.onTaskbarClick(e, target, taskbarElement);
            }
        }
    }

    /**
     * This event triggered when click on taskbar element
     * @return {void}
     */
    public onTaskbarClick(e: PointerEvent, target: EventTarget, taskbarElement: Element): void {
        let chartRow: Node = closest(target as Element, 'tr');
        let rowIndex: number = getValue('rowIndex', chartRow);
        let data: IGanttData = this.getRecordByTarget(e);
        let args: ITaskbarClickEventArgs = {
            data: data,
            taskbarElement: taskbarElement,
            rowIndex: rowIndex,
            target: target as Element
        };
        this.parent.trigger('onTaskbarClick', args);
    }

    /**
     *  Method trigger while perform mouse leave action.
     * @return {void}
     * @private
     */
    private ganttChartLeave(e: PointerEvent): void {
        this.parent.notify('chartMouseLeave', e);
    }

    /**
     *  Method trigger while perform mouse move action.
     * @return {void}
     * @private
     */
    private ganttChartMove(e: PointerEvent): void {
        this.parent.notify('chartMouseMove', e);
        if (!isNullOrUndefined(this.parent.taskFields.dependency) && this.parent.connectorLineEditModule) {
            this.parent.connectorLineEditModule.updateConnectorLineEditElement(e);
        }
    }

    /**
     * Method to trigger while perform mouse move on Gantt.
     * @return {void}
     * @private
     */
    public mouseMoveHandler(e: PointerEvent): void {
        if (!isNullOrUndefined(this.parent.onMouseMove) &&
            (this.parent.flatData.length ||
                (<HTMLElement>e.target).classList.contains('e-header-cell-label') ||
                (<HTMLElement>e.target).classList.contains('e-headercell'))) {
            let target: EventTarget = e.target;
            let args: IMouseMoveEventArgs = { originalEvent: e };
            let element: Element = closest((<HTMLElement>target), '.e-chart-row-cell,.e-connector-line-container,' +
                '.e-event-markers,.e-header-cell-label,.e-rowcell,.e-headercell,.e-indicator-span');
            if (element) {
                let rowData: IGanttData;
                let rowElement: Element = closest((<HTMLElement>target), '.e-rowcell,.e-chart-row-cell');
                let columnElement: Element = closest((<HTMLElement>target), '.e-rowcell,.e-headercell');
                if (rowElement) {
                    rowData = this.parent.ganttChartModule.getRecordByTarget(e);
                    args.data = rowData;
                }
                if (columnElement) {
                    let cellIndex: number = getValue('cellIndex', columnElement);
                    args.column = this.parent.treeGrid.columns[cellIndex];
                }
                if (closest((<HTMLElement>target), '.e-indicator-span')) {
                    let index: number = 0;
                    let indicators: IIndicator[] = rowData.ganttProperties.indicators;
                    if (indicators.length > 1) {
                        for (index = 0; index < indicators.length; index++) {
                            if (indicators[index].name === ((<HTMLElement>element).innerText).trim()) {
                                break;
                            }
                        }
                    }
                    args.indicator = indicators[index];
                }
                if (closest((<HTMLElement>target), '.e-connector-line-container')) {
                    let obj: TooltipEventArgs = {} as TooltipEventArgs;
                    obj.target = element as HTMLElement;
                    args.predecessor = this.parent.tooltipModule.getPredecessorTooltipData(obj);
                }
                if (closest((<HTMLElement>target), '.e-event-markers')) {
                    let obj: TooltipEventArgs = {} as TooltipEventArgs;
                    obj.target = element as HTMLElement;
                    args.eventMarkers = this.parent.tooltipModule.getMarkerTooltipData(obj);
                }
                if ((<HTMLElement>target).classList.contains('e-header-cell-label')) {
                    args.date = new Date((<HTMLElement>target).dataset.content);
                }
            }
            this.parent.trigger('onMouseMove', args);
        }
    }

    /**
     * Double click handler for chart
     * @param e 
     */
    private doubleClickHandler(e: PointerEvent): void {
        this.parent.notify('chartDblClick', e);
        let target: EventTarget = e.target;
        let row: Element = closest(target as Element, 'tr');
        let rowIndex: number = getValue('rowIndex', row);
        let rowData: IGanttData = this.parent.ganttChartModule.getRecordByTarget(e);
        let args: RecordDoubleClickEventArgs = {
            row: row,
            rowData: rowData,
            rowIndex: rowIndex,
            target: target as Element
        };
        this.recordDoubleClick(args);
    }

    /**
     * To trigger record double click event.
     * @return {void}
     * @private
     */
    public recordDoubleClick(args: RecordDoubleClickEventArgs): void {
        this.parent.trigger('recordDoubleClick', args);
    }

    /**
     * @private
     */
    public getRecordByTarget(e: PointerEvent): IGanttData {
        let row: Element = closest(e.target as Element, 'tr');
        let ganttData: IGanttData;
        if (row) {
            let rowIndex: number = getValue('rowIndex', closest(e.target as Element, 'tr'));
            ganttData = this.parent.currentViewData[rowIndex];
        }
        return ganttData;
    }

    /**
     * To get gantt chart row elements
     * @return {NodeListOf<Element>}
     * @private
     */
    public getChartRows(): NodeListOf<Element> {
        return document.getElementById(this.parent.element.id + 'GanttTaskTableBody').querySelectorAll('.e-chart-row');
    }

    /**
     * Expand Collapse operations from gantt chart side
     * @return {void}
     * @param target
     * @private
     */
    private chartExpandCollapseRequest(e: PointerEvent): void {
        let target: EventTarget = e.target;
        let parentElement: Element = closest((<HTMLElement>target), '.e-gantt-parent-taskbar');
        let record: IGanttData = this.getRecordByTarget(e);
        let chartRow: Node = closest(target as Element, 'tr');
        let rowIndex: number = getValue('rowIndex', chartRow);
        let gridRow: Node = this.parent.treeGrid.getRows()[rowIndex];
        let args: object = { data: record, gridRow: gridRow, chartRow: chartRow, cancel: false };
        this.isExpandCollapseFromChart = true;
        if (parentElement.classList.contains('e-row-expand')) {
            this.collapseGanttRow(args);
        } else if (parentElement.classList.contains('e-row-collapse')) {
            this.expandGanttRow(args);
        }
    }
    /**
     * @private
     */
    public reRenderConnectorLines(): void {
        this.parent.connectorLineModule.dependencyViewContainer.innerHTML = '';
        let expandedRecords: IGanttData[] = this.parent.getExpandedRecords(this.parent.currentViewData);
        this.parent.connectorLineIds = [];
        this.parent.updatedConnectorLineCollection = [];
        this.parent.predecessorModule.createConnectorLinesCollection(expandedRecords);
        this.parent.connectorLineModule.renderConnectorLines(this.parent.updatedConnectorLineCollection);
    }

    /**
     * To collapse gantt rows
     * @return {void}
     * @param args
     * @private
     */
    public collapseGanttRow(args: object, isCancel?: boolean): void {
        if (isCancel) {
            this.collapsedGanttRow(args);
        } else {
            this.parent.trigger('collapsing', args, (args: object) => {
                if (this.isExpandCollapseFromChart && !getValue('cancel', args)) {
                    if (isBlazor()) {
                        setValue('chartRow', getElement(getValue('chartRow', args)), args);
                        setValue('gridRow', getElement(getValue('gridRow', args)), args);
                    }
                    this.collapsedGanttRow(args);
                }
                this.isExpandCollapseFromChart = false;
            });
        }
    }

    /**
     * @return {void}
     * @param args
     * @private
     */
    public collapsedGanttRow(args: object): void {
        let record: IGanttData = getValue('data', args);
        if (this.isExpandCollapseFromChart) {
            this.expandCollapseChartRows('collapse', getValue('chartRow', args), record, null);
            this.parent.treeGrid.collapseRow(getValue('gridRow', args), record);
            this.isExpandCollapseFromChart = false;
        } else {
            this.expandCollapseChartRows('collapse', getValue('chartRow', args), record, null);
        }
        this.parent.updateContentHeight();
        this.updateWidthAndHeight();
        this.reRenderConnectorLines();
        getValue('chartRow', args).setAttribute('aria-expanded', 'false');
        this.parent.trigger('collapsed', args);
    }

    /**
     * To expand gantt rows
     * @return {void}
     * @param args
     * @private
     */
    public expandGanttRow(args: object, isCancel?: boolean): void {
        if (isCancel) {
            this.expandedGanttRow(args);
        } else {
            this.parent.trigger('expanding', args, (args: object) => {
                if (isBlazor()) {
                    setValue('chartRow', getElement(getValue('chartRow', args)), args);
                    setValue('gridRow', getElement(getValue('gridRow', args)), args);
                }
                if (this.isExpandCollapseFromChart && !getValue('cancel', args)) {
                    this.expandedGanttRow(args);
                }
                this.isExpandCollapseFromChart = false;
            });
        }
    }

    /**
     * @return {void}
     * @param args
     * @private
     */
    public expandedGanttRow(args: object): void {
        let record: IGanttData = getValue('data', args);
        if (this.isExpandCollapseFromChart) {
            this.expandCollapseChartRows('expand', getValue('chartRow', args), record, null);
            this.parent.treeGrid.expandRow(getValue('gridRow', args), record);
            this.isExpandCollapseFromChart = false;
        } else {
            this.expandCollapseChartRows('expand', getValue('chartRow', args), record, null);
        }
        this.parent.updateContentHeight();
        this.updateWidthAndHeight();
        this.reRenderConnectorLines();
        getValue('chartRow', args).setAttribute('aria-expanded', 'true');
        this.parent.trigger('expanded', args);
    }

    /**
     * On expand collapse operation row properties will be updated here.
     * @return {void}
     * @param action
     * @param rowElement
     * @param record
     * @param isChild
     * @private
     */
    private expandCollapseChartRows(action: string, rowElement: Node, record: IGanttData, isChild: boolean): void {
        let displayType: string;
        if (action === 'expand') {
            displayType = 'table-row';
            if (!isChild) {
                record.expanded = true;
            }
            let targetElement: NodeListOf<Element> = (rowElement as HTMLElement).querySelectorAll('.e-row-collapse');
            for (let t: number = 0; t < targetElement.length; t++) {
                addClass([targetElement[t]], 'e-row-expand');
                removeClass([targetElement[t]], 'e-row-collapse');
            }
        } else if (action === 'collapse') {
            displayType = 'none';
            if (!isChild) {
                record.expanded = false;
            }
            let targetElement: NodeListOf<Element> = (rowElement as HTMLElement).querySelectorAll('.e-row-expand');
            for (let t: number = 0; t < targetElement.length; t++) {
                addClass([targetElement[t]], 'e-row-collapse');
                removeClass([targetElement[t]], 'e-row-expand');
            }
        }
        let childRecords: IGanttData[] = record.childRecords;
        let chartRows: NodeListOf<Element> = this.getChartRows();
        let rows: HTMLElement[] = [];
        for (let i: number = 0; i < chartRows.length; i++) {
            if ((<HTMLElement>chartRows[i]).classList.contains('gridrowtaskId'
                + record.ganttProperties.taskId + 'level' + (record.level + 1))) {
                rows.push(<HTMLElement>chartRows[i]);
            }
        }
        for (let i: number = 0; i < rows.length; i++) {
            rows[i].style.display = displayType;
            if ((childRecords[i].childRecords && childRecords[i].childRecords.length)
                && (action === 'collapse' || childRecords[i].expanded || this.isExpandAll)) {
                this.expandCollapseChartRows(action, rows[i], childRecords[i], true);
            }
        }
    }

    /**
     * Public method to expand or collapse all the rows of Gantt
     * @return {void}
     * @param action
     * @private
     */
    public expandCollapseAll(action: string): void {
        if (action === 'expand') {
            this.isExpandAll = true;
            this.parent.treeGrid.expandAll();
        } else {
            this.parent.treeGrid.collapseAll();
        }
        this.isExpandAll = false;
        let focussedElement: HTMLElement = <HTMLElement>this.parent.element.querySelector('.e-treegrid');
        focussedElement.focus();
    }

    /**
     * Public method to expand particular level of rows.
     * @return {void}
     * @param level
     * @private
     */
    public expandAtLevel(level: number): void {
        this.parent.treeGrid.expandAtLevel(level);
    }

    /**
     * Public method to collapse particular level of rows.
     * @return {void}
     * @param level
     * @private
     */
    public collapseAtLevel(level: number): void {
        this.parent.treeGrid.collapseAtLevel(level);
    }

    /**
     * Event Binding for gantt chart click 
     */
    private wireEvents(): void {
        let isIE11Pointer: Boolean = Browser.isPointer;
        let mouseDown: string = Browser.touchStartEvent;
        let mouseUp: string = Browser.touchEndEvent;
        let mouseMove: string = Browser.touchMoveEvent;
        let cancel: string = isIE11Pointer ? 'pointerleave' : 'mouseleave';
        if (this.parent.editSettings.allowTaskbarEditing) {
            EventHandler.add(this.parent.chartPane, mouseDown, this.ganttChartMouseDown, this);
            EventHandler.add(this.parent.chartPane, cancel, this.ganttChartLeave, this);
            EventHandler.add(this.parent.chartPane, mouseMove, this.ganttChartMove, this);
            if (this.parent.isAdaptive) {
                EventHandler.add(this.parent.chartPane, click, this.ganttChartMouseClick, this);
                EventHandler.add(this.parent.chartPane, mouseUp, this.ganttChartMouseUp, this);
            }
        }
        if (!this.parent.isAdaptive) {
            EventHandler.add(document, mouseUp, this.documentMouseUp, this);
        }
        EventHandler.add(document.body, 'mousemove', this.mouseMoveHandler, this);
        EventHandler.add(this.parent.chartRowsModule.ganttChartTableBody, 'dblclick', this.doubleClickHandler, this);
    }

    private unWireEvents(): void {
        let isIE11Pointer: Boolean = Browser.isPointer;
        let mouseDown: string = Browser.touchStartEvent;
        let mouseUp: string = Browser.touchEndEvent;
        let mouseMove: string = Browser.touchMoveEvent;
        let cancel: string = isIE11Pointer ? 'pointerleave' : 'mouseleave';
        if (this.parent.editSettings.allowTaskbarEditing) {
            EventHandler.remove(this.parent.chartRowsModule.ganttChartTableBody, mouseDown, this.ganttChartMouseDown);
            EventHandler.remove(this.parent.chartPane, cancel, this.ganttChartLeave);
            EventHandler.remove(this.parent.chartPane, mouseMove, this.ganttChartMove);
            if (this.parent.isAdaptive) {
                EventHandler.remove(this.parent.chartPane, click, this.ganttChartMouseClick);
                EventHandler.remove(this.parent.chartPane, mouseUp, this.ganttChartMouseUp);
            }
        }
        if (!this.parent.isAdaptive) {
            EventHandler.remove(document, mouseUp, this.documentMouseUp);
        }
        EventHandler.remove(document.body, 'mousemove', this.mouseMoveHandler);
        EventHandler.remove(this.parent.chartRowsModule.ganttChartTableBody, 'dblclick', this.doubleClickHandler);
    }

    /**
     * To get record by taskbar element.
     * @return {IGanttData}
     * @private
     */
    public getRecordByTaskBar(target: Element): IGanttData {
        let item: IGanttData = this.parent.currentViewData[this.getIndexByTaskBar(target)];
        return item;
    }
    /**
     * Trigger Tab & Shift + Tab keypress to highlight active element.
     * @param e
     * @private
     */
    public onTabAction(e: KeyboardEventArgs): void {
        if (!this.parent.showActiveElement) {
            return;
        }
        e.preventDefault();
        let $target: Element = e.target as Element;
        let isTab: boolean = (e.action === 'tab') ? true : false;
        let nextElement: Element = this.getNextElement($target, isTab);
        if ($target.classList.contains('e-rowcell') && (nextElement && nextElement.classList.contains('e-rowcell'))) {
            this.parent.treeGrid.grid.notify('key-pressed', e);
        } else if (nextElement) {
            if ($target.classList.contains('e-rowcell')) {
                this.manageFocus($target as HTMLElement, 'remove', false);
            } else {
                this.manageFocus($target as HTMLElement, 'remove', true);
            }
            if (nextElement.classList.contains('e-rowcell')) {
                if (!$target.classList.contains('e-rowcell')) {
                    this.parent.treeGrid.grid.notify('key-pressed', e);
                    let fmodule: FocusStrategy = getValue('focusModule', this.parent.treeGrid.grid);
                    fmodule.currentInfo.element = nextElement as HTMLElement;
                    fmodule.currentInfo.elementToFocus = nextElement as HTMLElement;
                    /* tslint:disable-next-line:no-any */
                    fmodule.content.matrix.current = [(nextElement.parentElement as any).rowIndex, (nextElement as any).cellIndex];
                }
                this.manageFocus(nextElement as HTMLElement, 'add', false);
            } else {
                this.manageFocus(nextElement as HTMLElement, 'add', true);
            }
        }
    }
    /**
     * Get next/previous sibling element.
     * @param $target 
     * @param isTab 
     */
    private getNextElement($target: Element, isTab: boolean): Element {
        let nextElement: Element = isTab ? $target.nextElementSibling : $target.previousElementSibling;
        if (this.validateNextElement(nextElement)) {
            return nextElement;
        } else {
            let rowIndex: number = -1;
            let rowElement: Element = null;
            if ($target.classList.contains('e-rowcell')) {
                /* tslint:disable-next-line:no-any */
                rowIndex = ($target.parentElement as any).rowIndex;
                if (isTab) {
                    rowElement = this.parent.getRowByIndex(rowIndex);
                    if (this.validateNextElement(rowElement, 'e-left-label-container')) {
                        return rowElement.getElementsByClassName('e-left-label-container')[0];
                    } else if (this.validateNextElement(rowElement, 'e-taskbar-main-container')) {
                        return rowElement.getElementsByClassName('e-taskbar-main-container')[0];
                    } else if (this.validateNextElement(rowElement, 'e-right-label-container')) {
                        return rowElement.getElementsByClassName('e-right-label-container')[0];
                    }
                } else {
                    rowElement = this.getNextRowElement(rowIndex, isTab, false);
                    if (this.validateNextElement(rowElement, 'e-right-label-container')) {
                        return rowElement.getElementsByClassName('e-right-label-container')[0];
                    } else if (this.validateNextElement(rowElement, 'e-taskbar-main-container')) {
                        return rowElement.getElementsByClassName('e-taskbar-main-container')[0];
                    } else if (this.validateNextElement(rowElement, 'e-left-label-container')) {
                        return rowElement.getElementsByClassName('e-left-label-container')[0];
                    }
                }
            } else if ($target.parentElement.classList.contains('e-chart-row-cell')) {
                /* tslint:disable-next-line:no-any */
                rowIndex = (closest($target, '.e-chart-row') as any).rowIndex;

                if (isTab) {
                    rowElement = this.getNextRowElement(rowIndex, isTab, true);
                    return rowElement ? (rowElement.children[0]) : null;
                } else {
                    rowElement = this.parent.treeGrid.grid.getRowByIndex(rowIndex);
                    return rowElement ? (rowElement.children[this.parent.ganttColumns.length - 1]) : null;
                }
            }
        }
        return null;
    }
    /**
     * Get next/previous row element.
     * @param rowIndex 
     * @param isTab 
     * @param isChartRow 
     */
    private getNextRowElement(rowIndex: number, isTab: boolean, isChartRow: boolean): Element {
        let expandedRecords: IGanttData[] = this.parent.getExpandedRecords(this.parent.currentViewData);
        let currentItem: IGanttData = this.parent.currentViewData[rowIndex];
        let expandedRecordIndex: number = expandedRecords.indexOf(currentItem);
        let nextRecord: IGanttData = isTab ? expandedRecords[expandedRecordIndex + 1] : expandedRecords[expandedRecordIndex - 1];
        let nextRowIndex: number = this.parent.currentViewData.indexOf(nextRecord);
        if (nextRecord) {
            return isChartRow ? this.parent.treeGrid.grid.getRowByIndex(nextRowIndex) : this.parent.getRowByIndex(nextRowIndex);
        } else {
            return null;
        }
    }
    /**
     * Validate next/previous sibling element haschilds.
     * @param $target 
     * @param className 
     */
    private validateNextElement($target: Element, className?: string): boolean {
        if ($target && $target.classList.contains('e-rowcell')) {
            return true;
        }
        if ($target && className) {
            let elementByClass: Element = $target.getElementsByClassName(className)[0];
            return (elementByClass && elementByClass.hasChildNodes()) ? true : false;
        } else if ($target) {
            return (!isNullOrUndefined($target) && $target.hasChildNodes()) ? true : false;
        }
        return false;
    }
    /**
     * Add/Remove active element.
     * @param element 
     * @param focus 
     * @param isChartElement 
     */
    private manageFocus(element: HTMLElement, focus: string, isChartElement?: boolean): void {
        if (isChartElement) {
            let childElement: Element = null;
            if (element.classList.contains('e-left-label-container') ||
                element.classList.contains('e-right-label-container')) {
                childElement = element.children[0].children[0];
            } else if (element.classList.contains('e-taskbar-main-container')) {
                /* tslint:disable-next-line:no-any */
                let rowIndex: number = (closest(element, '.e-chart-row') as any).rowIndex;
                let data: IGanttData = this.parent.currentViewData[rowIndex];
                let className: string = data.hasChildRecords ? 'e-gantt-parent-taskbar' :
                    data.ganttProperties.isMilestone ? 'e-gantt-milestone' : 'e-gantt-child-taskbar';
                childElement = element.getElementsByClassName(className)[0];
            }
            if (focus === 'add') {
                element.setAttribute('tabIndex', '0');
                addClass([childElement], 'e-active-container');
                element.focus();
                this.focusedElement = element;
            } else {
                removeClass([childElement], 'e-active-container');
                element.setAttribute('tabIndex', '-1');
                element.blur();
            }
        } else {
            if (focus === 'add') {
                element.setAttribute('tabIndex', '0');
                addClass([element], ['e-focused', 'e-focus']);
                element.focus();
            } else {
                element.setAttribute('tabIndex', '-1');
                removeClass([element], ['e-focused', 'e-focus']);
                element.blur();
            }
        }
    }
    /**
     * To get index by taskbar element.
     * @return {number}
     * @private
     */
    public getIndexByTaskBar(target: Element): number {
        let row: Element = closest(target, 'tr.' + cls.chartRow);
        let recordIndex: number = [].slice.call(this.parent.chartRowsModule.ganttChartTableBody.childNodes).indexOf(row);
        return recordIndex;
    }

    private destroy(): void {
        this.removeEventListener();
        this.unWireEvents();
        this.scrollObject.destroy();
        this.scrollObject = null;
    }
}