import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuItem, MenuItemType } from './types';

@Component({
    selector: 'app-menu-item',
    templateUrl: './menu-item.component.html',
    styleUrls: ['./menu-item.component.scss'],
})
export class MenuItemComponent implements OnInit {
    ngOnInit(): void {}

    MenuItemType = MenuItemType;

    @Input() props: MenuItem;
    @Input() seeThrough? = true

    @Output() click = new EventEmitter<KeyboardEvent>();
    onClick(e: Event) {
        this.click.emit(e as KeyboardEvent);
        this.props.action?.();
    }
}
