/*
    node-cors-developer-proxy
	A proxy server just for development services tipically in localhost
    Author: jrcribb
*/
const no_target_header = "You must set Target-Domain on the request header";
const just_for_localhost = "Proxy enabled only for localhost connections";
const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const app = express();
const parserLimit = process.env.LIMIT || "100Kb";
const parserName = process.env.PARSER || "json";
const proxyPort = process.env.PORT || 3000;
const proxyAllowedDomains = process.env.ALLOWED || "*";

app.set("port", proxyPort);
app.set("limit", parserLimit);
app.set("parser", parserName);
app.set("allowed", proxyAllowedDomains);

if (parserName == "json") {
    app.use(bodyParser.json({ limit: parserLimit }));
} else {
    if (parserName == "text") {
        app.use(bodyParser.text({ limit: parserLimit }));
    } else {
        if (parserName == "raw") {
            app.use(bodyParser.raw({ limit: parserLimit }));
        } else {
            if (parserName == "urlencoded") {
                app.use(bodyParser.urlencoded({ limit: parserLimit }));
            }
        }
    }
}

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", proxyAllowedDomains);
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        req.header("access-control-request-headers")
    );
    if (req.method === "OPTIONS") {
        res.status(200).send();
    } else {
        var targetDomain = req.header("Target-Domain");
        const { origin } = req.headers;
        const testLocalHost = /\/\/localhost/gm;
        if (proxyAllowedDomains != "*" || testLocalHost.test(origin)) {
            console.log(
                ".",
                req.method,
                targetDomain + req.url,
                "(" + origin + ")"
            );
            if (!targetDomain) {
                console.log("!", no_target_header);
                res.status(500).send(no_target_header);
                return;
            }
            request(
                {
                    url: targetDomain + req.url,
                    method: req.method,
                    json: req.body,
                    headers: { Authorization: req.header("Authorization") },
                },
                function (error, response, body) {
                    if (error) {
                        console.error("error: ", error);
                    }
                }
            ).pipe(res);
        } else {
            console.log(
                ".",
                just_for_localhost,
                req.method,
                targetDomain + req.url,
                "(" + origin + ")"
            );
            res.status(401).send(just_for_localhost);
        }
    }
});

app.listen(app.get("port"), function () {
    const { port, limit, parser } = app.settings;
    console.log(
        "Servidor Proxy activo en port " +
            port +
            " usando límite de " +
            limit +
            " y el parser bodyParser." +
            parser
    );
});
