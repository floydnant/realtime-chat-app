import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
    constructor(private router: Router) {}

    ngOnInit(): void {
        const isNoChildActive = this.router.isActive('/auth', {
            paths: 'exact',
            queryParams: 'exact',
            fragment: 'ignored',
            matrixParams: 'ignored',
        });
        if (isNoChildActive) this.router.navigate(['/auth/login']);
    }
}
