import { IRenderer, IRichTextEditor } from '../base/interface';

/**
 * Markdown module is used to render RichTextEditor as Markdown editor content
 * @hidden
 * @deprecated
 */
export class MarkdownRender implements IRenderer {
    private contentPanel: Element;
    protected parent: IRichTextEditor;
    protected editableElement: Element;

    /**
     * Constructor for content renderer module
     */
    constructor(parent?: IRichTextEditor) {
        this.parent = parent;
    }

    /**
     * The function is used to render RichTextEditor content div
     * @hidden
     * @deprecated  
     */
    public renderPanel(): void {
        let rteObj: IRichTextEditor = this.parent;
        let div: HTMLElement = this.parent.createElement('div', { id: this.parent.getID() + '_view', className: 'e-rte-content' });
        this.editableElement = this.parent.createElement('textarea', {
            className: 'e-content',
            id: this.parent.getID() + '_editable-content'
        });
        div.appendChild(this.editableElement);
        this.setPanel(div);
        rteObj.element.appendChild(div);
    }
    /**
     * Get the content div element of RichTextEditor
     * @return {Element}
     * @hidden
     * @deprecated
     */
    public getPanel(): Element {
        return this.contentPanel;
    }
    /**
     * Get the editable element of RichTextEditor
     * @return {Element}
     * @hidden
     * @deprecated
     */
    public getEditPanel(): Element {
        return this.editableElement;
    }
    /**
     * Returns the text content as string.
     * @return {string} 
     */
    public getText(): string {
        return (this.getEditPanel() as HTMLTextAreaElement).value;
    }
    /**
     * Set the content div element of RichTextEditor
     * @param  {Element} panel
     * @hidden
     * @deprecated
     */
    public setPanel(panel: Element): void {
        this.contentPanel = panel;
    }
    /**
     * Get the document of RichTextEditor
     * @param  {Document}
     * @hidden
     * @deprecated
     */
    public getDocument(): Document {
        return this.getEditPanel().ownerDocument;
    }
}