import { Component, ElementRef, Input } from '@angular/core';
import { MenuItem } from '../../atoms/menu-item/types';

@Component({
    selector: 'app-drop-down',
    templateUrl: './drop-down.component.html',
    styleUrls: ['./drop-down.component.scss'],
})
export class DropDownComponent {
    constructor(private elemRef: ElementRef) {}

    @Input() items: MenuItem[];

    isOpen = false;
    toggle() {
        this.isOpen = !this.isOpen;
    }
    close() {
        this.isOpen = false;
    }
    open() {
        this.isOpen = true;
    }

    onDocumentClick(_e: Event) {
        const e = _e as PointerEvent;
        if (!this.elemRef.nativeElement.contains(e.target)) this.close();
    }
}
