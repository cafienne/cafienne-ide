import $ from "jquery";

// BIG TODO HERE Alpaca doesn't work with jQuery import .  Some undefined jQuery
// import "handlebars";
// import "alpaca/dist/alpaca/bootstrap/alpaca";

function loadScriptSync(src: string) {
    var s = document.createElement('script');
    s.src = src;
    s.type = "text/javascript";
    s.async = false;                                 // <-- this is important
    document.getElementsByTagName('head')[0].appendChild(s);
}

loadScriptSync("node_modules/handlebars/dist/handlebars.min.js");
loadScriptSync("node_modules/alpaca/dist/alpaca/bootstrap/alpaca.min.js");
(<any>window).jQuery = $;

export default class AlpacaPreview {
    html: JQuery<HTMLElement>;

    constructor(public container: JQuery<HTMLElement>) {
        this.html = container;
    }

    render(jsonForm: any) {
        (<any>this.html)?.alpaca(jsonForm);
    }
}
