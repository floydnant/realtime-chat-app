import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';

import { AppComponent } from './app.component';
import { ChatMessageComponent } from './components/molecules/chat-message/chat-message.component';
import { DomValueAccessorDirective } from './directives/dom-value-accessor.directive';
import { AppRoutingModule } from './app-routing.module';
import { ChatComponent } from './pages/chat/chat.component';
import { HomeComponent } from './pages/home/home.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { AuthComponent } from './pages/auth/auth.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { FeedbackBannerComponent } from './components/molecules/feedback-banner/feedback-banner.component';
import { InputFieldComponent } from './components/molecules/input-field/input-field.component';
import { AuthFormComponent } from './components/organisms/auth-form/auth-form.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { metaReducers, reducers } from './store/app.reducer';
import { effects } from './store/app.effects';
import { HttpClientModule } from '@angular/common/http';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { SidebarComponent } from './components/organisms/sidebar/sidebar.component';
import { HotToastModule } from '@ngneat/hot-toast';
import { LoadingSpinnerComponent } from './components/atoms/loading-spinner/loading-spinner.component';
import { DatePipe } from '@angular/common';

@NgModule({
    declarations: [
        AppComponent,
        ChatMessageComponent,
        DomValueAccessorDirective,
        ChatComponent,
        HomeComponent,
        PageNotFoundComponent,
        AuthComponent,
        SignupComponent,
        LoginComponent,
        FeedbackBannerComponent,
        InputFieldComponent,
        AuthFormComponent,
        SidebarComponent,
        LoadingSpinnerComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        SocketIoModule.forRoot({
            url: environment.SERVER_BASE_URL,
        }),
        AppRoutingModule,
        StoreModule.forRoot(reducers, { metaReducers }),
        EffectsModule.forRoot(effects),
        StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
        HotToastModule.forRoot({
            position: 'bottom-left',
            success: {
                iconTheme: { primary: 'var(--primary-100)', secondary: 'black' },
            },
            loading: {
                iconTheme: { primary: 'var(--secondary-100)', secondary: 'transparent' },
            },
            style: { background: 'var(--primary-800)', color: 'white', 'border-radius': '14px' },
        }),
    ],
    providers: [DatePipe],
    bootstrap: [AppComponent],
})
export class AppModule {}
