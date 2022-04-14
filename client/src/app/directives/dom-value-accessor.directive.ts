import { Directive, ElementRef } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

/** ### appearently not working */
@Directive({
    selector: '[domValueAccessor]',
    host: {
        '(change)': '_onChange($event.target.value)',
        '(blur)': '_onTouched()',
    },
})
export class DomValueAccessorDirective implements ControlValueAccessor {
    constructor(private elemRef: ElementRef) {}

    writeValue(value: any): void {
        // this._renderer.setProperty(this._elementRef.nativeElement, 'innerHTML', value);
        this.elemRef.nativeElement.innerHTML = value;
        console.log('value written');
    }

    _onChange: (value: any) => void;
    registerOnChange(fn: (value: any) => void): void {
        this._onChange = (...args) => {
            fn(...args);
            console.log('value changed');
        };
    }

    _onTouched: () => void;
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        console.warn('disabling might not work');
        this.elemRef.nativeElement.contenteditable = !isDisabled;
    }
}
