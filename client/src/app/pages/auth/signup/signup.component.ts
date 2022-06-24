import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { SignupCredentialsDTO } from 'src/app/store/user/user.model';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
    constructor(private authService: AuthService) {}

    errorMessages: string | string[];
    successMessage: string;

    submitWrapper(creds: any) {
        this.handleSubmit(creds);
    }
    async handleSubmit(credentials: SignupCredentialsDTO) {
        const res = await this.authService.signup(credentials);

        if ('error' in res) this.errorMessages = res.error.message;
        else this.errorMessages = '';

        if ('successMessage' in res) this.successMessage = res.successMessage;
        else this.successMessage = '';
    }

    ngOnInit(): void {}
}
