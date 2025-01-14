import {
    PdfViewer, PdfViewerBase, IRectangle, ISelection, AnnotationType, IPageAnnotations, ICommentsCollection,
    IReviewCollection,
    ISize
} from '../index';
import { createElement, Browser, isNullOrUndefined } from '@syncfusion/ej2-base';
import { ColorPicker, ChangeEventArgs } from '@syncfusion/ej2-inputs';
import { cloneObject } from '../../diagram/drawing-util';

/**
 * @hidden
 */
export interface ITextMarkupAnnotation {
    textMarkupAnnotationType: string;
    author: string;
    subject: string;
    modifiedDate: string;
    note: string;
    // tslint:disable-next-line
    bounds: any;
    // tslint:disable-next-line
    color: any;
    opacity: number;
    // tslint:disable-next-line
    rect: any;
    comments: ICommentsCollection[];
    review: IReviewCollection;
    annotName: string;
    shapeAnnotationType: string;
    position?: string;
    pageNumber: number;
    textMarkupContent: string;
    textMarkupStartIndex: number;
    textMarkupEndIndex: number;
}

/**
 * @hidden
 */
export interface IPageAnnotationBounds {
    pageIndex: number;
    bounds: IRectangle[];
    // tslint:disable-next-line
    rect: any;
    startIndex?: number;
    endIndex?: number;
    textContent?: string;
}

/**
 * The `TextMarkupAnnotation` module is used to handle text markup annotation actions of PDF viewer.
 * @hidden
 */
export class TextMarkupAnnotation {
    private pdfViewer: PdfViewer;
    private pdfViewerBase: PdfViewerBase;
    /**
     * @private
     */
    public isTextMarkupAnnotationMode: boolean;
    /**
     * @private
     */
    public currentTextMarkupAddMode: string = '';
    /**
     * @private
     */
    public highlightColor: string;
    /**
     * @private
     */
    public underlineColor: string;
    /**
     * @private
     */
    public strikethroughColor: string;
    /**
     * @private
     */
    public highlightOpacity: number;
    /**
     * @private
     */
    public underlineOpacity: number;
    /**
     * @private
     */
    public strikethroughOpacity: number;
    /**
     * @private
     */
    public selectTextMarkupCurrentPage: number = null;
    /**
     * @private
     */
    public currentTextMarkupAnnotation: ITextMarkupAnnotation = null;
    private currentAnnotationIndex: number = null;
    private isAnnotationSelect: boolean = false;
    // tslint:disable-next-line
    private dropDivAnnotationLeft: any;
    // tslint:disable-next-line
    private dropDivAnnotationRight: any;
    // tslint:disable-next-line
    private dropElementLeft: any;
    // tslint:disable-next-line
    private dropElementRight: any;
    /**
     * @private
     */
    public isDropletClicked: boolean = false;
    /**
     * @private
     */
    public isRightDropletClicked: boolean = false;
    /**
     * @private
     */
    public isLeftDropletClicked: boolean = false;
    /**
     * @private
     */
    public isSelectionMaintained: boolean = false;
    private isExtended: boolean = false;
    private isNewAnnotation: boolean = false;
    private selectAnnotationCollection: ITextMarkupAnnotation[] = [];
    private selectedAnnotation: ITextMarkupAnnotation;
    private selectedTextMarkup: ITextMarkupAnnotation = null;
    /**
     * @private
     */
    public isSelectedAnnotation: boolean = false;

    /**
     * @private
     */
    constructor(pdfViewer: PdfViewer, viewerBase: PdfViewerBase) {
        this.pdfViewer = pdfViewer;
        this.pdfViewerBase = viewerBase;
        this.highlightColor = pdfViewer.highlightSettings.color;
        this.underlineColor = pdfViewer.underlineSettings.color;
        this.strikethroughColor = pdfViewer.strikethroughSettings.color;
        this.highlightOpacity = pdfViewer.highlightSettings.opacity;
        this.underlineOpacity = pdfViewer.underlineSettings.opacity;
        this.strikethroughOpacity = pdfViewer.strikethroughSettings.opacity;
    }
    /**
     * @private
     */
    public createAnnotationSelectElement(): void {
        // tslint:disable-next-line:max-line-length
        this.dropDivAnnotationLeft = createElement('div', { id: this.pdfViewer.element.id + '_droplet_left', className: 'e-pv-drop' });
        this.dropDivAnnotationLeft.style.borderRight = '2px solid';
        // tslint:disable-next-line:max-line-length
        this.dropDivAnnotationRight = createElement('div', { id: this.pdfViewer.element.id + '_droplet_right', className: 'e-pv-drop' });
        this.dropDivAnnotationRight.style.borderLeft = '2px solid';
        this.dropElementLeft = createElement('div', { className: 'e-pv-droplet', id: this.pdfViewer.element.id + '_dropletspan_left', });
        this.dropElementLeft.style.transform = 'rotate(0deg)';
        this.dropDivAnnotationLeft.appendChild(this.dropElementLeft);
        this.dropElementRight = createElement('div', { className: 'e-pv-droplet', id: this.pdfViewer.element.id + '_dropletspan_right' });
        this.dropElementRight.style.transform = 'rotate(-90deg)';
        this.dropDivAnnotationRight.appendChild(this.dropElementRight);
        this.pdfViewerBase.pageContainer.appendChild(this.dropDivAnnotationLeft);
        this.pdfViewerBase.pageContainer.appendChild(this.dropDivAnnotationRight);
        this.dropElementLeft.style.top = '20px';
        this.dropElementRight.style.top = '20px';
        this.dropElementRight.style.left = '-8px';
        this.dropElementLeft.style.left = '-8px';
        this.dropDivAnnotationLeft.style.display = 'none';
        this.dropDivAnnotationRight.style.display = 'none';
        this.dropDivAnnotationLeft.addEventListener('mousedown', this.maintainSelection);
        this.dropDivAnnotationLeft.addEventListener('mousemove', this.annotationLeftMove);
        this.dropDivAnnotationLeft.addEventListener('mouseup', this.selectionEnd);
        this.dropDivAnnotationRight.addEventListener('mousedown', this.maintainSelection);
        this.dropDivAnnotationRight.addEventListener('mousemove', this.annotationRightMove);
        this.dropDivAnnotationRight.addEventListener('mouseup', this.selectionEnd);
    }
    // tslint:disable-next-line
    private maintainSelection = (event: any): void => {
        this.isDropletClicked = true;
        this.pdfViewer.textSelectionModule.initiateSelectionByTouch();
        this.isExtended = true;
        this.pdfViewer.textSelectionModule.selectionRangeArray = [];
    }
    // tslint:disable-next-line
    private selectionEnd = (event: any): void => {
        if (this.isDropletClicked) {
            this.isDropletClicked = false;
        }
    }
    // tslint:disable-next-line
    private annotationLeftMove = (event: any): void => {
        if (this.isDropletClicked) {
            this.isLeftDropletClicked = true;
        }
    }

    // tslint:disable-next-line
    private annotationRightMove = (event: any): void => {
        if (this.isDropletClicked) {
            this.isRightDropletClicked = true;
        }
    }
    /**
     * @private
     */
    // tslint:disable-next-line
    public textSelect(target: any, x: any, y: any) {
        if (this.isLeftDropletClicked) {
            let leftElement: ClientRect = this.dropDivAnnotationRight.getBoundingClientRect();
            let rightElement: ClientRect = this.dropDivAnnotationLeft.getBoundingClientRect();
            let clientX: number = x;
            let clientY: number = y;
            if (target.classList.contains('e-pv-text')) {
                if ((rightElement.top - 25) > leftElement.top) {
                    this.pdfViewer.textSelectionModule.textSelectionOnDrag(target, clientX, clientY, true);
                } else {
                    this.pdfViewer.textSelectionModule.textSelectionOnDrag(target, clientX, clientY, false);
                }
                this.updateLeftposition(clientX, clientY);
            }
        } else if (this.isRightDropletClicked) {
            let leftElement: ClientRect = this.dropDivAnnotationLeft.getBoundingClientRect();
            let clientX: number = x;
            let clientY: number = y;
            if (target.classList.contains('e-pv-text')) {
                if ((clientY) >= leftElement.top) {
                    this.pdfViewer.textSelectionModule.textSelectionOnDrag(target, clientX, clientY, true);
                } else {
                    this.pdfViewer.textSelectionModule.textSelectionOnDrag(target, clientX, clientY, false);
                }
                this.updatePosition(clientX, clientY);
            }
        }
    }
    /**
     * @private
     */
    public showHideDropletDiv(hide: boolean): void {
        if (this.pdfViewer.enableTextMarkupResizer && this.dropDivAnnotationLeft && this.dropDivAnnotationRight) {
            if (hide) {
                this.dropDivAnnotationLeft.style.display = 'none';
                this.dropDivAnnotationRight.style.display = 'none';
            } else {
                this.dropDivAnnotationLeft.style.display = '';
                this.dropDivAnnotationRight.style.display = '';
            }
        }
    }
    private updateAnnotationBounds(): void {
        this.isSelectionMaintained = false;
        // tslint:disable-next-line
        let annotation: any = this.currentTextMarkupAnnotation;
        if (annotation && annotation.bounds) {
            this.retreieveSelection(annotation, null);
            this.pdfViewer.textSelectionModule.maintainSelection(this.selectTextMarkupCurrentPage, false);
            this.isSelectionMaintained = true;
            window.getSelection().removeAllRanges();
        }
    }

    // tslint:disable-next-line
    private retreieveSelection(annotation: any, element: any): any {
        for (let k: number = 0; k < annotation.bounds.length; k++) {
            // tslint:disable-next-line
            let bound: any = annotation.bounds[k];
            let x: number = (bound.left ? bound.left : bound.Left) * this.pdfViewerBase.getZoomFactor();
            let y: number = (bound.top ? bound.top : bound.Top) * this.pdfViewerBase.getZoomFactor();
            let width: number = (bound.width ? bound.width : bound.Width) * this.pdfViewerBase.getZoomFactor();
            let height: number = bound.height ? bound.height : bound.Height;
            // tslint:disable-next-line
            let textDivs: any = this.pdfViewerBase.getElement('_textLayer_' + this.selectTextMarkupCurrentPage).childNodes;
            for (let n: number = 0; n < textDivs.length; n++) {
                if (textDivs[n]) {
                    // tslint:disable-next-line
                    let rangebounds: any = textDivs[n].getBoundingClientRect();
                    let top: number = this.getClientValueTop(rangebounds.top, annotation.pageNumber);
                    // tslint:disable-next-line:max-line-length
                    let currentLeft: number = rangebounds.left - this.pdfViewerBase.getElement('_pageDiv_' + annotation.pageNumber).getBoundingClientRect().left;
                    let totalLeft: number = currentLeft + rangebounds.width;
                    // tslint:disable-next-line
                    let textDiVLeft: number = parseInt(textDivs[n].style.left);
                    // tslint:disable-next-line
                    let currentTop: number = parseInt(textDivs[n].style.top);
                    let isLeftBounds: boolean = this.checkLeftBounds(currentLeft, textDiVLeft, totalLeft, x);
                    let isTopBounds: boolean = this.checkTopBounds(top, currentTop, y);
                    if (isLeftBounds && isTopBounds) {
                        element = textDivs[n];
                        break;
                    }
                }
            }
            if (element != null) {
                // tslint:disable-next-line
                let boundingRect: any = this.pdfViewerBase.getElement('_textLayer_' + this.selectTextMarkupCurrentPage).getBoundingClientRect();
                this.pdfViewer.textSelectionModule.textSelectionOnMouseMove(element, x + boundingRect.left, y + boundingRect.top, false);
                if ((annotation.bounds.length - 1) === k) {
                    // tslint:disable-next-line:max-line-length
                    this.pdfViewer.textSelectionModule.textSelectionOnMouseMove(element, x + boundingRect.left + width, y + boundingRect.top, false);
                }
            }
        }
    }
    private checkLeftBounds(left: number, textDiVLeft: number, totalLeft: number, x: number): boolean {
        let isExists: boolean = false;
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line
        if (left === parseInt(x.toString()) || parseInt(left.toString()) === parseInt(x.toString()) || (left + 1) === parseInt(x.toString()) || (left - 1) === parseInt(x.toString())
        // tslint:disable-next-line    
        || textDiVLeft === parseInt(x.toString()) || textDiVLeft === x || (totalLeft >= x && left <= x)) {
            isExists = true;
        }
        return isExists;
    }
    private checkTopBounds(top: number, currentTop: number, y: number): boolean {
        let isExists: boolean = false;
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line
        if ((top === parseInt(y.toString()) || parseInt(top.toString()) === parseInt(y.toString()) || parseInt((top + 1).toString()) === parseInt(y.toString()) || parseInt((top - 1).toString()) === parseInt(y.toString())
            // tslint:disable-next-line
            || currentTop === parseInt(y.toString()) || currentTop === y)) {
                isExists = true;
        }
        return isExists;
    }
    /**
     * @private
     */
    public updatePosition(x: number, y: number, isSelected?: boolean): void {
        this.showHideDropletDiv(false);
        let pageTopValue: number = this.pdfViewerBase.pageSize[this.pdfViewerBase.currentPageNumber - 1].top;
        let topClientValue: number = this.getClientValueTop(y, this.pdfViewerBase.currentPageNumber - 1);
        // tslint:disable-next-line
        let rightDivElement: any = document.getElementById(this.pdfViewer.element.id + '_droplet_right');
        if (isSelected) {
            // tslint:disable-next-line:max-line-length
            rightDivElement.style.top = topClientValue * this.pdfViewerBase.getZoomFactor() + pageTopValue * this.pdfViewerBase.getZoomFactor() + 'px';
        } else {
            // tslint:disable-next-line:max-line-length
            rightDivElement.style.top = topClientValue + pageTopValue * this.pdfViewerBase.getZoomFactor() + 'px';
        }
        rightDivElement.style.left = x - this.pdfViewerBase.viewerContainer.getBoundingClientRect().left + 'px';
    }
    /**
     * @private
     */
    public updateLeftposition(x: number, y: number, isSelected?: boolean): void {
        this.showHideDropletDiv(false);
        let pageTopValue: number = this.pdfViewerBase.pageSize[this.pdfViewerBase.currentPageNumber - 1].top;
        let topClientValue: number = this.getClientValueTop(y, this.pdfViewerBase.currentPageNumber - 1);
        // tslint:disable-next-line
        let leftDivElement: any = document.getElementById(this.pdfViewer.element.id + '_droplet_left');
        leftDivElement.style.display = '';
        if (isSelected) {
            // tslint:disable-next-line:max-line-length
            leftDivElement.style.top = topClientValue * this.pdfViewerBase.getZoomFactor() + pageTopValue * this.pdfViewerBase.getZoomFactor() + 'px';
        } else {
            // tslint:disable-next-line:max-line-length
            leftDivElement.style.top = topClientValue + pageTopValue * this.pdfViewerBase.getZoomFactor() + 'px';
        }
        leftDivElement.style.left = x - this.pdfViewerBase.viewerContainer.getBoundingClientRect().left - 20 + 'px';
    }


    private getClientValueTop(clientValue: number, pageNumber: number): number {
        // tslint:disable-next-line:max-line-length
        return clientValue - this.pdfViewerBase.getElement('_pageDiv_' + pageNumber).getBoundingClientRect().top;
    }
    /**
     * @private
     */
    // tslint:disable-next-line
    public renderTextMarkupAnnotationsInPage(textMarkupAnnotations: any, pageNumber: number, isImportTextMarkup?: boolean): void {
        let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
        if (isImportTextMarkup) {
            this.renderTextMarkupAnnotations(null, pageNumber, canvas, this.pdfViewerBase.getZoomFactor());
            this.renderTextMarkupAnnotations(textMarkupAnnotations, pageNumber, canvas, this.pdfViewerBase.getZoomFactor(), true);
        } else {
            this.renderTextMarkupAnnotations(textMarkupAnnotations, pageNumber, canvas, this.pdfViewerBase.getZoomFactor());
        }
    }

    // tslint:disable-next-line
    private renderTextMarkupAnnotations(textMarkupAnnotations: any, pageNumber: number, canvas: HTMLElement, factor: number, isImportAction?: boolean): void {
        if (canvas) {
            let context: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d');
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.setLineDash([]);
            // tslint:disable-next-line
            let annotations: any[];
            if (!isImportAction) {
                annotations = this.getAnnotations(pageNumber, textMarkupAnnotations);
            } else {
                annotations = textMarkupAnnotations;
            }
            if (annotations) {
                for (let i: number = 0; i < annotations.length; i++) {
                    // tslint:disable-next-line
                    let annotation: any = annotations[i];
                    let annotationObject: ITextMarkupAnnotation = null;
                    if (annotation.TextMarkupAnnotationType) {
                        // tslint:disable-next-line:max-line-length
                        annotationObject = {
                            textMarkupAnnotationType: annotation.TextMarkupAnnotationType, color: annotation.Color, opacity: annotation.Opacity, bounds: annotation.Bounds, author: annotation.Author, subject: annotation.Subject, modifiedDate: annotation.ModifiedDate, note: annotation.Note, rect: annotation.Rect,
                            // tslint:disable-next-line:max-line-length
                            annotName: annotation.AnnotName, comments: this.pdfViewer.annotationModule.getAnnotationComments(annotation.Comments, annotation, annotation.Author), review: { state: annotation.State, stateModel: annotation.StateModel, modifiedDate: annotation.ModifiedDate, author: annotation.Author }, shapeAnnotationType: 'textMarkup', pageNumber: pageNumber,
                            textMarkupContent: '', textMarkupStartIndex: 0, textMarkupEndIndex: 0
                        };
                        if (annotation.textMarkupContent && annotation.textMarkupContent !== '') {
                            annotationObject.textMarkupContent = annotation.textMarkupContent;
                            annotationObject.textMarkupStartIndex = annotation.textMarkupStartIndex;
                            annotationObject.textMarkupEndIndex = annotation.textMarkupEndIndex;
                        }
                        this.pdfViewer.annotationModule.storeAnnotations(pageNumber, annotationObject, '_annotations_textMarkup');
                    }
                    // tslint:disable-next-line:max-line-length
                    let type: string = annotation.TextMarkupAnnotationType ? annotation.TextMarkupAnnotationType : annotation.textMarkupAnnotationType;
                    // tslint:disable-next-line
                    let annotBounds: any = annotation.Bounds ? annotation.Bounds : annotation.bounds;
                    let opacity: number = annotation.Opacity ? annotation.Opacity : annotation.opacity;
                    let color: string = annotation.Color ? annotation.Color : annotation.color;
                    switch (type) {
                        case 'Highlight':
                            this.renderHighlightAnnotation(annotBounds, opacity, color, context, factor);
                            break;
                        case 'Strikethrough':
                            this.renderStrikeoutAnnotation(annotBounds, opacity, color, context, factor);
                            break;
                        case 'Underline':
                            this.renderUnderlineAnnotation(annotBounds, opacity, color, context, factor);
                            break;
                    }
                }
            }
            if (pageNumber === this.selectTextMarkupCurrentPage) {
                if (!this.isAnnotationSelect) {
                    this.maintainAnnotationSelection();
                } else {
                    this.isAnnotationSelect = false;
                }
            }
        }
    }

    /**
     * @private
     */
    public drawTextMarkupAnnotations(type: string): void {
        this.isTextMarkupAnnotationMode = true;
        this.currentTextMarkupAddMode = type;
        let selectionObject: ISelection[] = this.pdfViewer.textSelectionModule.selectionRangeArray;
        if (selectionObject.length > 0 && !this.isSelectionMaintained) {
            this.convertSelectionToTextMarkup(type, selectionObject, this.pdfViewerBase.getZoomFactor());
        }
        if (this.pdfViewer.enableTextMarkupResizer && this.isExtended && window.getSelection().toString()) {
            let pageBounds: IPageAnnotationBounds[] = this.getDrawnBounds();
            if (pageBounds[0] && pageBounds[0].bounds) {
                this.updateTextMarkupAnnotationBounds(pageBounds);
            }

        } else if (window.getSelection().toString()) {
            let pageBounds: IPageAnnotationBounds[] = this.getDrawnBounds();
            if (pageBounds.length > 0) {
                for (let i: number = 0; i < pageBounds.length; i++) {
                    // tslint:disable-next-line:max-line-length
                    this.drawTextMarkups(type, pageBounds[i].bounds, pageBounds[i].pageIndex, pageBounds[i].rect, this.pdfViewerBase.getZoomFactor(), pageBounds[i].textContent, pageBounds[i].startIndex, pageBounds[i].endIndex);
                }
            }
        }
        this.isExtended = false;
        this.isSelectionMaintained = false;
        // this.pdfViewerBase.annotationHelper.redoCollection = [];
        this.pdfViewer.textSelectionModule.clearTextSelection();
        if (this.pdfViewer.enableTextMarkupResizer) {
            this.updateAnnotationBounds();
        }
    }

    private convertSelectionToTextMarkup(type: string, selectionObject: ISelection[], factor: number): void {
        for (let i: number = 0; i < selectionObject.length; i++) {
            let textValue: string = selectionObject[i].textContent.replace(/(\r\n|\n|\r)/gm, '');
            // tslint:disable-next-line
            let indexes: any;
            if (selectionObject[i].startNode === selectionObject[i].endNode) {
                let parentText: string = document.getElementById(selectionObject[i].startNode).textContent.replace(/(\r\n|\n|\r)/gm, '');
                indexes = this.getIndexNumbers(selectionObject[i].pageNumber, textValue, parentText);
            } else {
                indexes = this.getIndexNumbers(selectionObject[i].pageNumber, textValue);
            }
            // tslint:disable-next-line:max-line-length
            this.drawTextMarkups(type, selectionObject[i].rectangleBounds, selectionObject[i].pageNumber, selectionObject[i].bound, factor, textValue, indexes.startIndex, indexes.endIndex);
        }
    }

    // tslint:disable-next-line
    private updateTextMarkupAnnotationBounds(pageBounds: IPageAnnotationBounds[]): void {
        if (this.currentTextMarkupAnnotation) {
            let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(this.selectTextMarkupCurrentPage, null);
            let annotation: ITextMarkupAnnotation = null;
            if (pageAnnotations) {
                for (let i: number = 0; i < pageAnnotations.length; i++) {
                    if (JSON.stringify(this.currentTextMarkupAnnotation) === JSON.stringify(pageAnnotations[i])) {
                        pageAnnotations[i].bounds = pageBounds[0].bounds;
                        pageAnnotations[i].textMarkupContent = pageBounds[0].textContent;
                        pageAnnotations[i].textMarkupStartIndex = pageBounds[0].startIndex;
                        pageAnnotations[i].textMarkupEndIndex = pageBounds[0].endIndex;
                        let date: Date = new Date();
                        pageAnnotations[i].modifiedDate = date.toLocaleString();
                        annotation = pageAnnotations[i];
                    }
                }
                this.manageAnnotations(pageAnnotations, this.selectTextMarkupCurrentPage);
                this.currentTextMarkupAnnotation = null;
                this.pdfViewer.annotationModule.renderAnnotations(this.selectTextMarkupCurrentPage, null, null, null);
                this.pdfViewerBase.isDocumentEdited = true;
                if (annotation) {
                    // tslint:disable-next-line
                    let settings: any = { opacity: annotation.opacity, color: annotation.color, author: annotation.author, subject: annotation.subject, modifiedDate: annotation.modifiedDate };
                    // tslint:disable-next-line:max-line-length
                    this.pdfViewer.fireAnnotationResize(this.selectTextMarkupCurrentPage, annotation.annotName, annotation.textMarkupAnnotationType as AnnotationType, annotation.bounds, settings, annotation.textMarkupContent, annotation.textMarkupStartIndex, annotation.textMarkupEndIndex);
                }
                // tslint:disable-next-line:max-line-length
                this.currentAnnotationIndex = null;
                this.selectTextMarkupCurrentPage = null;
            }
        }
    }
    // tslint:disable-next-line
    private updateAnnotationContent(annotation: any, pageBound: any): any {
        if (annotation) {
            let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(this.selectTextMarkupCurrentPage, null);
            let annotation: ITextMarkupAnnotation = null;
            if (pageAnnotations) {
                for (let i: number = 0; i < pageAnnotations.length; i++) {
                    if (JSON.stringify(this.currentTextMarkupAnnotation) === JSON.stringify(pageAnnotations[i])) {
                        pageAnnotations[i].textMarkupContent = pageBound.textContent;
                        pageAnnotations[i].textMarkupStartIndex = pageBound.startIndex;
                        pageAnnotations[i].textMarkupEndIndex = pageBound.endIndex;
                        annotation = pageAnnotations[i];
                    }
                }
                this.manageAnnotations(pageAnnotations, this.selectTextMarkupCurrentPage);
            }
        }
    }
    // tslint:disable-next-line
    private drawTextMarkups(type: string, bounds: IRectangle[], pageNumber: number, rect: any, factor: number, textContent: string, startIndex: number, endIndex: number): void {
        let annotation: ITextMarkupAnnotation = null;
        this.isNewAnnotation = false;
        let author: string = 'Guest';
        let context: CanvasRenderingContext2D = this.getPageContext(pageNumber);
        if (context) {
            context.setLineDash([]);
            switch (type) {
                case 'Highlight':
                    this.isNewAnnotation = true;
                    // tslint:disable-next-line:max-line-length
                    author = (this.pdfViewer.annotationSettings.author !== 'Guest') ? this.pdfViewer.annotationSettings.author : this.pdfViewer.highlightSettings.author;
                    // tslint:disable-next-line:max-line-length
                    annotation = this.getAddedAnnotation(type, this.highlightColor, this.highlightOpacity, bounds, author, this.pdfViewer.highlightSettings.subject, this.pdfViewer.highlightSettings.modifiedDate, '', rect, pageNumber, textContent, startIndex, endIndex);
                    if (annotation) {
                        this.renderHighlightAnnotation(annotation.bounds, annotation.opacity, annotation.color, context, factor);
                    }
                    break;
                case 'Strikethrough':
                    this.isNewAnnotation = true;
                    // tslint:disable-next-line:max-line-length
                    author = (this.pdfViewer.annotationSettings.author !== 'Guest') ? this.pdfViewer.annotationSettings.author : this.pdfViewer.strikethroughSettings.author;
                    // tslint:disable-next-line:max-line-length
                    annotation = this.getAddedAnnotation(type, this.strikethroughColor, this.strikethroughOpacity, bounds, author, this.pdfViewer.strikethroughSettings.subject, this.pdfViewer.strikethroughSettings.modifiedDate, '', rect, pageNumber, textContent, startIndex, endIndex);
                    if (annotation) {
                        this.renderStrikeoutAnnotation(annotation.bounds, annotation.opacity, annotation.color, context, factor);
                    }
                    break;
                case 'Underline':
                    this.isNewAnnotation = true;
                    // tslint:disable-next-line:max-line-length
                    author = (this.pdfViewer.annotationSettings.author !== 'Guest') ? this.pdfViewer.annotationSettings.author : this.pdfViewer.underlineSettings.author;
                    // tslint:disable-next-line:max-line-length
                    annotation = this.getAddedAnnotation(type, this.underlineColor, this.underlineOpacity, bounds, author, this.pdfViewer.underlineSettings.subject, this.pdfViewer.underlineSettings.modifiedDate, '', rect, pageNumber, textContent, startIndex, endIndex);
                    if (annotation) {
                        this.renderUnderlineAnnotation(annotation.bounds, annotation.opacity, annotation.color, context, factor);
                    }
                    break;
            }
            this.isNewAnnotation = false;
            if (annotation) {
                this.pdfViewerBase.isDocumentEdited = true;
                // tslint:disable-next-line
                let settings: any = { opacity: annotation.opacity, color: annotation.color, author: annotation.author, subject: annotation.subject, modifiedDate: annotation.modifiedDate };
                let index: number = this.pdfViewer.annotationModule.actionCollection[this.pdfViewer.annotationModule.actionCollection.length - 1].index;
                // tslint:disable-next-line:max-line-length
                this.pdfViewer.fireAnnotationAdd(pageNumber, annotation.annotName, (type as AnnotationType), annotation.bounds, settings, textContent, startIndex, endIndex);
            }
        }
    }
    // tslint:disable-next-line
    private retreiveTextIndex(annotation: any): any {
        if (annotation.textMarkupContent === '') {
            this.retreieveSelection(annotation, null);
            let pageBounds: IPageAnnotationBounds[] = this.getDrawnBounds();
            window.getSelection().removeAllRanges();
            if (pageBounds[0] && pageBounds[0].bounds) {
                this.updateAnnotationContent(annotation, pageBounds[0]);
                annotation.textMarkupContent = pageBounds[0].textContent;
                annotation.textMarkupStartIndex = pageBounds[0].startIndex;
                annotation.textMarkupEndIndex = pageBounds[0].endIndex;
            }
        }
        return annotation;
    }

    // tslint:disable-next-line
    private renderHighlightAnnotation(bounds: any[], opacity: number, color: string, context: CanvasRenderingContext2D, factor: number): void {
        for (let i: number = 0; i < bounds.length; i++) {
            // tslint:disable-next-line
            let bound: any = bounds[i];
            context.beginPath();
            let x: number = bound.X ? bound.X : bound.left;
            let y: number = bound.Y ? bound.Y : bound.top;
            let width: number = bound.Width ? bound.Width : bound.width;
            let height: number = bound.Height ? bound.Height : bound.height;
            // tslint:disable-next-line:max-line-length
            context.rect((x * factor), (y * factor), (width * factor), (height * factor));
            context.globalAlpha = opacity * 0.5;
            context.closePath();
            context.fillStyle = color;
            context.msFillRule = 'nonzero';
            context.fill();
        }
        context.save();
    }

    // tslint:disable-next-line
    private renderStrikeoutAnnotation(bounds: any[], opacity: number, color: string, context: CanvasRenderingContext2D, factor: number): void {
        for (let i: number = 0; i < bounds.length; i++) {
            // tslint:disable-next-line
            let bound: any = this.getProperBounds(bounds[i]);
            this.drawLine(opacity, bound.x, bound.y, bound.width, (bound.height / 2), color, factor, context);
        }
    }

    // tslint:disable-next-line
    private renderUnderlineAnnotation(bounds: any[], opacity: number, color: string, context: CanvasRenderingContext2D, factor: number): void {
        for (let i: number = 0; i < bounds.length; i++) {
            // tslint:disable-next-line
            let boundValues: any = this.getProperBounds(bounds[i]);
            this.drawLine(opacity, boundValues.x, boundValues.y, boundValues.width, boundValues.height, color, factor, context);
        }
    }

    // tslint:disable-next-line
    private getProperBounds(bound: any): any {
        let x: number = bound.X ? bound.X : bound.left;
        let y: number = bound.Y ? bound.Y : bound.top;
        let width: number = bound.Width ? bound.Width : bound.width;
        let height: number = bound.Height ? bound.Height : bound.height;
        return { x: x, y: y, width: width, height: height };
    }

    // tslint:disable-next-line:max-line-length
    private drawLine(opacity: number, x: number, y: number, width: number, height: number, color: string, factor: number, context: CanvasRenderingContext2D): void {
        context.globalAlpha = opacity;
        context.beginPath();
        context.moveTo((x * factor), (y + height) * factor);
        context.lineTo((width + x) * factor, (y + height) * factor);
        context.lineWidth = 1;
        context.strokeStyle = color;
        context.closePath();
        context.msFillRule = 'nonzero';
        context.stroke();
    }

    /**
     * @private
     */
    // tslint:disable-next-line
    public printTextMarkupAnnotations(textMarkupAnnotations: any, pageIndex: number, stampData: any, shapeData: any, measureShapeData: any, stickyData: any): string {
        let canvas: HTMLCanvasElement = createElement('canvas', { id: this.pdfViewer.element.id + '_print_annotation_layer_' + pageIndex }) as HTMLCanvasElement;
        canvas.style.width = 816 + 'px';
        canvas.style.height = 1056 + 'px';
        let pageWidth: number = this.pdfViewerBase.pageSize[pageIndex].width;
        let pageHeight: number = this.pdfViewerBase.pageSize[pageIndex].height;
        canvas.height = pageHeight * this.pdfViewerBase.getZoomFactor();
        canvas.width = pageWidth * this.pdfViewerBase.getZoomFactor();
        // tslint:disable-next-line
        let textMarkupannotations: any = this.getAnnotations(pageIndex, null, '_annotations_textMarkup');
        // tslint:disable-next-line
        let shapeAnnotation: any = this.getAnnotations(pageIndex, null, '_annotations_shape');
        // tslint:disable-next-line
        let measureShapeAnnotation: any = this.getAnnotations(pageIndex, null, '_annotations_shape_measure');
        // tslint:disable-next-line
        let stampAnnotation: any = this.getAnnotations(pageIndex, null, '_annotations_stamp');
        // tslint:disable-next-line
        let stickyNoteAnnotation: any = this.getAnnotations(pageIndex, null, '_annotations_sticky');
        if (stampAnnotation || shapeAnnotation || stickyNoteAnnotation || measureShapeAnnotation) {
            this.pdfViewer.renderDrawing(canvas, pageIndex);
        } else {
            this.pdfViewer.annotation.renderAnnotations(pageIndex, shapeData, measureShapeData, null, canvas);
            this.pdfViewer.annotation.stampAnnotationModule.renderStampAnnotations(stampData, pageIndex, canvas);
            this.pdfViewer.annotation.stickyNotesAnnotationModule.renderStickyNotesAnnotations(stickyData, pageIndex, canvas);
        }
        if (textMarkupannotations) {
            this.renderTextMarkupAnnotations(null, pageIndex, canvas, 1);
        } else {
            this.renderTextMarkupAnnotations(textMarkupAnnotations, pageIndex, canvas, 1);
        }
        let imageSource: string = (canvas as HTMLCanvasElement).toDataURL();
        return imageSource;
    }

    /**
     * @private
     */
    public saveTextMarkupAnnotations(): string {
        // tslint:disable-next-line
        let storeTextMarkupObject: any = window.sessionStorage.getItem(this.pdfViewerBase.documentId + '_annotations_textMarkup');
        if (this.pdfViewerBase.isStorageExceed) {
            storeTextMarkupObject = this.pdfViewerBase.annotationStorage[this.pdfViewerBase.documentId + '_annotations_textMarkup'];
        }
        // tslint:disable-next-line
        let textMarkupAnnotations: Array<any> = new Array();
        let textMarkupColorpick: ColorPicker = new ColorPicker();
        for (let j: number = 0; j < this.pdfViewerBase.pageCount; j++) {
            textMarkupAnnotations[j] = [];
        }
        if (storeTextMarkupObject && this.pdfViewer.annotationSettings.isDownload) {
            let textMarkupAnnotationCollection: IPageAnnotations[] = JSON.parse(storeTextMarkupObject);
            for (let i: number = 0; i < textMarkupAnnotationCollection.length; i++) {
                let newArray: ITextMarkupAnnotation[] = [];
                let pageAnnotationObject: IPageAnnotations = textMarkupAnnotationCollection[i];
                if (pageAnnotationObject) {
                    for (let z: number = 0; pageAnnotationObject.annotations.length > z; z++) {
                        // tslint:disable-next-line:max-line-length
                        pageAnnotationObject.annotations[z].bounds = JSON.stringify(this.getBoundsForSave(pageAnnotationObject.annotations[z].bounds, i));
                        let colorString: string = textMarkupColorpick.getValue(pageAnnotationObject.annotations[z].color, 'rgba');
                        pageAnnotationObject.annotations[z].color = JSON.stringify(this.getRgbCode(colorString));
                        pageAnnotationObject.annotations[z].rect = JSON.stringify(pageAnnotationObject.annotations[z].rect);
                    }
                    newArray = pageAnnotationObject.annotations;
                }
                textMarkupAnnotations[pageAnnotationObject.pageIndex] = newArray;
            }
        }
        return JSON.stringify(textMarkupAnnotations);
    }

    /**
     * @private
     */
    public deleteTextMarkupAnnotation(): void {
        if (this.currentTextMarkupAnnotation) {
            this.showHideDropletDiv(true);
            let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(this.selectTextMarkupCurrentPage, null);
            let deletedAnnotation: ITextMarkupAnnotation = null;
            if (pageAnnotations) {
                for (let i: number = 0; i < pageAnnotations.length; i++) {
                    if (JSON.stringify(this.currentTextMarkupAnnotation) === JSON.stringify(pageAnnotations[i])) {
                        deletedAnnotation = pageAnnotations.splice(i, 1)[0];
                        // tslint:disable-next-line:max-line-length
                        this.pdfViewer.annotationModule.addAction(this.selectTextMarkupCurrentPage, i, deletedAnnotation, 'Text Markup Deleted', null);
                        this.currentAnnotationIndex = i;
                        this.pdfViewer.annotation.stickyNotesAnnotationModule.findPosition(deletedAnnotation, 'textMarkup');
                        let removeDiv: HTMLElement = document.getElementById(deletedAnnotation.annotName);
                        if (removeDiv) {
                            if (removeDiv.parentElement.childElementCount === 1) {
                                this.pdfViewer.annotationModule.stickyNotesAnnotationModule.updateAccordionContainer(removeDiv);
                            } else {
                                removeDiv.remove();
                            }
                        }
                    }
                }
                this.pdfViewer.annotationModule.updateAnnotationCollection(this.currentTextMarkupAnnotation);
                this.manageAnnotations(pageAnnotations, this.selectTextMarkupCurrentPage);
                // tslint:disable-next-line:max-line-length
                this.pdfViewer.annotationModule.updateImportAnnotationCollection(this.currentTextMarkupAnnotation, this.currentTextMarkupAnnotation.pageNumber, 'textMarkupAnnotation');
                let annotationId: string = this.currentTextMarkupAnnotation.annotName;
                // tslint:disable-next-line
                let annotationBounds: any = this.currentTextMarkupAnnotation.bounds;
                this.currentTextMarkupAnnotation = null;
                this.pdfViewer.annotationModule.renderAnnotations(this.selectTextMarkupCurrentPage, null, null, null);
                this.pdfViewerBase.isDocumentEdited = true;
                // tslint:disable-next-line:max-line-length
                this.pdfViewer.fireAnnotationRemove(this.selectTextMarkupCurrentPage, annotationId, deletedAnnotation.textMarkupAnnotationType as AnnotationType, annotationBounds, deletedAnnotation.textMarkupContent, deletedAnnotation.textMarkupStartIndex, deletedAnnotation.textMarkupEndIndex); this.currentAnnotationIndex = null;
                this.selectTextMarkupCurrentPage = null;
                if (Browser.isDevice) {
                    // tslint:disable-next-line:max-line-length
                    this.pdfViewer.toolbarModule.annotationToolbarModule.hideMobileAnnotationToolbar();
                    this.pdfViewer.toolbarModule.showToolbar(true);
                }
            }
        }
    }

    /**
     * @private
     */
    public modifyColorProperty(color: string): void {
        if (this.currentTextMarkupAnnotation) {
            let pageAnnotations: ITextMarkupAnnotation[] = this.modifyAnnotationProperty('Color', color, null);
            this.manageAnnotations(pageAnnotations, this.selectTextMarkupCurrentPage);
            this.pdfViewer.annotationModule.renderAnnotations(this.selectTextMarkupCurrentPage, null, null, null);
            this.pdfViewerBase.isDocumentEdited = true;
            // tslint:disable-next-line
            let annotation: any = this.currentTextMarkupAnnotation;
            // tslint:disable-next-line:max-line-length
            this.pdfViewer.fireAnnotationPropertiesChange(this.selectTextMarkupCurrentPage, annotation.annotName, annotation.textMarkupAnnotationType as AnnotationType, true, false, false, false, annotation.textMarkupContent, annotation.textMarkupStartIndex, annotation.textMarkupEndIndex); this.currentAnnotationIndex = null;
        }
    }

    /**
     * @private
     */
    public modifyOpacityProperty(args: ChangeEventArgs, isOpacity?: number): void {
        if (this.currentTextMarkupAnnotation) {
            let pageAnnotations: ITextMarkupAnnotation[];
            if (isOpacity) {
                pageAnnotations = this.modifyAnnotationProperty('Opacity', isOpacity, 'changed');
            } else {
                pageAnnotations = this.modifyAnnotationProperty('Opacity', args.value / 100, args.name);
            }
            if (pageAnnotations) {
                this.manageAnnotations(pageAnnotations, this.selectTextMarkupCurrentPage);
                this.pdfViewer.annotationModule.renderAnnotations(this.selectTextMarkupCurrentPage, null, null, null);
                if (isOpacity || args.name === 'changed') {
                    this.pdfViewerBase.isDocumentEdited = true;
                    // tslint:disable-next-line
                    let annotation: any = this.currentTextMarkupAnnotation;
                    // tslint:disable-next-line:max-line-length
                    this.pdfViewer.fireAnnotationPropertiesChange(this.selectTextMarkupCurrentPage, annotation.annotName, annotation.textMarkupAnnotationType as AnnotationType, false, true, false, false, annotation.textMarkupContent, annotation.textMarkupStartIndex, annotation.textMarkupEndIndex); this.currentAnnotationIndex = null;
                }
            }
        }
    }


    // tslint:disable-next-line
    private modifyAnnotationProperty(property: string, value: any, status: string, annotName?: string): ITextMarkupAnnotation[] {
        let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(this.selectTextMarkupCurrentPage, null);
        if (pageAnnotations) {
            for (let i: number = 0; i < pageAnnotations.length; i++) {
                if (JSON.stringify(this.currentTextMarkupAnnotation) === JSON.stringify(pageAnnotations[i])) {
                    let date: Date = new Date();
                    if (property === 'Color') {
                        pageAnnotations[i].color = value;
                    } else {
                        pageAnnotations[i].opacity = value;
                    }
                    pageAnnotations[i].modifiedDate = date.toLocaleString();
                    this.currentAnnotationIndex = i;
                    if (status === null || status === 'changed') {
                        // tslint:disable-next-line:max-line-length
                        this.pdfViewer.annotationModule.addAction(this.selectTextMarkupCurrentPage, i, this.currentTextMarkupAnnotation, 'Text Markup Property modified', property);
                    }
                    this.currentTextMarkupAnnotation = pageAnnotations[i];
                    this.pdfViewer.annotationModule.stickyNotesAnnotationModule.updateAnnotationModifiedDate(pageAnnotations[i]);
                }
            }
        }
        return pageAnnotations;
    }

    /**
     * @private
     */
    public undoTextMarkupAction(annotation: ITextMarkupAnnotation, pageNumber: number, index: number, action: string): void {
        let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(pageNumber, null);
        if (pageAnnotations) {
            if (action === 'Text Markup Added') {
                this.pdfViewer.annotation.stickyNotesAnnotationModule.findPosition(pageAnnotations[index], 'textMarkup');
                // tslint:disable-next-line
                let removeDiv: any = document.getElementById(pageAnnotations[index].annotName);
                if (removeDiv) {
                    if (removeDiv.parentElement.childElementCount === 1) {
                        this.pdfViewer.annotationModule.stickyNotesAnnotationModule.updateAccordionContainer(removeDiv);
                    } else {
                        removeDiv.remove();
                    }
                }
                pageAnnotations.splice(index, 1);
            } else if (action === 'Text Markup Deleted') {
                // tslint:disable-next-line:max-line-length
                this.pdfViewer.annotationModule.stickyNotesAnnotationModule.addAnnotationComments(pageNumber, annotation.shapeAnnotationType);
                pageAnnotations.splice(index, 0, annotation);
            }
        }
        this.clearCurrentAnnotation();
        this.pdfViewerBase.isDocumentEdited = true;
        this.manageAnnotations(pageAnnotations, pageNumber);
        this.pdfViewer.annotationModule.renderAnnotations(pageNumber, null, null, null);
    }

    /**
     * @private
     */
    // tslint:disable-next-line:max-line-length
    public undoRedoPropertyChange(annotation: ITextMarkupAnnotation, pageNumber: number, index: number, property: string, isUndoAction?: boolean): ITextMarkupAnnotation {
        let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(pageNumber, null);
        if (pageAnnotations) {
            if (property === 'Color') {
                let tempColor: string = pageAnnotations[index].color;
                pageAnnotations[index].color = annotation.color;
                annotation.color = tempColor;
            } else {
                let tempOpacity: number = pageAnnotations[index].opacity;
                pageAnnotations[index].opacity = annotation.opacity;
                annotation.opacity = tempOpacity;
            }
            this.pdfViewer.annotationModule.stickyNotesAnnotationModule.updateAnnotationModifiedDate(annotation, null, true);
            if (isUndoAction) {
                annotation.modifiedDate = new Date().toLocaleString();
            }
        }
        this.clearCurrentAnnotation();
        this.pdfViewerBase.isDocumentEdited = true;
        this.manageAnnotations(pageAnnotations, pageNumber);
        this.pdfViewer.annotationModule.renderAnnotations(pageNumber, null, null, null);
        return annotation;
    }

    /**
     * @private
     */
    public redoTextMarkupAction(annotation: ITextMarkupAnnotation, pageNumber: number, index: number, action: string): void {
        let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(pageNumber, null);
        if (pageAnnotations) {
            if (action === 'Text Markup Added') {
                // tslint:disable-next-line:max-line-length
                this.pdfViewer.annotationModule.stickyNotesAnnotationModule.addAnnotationComments(pageNumber, annotation.shapeAnnotationType);
                pageAnnotations.push(annotation);
            } else if (action === 'Text Markup Deleted') {
                this.pdfViewer.annotation.stickyNotesAnnotationModule.findPosition(pageAnnotations[index], 'textMarkup');
                // tslint:disable-next-line
                let removeDiv: any = document.getElementById(pageAnnotations[index].annotName);
                if (removeDiv) {
                    if (removeDiv.parentElement.childElementCount === 1) {
                        this.pdfViewer.annotationModule.stickyNotesAnnotationModule.updateAccordionContainer(removeDiv);
                    } else {
                        removeDiv.remove();
                    }
                }
                pageAnnotations.splice(index, 1);
            }
        }
        this.clearCurrentAnnotation();
        this.pdfViewerBase.isDocumentEdited = true;
        this.manageAnnotations(pageAnnotations, pageNumber);
        this.pdfViewer.annotationModule.renderAnnotations(pageNumber, null, null, null);
    }

    /**
     * @private
     */
    public saveNoteContent(pageNumber: number, note: string): void {
        let pageAnnotations: ITextMarkupAnnotation[] = this.getAnnotations(pageNumber, null);
        if (pageAnnotations) {
            for (let i: number = 0; i < pageAnnotations.length; i++) {
                if (JSON.stringify(this.currentTextMarkupAnnotation) === JSON.stringify(pageAnnotations[i])) {
                    pageAnnotations[i].note = note;
                }
            }
        }
        this.manageAnnotations(pageAnnotations, pageNumber);
        this.pdfViewerBase.isDocumentEdited = true;
    }

    private clearCurrentAnnotation(): void {
        if (!this.isExtended) {
            this.selectTextMarkupCurrentPage = null;
            this.currentTextMarkupAnnotation = null;
            let isSkip: boolean = false;
            // tslint:disable-next-line:max-line-length
            if (this.pdfViewer.annotation.freeTextAnnotationModule && this.pdfViewer.annotation.freeTextAnnotationModule.isInuptBoxInFocus) {
                isSkip = true;
            }
            if (!isSkip) {
                this.enableAnnotationPropertiesTool(false);
            }
        }
    }

    /**
     * @private
     */
    public clearCurrentAnnotationSelection(pageNumber: number, isSelect?: boolean): void {
        if (isSelect) {
            this.isAnnotationSelect = true;
        } else {
            this.isAnnotationSelect = false;
        }
        let lowerPageIndex: number = (pageNumber - 2) >= 0 ? (pageNumber - 2) : 0;
        // tslint:disable-next-line:max-line-length
        let higherPageIndex: number = (pageNumber + 2) < this.pdfViewerBase.pageCount ? (pageNumber + 2) : this.pdfViewerBase.pageCount - 1;
        for (let k: number = lowerPageIndex; k <= higherPageIndex; k++) {
            this.clearAnnotationSelection(k);
        }
    }

    // tslint:disable-next-line
    private getBoundsForSave(bounds: any, pageIndex: number): any {
        // tslint:disable-next-line
        let newArray: any[] = [];
        for (let i: number = 0; i < bounds.length; i++) {
            // tslint:disable-next-line
            let bound: any = this.getAnnotationBounds(bounds[i], pageIndex);
            newArray.push(bound);
        }
        return newArray;
    }

    // tslint:disable-next-line
    private getAnnotationBounds(bounds: any, pageIndex: number): any {
        let left: number = bounds.left ? bounds.left : bounds.Left;
        let top: number = bounds.top ? bounds.top : bounds.Top;
        let height: number = bounds.height ? bounds.height : bounds.Height;
        let width: number = bounds.width ? bounds.width : bounds.Width;
        let pageDetails: ISize = this.pdfViewerBase.pageSize[pageIndex];
        if (pageDetails) {
            if (pageDetails.rotation === 1) {
                return { left: top, top: pageDetails.width - (left + width), width: height, height: width };
            } else if (pageDetails.rotation === 2) {
                // tslint:disable-next-line:max-line-length
                return { left: pageDetails.width - left - width, top: pageDetails.height - top - height, width: width, height: height };
            } else if (pageDetails.rotation === 3) {
                return { left: pageDetails.height - top - height, top: left, width: height, height: width };
            } else {
                return { left: left, top: top, width: width, height: height };
            }
        } else {
            return { left: left, top: top, width: width, height: height };
        }
    }

    // tslint:disable-next-line
    private getRgbCode(colorString: string): any {
        let markupStringArray: string[] = colorString.split(',');
        // tslint:disable-next-line:radix
        let textMarkupR: number = parseInt(markupStringArray[0].split('(')[1]);
        // tslint:disable-next-line:radix
        let textMarkupG: number = parseInt(markupStringArray[1]);
        // tslint:disable-next-line:radix
        let textMarkupB: number = parseInt(markupStringArray[2]);
        // tslint:disable-next-line:radix
        let textMarkupA: number = parseInt(markupStringArray[3]);
        return { a: textMarkupA * 255, r: textMarkupR, g: textMarkupG, b: textMarkupB };
    }

    private getDrawnBounds(): IPageAnnotationBounds[] {
        let pageBounds: IPageAnnotationBounds[] = [];
        let selection: Selection = window.getSelection();
        if (selection.anchorNode !== null) {
            let range: Range = document.createRange();
            let isBackWardSelection: boolean = this.pdfViewerBase.textLayer.isBackWardSelection(selection);
            if (selection.anchorNode === selection.focusNode) {
                let pageId: number = this.pdfViewerBase.textLayer.getPageIndex(selection.anchorNode);
                let startIndex: number = 0;
                let endIndex: number = 0;
                if (!isNaN(pageId)) {
                    let pageRect: ClientRect = this.pdfViewerBase.getElement('_pageDiv_' + pageId).getBoundingClientRect();
                    if (isBackWardSelection) {
                        range.setStart(selection.focusNode, selection.focusOffset);
                        range.setEnd(selection.anchorNode, selection.anchorOffset);
                    } else {
                        if (selection.anchorOffset < selection.focusOffset) {
                            startIndex = selection.anchorOffset;
                            endIndex = selection.focusOffset;
                            range.setStart(selection.anchorNode, selection.anchorOffset);
                            range.setEnd(selection.focusNode, selection.focusOffset);
                        } else {
                            startIndex = selection.focusOffset;
                            endIndex = selection.anchorOffset;
                            range.setStart(selection.focusNode, selection.focusOffset);
                            range.setEnd(selection.anchorNode, selection.anchorOffset);
                        }
                    }
                    let boundingRect: ClientRect = range.getBoundingClientRect();
                    // tslint:disable-next-line
                    let indexes: any = this.getIndexNumbers(pageId, range.toString(), range.commonAncestorContainer.textContent.toString().replace(/(\r\n|\n|\r)/gm, ''));
                    // tslint:disable-next-line:max-line-length
                    let rectangle: IRectangle = { left: this.getDefaultValue(boundingRect.left - pageRect.left), top: this.getDefaultValue(boundingRect.top - pageRect.top), width: this.getDefaultValue(boundingRect.width), height: this.getDefaultValue(boundingRect.height), right: this.getDefaultValue(boundingRect.right - pageRect.left), bottom: this.getDefaultValue(boundingRect.bottom - pageRect.top) };
                    let rectangleArray: IRectangle[] = [];
                    rectangleArray.push(rectangle);
                    // tslint:disable-next-line
                    let rect: any = { left: rectangle.left, top: rectangle.top, right: rectangle.right, bottom: rectangle.bottom };
                    pageBounds.push({ pageIndex: pageId, bounds: rectangleArray, rect: rect, startIndex: indexes.startIndex, endIndex: indexes.endIndex, textContent: range.toString() });
                }
            } else {
                let startNode: Node; let endNode: Node;
                let selectionStartOffset: number; let selectionEndOffset: number;
                if (isBackWardSelection) {
                    startNode = selection.focusNode;
                    selectionStartOffset = selection.focusOffset;
                    endNode = selection.anchorNode;
                    selectionEndOffset = selection.anchorOffset;
                } else {
                    startNode = selection.anchorNode;
                    selectionStartOffset = selection.anchorOffset;
                    endNode = selection.focusNode;
                    selectionEndOffset = selection.focusOffset;
                }
                let anchorPageId: number = this.pdfViewerBase.textLayer.getPageIndex(startNode);
                let anchorTextId: number = this.pdfViewerBase.textLayer.getTextIndex(startNode, anchorPageId);
                let focusPageId: number = this.pdfViewerBase.textLayer.getPageIndex(endNode);
                let focusTextId: number = this.pdfViewerBase.textLayer.getTextIndex(endNode, focusPageId);
                let startOffset: number = 0; let endOffset: number = 0; let currentId: number = 0;
                for (let i: number = anchorPageId; i <= focusPageId; i++) {
                    let selectionRects: IRectangle[] = [];
                    let pageStartId: number; let pageEndId: number; let pageStartOffset: number; let pageEndOffset: number;
                    let textDivs: NodeList = this.pdfViewerBase.getElement('_textLayer_' + i).childNodes;
                    let pageRect: ClientRect = this.pdfViewerBase.getElement('_pageDiv_' + i).getBoundingClientRect();
                    if (i === anchorPageId) {
                        currentId = anchorTextId;
                    } else {
                        currentId = 0;
                    }
                    for (let j: number = currentId; j < textDivs.length; j++) {
                        let textElement: HTMLElement = textDivs[j] as HTMLElement;
                        if (j === currentId) {
                            pageStartId = currentId;
                            pageStartOffset = (i === anchorPageId) ? selectionStartOffset : 0;
                        } else {
                            pageEndId = j;
                            pageEndOffset = (i === focusPageId) ? selectionEndOffset : textElement.textContent.length;
                        }
                        if (j === anchorTextId && i === anchorPageId) {
                            startOffset = selectionStartOffset;
                        } else {
                            startOffset = 0;
                        }
                        if (j === focusTextId && i === focusPageId) {
                            endOffset = selectionEndOffset;
                        } else {
                            endOffset = textElement.textContent.length;
                        }
                        for (let k: number = 0; k < textElement.childNodes.length; k++) {
                            let node: Node = textElement.childNodes[k];
                            range.setStart(node, startOffset);
                            range.setEnd(node, endOffset);
                        }
                        let boundingRect: ClientRect = range.getBoundingClientRect();
                        // tslint:disable-next-line:max-line-length
                        let rectangle: IRectangle = { left: this.getDefaultValue(boundingRect.left - pageRect.left), top: this.getDefaultValue(boundingRect.top - pageRect.top), width: this.getDefaultValue(boundingRect.width), height: this.getDefaultValue(boundingRect.height), right: this.getDefaultValue(boundingRect.right - pageRect.left), bottom: this.getDefaultValue(boundingRect.bottom - pageRect.top) };
                        selectionRects.push(rectangle);
                        range.detach();
                        if (i === focusPageId && j === focusTextId) {
                            break;
                        }
                    }
                    let startElementNode: Node = this.pdfViewerBase.getElement('_text_' + i + '_' + pageStartId).childNodes[0];
                    let endElementNode: Node = this.pdfViewerBase.getElement('_text_' + i + '_' + pageEndId).childNodes[0];
                    let pageRange: Range = document.createRange();
                    pageRange.setStart(startElementNode, pageStartOffset);
                    pageRange.setEnd(endElementNode, pageEndOffset);
                    let pageRectBounds: ClientRect = pageRange.getBoundingClientRect();
                    let textValue: string = pageRange.toString().replace(/(\r\n|\n|\r)/gm, '');
                    // tslint:disable-next-line
                    let indexes: any = this.getIndexNumbers(i, textValue);
                    // tslint:disable-next-line:max-line-length
                    let pageRectangle: IRectangle = { left: this.getDefaultValue(pageRectBounds.left - pageRect.left), top: this.getDefaultValue(pageRectBounds.top - pageRect.top), width: this.getDefaultValue(pageRectBounds.width), height: this.getDefaultValue(pageRectBounds.height), right: this.getDefaultValue(pageRectBounds.right - pageRect.left), bottom: this.getDefaultValue(pageRectBounds.bottom - pageRect.top) };
                    // tslint:disable-next-line
                    let rect: any = { left: pageRectangle.left, top: pageRectangle.top, right: pageRectangle.right, bottom: pageRectangle.bottom };
                    pageBounds.push({ pageIndex: i, bounds: selectionRects, rect: rect, startIndex: indexes.startIndex, endIndex: indexes.endIndex, textContent: textValue });
                }
            }
        }
        selection.removeAllRanges();
        return pageBounds;
    }

    // tslint:disable-next-line
    private getIndexNumbers(pageNumber: number, content: string, parentText?: string): any {
        // tslint:disable-next-line
        let storedData: any = this.pdfViewerBase.getStoredData(pageNumber);
        let startIndex: number;
        let endIndex: number;
        if (storedData) {
            let pageText: string = storedData.pageText.replace(/(\r\n|\n|\r)/gm, '');
            if (!isNullOrUndefined(parentText)) {
                let parentIndex: number = pageText.indexOf(parentText);
                let initialIndex: number = parentText.indexOf(content);
                startIndex = parentIndex + initialIndex;
            } else {
                startIndex = pageText.indexOf(content);
            }
            endIndex = startIndex + (content.length - 1);
        }
        return { startIndex: startIndex, endIndex: endIndex };
    }

    /**
     * @private
     */
    public rerenderAnnotationsPinch(pageNumber: number): void {
        let annotCanvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
        if (annotCanvas) {
            let oldAnnotCanvas: HTMLElement = this.pdfViewerBase.getElement('_old_annotationCanvas_' + pageNumber);
            if (oldAnnotCanvas) {
                if (annotCanvas) {
                    oldAnnotCanvas.id = annotCanvas.id;
                    annotCanvas.parentElement.removeChild(annotCanvas);
                } else {
                    oldAnnotCanvas.id = this.pdfViewer.element.id + '_annotationCanvas_' + pageNumber;
                }
                annotCanvas = oldAnnotCanvas;
            }
            annotCanvas.style.width = '';
            annotCanvas.style.height = '';
            (annotCanvas as HTMLCanvasElement).width = this.pdfViewerBase.pageSize[pageNumber].width * this.pdfViewerBase.getZoomFactor();
            (annotCanvas as HTMLCanvasElement).height = this.pdfViewerBase.pageSize[pageNumber].height * this.pdfViewerBase.getZoomFactor();
            this.renderTextMarkupAnnotations(null, pageNumber, annotCanvas, this.pdfViewerBase.getZoomFactor());
        }
    }

    /**
     * @private
     */
    public rerenderAnnotations(pageNumber: number): void {
        let oldCanvas: HTMLElement = this.pdfViewerBase.getElement('_old_annotationCanvas_' + pageNumber);
        if (oldCanvas) {
            oldCanvas.parentElement.removeChild(oldCanvas);
        }
        let newCanvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
        if (newCanvas) {
            newCanvas.style.display = 'block';
        }
    }

    /**
     * @private
     */
    public onTextMarkupAnnotationMouseUp(event: MouseEvent): void {
        let pageNumber: number = this.pdfViewer.annotationModule.getEventPageNumber(event);
        if (!isNullOrUndefined(pageNumber) && !isNaN(pageNumber)) {
            let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
            if (this.currentTextMarkupAnnotation) {
                this.selectedTextMarkup = this.currentTextMarkupAnnotation;
            } else {
                this.selectedTextMarkup = null;
            }
            this.clearCurrentSelectedAnnotation();
            let currentAnnot: ITextMarkupAnnotation = this.getCurrentMarkupAnnotation(event.clientX, event.clientY, pageNumber, canvas);
            if (currentAnnot) {
                this.selectAnnotation(currentAnnot, canvas, pageNumber, event);
                this.currentTextMarkupAnnotation = currentAnnot;
                this.selectTextMarkupCurrentPage = pageNumber;
                this.enableAnnotationPropertiesTool(true);
                let commentPanelDiv: HTMLElement = document.getElementById(this.pdfViewer.element.id + '_commantPanel');
                if (commentPanelDiv && commentPanelDiv.style.display === 'block') {
                    // tslint:disable-next-line
                    let accordionExpand: any = document.getElementById(this.pdfViewer.element.id + '_accordionContainer' + (pageNumber + 1));
                    if (accordionExpand) {
                        accordionExpand.ej2_instances[0].expandItem(true);
                    }
                    // tslint:disable-next-line
                    let comments: any = document.getElementById(currentAnnot.annotName);
                    if (comments) {
                        comments.firstChild.click();
                    }
                }
                if (this.pdfViewer.toolbarModule && this.pdfViewer.enableAnnotationToolbar) {
                    this.pdfViewer.toolbarModule.annotationToolbarModule.isToolbarHidden = true;
                    this.pdfViewer.toolbarModule.annotationToolbarModule.showAnnotationToolbar(this.pdfViewer.toolbarModule.annotationItem);
                }
            } else {
                this.clearCurrentAnnotation();
            }
            this.clearCurrentAnnotationSelection(pageNumber);
        } else {
            if (!this.pdfViewerBase.isClickedOnScrollBar(event, true)) {
                this.clearCurrentAnnotation();
                this.clearCurrentAnnotationSelection(pageNumber);
            }
        }
    }

    /**
     * @private
     */
    public onTextMarkupAnnotationTouchEnd(event: TouchEvent): void {
        let pageNumber: number = this.pdfViewer.annotationModule.getEventPageNumber(event);
        if (!isNullOrUndefined(pageNumber) && !isNaN(pageNumber)) {
            if (this.currentTextMarkupAnnotation) {
                this.selectedTextMarkup = this.currentTextMarkupAnnotation;
            } else {
                this.selectedTextMarkup = null;
            }
            this.clearCurrentAnnotationSelection(pageNumber);
            let touchCanvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
            this.clearCurrentSelectedAnnotation();
            // tslint:disable-next-line:max-line-length
            let currentAnnot: ITextMarkupAnnotation = this.getCurrentMarkupAnnotation(event.touches[0].clientX, event.touches[0].clientY, pageNumber, touchCanvas);
            if (currentAnnot) {
                this.selectAnnotation(currentAnnot, touchCanvas, pageNumber, event);
                this.currentTextMarkupAnnotation = currentAnnot;
                this.selectTextMarkupCurrentPage = pageNumber;
                this.enableAnnotationPropertiesTool(true);
                // tslint:disable-next-line
                let accordionExpand: any = document.getElementById(this.pdfViewer.element.id + '_accordionContainer' + (pageNumber + 1));
                if (accordionExpand) {
                    accordionExpand.ej2_instances[0].expandItem(true);
                }
                // tslint:disable-next-line
                let comments: any = document.getElementById(currentAnnot.annotName);
                if (comments) {
                    comments.firstChild.click();
                }
            } else {
                this.clearCurrentAnnotation();
            }
            this.clearCurrentAnnotationSelection(pageNumber);
        } else if (this.selectTextMarkupCurrentPage != null && Browser.isDevice) {
            let number: number = this.selectTextMarkupCurrentPage;
            this.selectTextMarkupCurrentPage = null;
            this.clearAnnotationSelection(number);
        } else {
            this.clearCurrentAnnotation();
            this.clearCurrentAnnotationSelection(pageNumber);
        }
    }

    private clearCurrentSelectedAnnotation(): void {
        if (this.currentTextMarkupAnnotation) {
            this.clearAnnotationSelection(this.selectTextMarkupCurrentPage);
            this.clearCurrentAnnotation();
        }
    }

    /**
     * @private
     */
    public onTextMarkupAnnotationMouseMove(event: MouseEvent): void {
        let eventTarget: HTMLElement = event.target as HTMLElement;
        // tslint:disable-next-line
        let pageIndex: number = parseInt(eventTarget.id.split('_text_')[1]) || parseInt(eventTarget.id.split('_textLayer_')[1]) || parseInt(eventTarget.id.split('_annotationCanvas_')[1]);
        if (pageIndex) {
            let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageIndex);
            let currentAnnot: ITextMarkupAnnotation = this.getCurrentMarkupAnnotation(event.clientX, event.clientY, pageIndex, canvas);
            if (currentAnnot) {
                eventTarget.style.cursor = 'pointer';
                // this.showPopupNote(event, currentAnnot);
            } else {
                this.pdfViewer.annotationModule.hidePopupNote();
                if (this.pdfViewerBase.isPanMode && !this.pdfViewerBase.getAnnotationToolStatus()) {
                    eventTarget.style.cursor = 'grab';
                } else {
                    eventTarget.style.cursor = 'auto';
                }
            }
        }
    }

    // tslint:disable-next-line
    private showPopupNote(event: any, annotation: ITextMarkupAnnotation): void {
        if (annotation.note) {
            // tslint:disable-next-line:max-line-length
            this.pdfViewer.annotationModule.showPopupNote(event, annotation.color, annotation.author, annotation.note, annotation.textMarkupAnnotationType);
        }
    }

    private getCurrentMarkupAnnotation(clientX: number, clientY: number, pageNumber: number, canvas: HTMLElement): ITextMarkupAnnotation {
        let currentTextMarkupAnnotations: ITextMarkupAnnotation[] = [];
        if (canvas) {
            let canvasParentPosition: ClientRect = canvas.parentElement.getBoundingClientRect();
            let leftClickPosition: number = clientX - canvasParentPosition.left;
            let topClickPosition: number = clientY - canvasParentPosition.top;
            let annotationList: ITextMarkupAnnotation[] = this.getAnnotations(pageNumber, null);
            let isAnnotationGot: boolean = false;
            if (annotationList) {
                for (let i: number = 0; i < annotationList.length; i++) {
                    let annotation: ITextMarkupAnnotation = annotationList[i];
                    for (let j: number = 0; j < annotation.bounds.length; j++) {
                        // tslint:disable-next-line
                        let bound: any = annotation.bounds[j];
                        let left: number = bound.left ? bound.left : bound.Left;
                        let top: number = bound.top ? bound.top : bound.Top;
                        let width: number = bound.width ? bound.width : bound.Width;
                        let height: number = bound.height ? bound.height : bound.Height;
                        // tslint:disable-next-line:max-line-length
                        if (leftClickPosition >= this.getMagnifiedValue(left, this.pdfViewerBase.getZoomFactor()) && leftClickPosition <= this.getMagnifiedValue(left + width, this.pdfViewerBase.getZoomFactor()) && topClickPosition >= this.getMagnifiedValue(top, this.pdfViewerBase.getZoomFactor()) && topClickPosition <= this.getMagnifiedValue(top + height, this.pdfViewerBase.getZoomFactor())) {
                            currentTextMarkupAnnotations.push(annotation);
                            isAnnotationGot = true;
                        } else {
                            if (isAnnotationGot) {
                                isAnnotationGot = false;
                                break;
                            }
                        }
                    }
                }
            }
            let currentAnnot: ITextMarkupAnnotation = null;
            if (currentTextMarkupAnnotations.length > 1) {
                currentAnnot = this.compareCurrentAnnotations(currentTextMarkupAnnotations);
            } else if (currentTextMarkupAnnotations.length === 1) {
                currentAnnot = currentTextMarkupAnnotations[0];
            }
            return currentAnnot;
        } else {
            return null;
        }
    }

    private compareCurrentAnnotations(annotations: ITextMarkupAnnotation[]): ITextMarkupAnnotation {
        let previousX: number;
        let currentAnnotation: ITextMarkupAnnotation = null;
        for (let i: number = 0; i < annotations.length; i++) {
            if (i === annotations.length - 1) {
                break;
            }
            // tslint:disable-next-line
            let firstAnnotBounds: any = annotations[i].bounds;
            let firstXposition: number = firstAnnotBounds[0].left ? firstAnnotBounds[0].left : firstAnnotBounds[0].Left;
            let firstYposition: number = firstAnnotBounds[0].top ? firstAnnotBounds[0].top : firstAnnotBounds[0].Top;
            // tslint:disable-next-line
            let secondAnnotBounds: any = annotations[i + 1].bounds;
            let secondXposition: number = secondAnnotBounds[0].left ? secondAnnotBounds[0].left : secondAnnotBounds[0].Left;
            let secondYposition: number = secondAnnotBounds[0].top ? secondAnnotBounds[0].top : secondAnnotBounds[0].Top;
            if ((firstXposition < secondXposition) || (firstYposition < secondYposition)) {
                previousX = secondXposition;
                currentAnnotation = annotations[i + 1];
            } else {
                previousX = firstXposition;
                currentAnnotation = annotations[i];
            }
            if (previousX && (i === (annotations.length - 2))) {
                if ((previousX === firstXposition) && (previousX === secondXposition)) {
                    previousX = secondXposition;
                    currentAnnotation = annotations[i + 1];
                }
            }
        }
        return currentAnnotation;
    }
    /**
     * @private
     */
    public clearAnnotationSelection(pageNumber: number): void {
        let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
        if (canvas) {
            let context: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d');
            context.setLineDash([]);
            this.pdfViewer.annotationModule.renderAnnotations(pageNumber, null, null, null);
        }
    }

    /**
     * @private
     */
    // tslint:disable-next-line:max-line-length
    public selectAnnotation(annotation: ITextMarkupAnnotation, canvas: HTMLElement, pageNumber?: number, event?: MouseEvent | TouchEvent): void {
        if (this.pdfViewer.selectedItems.annotations[0]) {
            this.pdfViewer.clearSelection(this.pdfViewer.selectedItems.annotations[0].pageIndex);
            this.pdfViewer.clearSelection(this.selectTextMarkupCurrentPage);
        }
        let isCurrentTextMarkup: boolean = false;
        if (!this.currentTextMarkupAnnotation) {
            isCurrentTextMarkup = true;
        }
        if (this.selectedTextMarkup && annotation) {
            if (this.selectedTextMarkup.annotName === annotation.annotName) {
                isCurrentTextMarkup = false;
            }
        }
        if (!isNaN(pageNumber)) {
            this.selectTextMarkupCurrentPage = pageNumber;
            this.currentTextMarkupAnnotation = annotation;
            annotation = this.retreiveTextIndex(annotation);
            this.currentTextMarkupAnnotation = annotation;
        }
        if (this.isSelectedAnnotation) {
            this.pdfViewerBase.isSelection = true;
            this.updateAnnotationBounds();
        }
        // tslint:disable-next-line
        let currentEvent: any = event;
        if (this.pdfViewer.enableTextMarkupResizer && annotation && currentEvent && !currentEvent.touches) {
            // tslint:disable-next-line
            let boundingRect: any = this.pdfViewerBase.getElement('_textLayer_' + this.selectTextMarkupCurrentPage).getBoundingClientRect();
            let left: number = annotation.bounds[0].left ? annotation.bounds[0].left : annotation.bounds[0].Left;
            let top: number = annotation.bounds[0].top ? annotation.bounds[0].top : annotation.bounds[0].Top;
            this.updateLeftposition(left * this.pdfViewerBase.getZoomFactor() + boundingRect.left, (boundingRect.top + top), true);
            // tslint:disable-next-line
            let endPosition: any = annotation.bounds[annotation.bounds.length - 1];
            let endLeft: number = endPosition.left ? endPosition.left : endPosition.Left;
            let endTop: number = endPosition.top ? endPosition.top : endPosition.Top;
            let endWidth: number = endPosition.width ? endPosition.width : endPosition.Width;
            // tslint:disable-next-line:max-line-length
            this.updatePosition((endLeft + endWidth) * this.pdfViewerBase.getZoomFactor() + boundingRect.left, (endTop + boundingRect.top), true);
        }
        for (let i: number = 0; i < annotation.bounds.length; i++) {
            // tslint:disable-next-line
            let bound: any = annotation.bounds[i];
            let x: number = bound.left ? bound.left : bound.Left;
            let y: number = bound.top ? bound.top : bound.Top;
            let width: number = bound.width ? bound.width : bound.Width;
            let height: number = bound.height ? bound.height : bound.Height;
            // tslint:disable-next-line:max-line-length
            this.drawAnnotationSelectRect(canvas, this.getMagnifiedValue(x - 0.5, this.pdfViewerBase.getZoomFactor()), this.getMagnifiedValue(y - 0.5, this.pdfViewerBase.getZoomFactor()), this.getMagnifiedValue(width + 0.5, this.pdfViewerBase.getZoomFactor()), this.getMagnifiedValue(height + 0.5, this.pdfViewerBase.getZoomFactor()));
        }
        if (annotation.annotName !== '' && !this.isNewAnnotation) {
            if (isCurrentTextMarkup) {
                // tslint:disable-next-line
                let annotationCollection: any = this.getAnnotationsUnderClickPoint(annotation);
                if (annotationCollection) {
                    // tslint:disable-next-line:max-line-length
                    this.pdfViewer.annotationModule.annotationSelect(annotation.annotName, this.selectTextMarkupCurrentPage, annotation, annotationCollection);
                } else {
                    this.pdfViewer.annotationModule.annotationSelect(annotation.annotName, this.selectTextMarkupCurrentPage, annotation);
                }
                this.selectedTextMarkup = null;
            }
        }
        if (annotation && this.pdfViewer.enableTextMarkupResizer) {
            this.isTextMarkupAnnotationMode = true;
        }
    }

    private drawAnnotationSelectRect(canvas: HTMLElement, x: number, y: number, width: number, height: number): void {
        let context: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.beginPath();
        // tslint:disable-next-line:max-line-length
        let lineDash: number[] = isNullOrUndefined(this.pdfViewer.annotationSelectorSettings.selectorLineDashArray) || this.pdfViewer.annotationSelectorSettings.selectorLineDashArray.length === 0 ? [4] : this.pdfViewer.annotationSelectorSettings.selectorLineDashArray;
        if (lineDash.length > 2) {
            lineDash = [lineDash[0], lineDash[1]];
        }
        context.setLineDash(lineDash);
        context.globalAlpha = 1;
        context.rect(x, y, width, height);
        context.closePath();
        // tslint:disable-next-line:max-line-length
        let borderColor: string = isNullOrUndefined(this.pdfViewer.annotationSelectorSettings.selectionBorderColor) || this.pdfViewer.annotationSelectorSettings.selectionBorderColor === '' ? '#0000ff' : this.pdfViewer.annotationSelectorSettings.selectionBorderColor;
        context.strokeStyle = borderColor;
        // tslint:disable-next-line:max-line-length
        context.lineWidth = isNullOrUndefined(this.pdfViewer.annotationSelectorSettings.selectionBorderThickness) ? 1 : this.pdfViewer.annotationSelectorSettings.selectionBorderThickness;
        context.stroke();
        context.save();
    }

    // tslint:disable-next-line
    private getAnnotationsUnderClickPoint(selectAnnotation: any, isCheck?: boolean): any {
        if (!isCheck) {
            this.selectedAnnotation = selectAnnotation;
            this.selectAnnotationCollection = [];
        }
        // Calculate the textmarkup annotation rectangular bounds.
        // tslint:disable-next-line
        let selectBounds: any = this.calculateAnnotationBounds(selectAnnotation);
        // tslint:disable-next-line
        let left: number = parseInt(selectBounds.left);
        // tslint:disable-next-line
        let top: number = parseInt(selectBounds.top);
        // tslint:disable-next-line
        let totalHeight: number = parseInt(selectBounds.top + selectBounds.height);
        // tslint:disable-next-line
        let totalWidth: number = parseInt(selectBounds.left + selectBounds.width);
        // tslint:disable-next-line
        let pageNumber: number = selectAnnotation.pageNumber;
        let annotationList: ITextMarkupAnnotation[] = this.getAnnotations(pageNumber, null);
        for (let i: number = 0; i < annotationList.length; i++) {
            let annotation: ITextMarkupAnnotation = annotationList[i];
            let isAdded: boolean = false;
            if (isCheck) {
                for (let i: number = 0; i < this.selectAnnotationCollection.length; i++) {
                    if (annotation.annotName === this.selectAnnotationCollection[i].annotName) {
                        isAdded = true;
                    }
                    if (annotation.annotName === this.selectedAnnotation.annotName) {
                        isAdded = true;
                    }
                }
            }
            if (selectAnnotation.annotName !== annotation.annotName && !isAdded) {
                // Calculate the textmarkup annotation rectangular bounds.
                // tslint:disable-next-line
                let annotationBounds: any = this.calculateAnnotationBounds(annotation);
                // tslint:disable-next-line
                if ((left >= parseInt(annotationBounds.left)) && (totalWidth <= parseInt(annotationBounds.left + annotationBounds.width + 2)) && (top >= parseInt(annotationBounds.top)) && (top <= parseInt(annotationBounds.top + annotationBounds.height))) {
                    // tslint:disable-next-line
                    left = parseInt(annotationBounds.left);
                    // tslint:disable-next-line
                    totalWidth = parseInt(annotationBounds.left + annotationBounds.width);
                    // tslint:disable-next-line
                    top = parseInt(annotationBounds.top);
                    // tslint:disable-next-line
                    totalHeight = parseInt(annotationBounds.top + annotationBounds.height);
                    annotationBounds = selectBounds;
                } else {
                    // tslint:disable-next-line
                    left = parseInt(selectBounds.left);
                    // tslint:disable-next-line
                    totalWidth = parseInt(selectBounds.left + selectBounds.width);
                    // tslint:disable-next-line
                    top = parseInt(selectBounds.top);
                    // tslint:disable-next-line
                    totalHeight = parseInt(selectBounds.top + selectBounds.height);
                }
                let isOverlap: boolean = false;
                // To Check whether the annotations has same bounds or not.
                // tslint:disable-next-line
                if (left === parseInt(annotationBounds.left) && top === parseInt(annotationBounds.top)) {
                    isOverlap = true;
                }
                // To check left and right positions of the annotations.
                // tslint:disable-next-line 
                if (((left <= parseInt(annotationBounds.left + 1)) && (totalWidth >= parseInt(annotationBounds.left))) || ((left <= parseInt(annotationBounds.left + annotationBounds.width)) && (totalWidth >= parseInt(annotationBounds.left + annotationBounds.width)))) {
                    isOverlap = true;
                }
                if (isOverlap) {
                    // To check top and bottom positions of the annotations. 
                    // tslint:disable-next-line
                    if (((top <= parseInt(annotationBounds.top)) && (totalHeight >= parseInt(annotationBounds.top))) || ((top <= parseInt(annotationBounds.top + annotationBounds.height)) && (totalHeight >= parseInt(annotationBounds.top + annotationBounds.height)))) {
                        isOverlap = true;
                        this.selectAnnotationCollection.push(annotation);
                    }
                } else {
                    isOverlap = false;
                }
            }
        }
        if (this.selectAnnotationCollection.length !== 0) {
            if (!isCheck) {
                let annotCollection: ITextMarkupAnnotation[] = this.selectAnnotationCollection;
                for (let i: number = 0; i < annotCollection.length; i++) {
                    this.getAnnotationsUnderClickPoint(annotCollection[i], true);
                }
                return this.selectAnnotationCollection;
            }
        } else {
            this.selectedAnnotation = null;
            this.selectAnnotationCollection = [];
            return null;
        }
    }

    // tslint:disable-next-line
    private calculateAnnotationBounds(annotation: any): any {
        // tslint:disable-next-line
        let textMarkupAnnotation: any = cloneObject(annotation);
        // tslint:disable-next-line
        let bounds: any = textMarkupAnnotation.bounds;
        let left: number = 0;
        let top: number = 0;
        let width: number = 0;
        let height: number = 0;
        let prevTop: number = 0;
        let prevLeft: number = 0;
        let widthArray: number[] = [];
        for (let i: number = 0; i < bounds.length; i++) {
            if (bounds[i].X || bounds[i].Y) {
                bounds[i].left = bounds[i].X;
                bounds[i].top = bounds[i].Y;
                bounds[i].height = bounds[i].Height;
                bounds[i].width = bounds[i].Width;
            }
            if (!left && !top) {
                left = bounds[i].left;
                top = bounds[i].top;
                height = bounds[i].height;
                width = bounds[i].width;
            } else {
                if (prevTop !== bounds[i].top) {
                    height = height + bounds[i].height;
                    widthArray.push(width);
                    width = 0;
                }
                if (prevLeft !== bounds[i].left) {
                    width = width + bounds[i].width;
                }
                if (left > bounds[i].left) {
                    left = bounds[i].left;
                }
                if (top > bounds[i].top) {
                    top = bounds[i].top;
                }
            }
            prevLeft = bounds[i].left;
            prevTop = bounds[i].top;
        }
        for (let i: number = 0; i < widthArray.length; i++) {
            if (width < widthArray[i]) {
                width = widthArray[i];
            }
        }
        if (bounds.length > 2) {
            height = (bounds[bounds.length - 1].top - bounds[0].top) + bounds[bounds.length - 1].height;
        }
        return { left: left, top: top, width: width, height: height };
    }

    /**
     * @private
     */
    public enableAnnotationPropertiesTool(isEnable: boolean): void {
        // tslint:disable-next-line:max-line-length
        if (this.pdfViewer.toolbarModule && this.pdfViewer.toolbarModule.annotationToolbarModule) {
            this.pdfViewer.toolbarModule.annotationToolbarModule.createMobileAnnotationToolbar(isEnable);
        }
        // tslint:disable-next-line:max-line-length
        if (this.pdfViewer.toolbarModule && this.pdfViewer.toolbarModule.annotationToolbarModule && this.pdfViewer.toolbarModule.annotationToolbarModule.isMobileAnnotEnabled && this.pdfViewer.selectedItems.annotations.length === 0) {
            if (this.pdfViewer.toolbarModule.annotationToolbarModule) {
                this.pdfViewer.toolbarModule.annotationToolbarModule.selectAnnotationDeleteItem(isEnable);
                let enable: boolean = isEnable;
                if (this.isTextMarkupAnnotationMode) {
                    enable = true;
                }
                this.pdfViewer.toolbarModule.annotationToolbarModule.enableTextMarkupAnnotationPropertiesTools(enable);
                if (this.currentTextMarkupAnnotation) {
                    // tslint:disable-next-line:max-line-length
                    this.pdfViewer.toolbarModule.annotationToolbarModule.updateColorInIcon(this.pdfViewer.toolbarModule.annotationToolbarModule.colorDropDownElement, this.currentTextMarkupAnnotation.color);
                } else {
                    if (!this.isTextMarkupAnnotationMode) {
                        // tslint:disable-next-line:max-line-length
                        this.pdfViewer.toolbarModule.annotationToolbarModule.updateColorInIcon(this.pdfViewer.toolbarModule.annotationToolbarModule.colorDropDownElement, '#000000');
                    } else {
                        this.pdfViewer.toolbarModule.annotationToolbarModule.setCurrentColorInPicker();
                    }
                }
            }
        }
    }

    /**
     * @private
     */
    public maintainAnnotationSelection(): void {
        if (this.currentTextMarkupAnnotation) {
            let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + this.selectTextMarkupCurrentPage);
            if (canvas) {
                this.selectAnnotation(this.currentTextMarkupAnnotation, canvas, this.selectTextMarkupCurrentPage);
            }
        }
    }

    // private storeAnnotations(pageNumber: number, annotation: ITextMarkupAnnotation): number {
    //     // tslint:disable-next-line
    //     let storeObject: any = window.sessionStorage.getItem(this.pdfViewerBase.documentId + '_annotations_textMarkup');
    //     let index: number = 0;
    //     if (!storeObject) {
    //         let markupAnnotation: IPageAnnotations = { pageIndex: pageNumber, annotations: [] };
    //         markupAnnotation.annotations.push(annotation);
    //         index = markupAnnotation.annotations.indexOf(annotation);
    //         let annotationCollection: IPageAnnotations[] = [];
    //         annotationCollection.push(markupAnnotation);
    //         let annotationStringified: string = JSON.stringify(annotationCollection);
    //         window.sessionStorage.setItem(this.pdfViewerBase.documentId + '_annotations_textMarkup', annotationStringified);
    //     } else {
    //         let annotObject: IPageAnnotations[] = JSON.parse(storeObject);
    //         window.sessionStorage.removeItem(this.pdfViewerBase.documentId + '_annotations_textMarkup');
    //         let pageIndex: number = this.pdfViewer.annotationModule.getPageCollection(annotObject, pageNumber);
    //         if (annotObject[pageIndex]) {
    //             (annotObject[pageIndex] as IPageAnnotations).annotations.push(annotation);
    //             index = (annotObject[pageIndex] as IPageAnnotations).annotations.indexOf(annotation);
    //         } else {
    //             let markupAnnotation: IPageAnnotations = { pageIndex: pageNumber, annotations: [] };
    //             markupAnnotation.annotations.push(annotation);
    //             index = markupAnnotation.annotations.indexOf(annotation);
    //             annotObject.push(markupAnnotation);
    //         }
    //         let annotationStringified: string = JSON.stringify(annotObject);
    //         window.sessionStorage.setItem(this.pdfViewerBase.documentId + '_annotations_textMarkup', annotationStringified);
    //     }
    //     return index;
    // }

    private manageAnnotations(pageAnnotations: ITextMarkupAnnotation[], pageNumber: number): void {
        // tslint:disable-next-line
        let storeObject: any = window.sessionStorage.getItem(this.pdfViewerBase.documentId + '_annotations_textMarkup');
        if (this.pdfViewerBase.isStorageExceed) {
            storeObject = this.pdfViewerBase.annotationStorage[this.pdfViewerBase.documentId + '_annotations_textMarkup'];
        }
        if (storeObject) {
            let annotObject: IPageAnnotations[] = JSON.parse(storeObject);
            if (!this.pdfViewerBase.isStorageExceed) {
                window.sessionStorage.removeItem(this.pdfViewerBase.documentId + '_annotations_textMarkup');
            }
            let index: number = this.pdfViewer.annotationModule.getPageCollection(annotObject, pageNumber);
            if (annotObject[index]) {
                annotObject[index].annotations = pageAnnotations;
            }
            let annotationStringified: string = JSON.stringify(annotObject);
            if (this.pdfViewerBase.isStorageExceed) {
                this.pdfViewerBase.annotationStorage[this.pdfViewerBase.documentId + '_annotations_textMarkup'] = annotationStringified;
            } else {
                window.sessionStorage.setItem(this.pdfViewerBase.documentId + '_annotations_textMarkup', annotationStringified);
            }
        }
    }

    // tslint:disable-next-line
    private getAnnotations(pageIndex: number, textMarkupAnnotations: any[], id?: string): any[] {
        // tslint:disable-next-line
        let annotationCollection: any[];
        // tslint:disable-next-line
        if (id == null || id == undefined) {
            id = '_annotations_textMarkup';
        }
        // tslint:disable-next-line
        let storeObject: any = window.sessionStorage.getItem(this.pdfViewerBase.documentId + id);
        if (this.pdfViewerBase.isStorageExceed) {
            storeObject = this.pdfViewerBase.annotationStorage[this.pdfViewerBase.documentId + id];
        }
        if (storeObject) {
            let annotObject: IPageAnnotations[] = JSON.parse(storeObject);
            let index: number = this.pdfViewer.annotationModule.getPageCollection(annotObject, pageIndex);
            if (annotObject[index]) {
                annotationCollection = annotObject[index].annotations;
            } else {
                annotationCollection = textMarkupAnnotations;
            }
        } else {
            annotationCollection = textMarkupAnnotations;
        }
        return annotationCollection;
    }

    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line
    private getAddedAnnotation(type: string, color: string, opacity: number, bounds: any, author: string, subject: string, predefinedDate: string, note: string, rect: any, pageNumber: number, textContent: string, startIndex: number, endIndex: number): ITextMarkupAnnotation {
        let date: Date = new Date();
        // tslint:disable-next-line:max-line-length
        let modifiedDate: string = predefinedDate ? predefinedDate : date.toLocaleString();
        let annotationName: string = this.pdfViewer.annotation.createGUID();
        let commentsDivid: string = this.pdfViewer.annotation.stickyNotesAnnotationModule.addComments('textMarkup', pageNumber + 1, type);
        if (commentsDivid) {
            document.getElementById(commentsDivid).id = annotationName;
        }
        let annotation: ITextMarkupAnnotation = {
            // tslint:disable-next-line:max-line-length
            textMarkupAnnotationType: type, color: color, opacity: opacity, bounds: bounds, author: author, subject: subject, modifiedDate: modifiedDate, note: note, rect: rect,
            annotName: annotationName, comments: [], review: { state: '', stateModel: '', author: author, modifiedDate: modifiedDate }, shapeAnnotationType: 'textMarkup', pageNumber: pageNumber,
            textMarkupContent: textContent, textMarkupStartIndex: startIndex, textMarkupEndIndex: endIndex
        };
        if (document.getElementById(annotationName)) {
            document.getElementById(annotationName).addEventListener('mouseup', this.annotationDivSelect(annotation, pageNumber));
        }
        let storedIndex: number = this.pdfViewer.annotationModule.storeAnnotations(pageNumber, annotation, '_annotations_textMarkup');
        this.pdfViewer.annotationModule.addAction(pageNumber, storedIndex, annotation, 'Text Markup Added', null);
        return annotation;
    }

    // tslint:disable-next-line
    private annotationDivSelect(annotation: any, pageNumber: number): any {
        let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
        this.selectAnnotation(annotation, canvas, pageNumber);
        if (this.pdfViewer.toolbarModule) {
            if (this.pdfViewer.toolbarModule.annotationToolbarModule && this.pdfViewer.enableAnnotationToolbar) {
                this.pdfViewer.toolbarModule.annotationToolbarModule.clearShapeMode();
                this.pdfViewer.toolbarModule.annotationToolbarModule.clearMeasureMode();
                this.pdfViewer.toolbarModule.annotationToolbarModule.enableTextMarkupAnnotationPropertiesTools(true);
                this.pdfViewer.toolbarModule.annotationToolbarModule.selectAnnotationDeleteItem(true);
                this.pdfViewer.toolbarModule.annotationToolbarModule.setCurrentColorInPicker();
                this.pdfViewer.toolbarModule.annotationToolbarModule.isToolbarHidden = true;
                this.pdfViewer.toolbarModule.annotationToolbarModule.showAnnotationToolbar(this.pdfViewer.toolbarModule.annotationItem);
            }
        }
    }

    private getPageContext(pageNumber: number): CanvasRenderingContext2D {
        let canvas: HTMLElement = this.pdfViewerBase.getElement('_annotationCanvas_' + pageNumber);
        let context: CanvasRenderingContext2D = null;
        if (canvas) {
            context = (canvas as HTMLCanvasElement).getContext('2d');
        }
        return context;
    }

    private getDefaultValue(value: number): number {
        return value / this.pdfViewerBase.getZoomFactor();
    }

    private getMagnifiedValue(value: number, factor: number): number {
        return value * factor;
    }

    /**
     * @private
     */
    // tslint:disable-next-line
    public saveImportedTextMarkupAnnotations(annotation: any, pageNumber: number): any {
        let annotationObject: ITextMarkupAnnotation = null;
        annotation.Author = this.pdfViewer.annotationModule.updateAnnotationAuthor('textMarkup', annotation.Subject);
        // tslint:disable-next-line:max-line-length
        annotationObject = {
            // tslint:disable-next-line:max-line-length
            textMarkupAnnotationType: annotation.TextMarkupAnnotationType, color: annotation.Color, opacity: annotation.Opacity, bounds: annotation.Bounds, author: annotation.Author, subject: annotation.Subject, modifiedDate: annotation.ModifiedDate, note: annotation.Note, rect: annotation.Rect,
            annotName: annotation.AnnotName, comments: this.pdfViewer.annotationModule.getAnnotationComments(annotation.Comments, annotation, annotation.Author), review: { state: annotation.State, stateModel: annotation.StateModel, modifiedDate: annotation.ModifiedDate, author: annotation.Author }, shapeAnnotationType: 'textMarkup', pageNumber: pageNumber,
            textMarkupContent: '', textMarkupStartIndex: 0, textMarkupEndIndex: 0,
        };
        this.pdfViewer.annotationModule.storeAnnotations(pageNumber, annotationObject, '_annotations_textMarkup');
    }

    /**
     * @private
     */
    // tslint:disable-next-line
    public updateTextMarkupAnnotationCollections(annotation: any, pageNumber: number): any {
        // tslint:disable-next-line
        let annotationObject: any = null;
        annotationObject = {
            // tslint:disable-next-line:max-line-length
            textMarkupAnnotationType: annotation.TextMarkupAnnotationType, color: annotation.Color, opacity: annotation.Opacity, bounds: annotation.Bounds, author: annotation.Author, subject: annotation.Subject, modifiedDate: annotation.ModifiedDate, note: annotation.Note, rect: annotation.Rect,
            annotationId: annotation.AnnotName, comments: this.pdfViewer.annotationModule.getAnnotationComments(annotation.Comments, annotation, annotation.Author), review: { state: annotation.State, stateModel: annotation.StateModel, modifiedDate: annotation.ModifiedDate, author: annotation.Author }, shapeAnnotationType: 'textMarkup', pageNumber: pageNumber
        };
        return annotationObject;
    }

    /**
     * @private
     */
    public clear(): void {
        this.selectTextMarkupCurrentPage = null;
        this.currentTextMarkupAnnotation = null;
        this.selectAnnotationCollection = [];
        this.selectedAnnotation = null;
        window.sessionStorage.removeItem(this.pdfViewerBase.documentId + '_annotations_textMarkup');
    }
}