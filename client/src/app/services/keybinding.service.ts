import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StateModifier } from '../directives/keybinding.directive';

const isMacOs = /(Mac)/i.test(navigator.platform); // @TODO: update deprecated OS check

console.log('isMacOs:', isMacOs);

export const doesComboMatch = (e: KeyboardEvent, combo: string, isMacOs_ = isMacOs) => {
    const keys = combo.split('+');

    const letterKey = keys.filter(key => key != 'cmd' && key != 'shift' && key != 'alt' && key != 'ctrl')[0];
    const letterKeyMatches =
        e.code == 'Key' + letterKey.toUpperCase() ||
        e.code == 'Digit' + letterKey.toUpperCase() ||
        e.code == letterKey ||
        e.key == letterKey;

    if (!letterKeyMatches) return false;

    const modifierMatchMap = {
        cmd: keys.includes('cmd') ? (isMacOs_ ? e.metaKey : e.ctrlKey) : !(isMacOs_ ? e.metaKey : e.ctrlKey),
        shift: keys.includes('shift') ? e.shiftKey : !e.shiftKey,
        alt: keys.includes('alt') ? e.altKey : !e.altKey,
        ctrl: !isMacOs_ ? true : keys.includes('ctrl') ? e.ctrlKey : !e.ctrlKey,
    };
    const modifiersMatch = Object.values(modifierMatchMap).reduce((prev, curr) => prev && curr);

    return modifiersMatch;
};

type ComboMatchHandler = (e: KeyboardEvent) => Promise<void | boolean> | void | boolean;

interface Keybinding {
    when: StateModifier;
    sequence: string[];
    handler: ComboMatchHandler;
}

const debug = false;

@Injectable({
    providedIn: 'root',
})
export class KeybindingService {
    constructor() {
        document.addEventListener('keydown', async e => {
            // check if a sequence is active
            if (this.followUpCombos.length != 0) {
                const keybindingEntry = this.followUpCombos.find(({ nextCombo }) => doesComboMatch(e, nextCombo));

                if (!keybindingEntry) {
                    if (debug) console.log(`No Sequence matched`);
                    this.followUpCombos = [];
                    return;
                }

                const { nextCombo, handler } = keybindingEntry;
                if (debug) console.log(`%cSecond Combo matched: ${nextCombo}`, 'color: hsl(295, 100%, 55%)');

                // handler decides if default should be preserved or prevented
                if (!(await handler(e))) e.preventDefault();
                this.followUpCombos = [];

                return;
            }

            // otherwise check all combos
            this.keybindings.forEach(async ({ sequence, when, handler }) => {
                const focusPreventsMatch = when == 'not.peer-focus' && this.peerHasFocus;
                if (focusPreventsMatch) return;

                const combo = sequence[0];
                if (!doesComboMatch(e, combo)) return;

                // check if it's the start of a sequence
                if (sequence.length > 1) {
                    const nextCombo = sequence[1];
                    if (debug)
                        console.log(
                            `%cFirst Combo matched: ${combo}`,
                            'color: hsl(295, 100%, 55%)',
                            `Waiting for second combo: ${nextCombo}`,
                        );

                    this.followUpCombos.push({ nextCombo, handler });

                    setTimeout(() => {
                        if (this.followUpCombos.length != 0) {
                            this.followUpCombos = [];
                            if (debug) console.log(`Timeout - Could not match a sequence`);
                        }
                    }, 1800);

                    return;
                }

                // handler decides if default should be preserved or prevented
                if (!(await handler(e))) e.preventDefault();
            });
        });
    }

    private followUpCombos: { nextCombo: string; handler: ComboMatchHandler }[] = [];
    private keybindings = new Map<string, Keybinding>();

    registerKeybinding({ id, ...keybinding }: Keybinding & { id: string }) {
        if (debug)
            console.info(
                `registering: %c${keybinding.sequence.join(' -> ')}%c, when: ${keybinding.when}`,
                'color: hsl(185, 100%, 50%);',
                'color: darkgray',
            );

        if (environment.production) {
            const isKeybindingColliding = [...this.keybindings.values()].some(binding =>
                // @TODO: sequences should be normalized (clean up spaces, casing, syntax) before comparing
                binding.sequence.join(' -> ') == keybinding.sequence.join(' -> ') &&
                binding.when != 'focus',
            ); // prettier-ignore
            if (isKeybindingColliding)
                console.warn(`Colliding keybinding: '${keybinding.sequence.join(' -> ')}' already registered`);
        }

        this.keybindings.set(id, keybinding);
    }
    unregisterKeybinding(id: string, sequence: string[]) {
        if (debug) console.info(`unregistering: %c${sequence.join(' -> ')}`, 'color: orange;');
        this.keybindings.delete(id);
    }

    peerHasFocus = false;
    reportFocus(isFocused: boolean) {
        this.peerHasFocus = isFocused;
        if (debug) console.info(`%cpeer-focus: ${isFocused}`, isFocused && 'color: hsl(335, 100%, 55%);');
    }
}
