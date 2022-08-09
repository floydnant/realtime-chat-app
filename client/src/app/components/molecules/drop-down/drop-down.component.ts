import { Component, ElementRef, Input } from '@angular/core';
import { MenusService } from 'src/app/services/menus.service';
import { MenuItem } from '../../atoms/menu-item/types';

@Component({
    selector: 'app-drop-down',
    templateUrl: './drop-down.component.html',
    styleUrls: ['./drop-down.component.scss'],
})
export class DropDownComponent {
    constructor(private elemRef: ElementRef, private menusService: MenusService) {
        this.menusService.addMenu(this);
    }

    @Input() items: MenuItem[];

    isOpen = false;
    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
    close() {
        this.isOpen = false;
    }
    open() {
        this.menusService.onBeforeOpen();
        this.isOpen = true;
    }

    onDocumentClick(e: Event) {
        if (this.isOpen && !this.elemRef.nativeElement.contains(e.target)) this.close();
    }
}
