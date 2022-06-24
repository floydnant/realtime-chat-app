import { Injectable } from '@angular/core';
// import { LocalSettings } from '../store/models/local-settings.model';
import { LoggedInUser } from '../store/user/user.model';

@Injectable({
    providedIn: 'root',
})
export class LocalStorageService {
    constructor() {}
    private localStoragePrefix = 'chat-';

    private userKey = this.localStoragePrefix + 'user';
    getUser() {
        return this.getItem<LoggedInUser>(this.userKey);
    }
    setUser(user: LoggedInUser) {
        this.setItem(this.userKey, user);
    }
    deleteUser() {
        this.deleteItem(this.userKey);
    }

    // private localSettingsKey = this.localStoragePrefix + 'localSettings';
    // getLocalSettings() {
    // 	return this.getItem<LocalSettings>(this.localSettingsKey);
    // }
    // setLocalSettings(settings: LocalSettings) {
    // 	this.setItem(this.localSettingsKey, settings);
    // }

    getItem<T = string>(key: string): T | null {
        const value = localStorage.getItem(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch (err) {
            return value as any;
        }
    }
    setItem(key: string, value: any) {
        if (typeof value == 'object') value = JSON.stringify(value);
        localStorage.setItem(key, value);
    }
    deleteItem(key: string) {
        localStorage.removeItem(key);
    }
}
