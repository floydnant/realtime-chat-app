import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SocketIoModule } from 'ngx-socket-io';

import { AppComponent } from './app.component';
import { ChatMessageComponent } from './chat-message/chat-message.component';

@NgModule({
    declarations: [AppComponent, ChatMessageComponent],
    imports: [BrowserModule, FormsModule, SocketIoModule.forRoot({ url: '/' })],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
