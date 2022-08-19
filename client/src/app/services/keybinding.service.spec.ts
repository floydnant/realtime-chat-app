import { TestBed } from '@angular/core/testing';

import { doesComboMatch, KeybindingService } from './keybinding.service';

describe('KeybindingService', () => {
    let service: KeybindingService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(KeybindingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});

describe('doesComboMatch()', () => {
    it('matches right letter key', () => {
        const event = new KeyboardEvent('keydown', { key: 'M', code: 'KeyM' });
        expect(doesComboMatch(event, 'M')).toBe(true);
    });
    it('does not match other letter keys', () => {
        const event = new KeyboardEvent('keydown', { key: 'F', code: 'KeyF' });
        expect(doesComboMatch(event, 'M')).toBe(false);
    });
    it('matches right digit key', () => {
        const event = new KeyboardEvent('keydown', { key: '2', code: 'Digit2' });
        expect(doesComboMatch(event, '2')).toBe(true);
    });

    describe('modifiers', () => {
        it('matches cmd', () => {
            const macOsEvent = new KeyboardEvent('keydown', { key: 'F', code: 'KeyF', metaKey: true });
            expect(doesComboMatch(macOsEvent, 'cmd+F', true)).withContext('as cmd on macOS').toBe(true);

            const otherEvent = new KeyboardEvent('keydown', { key: 'F', code: 'KeyF', ctrlKey: true });
            expect(doesComboMatch(otherEvent, 'cmd+F')).withContext('as ctrlKey on other OSs').toBe(true);
        });
        it('matches shift', () => {
            const event = new KeyboardEvent('keydown', { key: 'F', code: 'KeyF', shiftKey: true });
            expect(doesComboMatch(event, 'shift+F')).toBe(true);
        });
        it('matches alt', () => {
            const event = new KeyboardEvent('keydown', { key: 'F', code: 'KeyF', altKey: true });
            expect(doesComboMatch(event, 'alt+F')).toBe(true);
        });
    });

    it('matches Enter', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
        expect(doesComboMatch(event, 'Enter')).toBe(true);
    });
    it('matches Escape', () => {
        const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' });
        expect(doesComboMatch(event, 'Escape')).toBe(true);
    });
});
