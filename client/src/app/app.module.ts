import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SocketIoModule } from 'ngx-socket-io';

import { AppComponent } from './app.component';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { DomValueAccessorDirective } from './directives/dom-value-accessor.directive';

@NgModule({
    declarations: [AppComponent, ChatMessageComponent, DomValueAccessorDirective],
    imports: [BrowserModule, FormsModule, SocketIoModule.forRoot({ url: 'http://localhost:3000' })],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
