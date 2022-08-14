import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KeybindingService } from '../services/keybinding.service';
import { KeybindingDirective } from './keybinding.directive';

class MockKeybindingService {
    registerKeybinding() {}
    unregisterKeybinding() {}
}

describe('KeybindingDirective', () => {
    let directive: KeybindingDirective;
    // let mockKeybindingService: KeybindingService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            // provide the component-under-test and dependent service
            providers: [
                KeybindingDirective,
                { provide: ElementRef, useValue: { nativeElement: { click() {}, focus() {} } } },
                { provide: KeybindingService, useClass: MockKeybindingService },
            ],
        });
        // inject both the component and the dependent service.
        directive = TestBed.inject(KeybindingDirective);
        // mockKeybindingService = TestBed.inject(KeybindingService);
    });
    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });
});
