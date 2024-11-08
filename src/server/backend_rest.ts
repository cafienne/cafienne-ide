'use strict';

import axios from "axios";

export default class Backend {
    constructor(public baseURL: string) {}

    request(url: string, method: string, headers: any, data: any = undefined) {
        const options = {url: `${this.baseURL}/${url}`, method, headers, data}
        return axios(options);
    }

    validate(cmmn: string) {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/xml'
        }

        return this.request('repository/validate', 'POST', headers, cmmn);
    }

    getEvents(caseId: string, from: string, to: string, token: string) {
        const parameters = [];
        if (from && from !== '') {
            parameters.push(`from=${from}`)
        }
        if (to) {
            parameters.push(`to=${to}`)
        }
        const url = `debug/${caseId}?${parameters.join('&')}`;
        const headers: any = {
            'Accept': 'application/json',
            'Content-Type': 'text/plain'
        }
        if (token) {
            headers.Authorization = token
        }
        return this.request(url, 'GET', headers);
    }
}

exports.Backend = Backend;
