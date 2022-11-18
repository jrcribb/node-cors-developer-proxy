/*
    node-cors-developer-proxy
	A proxy server just for development services tipically in localhost
	Para desarrollo de aplicaciones web que requieran 
    acceso a APIs que no satisfacen el control CORS
    No debe usarse fuera de su ámbito específico, desarrollo, por
    las implicancias de seguridad y consumo de recursos añadidos.
    Para iniciar el servidor hacer: nodemon server.js en la carpeta
    raiz de este proyecto
*/
const no_target_header =
    "No ha indicado el end-point usando la cabecera Target-Domain";
const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const app = express();
app.set("port", process.env.PORT || 3000); 
app.set("limit", process.env.LIMIT || "100Kb");
app.set("parser", process.env.PARSER || "json");
app.set("allowed", process.env.ALLOWED || "*");

if (app.get("parser")=="json") {
    app.use(bodyParser.json({ limit: app.get("limit") }));
} else {
    if (app.get("parser")=="text") {
        app.use(bodyParser.text({ limit: app.get("limit") }));
    } else {
        if (app.get("parser")=="raw") {
            app.use(bodyParser.raw({ limit: app.get("limit") }));
        } else {
            if (app.get("parser")=="urlencoded") {
                app.use(bodyParser.urlencoded({ limit: app.get("limit") }));
            }
        }
    }
}

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", app.get("allowed"));
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        req.header("access-control-request-headers")
    );
    if (req.method === "OPTIONS") {
        res.status(200).send();
    } else {
        var targetDomain = req.header("Target-Domain");
        const { origin} = req.headers;
        const testLocalHost = /\/\/localhost/gm;
        if (testLocalHost.test(origin)) {
            console.log(".",req.method, targetDomain + req.url,'('+origin+')');
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
            console.log(". CORS error:",req.method, targetDomain + req.url,'('+origin+')');
            res.status(401).send("Error de acceso CORS");
        }
    }
});

app.listen(app.get("port"), function () {
    const {port,limit,parser} = app.settings
    console.log(
        "Servidor Proxy activo en port " +
            port +
            " usando límite de " +
            limit + 
            " y el parser bodyParser." +
            parser
    );
});
