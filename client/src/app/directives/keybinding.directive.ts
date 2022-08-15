import { Directive, ElementRef, HostListener, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { KeybindingService } from '../services/keybinding.service';

export type HandlerAction =
    | 'click'
    | 'focus'
    | 'blur'
    | ((e: KeyboardEvent) => Promise<void | boolean> | void | boolean);

export type StateModifier = 'always' | 'focus' | 'not.focus' | 'not.peer-focus';

interface KeybindingEntry {
    combo: string;
    when: StateModifier;
    action: HandlerAction;
    id: string;
    enabled: boolean;
}


export type KeybindingInput = false | string | Record<string, KeybindingOptions> | Command;


const getKeybindingEntry = (identifier: string, options?: KeybindingOptions): KeybindingEntry => {
    const [combo, stateModifier] = identifier.split(/:\s*/).reverse();
    const action = typeof options == 'function' || typeof options == 'string' ? options : 'click';
    const isEnabled = typeof options == 'object' && typeof options.enabled == 'boolean' ? options.enabled : true;

    return {
        combo,
        when: (stateModifier as StateModifier) || 'always',
        action: isCommand(action as any) ? 'click' : (action as HandlerAction),
        command: isCommand(options) ? options : isCommand(options.command),
        enabled: isEnabled,
        id: new Date().toString() + Math.random(),
    };
};

@Directive({
    selector: '[keybinding], [reportFocus]',
})
export class KeybindingDirective implements OnDestroy, OnChanges {
    constructor(private elemRef: ElementRef, private keybindingService: KeybindingService) {}
    ngOnChanges(changes: SimpleChanges): void {
        if (!('keybinding' in changes)) return;

        // @TODO: surgically unregister & register only keybindings that changed
        this.unregisterKeybindings();
        this.keybindings = [];

        if (!this.keybinding) return;
        if (typeof this.keybinding == 'string') this.keybindings.push(getKeybindingEntry(this.keybinding));
        else
            Object.entries(this.keybinding).forEach(([identifier, options]) => {
                const entry = getKeybindingEntry(identifier, options);
                if (!entry.enabled) return;
                this.keybindings.push(entry);
                if (/focus/.test(entry.when)) this.reportFocus = true;
            });

        this.registerKeybindings();
    }
    ngOnDestroy() {
        this.unregisterKeybindings();
    }

    @Input() keybinding: KeybindingInput;
    private keybindings: KeybindingEntry[] = [];

    @Input() reportFocus: false | '' | true = false;
    isFocused = false;
    @HostListener('focus')
    onFocus() {
        this.isFocused = true;
        if (this.reportFocus || this.reportFocus === '') this.keybindingService.reportFocus(true);
    }
    @HostListener('blur')
    onBlur() {
        this.isFocused = false;
        if (this.reportFocus || this.reportFocus === '') this.keybindingService.reportFocus(false);
    }

    registerKeybindings() {
        this.keybindings.forEach(({ action, when, id, combo, enabled }) => {
            if (enabled)
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
        this.keybindings.forEach(({ id, combo, enabled }) => {
            if (enabled) this.keybindingService.unregisterKeybinding(id, combo);
        });
    }
}
