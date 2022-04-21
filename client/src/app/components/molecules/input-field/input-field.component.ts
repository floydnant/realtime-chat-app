import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export const allHTMLInputTypes = [
    'button',
    'checkbox',
    'color',
    'date',
    'datetime-local',
    'email',
    'file',
    'hidden',
    'image',
    'month',
    'number',
    'password',
    'radio',
    'range',
    'reset',
    'search',
    'submit',
    'tel',
    'text',
    'time',
    'url',
    'week',
];

@Component({
    selector: 'input-field',
    templateUrl: './input-field.component.html',
    styleUrls: ['./input-field.component.scss'],
})
export class InputFieldComponent implements OnInit {
    @Input() type: HTMLInputElement['type'];
    @Input() label!: string;
    @Input() placeholder?: string;

    @Input() isValid: boolean;

    value!: string | any;
    @Output() newValue = new EventEmitter<this['value']>();
    onNewValue = (e: this['value']) => this.newValue.emit(e);

    ngOnInit(): void {
        const label = this.label.toLowerCase();
        const isValidInputType = allHTMLInputTypes.some(type => type == label);

        this.placeholder ||= label;
        this.type ||= isValidInputType ? label : 'text';
    }
}
