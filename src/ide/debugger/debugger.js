'use strict';

import CodeMirrorConfig from "@ide/editors/external/codemirrorconfig";
import CaseView from "@ide/modeleditor/case/elements/caseview";
import { $get } from "@util/ajax";
import Util from "@util/util";
import $ from "jquery";
import StandardForm from "../editors/standardform";
import RightSplitter from "../splitter/rightsplitter";
import Settings from "@ide/settings/settings";

/**
 * This class implements the logic to call the repository REST service to debug a case instance.
 *
 * @constructor
 */
export default class Debugger extends StandardForm {
    /**
     * 
     * @param {CaseView} cs 
     */
    constructor(cs) {
        super(cs, 'Debugger', 'debug-form');
        this.eventTypeFilter = '';
        this.eventNameFilter = '';
    }

    renderData() {
        this.htmlContainer.html(
            `<div>
    <div>
        <span style="top:-15px;position:relative;">
            <label>Case instance</label>
            <input class="caseInstanceId" type="text"></input>
            <button class="buttonShowEvents">Show Events</button>
            <button style="display:none" class="buttonClearEvents">Clear</button>
        </span>
        <span style="left:450px;top:-35px;font-size:smaller;position:relative;">
            <table>
                <tr>
                    <td>
                        <label style="margin-right:10px;">Event Range (from/to)</label>
                    </td>
                    <td>
                        <label style="margin-left:15px">Show/hide options</label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <input class="from" type="number" style="margin-left:5px;font-size:smaller;width:50px;position:relative;top:-1px;"></input>
                    </td>
                    <td>
                        <input style="margin-left:15px;position:relative;top:1px" id="hp" class="inputShowPathInformation" type="checkbox"></input>
                        <label style="position:relative;top:-2px" for="hp">Show path information</label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <input class="to" type="number" style="margin-left:5px;font-size:smaller;width:50px;position:relative;top:-1px;"></input>
                    </td>
                    <td>        
                        <input style="margin-left:15px;position:relative;top:1px" id="ht" class="inputShowAllTimestamps" type="checkbox"></input>
                        <label style="position:relative;top:-2px" for="ht">All timestamps</label>
                    </td>
                </tr>
                <tr>
                    <td>
                    </td>
                    <td>
                        <input style="margin-left:15px" id="hd" class="inputHideDetail" type="checkbox"></input>
                        <label style="position:relative;top:-3px" for="hd">Hide generic event data</label>
                    </td>
                </tr>
            </table>
        </span>
        <span style="top:-90px;position:relative;">
            <label>Server to use</label>
            <input style="margin-left:4px" class="serverURL" value="${Settings.serverURL}" type="text"></input>
        </span>
    </div>
    <div class="event-container">
        <div>
            <span class="spanEventListButtons">
                <label>Events</label>
                <button class="buttonCopyEvents">Copy events</button>
                <button class="buttonCopyDefinition">Copy case definition</button>            
                <button class="buttonShowParentEvents">Show Parent Events</button>
                <button class="buttonCopyFilteredEvents">Copy filtered events</button>
            </span>
        </div>
        <div class="debug-container">
            <div class="event-list">
                <table>
                    <thead>
                        <tr>
                            <td class="event-list-nr"><strong>Nr</strong></td>
                            <td class="event-list-type"><strong>Type</strong></td>
                            <td class="event-list-name"><strong>Name</strong></td>
                            <td class="event-list-time"><strong>Time</strong></td>
                        </tr>
                    </thead>
                </table>
            </div>
            <div class="event-content">
                <div class="codeMirrorSource debugFormContent" />
            </div>
        </div>
    </div>
</div>`);

        this.html.find('.caseInstanceId').val(localStorage.getItem('debug-case-id'))
        this.html.find('.serverURL').on('change', e => Settings.serverURL = e.currentTarget.value);
        this.html.find('.from').val(localStorage.getItem('from'))
        this.html.find('.to').val(localStorage.getItem('to'))
        this.html.find('.inputShowPathInformation').prop('checked', this.showPathInformation);
        this.html.find('.inputShowPathInformation').on('change', e => {
            this.showPathInformation = e.currentTarget.checked;
            this.renderEvents();
        });
        this.html.find('.inputHideDetail').prop('checked', this.hideDetails);
        this.html.find('.inputHideDetail').on('change', e => {
            this.hideDetails = e.currentTarget.checked;
            this.renderEvents();
        });
        this.html.find('.inputShowAllTimestamps').prop('checked', this.showAllTimestamps);
        this.html.find('.inputShowAllTimestamps').on('change', e => {
            this.showAllTimestamps = e.currentTarget.checked;
            this.renderEvents();
        });
        this.html.find('.buttonShowEvents').on('click', () => this.showEvents());
        this.html.find('.buttonClearEvents').on('click', () => this.clearEvents());
        this.html.find('.buttonShowParentEvents').on('click', () => this.showParentEvents());
        this.html.find('.buttonCopyEvents').on('click', () => Util.copyText(JSON.stringify(this.events, undefined, 2)));
        this.html.find('.buttonCopyFilteredEvents').on('click', () => Util.copyText(JSON.stringify(this.filteredEvents, undefined, 2)));
        this.html.find('.buttonCopyDefinition').on('click', () => Util.copyText(this.currentDefinition));

        this.splitter = new RightSplitter(this.html.find('.debug-container'), '150px');
        this.eventTable = this.html.find('.event-list');

        // Add code mirror for decent printing
        this.codeMirrorEventViewer = CodeMirrorConfig.createJSONEditor(this.htmlContainer.find('.debugFormContent'));

        this.keyHandler = e => this.handleKeyDown(e);

        // Scan for pasted text. It can upload and re-engineer a deployed model into a set of files
        this.html.find('.event-content').on('paste', e => this.handlePasteText(e));
    }

    /**
     * 
     * @param {JQuery.Event} e 
     */
    handlePasteText(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        const pastedText = e.originalEvent.clipboardData.getData('text/plain');
        try {
            const potentialEvents = JSON.parse(pastedText);
            this.events = potentialEvents;
        } catch (error) {
            console.log("Cannot paste text events")
            return false;
        }
    }

    /**
     * 
     * @param {JQuery.ChangeEvent} e 
     */
    searchWith(e) {
        const searchBox = $(e.currentTarget);
        const searchText = searchBox.val();
        const filterName = searchBox.attr('filter');
        this[filterName] = searchText;
        this.renderEvents();
    }

    /**
     * @returns {Boolean}
     */
    get showPathInformation() {
        const showPath = localStorage.getItem('showPathInformation') === 'true';
        return showPath;
    }

    set showPathInformation(show) {
        localStorage.setItem('showPathInformation', show.toString());
    }

    /**
     * @returns {Boolean}
     */
    get hideDetails() {
        const hide = localStorage.getItem('hideDetails') === 'true';
        return hide;
    }

    set hideDetails(show) {
        localStorage.setItem('hideDetails', show.toString());
    }

    /**
     * @returns {Boolean}
     */
    get showAllTimestamps() {
        const hide = localStorage.getItem('hideTimestamps') === 'true';
        return hide;
    }

    set showAllTimestamps(show) {
        localStorage.setItem('hideTimestamps', show.toString());
    }

    /**
     * 
     * @param {JQuery.KeyDownEvent} e 
     */
    handleKeyDown(e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.filteredEvents.length == 0) return; // Nothing rendered, hence no event to select.

        if (e.keyCode == 38) { // arrow up
            if (this.selectedEvent) {
                if (this.selectedEvent.filterIndex == this.filteredEvents.length - 1) {
                    return;
                } else {
                    this.selectEvent(this.filteredEvents[this.selectedEvent.filterIndex + 1], true);
                }
            } else {
                const lastEvent = this.filteredEvents[this.filteredEvents.length - 1];
                if (lastEvent) { // If there are events, select the last one (because table is showing reversed list)
                    this.selectEvent(lastEvent, true)
                }
            }
        } else if (e.keyCode == 40) { // arrow down
            if (this.selectedEvent) {
                if (this.selectedEvent.filterIndex == 0) {
                    return;
                } else {
                    this.selectEvent(this.filteredEvents[this.selectedEvent.filterIndex - 1], true);
                }
            } else {
                const lastEvent = this.filteredEvents[this.filteredEvents.length - 1];
                if (lastEvent) { // If there are events, select the last one (because table is showing reversed list)
                    this.selectEvent(lastEvent, true)
                }
            }
        }
    }

    move() {
        // CaseModelEditor moves the movable editor upon keypress (up/down). But we want to use that keypress ourselves, hence ignore the casemodeleditor with this override
        // console.log("Ignoring the move ;)")
    }

    onShow() {
        this.html.css('height', '100%');
        this.html.css('width', '100%');
        this.html.css('top', '0px');
        this.html.css('left', '0px');

        $(document).off('keyup', this.keyHandler);
        $(document).on('keyup', this.keyHandler);
        this.html.find('.buttonShowEvents').focus();
        if (this.events) {
            this.renderEvents();
        }
    }

    onHide() {
        $(document).off('keyup', this.keyHandler);
        this.selectedEvent = undefined;
    }

    setEventContent(label, content) {
        this.codeMirrorEventViewer.setValue(content);
        this.codeMirrorEventViewer.refresh();
    }

    get events() {
        return this._events;
    }

    detectParentActor() {
        this.parentActorId = '';
        const parents = this.events.filter(event => event.content.parentActorId)
        if (parents.length) {
            this.parentActorId = parents[parents.length - 1].content.parentActorId;
        } else {
            // Check if there is a case with a business identifier named '__ttp__boardId__'
            //  and if that is not found, check if we're in a consent group created by a board (then the id ends with '-team')
            const boards = this.events.filter(event => event.type === 'BusinessIdentifierSet' && event.content.name === '__ttp__boardId__')
            if (boards.length) {
                this.parentActorId = boards[0].content.value;
            } else {
                const currentActorId = this.html.find('.caseInstanceId').val().toString();
                if (currentActorId.endsWith('-team')) {
                    this.parentActorId = currentActorId.substring(0, currentActorId.length - 5);
                }
            }
        }
    }

    /**
     * @param {Array<*>} events 
     */
    set events(events) {
        this.selectedEvent = undefined;
        this._events = events;
        for (let i = 0; i < events.length; i++) {
            events[i].localNr = i;
        }
        const clearButtonVisibility = this.events.length > 0 ? '' : 'none';
        this.html.find('.buttonClearEvents').css('display', clearButtonVisibility);
        this.currentDefinition = ''; // Clear current case definition
        this.events.filter(event => event.type === 'CaseDefinitionApplied').forEach(event => this.currentDefinition = event.content.definition.source);
        this.detectParentActor();
        this.pics = events.filter(event => event.type === 'PlanItemCreated');
        console.log(`Found ${events.length} events`)
        this.renderEvents();

        const picPrinter = (pic, index) => {
            // compatibility on events created up to cafienne engine version 1.1.21: in newer events a path property exists, showing more info.
            if (pic.content.path) return `${index}: ${pic.content.type}[${pic.content.path}]`;
            return `${index}: ${pic.content.type}[${pic.content.name + '.' + pic.content.planitem.index}]`;
        }
        if (this.pics.length > 0) { // Otherwise probably a tenant is rendered
            console.log(`Case has ${this.pics.length} plan items:\n ${this.pics.map(picPrinter).join('\n ')}`);
        }
    }

    get filteredEvents() {
        return this._filteredEvents || []; // If nothing yet selected, return an empty array
    }

    /**
     * @param {Array<any>} selection
     */
    set filteredEvents(selection) {
        // Clear filterIndex on current selection
        if (this._filteredEvents) this._filteredEvents.forEach(value => delete value.filterIndex)
        // Apply filterIndex to new selection
        selection.forEach((value, index) => value.filterIndex = index);
        // And assign the new selection
        this._filteredEvents = selection;
        // Also clear the current event if it is not in the selection
        if (this.selectedEvent && this.selectedEvent.filterIndex === undefined) {
            this.selectEvent(undefined); // Clear the selected event, as it is not in the filter
        }
    }

    getEventName(event) {
        /** @type{String} */
        const path = event.content.path;
        const paths = path ? path.split('/') : [];

        if (this.showPathInformation && path) {
            return paths.length > 1 ? path.split('/').slice(1).join('/') : path;
        }

        if (event.content.messages && event.content.messages['1']) {
            return `<b style='text-align:center'>${event.content.messages['1'].type}</b>`;
        }

        const planItemId = event.content.planItemId || event.content.taskId;
        if (!planItemId) return '';

        if (path) {
            return paths[paths.length - 1];
        }

        // console.log("Searching for event with id "+planItemId)
        const eventWithName = this.getPlanItemName(planItemId);
        // console.log("Event with name: "+(eventWithName ? (eventWithName.content.name) : 'none'));
        return eventWithName;
    }

    isDefinitionEvent(event) {
        return (event.content && event.content.definition && event.content.definition.source && ('' + event.content.definition.source).startsWith('<?xml'));
    }

    getEventButton(event) {
        if (event.type === 'TaskInputFilled' && (event.content.type === 'ProcessTask' || event.content.type === 'CaseTask') || event.type === 'BoardTeamCreated' || event.type === 'FlowActivated') {
            return '<span style="padding-left:20px"><button class="buttonShowSubEvents">Show events</button></span>';
        } else if (this.isDefinitionEvent(event)) {
            return '<span style="padding-left:20px"><button class="buttonCopyEventDefinition">Copy definition</button></span>';
        } else {
            return '';
        }
    }

    getPlanItemName(planItemId) {
        const pic = this.pics.find(p => p.content.planItemId === planItemId);
        if (pic) {
            if (pic.content.path) {
                return pic.content.path.substring(pic.content.path.indexOf('/'))
            } else {
                return pic.content.name + '.' + pic.content.planitem.index;
            }
        } else {
            return '';
        }

    }

    getIndex(eventWithName) {
        if (!eventWithName) return '';
        if (!eventWithName.content) return '';
        if (!eventWithName.content.planitem) return '';
        const index = eventWithName.content.planitem.index;
        if (index) {
            return '.' + index;
        } else {
            return '.0';
        }
    }

    renderEvents() {
        if (!this.events) {
            return;
        }
        const renderedBefore = this.eventTable.find('tr').length > 1;
        const startMsg = this.events.length > 0 ? '' : 'If there are no events, check case instance id and context variables';
        this.setEventContent('', startMsg);
        Util.clearHTML(this.eventTable);

        const getBackgroundColor = event => {
            if (event.type !== 'PlanItemTransitioned') return '';
            if (event.content.currentState == 'Failed') return 'color: red; font-weight: bold';
            if (event.content.currentState == 'Completed') return 'color: green; font-weight: bold';
            if (event.content.currentState == 'Terminated') return 'color: darkblue; font-weight: bold';
        }

        const eventTypes = this.eventTypeFilter.split(' ');
        const eventNames = this.eventNameFilter.split(' ');

        const applyFilter = event => {
            const eventType = event.type;
            const eventName = this.getEventName(event);
            const hasOneOfEventTypes = eventTypes[0] == '' || eventTypes.find(type => hasSearchText(type, eventType));
            const hasOneOfEventNames = eventNames[0] == '' || eventNames.find(name => hasSearchText(name, eventName));
            return hasOneOfEventTypes && hasOneOfEventNames;
        }

        let currentTimestamp = '';
        let numTransactions = 0;

        this.filteredEvents = this.events.filter(applyFilter);
        const newRows = this.filteredEvents.map(event => {
            const timestamp = event.content.modelEvent.timestamp ? event.content.modelEvent.timestamp : event.type.indexOf('Modified') >= 0 ? event.content.lastModified : '';
            const format = timestamp => timestamp.substring(0, timestamp.indexOf('.') + 4);
            let timestampString = timestamp;
            if (!currentTimestamp) { // bootstrap
                currentTimestamp = timestamp;
                numTransactions = 1;
                timestampString = `<strong>${format(timestamp)}</strong>`;
            }
            if (currentTimestamp != timestamp) {
                currentTimestamp = timestamp;
                numTransactions++;
                timestampString = `<strong>${format(timestamp)}</strong>`;
            } else {
                timestampString = this.showAllTimestamps ? format(timestamp) : '';
            }
            const bgc = getBackgroundColor(event);
            return `<tr event-nr="${event.localNr}">
                <td>${event.nr}</td>
                <td style="${bgc}">${event.type}${this.getEventButton(event)}</td>
                <td style="white-space:nowrap"><span>${this.getEventName(event)}</span></td>
                <td style="white-space:nowrap">${timestampString}</td>
            </tr>\n`
        }).reverse().join('');
        this.eventTable.html(`
        <table>
            <thead>
                <tr>
                    <td><strong>Nr</strong><br/><div>count: ${this.filteredEvents.length}</div></td>
                    <td><strong>Type</strong><br/><input type="text"  filter="eventTypeFilter" value="${this.eventTypeFilter}" /></td>
                    <td style="white-space:nowrap"><strong>Name</strong><br/><input type="text" filter="eventNameFilter" value="${this.eventNameFilter}" /></td>
                    <td style="white-space:nowrap"><strong>Time</strong><div>batches: ${numTransactions}</div></td>
                </tr>
            </thead>
            <tbody>
                ${newRows}
            </tbody>
        </table>`);
        this.eventTable.find('tr').on('click', e => this.selectEvent(this.findEvent(e.currentTarget) || this.selectedEvent)); // Note, if clicking outside an event, do not change selection.
        this.eventTable.find('input[filter]').on('change', e => this.searchWith(e));
        this.eventTable.find('.buttonShowSubEvents').on('click', e => this.showSubEvents(e.currentTarget));
        this.eventTable.find('.buttonCopyEventDefinition').on('click', e => this.copyEventDefinition(e.currentTarget));

        if (this.eventTable.width() < this.eventTable.find('table').width()) {
            this.splitter.repositionSplitter(this.eventTable.find('table').width() + 20);
        }
        if (!renderedBefore) this.splitter.repositionSplitter(this.eventTable.find('table').width() + 70);
        this.renderEventButtons();
        // Upon rendering the events again (e.g. when changing a tickmark in the show/hide options), let's render the selected event again.
        this.selectEvent(this.selectedEvent);
    }

    renderEventButtons() {
        if (this.events && this.events.length > 0) {
            this.html.find('.spanEventListButtons').css('display', 'block');
            this.html.find('.buttonCopyDefinition').css('display', this.currentDefinition ? '' : 'none');
            this.html.find('.buttonCopyFilteredEvents').css('display', this.events.length == this.filteredEvents.length ? 'none' : '');
            this.html.find('.buttonShowParentEvents').css('display', this.parentActorId ? '' : 'none');
        } else {
            this.html.find('.spanEventListButtons').css('display', 'none');
        }
    }

    get selectedEvent() {
        return this._selectedEvent;
    }

    set selectedEvent(event) {
        this._selectedEvent = event;
    }

    /**
     * @param {Element} htmlElement
     */
    findEvent(htmlElement) {
        const eventId = $(htmlElement).closest('tr').attr('event-nr');
        if (eventId) {
            const event = this.events[eventId];
            return event;
        }
    }

    showSubEvents(btn) {
        const event = this.findEvent(btn);
        // New task events carry planItemId, but older ones may still have taskId filled instead, so also trying that.
        this.html.find('.caseInstanceId').val(event.content.planItemId || event.content.taskId || event.content.team || event.content.flowId);
        this.showEvents();
    }

    showParentEvents() {
        if (this.parentActorId) {
            this.html.find('.caseInstanceId').val(this.parentActorId);
            this.showEvents();
        }
    }

    copyEventDefinition(btn) {
        const event = this.findEvent(btn);
        Util.copyText(event.content.definition.source);
    }

    /**
     * 
     * @param {*} event 
     * @param {boolean} scroll Whether to center the selected event. Only done when there is a scrollbar and arrow-down or arrow-up is pressed
     * @returns 
     */
    selectEvent(event, scroll = false) {
        this.selectedEvent = event;
        // Clear current selection
        this.eventTable.find('tr').css('background-color', '')

        if (!this.selectedEvent) {
            // Return if a new event is not selected.
            return;
        }

        this.eventTable.find(`tr[event-nr='${this.selectedEvent.localNr}']`).css('background-color', 'rgb(156, 175, 226)');

        // Make a copy;
        const content = JSON.parse(JSON.stringify(this.selectedEvent.content));
        if (this.hideDetails) {
            delete content.modelEvent;
            delete content.caseInstanceId;
        }
        this.setEventContent('', JSON.stringify(content, undefined, 3));

        if (scroll) {
            this.eventTable.find(`tr[event-nr='${this.selectedEvent.localNr}']`)[0].scrollIntoView({ block: 'center' })
        }
    }

    clearEvents() {
        this.events = [];
    }

    async showEvents() {
        const caseInstanceId = this.html.find('.caseInstanceId').val();
        const from = this.html.find('.from').val();
        const to = this.html.find('.to').val();
        const parameters = [];
        if (from && from !== '') {
            parameters.push(`from=${from}`)
        }
        if (to) {
            parameters.push(`to=${to}`)
        }

        $get(`${Settings.serverURL}/debug/${caseInstanceId}?${parameters.join('&')}`).then(data => {
            this.events = data;
            if (this.events.length > 0) {
                // Only overwrite the previous identifier if we have actually found events.
                localStorage.setItem('debug-case-id', caseInstanceId.toString());
                localStorage.setItem('from', '' + from);
                localStorage.setItem('to', '' + to);
            }
        }).catch(error => this.modelEditor.ide.danger(error.message, 5000));
    }
}

/**
 * Determines recursively whether each character of text1 is available in text2 
 * @param {String} searchFor 
 * @param {String} searchIn
 */
function hasSearchText(searchFor, searchIn) {
    if (!searchFor) {
        // Nothing left to search for, so found a hit 
        return true;
    } if (!searchIn) {
        // Nothing left to search in, so did not find it. 
        return false;
    }
    searchFor = searchFor.toLowerCase();
    searchIn = searchIn.toLowerCase();
    const searchTerm = searchFor.substring(0, getSearchTerm(searchFor));
    const index = searchIn.indexOf(searchTerm);
    if (index < 0) {
        // Did not find any results, so returning false.
        return false;
    }
    // Continue the search in the remaining parts of text2 
    const remainingSearchFor = searchFor.substring(searchTerm.length);
    const remainingSearchIn = searchIn.substring(index + 1, searchIn.length);
    return hasSearchText(remainingSearchFor, remainingSearchIn);
}

/**
 * Returns the next search term to search for.
 * This is either everything up to a dot or a space, or just the next character.
 * @param {String} searchFor 
 * @returns 
 */
function getSearchTerm(searchFor) {
    // Take everything up-to-space, or ...
    const space = searchFor.indexOf(' ');
    if (space > 0) return space;

    // ... take everything up-to-dot, or ...
    const dot = searchFor.indexOf('.');
    if (dot > 0) return dot;

    // ... just take the next character
    return 1;
}
