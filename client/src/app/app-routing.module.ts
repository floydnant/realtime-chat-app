import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ChatComponent } from './pages/chat/chat.component';
import { HomeComponent } from './pages/home/home.component';
import { InvitesComponent } from './pages/invites/invites.component';
import { ReceivedComponent } from './pages/invites/received/received.component';
import { SentComponent } from './pages/invites/sent/sent.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

const routes: Routes = [
    {
        path: 'invites',
        component: InvitesComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'received' },
            { path: 'received', component: ReceivedComponent },
            { path: 'sent', component: SentComponent },
        ],
    },
    {
        path: 'chat',
        component: ChatComponent,
    },
    {
        path: 'auth',
        component: AuthComponent,
        children: [
            {
                // title: 'Login',
                path: 'login',
                component: LoginComponent,
            },
            {
                // title: 'Sign Up',
                path: 'signup',
                component: SignupComponent,
            },
        ],
    },
    {
        path: '',
        pathMatch: 'full',
        component: HomeComponent,
    },
    {
        path: '**',
        component: PageNotFoundComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
