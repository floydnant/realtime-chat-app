import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { KeybindingService } from '../services/keybinding.service';

type HandlerAction = 'click' | 'focus' | 'blur' | ((e: KeyboardEvent) => Promise<void | boolean> | void | boolean);

export type StateModifier = 'always' | 'focus' | 'not.focus';

interface KeybindingEntry {
    combo: string;
    when: StateModifier;
    action: HandlerAction;
    id: string;
}

const getKeybindingEntry = (identifier: string, action?: HandlerAction): KeybindingEntry => {
    const [combo, stateModifier] = identifier.split(':').reverse();
    return {
        combo,
        when: (stateModifier as any) || 'always', // @TODO: add boolean modifiers
        action: action || 'click',
        id: new Date().toString() + Math.random(),
    };
};

@Directive({
    selector: '[keybinding]',
})
export class KeybindingDirective implements OnInit, OnDestroy {
    constructor(private elemRef: ElementRef, private keybindingService: KeybindingService) {}
    // @TODO: make keybindings dynamicly updatable
    ngOnInit() {
        if (!this.keybinding) return;
        if (typeof this.keybinding == 'string') this.keybindings.push(getKeybindingEntry(this.keybinding));
        else
            Object.entries(this.keybinding).forEach(([identifier, action]) => {
                this.keybindings.push(getKeybindingEntry(identifier, action));
            });

        this.registerKeybindings();
    }
    ngOnDestroy() {
        this.unregisterKeybindings();
    }

    @Input() keybinding: false | string | Record<string, HandlerAction>;
    private keybindings: KeybindingEntry[] = [];

    isFocused = false;
    @HostListener('focus')
    onFocus() {
        this.isFocused = true;
    }
    @HostListener('blur')
    onBlur() {
        this.isFocused = false;
    }

    registerKeybindings() {
        this.keybindings.forEach(({ action, when, id, combo }) => {
            this.keybindingService.registerKeybinding({
                id,
                when,
                combo,
                handler: e => {
                    if (when == 'focus' && !this.isFocused) return true;
                    if (when == 'not.focus' && this.isFocused) return true;

                    if (typeof action == 'string') this.elemRef.nativeElement[action]();
                    else return action(e);
                },
            });
        });
    }

    unregisterKeybindings() {
        this.keybindings.forEach(({ id, combo }) => {
            this.keybindingService.unregisterKeybinding(id, combo);
        });
    }
}
