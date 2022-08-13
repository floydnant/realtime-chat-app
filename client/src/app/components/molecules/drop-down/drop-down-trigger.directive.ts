import { Directive, HostListener, Input } from '@angular/core';
import { DropDownComponent } from './drop-down.component';

@Directive({
    selector: '[dropDownTriggerFor]',
})
export class DropDownTriggerDirective {
    @Input() dropDownTriggerFor: DropDownComponent;

    @HostListener('click', ['$event']) onClick(e: PointerEvent) {
        this.dropDownTriggerFor.toggle();
        e.stopPropagation();
    }
}
