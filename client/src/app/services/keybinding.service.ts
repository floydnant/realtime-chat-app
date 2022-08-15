import { Injectable } from '@angular/core';
import { StateModifier } from '../directives/keybinding.directive';

const isMacOs = true; // @TODO: implement OS check

export const doesComboMatch = (e: KeyboardEvent, combo: string, isMacOs = false) => {
    const keys = combo.split('+');

    const letterKey = keys.filter(key => key != 'cmd' && key != 'shift' && key != 'alt' && key != 'ctrl')[0];
    const letterKeyMatches =
        e.code == 'Key' + letterKey.toUpperCase() ||
        e.code == 'Digit' + letterKey.toUpperCase() ||
        e.code == letterKey ||
        e.key == letterKey;

    if (!letterKeyMatches) return false;

    const modifierMatchMap = {
        cmd: keys.includes('cmd') ? (isMacOs ? e.metaKey : e.ctrlKey) : !(isMacOs ? e.metaKey : e.ctrlKey),
        shift: keys.includes('shift') ? e.shiftKey : !e.shiftKey,
        alt: keys.includes('alt') ? e.altKey : !e.altKey,
        ctrl: !isMacOs ? true : keys.includes('ctrl') ? e.ctrlKey : !e.ctrlKey,
    };
    const modifiersMatch = Object.values(modifierMatchMap).reduce((prev, curr) => prev && curr);

    return modifiersMatch;
};

interface Keybinding {
    when: StateModifier;
    combo: string;
    handler: (e: KeyboardEvent) => Promise<void | boolean> | void | boolean;
}

const debug = false;

@Injectable({
    providedIn: 'root',
})
export class KeybindingService {
    constructor() {
        // @TODO: implement sequences
        document.addEventListener('keydown', e => {
            this.keybindings.forEach(async ({ combo, handler, when }) => {
                const focusPreventsMatch = when == 'not.peer-focus' && this.peerHasFocus;
                if (!focusPreventsMatch && doesComboMatch(e, combo, isMacOs)) {
                    if (debug) console.log('%cCombo matched: ' + combo, 'color: hsl(295, 100%, 55%)');
                    const preserveDefault = await handler(e);
                    if (!preserveDefault) e.preventDefault();
                }
            });
        });
    }

    private keybindings = new Map<string, Keybinding>();

    registerKeybinding({ id, ...keybinding }: Keybinding & { id: string }) {
        if (debug)
            console.info(
                `registering: %c${keybinding.combo}%c, when: ${keybinding.when}`,
                'color: hsl(185, 100%, 50%);',
                'color: darkgray',
            );

        const isKeybindingColliding = [...this.keybindings.values()].some(
            binding => binding.combo == keybinding.combo && binding.when != 'focus',
        );
        if (isKeybindingColliding) console.warn(`keybinding '${keybinding.combo}' already registered`);

        this.keybindings.set(id, keybinding);
    }
    unregisterKeybinding(id: string, combo: string) {
        if (debug) console.info(`unregistering: %c${combo}`, 'color: orange;');
        this.keybindings.delete(id);
    }

    peerHasFocus = false;
    reportFocus(isFocused: boolean) {
        this.peerHasFocus = isFocused;
        if (debug) console.info(`%cpeer-focus: ${isFocused}`, isFocused && 'color: hsl(335, 100%, 55%);');
    }
}
