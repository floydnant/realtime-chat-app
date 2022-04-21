import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
    selector: 'feedback-banner',
    templateUrl: './feedback-banner.component.html',
    styleUrls: ['./feedback-banner.component.scss'],
})
export class FeedbackBannerComponent implements OnInit, OnChanges {
    @Input('message') _message: string;
    message: string;
    @Input() variant: 'error' | 'success' | 'warning';

    close() {
        this.message = '';
    }

    ngOnInit(): void {
        // this.message = this._message;
    }

    ngOnChanges(changes: SimpleChanges): void {
        // console.log(changes);
        if ('_message' in changes) this.message = changes._message.currentValue;
    }
}
