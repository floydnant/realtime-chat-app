import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { SignupCredentialsDTO, LoginCredentialsDTO } from 'src/app/store/models/user.model';

@Component({
    selector: 'auth-form',
    templateUrl: './auth-form.component.html',
    styleUrls: ['./auth-form.component.scss'],
})
export class AuthFormComponent implements OnInit {
    @Input() variant: 'login' | 'signup' = 'login';
    signupCreds: SignupCredentialsDTO = {
        email: '',
        username: '',
        password: '',
    };

    loginCreds: LoginCredentialsDTO = {
        usernameOrEmail: '',
        password: '',
    };

    @Input() errorMessages: string | string[]; // = 'Error occured: test error for testing so i can test the error message banner';
    @Input() successMessage: string; // = 'Success occured: test success for testing so i can test the success message banner';

    @Output() submit = new EventEmitter<this['signupCreds'] | this['loginCreds']>();
    onSubmit = () => this.submit.emit(this.variant == 'login' ? this.loginCreds : this.signupCreds);

    @HostListener('keydown', ['$event'])
    keydown(event: KeyboardEvent) {
        if (event.key == 'Enter') this.onSubmit();
    }

    ngOnInit(): void {}
}
