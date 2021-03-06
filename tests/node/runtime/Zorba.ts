/// <reference path="../../../typings/tsd.d.ts" />
require("jasmine2-pit");
import * as p from "path";
import * as fs from "fs";

import * as u from "./Utils";

function getQueries(path: string): string[] {
    var files: string[] = [];
    fs.readdirSync(path).forEach(file => {
        file = p.resolve(p.normalize(path + "/" + file));
        if(fs.statSync(file).isFile() && ["jq", "xq"].indexOf(file.substring(file.length - 2)) !== -1) {
            files.push(file);
        } else if(fs.statSync(file).isDirectory()) {
            files = files.concat(getQueries(file));
        }
    });
    return files;
}

describe("Test JSONiq Expressions", () => {

    var base = "tests/queries/zorba/Queries/zorba/jsoniq";
    var queries = [
        //"version_decl_02.xq"
    ];
    //getQueries("tests/queries/zorba/Queries/zorba/jsoniq")
    queries.forEach(file => {
        file = base + "/" + file;
        it(file, () => {
            var query = fs.readFileSync(file, "utf-8");
            var e = u.expectSerializedQuery(query, file.substring(file.length - 3) === ".jq");
            file = file.replace("/Queries/", "/ExpQueryResults/");
            file = file.substring(0, file.length - 3);
            file = file + ".xml.res";
            e.toEqual(fs.readFileSync(file, "utf-8"));
        });
    });
});

describe("Test FLWOR Expressions", () => {

    var base = "tests/queries/zorba/Queries/zorba/flwor";
    var queries = [
        "flwor00.xq",
        "flwor01.xq",
        "flwor02.xq",
        //"flwor03.xq",
        //"flwor04.xq",
        //"flwor05.xq",
        "flwor06.xq",
        "flwor07.xq",
        "flwor08.xq",
        //"flwor09.xq",
        "flwor10.xq"
    ];
    queries.forEach(file => {
        file = base + "/" + file;
        it(file, () => {
            var query = fs.readFileSync(file, "utf-8");
            var e = u.expectSerializedQuery(query, file.substring(file.length - 3) === ".jq");
            file = file.replace("/Queries/", "/ExpQueryResults/");
            file = file.substring(0, file.length - 3);
            file = file + ".xml.res";
            e.toEqual(fs.readFileSync(file, "utf-8").trim());
        });
    });
});

describe("Test Bang Expressions", () => {

    var base = "tests/queries/zorba/Queries/zorba/bang";
    var queries = [
        "1.xq",
        "9.xq",
        "10.xq"
    ];
    queries.forEach(file => {
        file = base + "/" + file;
        it(file, () => {
            var query = fs.readFileSync(file, "utf-8");
            var e = u.expectSerializedQuery(query, file.substring(file.length - 3) === ".jq");
            file = file.replace("/Queries/", "/ExpQueryResults/");
            file = file.substring(0, file.length - 3);
            file = file + ".xml.res";
            e.toEqual(fs.readFileSync(file, "utf-8").trim());
        });
    });
});
