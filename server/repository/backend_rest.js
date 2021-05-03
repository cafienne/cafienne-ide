'use strict';

const request = require('request');
const rp = require('request-promise');

class Backend {
    constructor(url) {
        this.url = url;
    }

    validate(cmmn) {
        const options = {
            method: 'POST',
            uri: this.url + '/repository/validate',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/xml'
            },
            resolveWithFullResponse: true,
            body: cmmn
        };
        return rp(options);
    }

    getEvents(caseId, from, to, token) {
        const parameters = [];
        if (from && from !== '') {
            parameters.push(`from=${from}`)
        }
        if (to) {
            parameters.push(`to=${to}`)
        }
        const uri = `${this.url}/debug/${caseId}?${parameters.join('&')}`;
        const method = 'GET';
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'text/plain'
        }
        if (token) {
            headers.Authorization = token
        }
        return rp({ method, uri, headers, resolveWithFullResponse: true})
    }
}

class IDP {
    constructor(url) {
        this.url = url;
    }

    login(details) {
        details = JSON.stringify(details)
        const options = {
            method: 'POST',
            uri: this.url + '/identity/login',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            resolveWithFullResponse: true,
            body: details
        };
        return rp(options);
    }
}

exports.Backend = Backend;
exports.IDP = IDP;