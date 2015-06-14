/// <reference path="../../typings/tsd.d.ts" />
import fs = require("fs");
import cli = require("commander");
import JSONiq = require("../JSONiq");
import SourceMap = require("source-map");

var pkg = require("../../../package.json");

cli
.command("run <file>")
.description("Run JSONiq query")
.action(file => {
    var query = new JSONiq(fs.readFileSync(file, "utf-8"));
    query.setFileName(file);
    var it = query.compile();
    it.forEach(item => {
        console.log(item.get());
    }).catch(e => {
        console.error(e.stack);
    });
});

cli
.command("plan <file>")
.description("Print query plan")
.action(file => {
    var query = new JSONiq(fs.readFileSync(file, "utf-8"));
    query.setFileName(file);
    var it = query.compile();
    var node = new SourceMap.SourceNode(1, 1, file);
    node.add("var r = require('./dist/lib/runtime/Runtime');\nvar it = ");
    node.add(it.serialize());
    node.add(";\n");
    node.add("\n");
    node.add("it.setDynamicCtx(new r.DynamicContext());");
    node.add("\n");
    node.add("it\n.forEach(function(item){ console.log(item.get()); })\n.catch(function(e){ console.error(e.stack); });");
    var source = node.toStringWithSourceMap();
    //console.log(source);
    console.log(source.code);
});

cli
.command("ast <file>")
.description("Print query plan")
.action(file => {
    var query = new JSONiq(fs.readFileSync(file, "utf-8"));
    query.setFileName(file);
    console.log(query.parse().toXML());
});

cli.version(pkg.version);

cli.parse(process.argv);
if (!cli.args.length) {
    cli.help();
}
