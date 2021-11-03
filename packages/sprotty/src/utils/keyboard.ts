/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { isMac } from './browser';

/**
 * Returns whether the keyboard event matches the keystroke described by the given
 * code and modifiers. The code must comply to the format of the `code` property
 * of KeyboardEvent, but in contrast to that property, the actual keyboard layout is
 * considered by this function if possible.
 */
export function matchesKeystroke(event: KeyboardEvent, code: KeyCode, ...modifiers: KeyboardModifier[]): boolean {
    if (getActualCode(event) !== code)
        return false;
    if (isMac()) {
        if (event.ctrlKey !== (modifiers.findIndex(m => m === 'ctrl') >= 0))
            return false;
        if (event.metaKey !== (modifiers.findIndex(m => m === 'meta' || m === 'ctrlCmd') >= 0))
            return false;
    } else {
        if (event.ctrlKey !== (modifiers.findIndex(m => m === 'ctrl' || m === 'ctrlCmd') >= 0))
            return false;
        if (event.metaKey !== (modifiers.findIndex(m => m === 'meta') >= 0))
            return false;
    }
    if (event.altKey !== (modifiers.findIndex(m => m === 'alt') >= 0))
        return false;
    if (event.shiftKey !== (modifiers.findIndex(m => m === 'shift') >= 0))
        return false;
    return true;
}

export type KeyboardModifier = 'ctrl' | 'meta' | 'ctrlCmd' | 'alt' | 'shift';

export type KeyCode =
    'AltLeft'|'AltRight'|'ArrowDown'|'ArrowLeft'|'ArrowRight'|'ArrowUp'|'Backslash'|'Backspace'|'Backquote'
    |'BracketLeft'|'BracketRight'|'CapsLock'|'Comma'|'ContextMenu'|'ControlLeft'|'ControlRight'|'Convert'|'Delete'
    |'Digit0'|'Digit1'|'Digit2'|'Digit3'|'Digit4'|'Digit5'|'Digit6'|'Digit7'|'Digit8'|'Digit9'
    |'F1'|'F2'|'F3'|'F4'|'F5'|'F6'|'F7'|'F8'|'F9'|'F10'|'F11'|'F12'|'F13'|'F14'|'F15'|'F16'|'F17'|'F18'|'F19'|'F20'|'F21'|'F22'|'F23'|'F24'
    |'End'|'Enter'|'Equal'|'Escape'|'Home'|'Insert'|'IntlBackslash'|'IntlRo'|'IntlYen'|'KanaMode'
    |'KeyA'|'KeyB'|'KeyC'|'KeyD'|'KeyE'|'KeyF'|'KeyG'|'KeyH'|'KeyI'|'KeyJ'|'KeyK'|'KeyL'|'KeyM'
    |'KeyN'|'KeyO'|'KeyP'|'KeyQ'|'KeyR'|'KeyS'|'KeyT'|'KeyU'|'KeyV'|'KeyW'|'KeyX'|'KeyY'|'KeyZ'
    |'MetaLeft'|'MetaRight'|'Minus'|'NonConvert'|'NumLock'
    |'Numpad0'|'Numpad1'|'Numpad2'|'Numpad3'|'Numpad4'|'Numpad5'|'Numpad6'|'Numpad7'|'Numpad8'|'Numpad9'
    |'NumpadAdd'|'NumpadComma'|'NumpadDecimal'|'NumpadDivide'|'NumpadEnter'|'NumpadEqual'|'NumpadMultiply'
    |'NumpadSeparator'|'NumpadSubtract'|'OSLeft'|'OSRight'|'PageDown'|'PageUp'|'Pause'|'Period'|'PrintScreen'
    |'Quote'|'ScrollLock'|'Semicolon'|'ShiftLeft'|'ShiftRight'|'Slash'|'Space'|'Tab';

/**
 * Determines a key code from the given event. This is necessary because the `code` property of
 * a KeyboardEvent does not consider keyboard layouts.
 */
export function getActualCode(event: KeyboardEvent): KeyCode {
    if (event.keyCode) {
        const result = STRING_CODE[event.keyCode];
        if (result !== undefined)
            return result;
    }
    return event.code as KeyCode;
}

const STRING_CODE: { [keyCode: number]: KeyCode } = new Array(256);

(() => {
    function addKeyCode(stringCode: KeyCode, numericCode: number): void {
        if (STRING_CODE[numericCode] === undefined)
            STRING_CODE[numericCode] = stringCode;
    }

    addKeyCode('Pause', 3);
    addKeyCode('Backspace', 8);
    addKeyCode('Tab', 9);
    addKeyCode('Enter', 13);
    addKeyCode('ShiftLeft', 16);
    addKeyCode('ShiftRight', 16);
    addKeyCode('ControlLeft', 17);
    addKeyCode('ControlRight', 17);
    addKeyCode('AltLeft', 18);
    addKeyCode('AltRight', 18);
    addKeyCode('CapsLock', 20);
    addKeyCode('Escape', 27);
    addKeyCode('Space', 32);
    addKeyCode('PageUp', 33);
    addKeyCode('PageDown', 34);
    addKeyCode('End', 35);
    addKeyCode('Home', 36);
    addKeyCode('ArrowLeft', 37);
    addKeyCode('ArrowUp', 38);
    addKeyCode('ArrowRight', 39);
    addKeyCode('ArrowDown', 40);
    addKeyCode('Insert', 45);
    addKeyCode('Delete', 46);

    addKeyCode('Digit1', 49);
    addKeyCode('Digit2', 50);
    addKeyCode('Digit3', 51);
    addKeyCode('Digit4', 52);
    addKeyCode('Digit5', 53);
    addKeyCode('Digit6', 54);
    addKeyCode('Digit7', 55);
    addKeyCode('Digit8', 56);
    addKeyCode('Digit9', 57);
    addKeyCode('Digit0', 48);

    addKeyCode('KeyA', 65);
    addKeyCode('KeyB', 66);
    addKeyCode('KeyC', 67);
    addKeyCode('KeyD', 68);
    addKeyCode('KeyE', 69);
    addKeyCode('KeyF', 70);
    addKeyCode('KeyG', 71);
    addKeyCode('KeyH', 72);
    addKeyCode('KeyI', 73);
    addKeyCode('KeyJ', 74);
    addKeyCode('KeyK', 75);
    addKeyCode('KeyL', 76);
    addKeyCode('KeyM', 77);
    addKeyCode('KeyN', 78);
    addKeyCode('KeyO', 79);
    addKeyCode('KeyP', 80);
    addKeyCode('KeyQ', 81);
    addKeyCode('KeyR', 82);
    addKeyCode('KeyS', 83);
    addKeyCode('KeyT', 84);
    addKeyCode('KeyU', 85);
    addKeyCode('KeyV', 86);
    addKeyCode('KeyW', 87);
    addKeyCode('KeyX', 88);
    addKeyCode('KeyY', 89);
    addKeyCode('KeyZ', 90);

    addKeyCode('OSLeft', 91);
    addKeyCode('MetaLeft', 91);
    addKeyCode('OSRight', 92);
    addKeyCode('MetaRight', 92);
    addKeyCode('ContextMenu', 93);

    addKeyCode('Numpad0', 96);
    addKeyCode('Numpad1', 97);
    addKeyCode('Numpad2', 98);
    addKeyCode('Numpad3', 99);
    addKeyCode('Numpad4', 100);
    addKeyCode('Numpad5', 101);
    addKeyCode('Numpad6', 102);
    addKeyCode('Numpad7', 103);
    addKeyCode('Numpad8', 104);
    addKeyCode('Numpad9', 105);
    addKeyCode('NumpadMultiply', 106);
    addKeyCode('NumpadAdd', 107);
    addKeyCode('NumpadSeparator', 108);
    addKeyCode('NumpadSubtract', 109);
    addKeyCode('NumpadDecimal', 110);
    addKeyCode('NumpadDivide', 111);

    addKeyCode('F1', 112);
    addKeyCode('F2', 113);
    addKeyCode('F3', 114);
    addKeyCode('F4', 115);
    addKeyCode('F5', 116);
    addKeyCode('F6', 117);
    addKeyCode('F7', 118);
    addKeyCode('F8', 119);
    addKeyCode('F9', 120);
    addKeyCode('F10', 121);
    addKeyCode('F11', 122);
    addKeyCode('F12', 123);
    addKeyCode('F13', 124);
    addKeyCode('F14', 125);
    addKeyCode('F15', 126);
    addKeyCode('F16', 127);
    addKeyCode('F17', 128);
    addKeyCode('F18', 129);
    addKeyCode('F19', 130);
    addKeyCode('F20', 131);
    addKeyCode('F21', 132);
    addKeyCode('F22', 133);
    addKeyCode('F23', 134);
    addKeyCode('F24', 135);

    addKeyCode('NumLock', 144);
    addKeyCode('ScrollLock', 145);

    addKeyCode('Semicolon', 186);
    addKeyCode('Equal', 187);
    addKeyCode('Comma', 188);
    addKeyCode('Minus', 189);
    addKeyCode('Period', 190);
    addKeyCode('Slash', 191);
    addKeyCode('Backquote', 192);
    addKeyCode('IntlRo', 193);
    addKeyCode('BracketLeft', 219);
    addKeyCode('Backslash', 220);
    addKeyCode('BracketRight', 221);
    addKeyCode('Quote', 222);
    addKeyCode('IntlYen', 255);
})();
