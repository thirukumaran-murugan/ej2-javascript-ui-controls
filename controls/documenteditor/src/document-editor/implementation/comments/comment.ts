import { createElement, L10n, classList, isNullOrUndefined } from '@syncfusion/ej2-base';
import { DocumentEditor } from '../../document-editor';
import { CommentElementBox, CommentCharacterElementBox, ElementBox } from '../../implementation/viewer/page';
import { DropDownButton, ItemModel, MenuEventArgs } from '@syncfusion/ej2-splitbuttons';
import { Button } from '@syncfusion/ej2-buttons';
import { Toolbar } from '@syncfusion/ej2-navigations';
import { DialogUtility, Dialog } from '@syncfusion/ej2-popups';
import { Dictionary } from '../../base/index';

/**
 * @private
 */
export class CommentReviewPane {
    public owner: DocumentEditor;
    public reviewPane: HTMLElement;
    public closeButton: HTMLElement;
    public toolbarElement: HTMLElement;
    public toolbar: Toolbar;
    public commentPane: CommentPane;
    public headerContainer: HTMLElement;
    public previousSelectedCommentInt: CommentElementBox;
    public isNewComment: boolean = false;
    private confirmDialog: Dialog;

    get previousSelectedComment(): CommentElementBox {
        return this.previousSelectedCommentInt;
    }

    set previousSelectedComment(value: CommentElementBox) {
        if (!isNullOrUndefined(value) && value !== this.previousSelectedCommentInt) {
            if (this.commentPane.comments.containsKey(value)) {
                let commentStart: CommentCharacterElementBox = this.commentPane.getCommentStart(value);
                let commentMark: HTMLElement = commentStart.commentMark;
                if (commentMark) {
                    classList(commentMark, [], ['e-de-cmt-mark-selected']);
                    this.commentPane.removeSelectionMark('e-de-cmt-selection');
                    this.commentPane.removeSelectionMark('e-de-cmt-mark-selected');
                }
                let commentView: CommentView = this.commentPane.comments.get(value);
                commentView.hideDrawer();
                for (let i: number = 0; i < value.replyComments.length; i++) {
                    commentView = this.commentPane.comments.get(value.replyComments[i]);
                    if (commentView) {
                        commentView.hideDrawer();
                        commentView.hideMenuItems();
                    }
                }
            }
        }
        this.previousSelectedCommentInt = value;
    }

    constructor(owner: DocumentEditor) {
        this.owner = owner;
        let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
        localObj.setLocale(this.owner.locale);
        this.initReviewPane(localObj);
        this.reviewPane.style.display = 'none';
    }

    /**
     * @private
     */
    public showHidePane(show: boolean): void {
        if (this.reviewPane) {
            this.reviewPane.style.display = show ? 'block' : 'none';
        }
        if (show) {
            this.commentPane.updateHeight();
        }
        if (this.owner) {
            this.owner.resize();
        }
    }

    public initReviewPane(localValue: L10n): void {
        let reviewContainer: HTMLElement = this.owner.viewer.optionsPaneContainer;
        reviewContainer.style.display = 'inline-flex';
        reviewContainer.appendChild(this.initPaneHeader(localValue));
        this.initCommentPane();
    }

    public initPaneHeader(localValue: L10n): HTMLElement {
        this.headerContainer = createElement('div');
        this.reviewPane = createElement('div', { className: 'e-de-cmt-pane', styles: 'display:none' });
        if (this.owner.enableRtl) {
            classList(this.reviewPane, ['e-rtl'], []);
        }
        let headerWholeDiv: HTMLElement = createElement('div', { className: 'e-de-cp-whole-header' });
        let headerDiv1: HTMLElement = createElement('div', {
            innerHTML: localValue.getConstant('Comments'), className: 'e-de-cp-header'
        });
        this.closeButton = createElement('button', {
            className: 'e-de-cp-close e-btn e-flat e-icon-btn', id: 'close',
            attrs: { type: 'button' }
        }) as HTMLButtonElement;
        this.closeButton.title = localValue.getConstant('Close');
        headerWholeDiv.appendChild(this.closeButton);
        headerWholeDiv.appendChild(headerDiv1);
        let closeSpan: HTMLSpanElement = createElement('span', { className: 'e-de-op-close-icon e-btn-icon e-icons' });
        this.closeButton.appendChild(closeSpan);
        this.headerContainer.appendChild(headerWholeDiv);
        this.headerContainer.appendChild(this.initToolbar(localValue));
        this.reviewPane.appendChild(this.headerContainer);
        this.closeButton.addEventListener('click', this.closePane.bind(this));
        return this.reviewPane;
    }

    public closePane(): void {
        if (this.commentPane && this.commentPane.isEditMode) {
            if (!isNullOrUndefined(this.commentPane.currentEditingComment)
                && this.commentPane.isInsertingReply && this.commentPane.currentEditingComment.replyViewTextBox.value === '') {
                this.owner.viewer.currentSelectedComment = undefined;
                this.commentPane.currentEditingComment.cancelReply();
                this.owner.showComments = false;
            } else if (this.isNewComment || !isNullOrUndefined(this.commentPane.currentEditingComment)
                && this.commentPane.isInsertingReply && this.commentPane.currentEditingComment.replyViewTextBox.value !== '' ||
                !isNullOrUndefined(this.commentPane.currentEditingComment) && !this.commentPane.isInsertingReply &&
                this.commentPane.currentEditingComment.textArea.value !== this.commentPane.currentEditingComment.comment.text) {
                let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
                localObj.setLocale(this.owner.locale);
                this.confirmDialog = DialogUtility.confirm({
                    title: localObj.getConstant('Un-posted comments'),
                    content: localObj.getConstant('Added comments not posted. If you continue, that comment will be discarded.'),
                    okButton: {
                        text: 'Discard', click: this.discardButtonClick.bind(this)
                    },
                    cancelButton: {
                        text: 'Cancel', click: this.closeDialogUtils.bind(this)
                    },
                    showCloseIcon: true,
                    closeOnEscape: true,
                    animationSettings: { effect: 'Zoom' },
                    position: { X: 'Center', Y: 'Center' }
                });
            } else {
                this.owner.viewer.currentSelectedComment = undefined;
                this.commentPane.currentEditingComment.cancelEditing();
                this.owner.showComments = false;
            }
        } else {
            this.owner.viewer.currentSelectedComment = undefined;
            this.owner.showComments = false;
        }
    }

    private discardButtonClick(): void {
        if (this.commentPane.currentEditingComment) {
            let isNewComment: boolean = this.isNewComment;
            if (this.commentPane.currentEditingComment && this.commentPane.isInsertingReply) {
                this.commentPane.currentEditingComment.cancelReply();
            } else {
                this.commentPane.currentEditingComment.cancelEditing();
                if (isNewComment) {
                    this.discardComment(this.commentPane.currentEditingComment.comment);
                }
            }
            this.owner.viewer.currentSelectedComment = undefined;
            this.closeDialogUtils();
            this.owner.showComments = false;
        }
    }

    private closeDialogUtils(): void {
        this.confirmDialog.close();
        this.confirmDialog = undefined;
    }

    public initToolbar(localValue: L10n): HTMLElement {
        this.toolbarElement = createElement('div');
        this.toolbar = new Toolbar({
            items: [
                {
                    prefixIcon: 'e-de-new-cmt e-de-cmt-tbr', tooltipText: localValue.getConstant('New Comment'),
                    text: localValue.getConstant('New Comment'), click: this.insertComment.bind(this)
                },
                {
                    prefixIcon: 'e-de-nav-left-arrow e-de-cmt-tbr', align: 'Right',
                    tooltipText: localValue.getConstant('Previous Comment'), click: this.navigatePreviousComment.bind(this)
                },
                {
                    prefixIcon: 'e-de-nav-right-arrow e-de-cmt-tbr', align: 'Right',
                    tooltipText: localValue.getConstant('Next Comment'), click: this.navigateNextComment.bind(this)
                }],
            enableRtl: this.owner.enableRtl
        });
        this.toolbar.appendTo(this.toolbarElement);
        return this.toolbarElement;
    }

    public insertComment(): void {
        if (this.owner && this.owner.editorModule) {
            this.owner.editorModule.insertComment('');
        }
    }

    public addComment(comment: CommentElementBox, isNewComment: boolean): void {
        this.isNewComment = isNewComment;
        this.owner.viewer.currentSelectedComment = comment;
        this.commentPane.insertComment(comment);
        if (!isNewComment) {
            let commentView: CommentView = this.commentPane.comments.get(comment);
            commentView.cancelEditing();
            this.enableDisableToolbarItem();
        }
        this.selectComment(comment);
    }

    public deleteComment(comment: CommentElementBox): void {
        if (this.commentPane) {
            this.commentPane.deleteComment(comment);
        }
    }

    public selectComment(comment: CommentElementBox): void {
        if (this.commentPane.isEditMode) {
            return;
        }
        if (comment.isReply) {
            comment = comment.ownerComment;
        }
        if (this.owner && this.owner.viewer && this.owner.viewer.currentSelectedComment !== comment) {
            this.owner.viewer.currentSelectedComment = comment;
        }
        this.commentPane.selectComment(comment);
    }

    public resolveComment(comment: CommentElementBox): void {
        this.commentPane.resolveComment(comment);
    }

    public reopenComment(comment: CommentElementBox): void {
        this.commentPane.reopenComment(comment);
    }

    public addReply(comment: CommentElementBox, newComment: boolean): void {
        this.isNewComment = newComment;
        this.commentPane.insertReply(comment);
        if (!newComment) {
            let commentView: CommentView = this.commentPane.comments.get(comment);
            commentView.cancelEditing();
            this.enableDisableToolbarItem();
        }
        this.selectComment(comment.ownerComment);
    }

    public navigatePreviousComment(): void {
        if (this.owner && this.owner.editorModule) {
            this.owner.selection.navigatePreviousComment();
        }
    }

    public navigateNextComment(): void {
        if (this.owner && this.owner.editorModule) {
            this.owner.selection.navigateNextComment();
        }
    }

    public enableDisableToolbarItem(): void {
        if (this.toolbar) {
            let enable: boolean = true;
            if (this.commentPane.isEditMode) {
                enable = !this.commentPane.isEditMode;
            }
            let elements: NodeListOf<Element> = this.toolbar.element.querySelectorAll('.' + 'e-de-cmt-tbr');
            this.toolbar.enableItems(elements[0].parentElement.parentElement, enable);
            if (enable && this.owner && this.owner.viewer) {
                enable = !(this.owner.viewer.comments.length === 0);
            }
            this.toolbar.enableItems(elements[1].parentElement.parentElement, enable);
            this.toolbar.enableItems(elements[2].parentElement.parentElement, enable);
        }
    }

    public initCommentPane(): void {
        this.commentPane = new CommentPane(this.owner, this);
        this.commentPane.initCommentPane();
    }

    public layoutComments(): void {
        for (let i: number = 0; i < this.owner.viewer.comments.length; i++) {
            this.commentPane.addComment(this.owner.viewer.comments[i]);
        }
    }

    public clear(): void {
        this.previousSelectedCommentInt = undefined;
        this.commentPane.clear();
    }

    public discardComment(comment: CommentElementBox): void {
        if (comment) {
            if (this.owner.editorHistory) {
                this.owner.editorHistory.undo();
                this.owner.editorHistory.redoStack.pop();
            } else if (this.owner.editor) {
                this.owner.editor.deleteCommentInternal(comment);
            }
        }
    }

    public destroy(): void {
        if (this.commentPane) {
            this.commentPane.destroy();
        }
        this.commentPane = undefined;
        if (this.closeButton && this.closeButton.parentElement) {
            this.closeButton.parentElement.removeChild(this.closeButton);
        }
        this.closeButton = undefined;
        if (this.toolbar) {
            this.toolbar.destroy();
        }
        this.toolbar = undefined;
        if (this.toolbarElement && this.toolbarElement.parentElement) {
            this.toolbarElement.parentElement.removeChild(this.toolbarElement);
        }
        this.toolbarElement = undefined;
        if (this.headerContainer && this.headerContainer.parentElement) {
            this.headerContainer.parentElement.removeChild(this.headerContainer);
        }
        this.headerContainer = undefined;
        this.previousSelectedCommentInt = undefined;
        if (this.reviewPane && this.reviewPane.parentElement) {
            this.reviewPane.parentElement.removeChild(this.reviewPane);
        }
        this.reviewPane.innerHTML = '';
        this.reviewPane = undefined;
        this.owner = undefined;
    }
}

/**
 * @private
 */
export class CommentPane {
    private owner: DocumentEditor;
    public parentPane: CommentReviewPane;
    public noCommentIndicator: HTMLElement;
    public parent: HTMLElement;
    public comments: Dictionary<CommentElementBox, CommentView>;
    public commentPane: HTMLElement;
    private isEditModeInternal: boolean = false;
    public currentEditingComment: CommentView;
    public isInsertingReply: boolean = false;
    /**
     * @private
     */
    get isEditMode(): boolean {
        return this.isEditModeInternal;
    }
    /**
     * @private
     */
    set isEditMode(value: boolean) {
        this.isEditModeInternal = value;
        let keys: CommentElementBox[] = this.comments.keys;
        for (let i: number = 0; i < keys.length; i++) {
            let commentView: CommentView = this.comments.get(keys[i]);
            if (value) {
                commentView.menuBar.style.display = 'none';
            } else if (!commentView.comment.isReply) {
                commentView.menuBar.style.display = 'block';
            }
        }
        if (this.parentPane) {
            this.parentPane.enableDisableToolbarItem();
        }
        if (this.owner) {
            if (this.isEditModeInternal) {
                this.owner.trigger('commentBegin');
            } else {
                this.owner.trigger('commentEnd');
            }
        }
    }

    constructor(owner: DocumentEditor, pane: CommentReviewPane) {
        this.owner = owner;
        this.parentPane = pane;
        this.parent = pane.reviewPane;
        this.comments = new Dictionary<CommentElementBox, CommentView>();
    }

    public initCommentPane(): void {
        this.commentPane = createElement('div', { className: 'e-de-cmt-container' });
        let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
        localObj.setLocale(this.owner.locale);
        this.noCommentIndicator = createElement('div', {
            className: 'e-de-cmt-no-cmt',
            innerHTML: localObj.getConstant('No comments in this document')
        });
        this.commentPane.appendChild(this.noCommentIndicator);
        this.parent.appendChild(this.commentPane);
    }

    public addComment(comment: CommentElementBox): void {
        let commentView: CommentView = new CommentView(this.owner, this, comment);
        let commentParent: HTMLElement = commentView.layoutComment(false);
        this.comments.add(comment, commentView);
        this.commentPane.appendChild(commentParent);
        for (let i: number = 0; i < comment.replyComments.length; i++) {
            let replyView: CommentView = new CommentView(this.owner, this, comment.replyComments[i]);
            this.comments.add(comment.replyComments[i], replyView);
            commentParent.insertBefore(replyView.layoutComment(true), commentView.replyViewContainer);
        }
        this.updateCommentStatus();
        commentView.hideDrawer();
    }

    public updateHeight(): void {
        this.commentPane.style.height = this.parent.clientHeight - this.parentPane.headerContainer.clientHeight + 'px';
    }

    public insertReply(replyComment: CommentElementBox): void {
        let parentComment: CommentElementBox = replyComment.ownerComment;
        let parentView: CommentView = this.comments.get(parentComment);
        let replyView: CommentView = new CommentView(this.owner, this, replyComment);
        this.comments.add(replyComment, replyView);
        let replyElement: HTMLElement = replyView.layoutComment(true);

        let replyIndex: number = parentComment.replyComments.indexOf(replyComment);
        if (replyIndex === parentComment.replyComments.length - 1) {
            parentView.parentElement.insertBefore(replyElement, parentView.replyViewContainer);
        } else {
            let nextReply: CommentElementBox = parentComment.replyComments[replyIndex + 1];
            parentView.parentElement.insertBefore(replyElement, this.comments.get(nextReply).parentElement);
        }
        replyView.editComment();
    }

    public insertComment(comment: CommentElementBox): void {
        let commentView: CommentView = new CommentView(this.owner, this, comment);
        let commentParent: HTMLElement = commentView.layoutComment(false);
        this.comments.add(comment, commentView);
        if (this.owner.viewer.comments.indexOf(comment) === this.owner.viewer.comments.length - 1) {
            this.commentPane.appendChild(commentParent);
        } else {
            let index: number = this.owner.viewer.comments.indexOf(comment);
            let element: HTMLElement = this.comments.get(this.owner.viewer.comments[index + 1]).parentElement;
            this.commentPane.insertBefore(commentParent, element);
            commentParent.focus();
        }
        this.updateCommentStatus();
        commentView.editComment();
    }

    public removeSelectionMark(className: string): void {
        if (this.parent) {
            let elements: NodeListOf<Element> = this.parent.getElementsByClassName(className);
            for (let i: number = 0; i < elements.length; i++) {
                classList(elements[i], [], [className]);
            }
        }
    }

    public selectComment(comment: CommentElementBox): void {
        this.removeSelectionMark('e-de-cmt-selection');
        if (comment.isReply) {
            comment = comment.ownerComment;
        }
        if (comment) {
            let commentView: CommentView = this.comments.get(comment);
            let selectedElement: HTMLElement = commentView.parentElement;
            if (selectedElement) {
                classList(selectedElement, ['e-de-cmt-selection'], []);
                selectedElement.focus();
            }
            let commentStart: CommentCharacterElementBox = this.getCommentStart(comment);
            if (!commentStart.commentMark) {
                commentStart.renderCommentMark();
            }
            classList(commentStart.commentMark, ['e-de-cmt-mark-selected'], []);
            commentView.showDrawer();
        }
    }

    public getCommentStart(comment: CommentElementBox): CommentCharacterElementBox {
        let commentStart: CommentCharacterElementBox = undefined;
        if (comment && comment.commentStart) {
            commentStart = comment.commentStart;
        }
        return this.getFirstCommentInLine(commentStart);

    }
    private getFirstCommentInLine(commentStart: CommentCharacterElementBox): CommentCharacterElementBox {
        for (let i: number = 0; i < commentStart.line.children.length; i++) {
            let startComment: ElementBox = commentStart.line.children[i];
            if (startComment instanceof CommentCharacterElementBox && startComment.commentType === 0) {
                return startComment as CommentCharacterElementBox;
            }
        }
        return commentStart;
    }

    public deleteComment(comment: CommentElementBox): void {
        let commentView: CommentView = this.comments.get(comment);
        if (commentView.parentElement && commentView.parentElement.parentElement) {
            commentView.parentElement.parentElement.removeChild(commentView.parentElement);
        }
        //this.commentPane.removeChild();
        this.comments.remove(comment);
        commentView.destroy();
        this.updateCommentStatus();
    }

    public resolveComment(comment: CommentElementBox): void {
        let commentView: CommentView = this.comments.get(comment);
        if (commentView) {
            commentView.resolveComment();
        }
    }

    public reopenComment(comment: CommentElementBox): void {
        let commentView: CommentView = this.comments.get(comment);
        if (commentView) {
            commentView.reopenComment();
        }
    }

    public updateCommentStatus(): void {
        if (this.owner.viewer.comments.length === 0) {
            if (!this.noCommentIndicator.parentElement) {
                this.commentPane.appendChild(this.noCommentIndicator);
            }
            this.noCommentIndicator.style.display = 'block';
        } else {
            this.noCommentIndicator.style.display = 'none';
        }
        if (this.parentPane) {
            this.parentPane.enableDisableToolbarItem();
        }
    }

    public clear(): void {
        this.isEditMode = false;
        this.currentEditingComment = undefined;
        this.isInsertingReply = false;
        this.removeChildElements();
        this.commentPane.innerHTML = '';
        this.updateCommentStatus();
    }

    public removeChildElements(): void {
        let comments: CommentElementBox[] = this.comments.keys;
        for (let i: number = 0; i < comments.length; i++) {
            this.comments.get(comments[i]).destroy();
        }
        this.comments.clear();
    }

    public destroy(): void {
        this.removeChildElements();
        if (this.noCommentIndicator && this.noCommentIndicator) {
            this.noCommentIndicator.parentElement.removeChild(this.noCommentIndicator);
        }
        this.noCommentIndicator = undefined;
        if (this.commentPane && this.commentPane.parentElement) {
            this.commentPane.parentElement.removeChild(this.commentPane);
        }
        this.commentPane.innerHTML = '';
        this.parentPane = undefined;
        this.owner = undefined;
    }
}

/**
 * @private
 */
export class CommentView {
    private owner: DocumentEditor;
    public comment: CommentElementBox;
    public commentPane: CommentPane;
    public parentElement: HTMLElement;
    public menuBar: HTMLElement;
    public commentView: HTMLElement;
    public commentText: HTMLElement;
    public commentDate: HTMLElement;
    public isReply: boolean = false;
    public textAreaContainer: HTMLElement;
    public textArea: HTMLTextAreaElement;
    public postButton: Button;
    public cancelButton: Button;
    public dropDownButton: DropDownButton;
    public drawerElement: HTMLElement;
    public drawerAction: HTMLElement;
    public drawerSpanElement: HTMLSpanElement;
    public isDrawerExpand: boolean = false;
    public replyViewContainer: HTMLElement;
    public replyViewTextBox: HTMLTextAreaElement;
    public replyPostButton: Button;
    public replyCancelButton: Button;
    public replyFooter: HTMLElement;
    public reopenButton: Button;
    public deleteButton: Button;


    constructor(owner: DocumentEditor, commentPane: CommentPane, comment: CommentElementBox) {
        this.owner = owner;
        this.comment = comment;
        this.commentPane = commentPane;
    }

    public layoutComment(isReply: boolean): HTMLElement {
        this.isReply = isReply;
        let classList: string = 'e-de-cmt-sub-container';
        if (isReply) {
            classList += ' e-de-cmt-reply';
        }
        let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
        localObj.setLocale(this.owner.locale);
        this.parentElement = createElement('div', { className: classList });
        this.initCommentHeader(localObj);
        this.initCommentView(localObj);
        this.initDateView();
        if (!this.comment.isReply) {
            this.parentElement.tabIndex = 0;
            this.initReplyView(localObj);
            this.initResolveOption(localObj);
            this.initDrawer();
            if (this.comment.isResolved) {
                this.resolveComment();
            }
        } else {
            this.menuBar.style.display = 'none';
        }
        this.commentView.addEventListener('mouseenter', this.showMenuItems.bind(this));
        this.commentView.addEventListener('mouseleave', this.hideMenuItemOnMouseLeave.bind(this));
        return this.parentElement;
    }

    private initCommentHeader(localObj: L10n): void {
        let commentDiv: HTMLElement = createElement('div', { className: 'e-de-cmt-view' });
        let commentUserInfo: HTMLElement = createElement('div', { className: 'e-de-cmt-author' });
        let userName: HTMLElement = createElement('div', { className: 'e-de-cmt-author-name' });
        userName.textContent = this.comment.author;
        //if (this.comment.author === this.owner.currentUser) {
        this.menuBar = createElement('button', { className: 'e-de-cp-option' });
        let userOption: ItemModel[] = [{ text: localObj.getConstant('Edit') },
        { text: localObj.getConstant('Delete') },
        { text: localObj.getConstant('Reply') },
        { text: localObj.getConstant('Resolve') }];
        let menuItem: DropDownButton = new DropDownButton({
            items: this.isReply ? userOption.splice(0, 2) : userOption,
            select: this.userOptionSelectEvent.bind(this),
            iconCss: 'e-de-menu-icon',
            cssClass: 'e-caret-hide',
            enableRtl: this.owner.enableRtl
        });
        menuItem.appendTo(this.menuBar);
        commentUserInfo.appendChild(this.menuBar);
        this.dropDownButton = menuItem;
        //}
        commentUserInfo.appendChild(userName);
        commentDiv.appendChild(commentUserInfo);
        this.commentView = commentDiv;
        this.parentElement.appendChild(commentDiv);
        commentDiv.addEventListener('click', this.selectComment.bind(this));
    }

    private selectComment(event: MouseEvent): void {
        if (this.commentPane) {
            if (!this.commentPane.isEditMode) {
                this.owner.selection.selectComment(this.comment);
            } else if (this.commentPane.isEditMode && this.commentPane.isInsertingReply
                && this.commentPane.currentEditingComment && this.commentPane.currentEditingComment.replyViewTextBox.value === '') {
                let comment: CommentElementBox = this.comment;
                if (comment && comment.isReply) {
                    comment = this.comment.ownerComment;
                }
                if (comment && this.owner.viewer.currentSelectedComment === comment) {
                    return;
                }
                this.commentPane.currentEditingComment.cancelReply();
                this.owner.selection.selectComment(this.comment);
            }
        }
    }

    private initCommentView(localObj: L10n): void {
        this.commentText = createElement('div', { className: 'e-de-cmt-readonly' });
        this.commentText.innerText = this.comment.text;
        this.commentView.appendChild(this.commentText);
        this.initEditView(localObj);
    }

    private initEditView(localObj: L10n): void {
        this.textAreaContainer = createElement('div', { styles: 'display:none' });
        this.textArea = createElement('textarea', { className: 'e-de-cmt-textarea e-input' }) as HTMLTextAreaElement;
        this.textArea.placeholder = localObj.getConstant('Type your comment hear');
        this.textArea.rows = 1;
        this.textArea.value = this.comment.text.trim();
        this.textArea.addEventListener('keydown', this.updateTextAreaHeight.bind(this));
        this.textArea.addEventListener('keyup', this.enableDisablePostButton.bind(this));
        let editRegionFooter: HTMLElement = createElement('div', { className: 'e-de-cmt-action-button' });
        let postButton: HTMLButtonElement = createElement('button', { className: 'e-de-cmt-post-btn e-btn e-flat' }) as HTMLButtonElement;
        //tslint:disable-next-line:max-line-length
        this.postButton = new Button({ cssClass: 'e-btn e-flat e-primary', iconCss: 'e-de-cmt-post', disabled: true }, postButton);
        postButton.addEventListener('click', this.postComment.bind(this));
        let cancelButton: HTMLButtonElement = createElement('button', {
            className: 'e-de-cmt-cancel-btn e-btn e-flat'
        }) as HTMLButtonElement;
        this.cancelButton = new Button({ cssClass: 'e-btn e-flat', iconCss: 'e-de-cmt-cancel' }, cancelButton);
        cancelButton.addEventListener('click', this.cancelEditing.bind(this));
        editRegionFooter.appendChild(postButton);
        editRegionFooter.appendChild(cancelButton);
        this.textAreaContainer.appendChild(this.textArea);
        this.textAreaContainer.appendChild(editRegionFooter);
        this.commentView.appendChild(this.textAreaContainer);
    }

    private initDateView(): void {
        this.commentDate = createElement('div', { className: 'e-de-cmt-date' });
        let modifiedDate: Date = new Date(this.comment.date);
        let date: string = modifiedDate.toString().split(' ').splice(1, 2).join(' ');
        let time: string = modifiedDate.toLocaleTimeString().split(' ')[0].split(':').splice(0, 2).join(':')
            + modifiedDate.toLocaleTimeString().split(' ')[1];
        this.commentDate.innerText = date + ', ' + modifiedDate.getFullYear() + ', ' + time;
        this.commentView.appendChild(this.commentDate);
    }

    private initDrawer(): void {
        this.drawerElement = createElement('div', { styles: 'display:none;', className: 'e-de-cmt-drawer-cnt' });
        let leftPane: HTMLElement = createElement('div', { className: 'e-de-cmt-drawer' });
        let spanElement: HTMLElement = createElement('span');
        leftPane.appendChild(spanElement);
        this.drawerElement.appendChild(leftPane);
        this.drawerSpanElement = spanElement as HTMLSpanElement;
        this.drawerAction = leftPane;
        this.drawerAction.addEventListener('click', this.showOrHideDrawer.bind(this));
        this.parentElement.appendChild(this.drawerElement);
    }

    private initReplyView(localObj: L10n): void {
        this.replyViewContainer = createElement('div', { className: 'e-de-cmt-rply-view' });
        if (this.commentPane.parentPane.isNewComment) {
            this.replyViewContainer.style.display = 'none';
        }
        this.replyViewTextBox = createElement('textarea', { className: 'e-de-cmt-textarea e-input' }) as HTMLTextAreaElement;
        this.replyViewTextBox.placeholder = localObj.getConstant('Reply');
        this.replyViewTextBox.rows = 1;
        this.replyViewTextBox.value = '';
        this.replyViewTextBox.readOnly = true;
        this.replyViewTextBox.addEventListener('click', this.enableReplyView.bind(this));
        this.replyViewTextBox.addEventListener('keydown', this.updateReplyTextAreaHeight.bind(this));
        this.replyViewTextBox.addEventListener('keyup', this.enableDisableReplyPostButton.bind(this));

        let editRegionFooter: HTMLElement = createElement('div', { styles: 'display:none', className: 'e-de-cmt-action-button' });
        let postButton: HTMLButtonElement = createElement('button', { className: 'e-de-cmt-post-btn e-btn e-flat' }) as HTMLButtonElement;
        //tslint:disable-next-line:max-line-length
        this.replyPostButton = new Button({ cssClass: 'e-btn e-flat e-primary', iconCss: 'e-de-cmt-post', disabled: true }, postButton);

        postButton.addEventListener('click', this.postReply.bind(this));

        let cancelButton: HTMLButtonElement = createElement('button', {
            className: 'e-de-cmt-cancel-btn e-btn e-flat'
        }) as HTMLButtonElement;
        this.replyCancelButton = new Button({ cssClass: 'e-btn e-flat', iconCss: 'e-de-cmt-cancel' }, cancelButton);

        cancelButton.addEventListener('click', this.cancelReply.bind(this));

        editRegionFooter.appendChild(postButton);
        editRegionFooter.appendChild(cancelButton);
        this.replyFooter = editRegionFooter;
        this.replyViewContainer.appendChild(this.replyViewTextBox);
        this.replyViewContainer.appendChild(editRegionFooter);
        this.parentElement.appendChild(this.replyViewContainer);
    }

    private initResolveOption(localObj: L10n): void {
        let editRegionFooter: HTMLElement = createElement('div', { className: 'e-de-cmt-resolve-btn' });
        let postButton: HTMLButtonElement = createElement('button', { className: 'e-de-cmt-post-btn e-btn e-flat' }) as HTMLButtonElement;
        //tslint:disable-next-line:max-line-length
        this.reopenButton = new Button({ cssClass: 'e-btn e-flat', iconCss: 'e-de-cmt-reopen' }, postButton);
        postButton.title = localObj.getConstant('Reopen');
        postButton.addEventListener('click', this.reopenButtonClick.bind(this));
        let cancelButton: HTMLButtonElement = createElement('button', {
            className: 'e-de-cmt-cancel-btn e-btn e-flat'
        }) as HTMLButtonElement;
        cancelButton.title = localObj.getConstant('Delete');
        this.deleteButton = new Button({ cssClass: 'e-btn e-flat', iconCss: 'e-de-cmt-delete' }, cancelButton);
        cancelButton.addEventListener('click', this.deleteButtonClick.bind(this));
        editRegionFooter.appendChild(postButton);
        editRegionFooter.appendChild(cancelButton);
        this.parentElement.appendChild(editRegionFooter);
    }

    private reopenButtonClick(): void {
        this.owner.editor.reopenComment(this.comment);
    }
    private deleteButtonClick(): void {
        this.owner.editorModule.deleteCommentInternal(this.comment);
    }


    private updateReplyTextAreaHeight(): void {
        setTimeout(() => {
            this.replyViewTextBox.style.height = 'auto';
            let scrollHeight: number = this.replyViewTextBox.scrollHeight;
            this.replyViewTextBox.style.height = scrollHeight + 'px';
        });
    }
    private enableDisableReplyPostButton(): void {
        this.replyPostButton.disabled = this.replyViewTextBox.value === '';
    }

    private enableReplyView(): void {
        if (this.commentPane.isEditMode) {
            return;
        }
        this.commentPane.currentEditingComment = this;
        this.commentPane.isInsertingReply = true;
        if (this.owner.viewer.currentSelectedComment !== this.comment) {
            this.owner.selection.selectComment(this.comment);
        }
        this.commentPane.isEditMode = true;
        this.replyViewTextBox.readOnly = false;
        this.replyFooter.style.display = 'block';
        setTimeout(() => {
            this.replyViewTextBox.focus();
        });
    }

    private postReply(): void {
        let replyText: string = this.replyViewTextBox.value;
        this.cancelReply();
        this.updateReplyTextAreaHeight();
        this.owner.editorModule.replyComment(this.comment, replyText);
    }

    public cancelReply(): void {
        this.commentPane.currentEditingComment = undefined;
        this.commentPane.isInsertingReply = true;
        this.commentPane.isEditMode = false;
        this.replyPostButton.disabled = true;
        this.replyViewTextBox.value = '';
        this.replyViewTextBox.readOnly = true;
        this.replyFooter.style.display = 'none';
    }

    private updateTextAreaHeight(): void {
        setTimeout(() => {
            this.textArea.style.height = 'auto';
            let scrollHeight: number = this.textArea.scrollHeight;
            this.textArea.style.height = scrollHeight + 'px';
        });
    }

    public showMenuItems(): void {
        if (this.comment.isReply) {
            if (!this.commentPane.isEditMode && (!isNullOrUndefined(this.comment) && !this.comment.isResolved)) {
                this.menuBar.style.display = 'block';
            }
        }

        let commentStart: CommentCharacterElementBox = this.commentPane.getCommentStart(this.comment);
        if (!isNullOrUndefined(commentStart) && !isNullOrUndefined(commentStart.commentMark)) {
            commentStart.commentMark.classList.add('e-de-cmt-mark-hover');
        }
    }

    public hideMenuItemOnMouseLeave(): void {
        if (this.comment.isReply) {
            if (this.owner.viewer.currentSelectedComment !== this.comment.ownerComment) {
                this.hideMenuItems();
            }
        }
        if (this.commentPane) {
            let commentStart: CommentCharacterElementBox = this.commentPane.getCommentStart(this.comment);
            if (!isNullOrUndefined(commentStart) && !isNullOrUndefined(commentStart.commentMark)) {
                commentStart.commentMark.classList.remove('e-de-cmt-mark-hover');
            }
        }
    }

    public hideMenuItems(): void {
        this.menuBar.style.display = 'none';
    }

    public enableDisablePostButton(): void {
        this.postButton.disabled = this.textArea.value === '';
    }

    public editComment(): void {
        this.commentPane.currentEditingComment = this;
        this.commentPane.isInsertingReply = false;
        this.commentPane.isEditMode = true;
        this.commentText.style.display = 'none';
        this.textAreaContainer.style.display = 'block';
        this.commentDate.style.display = 'none';
        this.menuBar.style.display = 'none';
        this.updateTextAreaHeight();
        setTimeout(() => {
            this.textArea.focus();
        });
    }

    public resolveComment(): void {
        classList(this.parentElement, ['e-de-cmt-resolved'], []);
        let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
        localObj.setLocale(this.owner.locale);
        this.dropDownButton.items = [{ text: localObj.getConstant('Reopen') }, { text: localObj.getConstant('Delete') }];
    }

    public reopenComment(): void {
        classList(this.parentElement, [], ['e-de-cmt-resolved']);
        let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
        localObj.setLocale(this.owner.locale);
        this.dropDownButton.items = [{ text: localObj.getConstant('Edit') },
        { text: localObj.getConstant('Delete') },
        { text: localObj.getConstant('Reply') },
        { text: localObj.getConstant('Resolve') }];
        this.showDrawer();
    }

    public postComment(): void {
        let updatedText: string = this.textArea.value;
        this.commentText.innerText = updatedText;
        this.comment.text = updatedText;
        this.showCommentView();
        if (this.commentPane && this.commentPane.parentPane) {
            this.commentPane.parentPane.isNewComment = false;
        }
        if (!isNullOrUndefined(this.replyViewContainer)) {
            this.replyViewContainer.style.display = '';
        }
    }

    public showCommentView(): void {
        this.commentPane.isEditMode = false;
        this.textAreaContainer.style.display = 'none';
        this.commentText.style.display = 'block';
        this.commentDate.style.display = 'block';
        this.menuBar.style.display = 'block';
    }

    public cancelEditing(): void {
        this.showCommentView();
        this.textArea.value = this.comment.text.trim();
        if (this.commentPane.parentPane.isNewComment) {
            if (this.commentPane && this.commentPane.parentPane) {
                this.commentPane.parentPane.isNewComment = false;
            }
            this.commentPane.parentPane.discardComment(this.comment);
        }
    }

    public showOrHideDrawer(): void {
        if (this.isDrawerExpand) {
            this.hideDrawer();
        } else {
            this.showDrawer();
        }
    }

    public hideDrawer(): void {
        if (this.parentElement) {
            let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
            localObj.setLocale(this.owner.locale);
            let elements: NodeListOf<Element> = this.parentElement.getElementsByClassName('e-de-cmt-sub-container');
            if (elements.length > 1) {
                for (let i: number = 1; i < elements.length; i++) {
                    (elements[i] as HTMLElement).style.display = 'none';
                }
                this.drawerElement.style.display = 'block';
                classList(this.drawerSpanElement, [], ['e-de-nav-up']);
                this.drawerSpanElement.innerText = '+' + (elements.length - 1) + ' ' + localObj.getConstant('more') + '...';
            }
            this.isDrawerExpand = false;
        }
    }

    public showDrawer(): void {
        if (this.parentElement) {
            let elements: NodeListOf<Element> = this.parentElement.getElementsByClassName('e-de-cmt-sub-container');
            if (elements.length > 1) {
                for (let i: number = 0; i < elements.length; i++) {
                    (elements[i] as HTMLElement).style.display = 'block';
                }
                this.drawerElement.style.display = 'block';
                this.drawerSpanElement.innerText = '';
                classList(this.drawerSpanElement, ['e-de-nav-up'], []);
            }
            this.isDrawerExpand = true;
        }
    }

    private userOptionSelectEvent(event: MenuEventArgs): void {
        let selectedItem: string = event.item.text;
        let localObj: L10n = new L10n('documenteditor', this.owner.defaultLocale);
        localObj.setLocale(this.owner.locale);
        switch (selectedItem) {
            case localObj.getConstant('Edit'):
                this.editComment();
                break;
            case localObj.getConstant('Reply'):
                this.enableReplyView();
                break;
            case localObj.getConstant('Delete'):
                this.owner.editorModule.deleteCommentInternal(this.comment);
                break;
            case localObj.getConstant('Resolve'):
                this.owner.editor.resolveComment(this.comment);
                break;
            case localObj.getConstant('Reopen'):
                this.owner.editor.reopenComment(this.comment);
        }
    }

    public unwireEvent(): void {
        if (this.drawerAction) {
            this.drawerAction.removeEventListener('click', this.showOrHideDrawer.bind(this));
        }
        if (this.textArea) {
            this.textArea.removeEventListener('keydown', this.updateTextAreaHeight.bind(this));
            this.textArea.removeEventListener('keyup', this.enableDisablePostButton.bind(this));
        }
        if (this.postButton) {
            this.postButton.removeEventListener('click', this.postComment.bind(this));
        }
        if (this.cancelButton) {
            this.cancelButton.removeEventListener('click', this.cancelEditing.bind(this));
        }
        if (this.commentView) {
            this.commentView.removeEventListener('click', this.selectComment.bind(this));
            this.commentView.removeEventListener('mouseenter', this.showMenuItems.bind(this));
            this.commentView.removeEventListener('mouseleave', this.hideMenuItemOnMouseLeave.bind(this));
        }
    }

    public destroy(): void {
        this.unwireEvent();
        if (this.comment) {
            this.comment = undefined;
        }
        if (this.dropDownButton) {
            this.dropDownButton.destroy();
        }
        this.dropDownButton = undefined;
        if (this.postButton) {
            this.postButton.destroy();
        }
        this.postButton = undefined;
        if (this.cancelButton) {
            this.cancelButton.destroy();
        }
        if (this.replyPostButton) {
            this.replyPostButton.destroy();
            this.replyPostButton = undefined;
        }
        if (this.replyCancelButton) {
            this.replyCancelButton.destroy();
            this.replyCancelButton = undefined;
        }
        if (this.reopenButton) {
            this.reopenButton.destroy();
            this.reopenButton = undefined;
        }
        if (this.deleteButton) {
            this.deleteButton.destroy();
            this.deleteButton = undefined;
        }
        this.replyViewContainer = undefined;
        this.replyViewTextBox = undefined;
        this.replyFooter = undefined;
        if (this.parentElement && this.parentElement.parentElement) {
            this.parentElement.parentElement.removeChild(this.parentElement);
        }
        this.commentPane = undefined;
        this.parentElement.innerHTML = '';
        this.cancelButton = undefined;
        this.owner = undefined;
        this.menuBar = undefined;
        this.commentView = undefined;
        this.drawerAction = undefined;
        this.commentText = undefined;
        this.commentDate = undefined;
        this.textAreaContainer = undefined;
        this.textArea = undefined;
        this.drawerElement = undefined;
        this.drawerSpanElement = undefined;
        this.parentElement = null;
    }

}