import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { LoginCredentialsDTO } from 'src/app/store/models/user.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    constructor(private authService: AuthService) {}

    errorMessage: string;
    successMessage: string;

    submitWrapper(creds: any) {
        this.handleSubmit(creds);
    }
    async handleSubmit(credentials: LoginCredentialsDTO) {
        const res = await this.authService.login(credentials);

        if ('error' in res) this.errorMessage = res.error.message;
        else this.errorMessage = '';

        if ('successMessage' in res) this.successMessage = res.successMessage;
        else this.successMessage = '';
    }

    ngOnInit(): void {}
}
