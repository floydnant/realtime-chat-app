import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-invitation',
    templateUrl: './invitation.component.html',
    styleUrls: ['./invitation.component.scss'],
})
export class InvitationComponent {
    @Input() title: string;
    @Input() subTitle: string;
}
