'use strict';

import SettingsStorage from "./settingsstorage";

const GRID_SIZE = 'grid_size';
const GRID_VISIBILITY = 'grid_visible';
const VALIDATION_SETTINGS = 'validation_settings';
const SPLITTER_SETTINGS = 'splitter_settings';

export default class Settings {

    constructor() {
    }

    static get gridSize() {
        const DEFAULT_GRID_SIZE = 10;
        return SettingsStorage.getItem(GRID_SIZE) || DEFAULT_GRID_SIZE;
    }

    static set gridSize(size) {
        SettingsStorage.setItem(GRID_SIZE, size);
    }

    static get gridVisibility() {
        return SettingsStorage.getItem(GRID_VISIBILITY) == true;
    }

    static set gridVisibility(visibility) {
        SettingsStorage.setItem(GRID_VISIBILITY, visibility);
    }

    static get validations() {
        return SettingsStorage.getItem(VALIDATION_SETTINGS) || {};
    }

    static set validations(v) {
        SettingsStorage.setItem(VALIDATION_SETTINGS, v);
    }

    static get splitters() {
        return SettingsStorage.getItem(SPLITTER_SETTINGS) || {};
    }

    static set splitters(v) {
        SettingsStorage.setItem(SPLITTER_SETTINGS, v);
    }
}
