import { KeybindingInput } from 'src/app/directives/keybinding.directive';

export enum MenuItemType {
    DEFAULT = 'default',
    PRIMARY = 'primary',
    DANGER = 'danger',
    SEPERATOR = 'separator',
}

export type MenuItem = {
    label: string;
    type?: MenuItemType;
    action?: () => void;
    route?: string;
    badge?: number;
    disabled?: boolean;
    iconClass: string;
    keybinding?: KeybindingInput;
};
