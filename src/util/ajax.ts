import $ from "jquery";

export type JQueryResponse = {
    xhr: JQuery.jqXHR,
    data: any,
    status: string
}

/**
 * Wrapper class around JQuery Ajax Error object, to have the stringification of the different types of error in only one place.
 */
export class AjaxError {
    constructor(public xhr: JQuery.jqXHR, public error: JQuery.Ajax.ErrorTextStatus, public errorThrown: string, public status: any) { }

    get message(): string {
        if (this.xhr.responseText) {
            return this.xhr.responseText;
        }
        switch (this.error) {
            case "timeout": {
                return 'A timeout occured. Check the status of the server and the internet connection\n' + this.errorThrown;
            }
            case "error": {
                return 'An unknown occured, perhaps the server is down. Check the status of the server and the internet connection\n' + this.errorThrown;
            }
            case "abort": {
                return 'The request was aborted\n' + this.errorThrown;
            }
            case "parsererror": {
                return 'The response could not be read due to a parser error:\n' + this.errorThrown;
            }
            default: {
                return this.errorThrown;
            }
        }
    }

    toString() {
        return this.message;
    }
}

/**
 * Mechanism to perform an HTTP GET on a backend repository API
 * @param url 
 * @param fileName 
 * @returns 
 */
export async function $read(url: string, fileName?: string): Promise<any> {
    url = fileName ? url + '/' + fileName : url;
    return $get('/repository/' + url);
}

export async function $get(url: string): Promise<any> {
    return $ajax({ method: 'get', url }).then(response => response.data);
}

/**
 * Simplistic JQuery Ajax wrapper that works with Promise instead of custom callback functions
 * @param settings 
 * @returns 
 */
export default function $ajax(settings: JQueryAjaxSettings): Promise<JQueryResponse> {
    return new Promise<JQueryResponse>((resolve, reject) => {
        settings.success = (data, status, xhr) => resolve({ data, xhr, status });
        settings.error = (xhr, error, errorThrown) => {
            const throwable = new AjaxError(xhr, error, errorThrown, xhr.status);
            console.groupCollapsed("Server Call Failed");
            console.log("Request", settings);
            console.log("Error", throwable);
            console.groupEnd();
            reject(throwable);
        }

        $.ajax(settings);
    });
}
