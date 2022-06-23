import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
    selector: 'feedback-banner',
    templateUrl: './feedback-banner.component.html',
    styleUrls: ['./feedback-banner.component.scss'],
})
export class FeedbackBannerComponent implements OnInit, OnChanges {
    @Input('messages') _messages: string | string[];
    messages: string[];
    @Input() variant: 'error' | 'success' | 'warning';

    close() {
        this.messages = [];
    }

    ngOnInit(): void {
        // this.message = this._message;
    }

    ngOnChanges(changes: SimpleChanges): void {
        // console.log(changes);
        if ('_messages' in changes) {
            const messages = changes._messages.currentValue;

            if (typeof messages == 'string') this.messages = messages ? [messages] : [];
            else if ((messages?.length || 0) > 1) this.messages = (messages || []).map((m: string) => '- ' + m);
            else this.messages = messages || [];
        }
    }
}
