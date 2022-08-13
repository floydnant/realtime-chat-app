import { Injectable } from '@angular/core';

interface Closable {
    close(): void;
    isOpen: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class MenusService {
    private menus: Closable[] = [];

    addMenu(menu: Closable) {
        this.menus.push(menu);
    }

    onBeforeOpen() {
        this.menus.find(menu => menu.isOpen)?.close();
    }
}
