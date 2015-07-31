/*
 * arpscanner
 * https://github.com/goliatone/arpscanner
 *
 * Copyright (c) 2015 goliatone
 * Licensed under the MIT license.
 */

'use strict';

var extend = require('gextend');
var spawn = require('child_process').spawn;
var sudo = require('sudo');

var DEFAULTS = {
    command: 'arp-scan',
    args:['-l'],
    interface: null,
    parser: parse,
    sudo: false
};


function parse(out){
    return function lineParser(line){
        var chunks = line.split('\t');
        out.push({
            ip:     chunks[0],
            mac:    (chunks[1] || '').toUpperCase(),
            vendor: chunks[2],
            timestamp: Date.now()
        });
    };
}


function scanner(cb, options){

    options = extend({}, DEFAULTS, options);

    var out = [],
        buffer = '',
        errbuf = '',
        arp = {};

    var parser = options.parser(out);

    var arpArgs = options.args;
    if (options.interface !== null) {
      arpArgs = arpArgs.concat(['--interface', options.interface]);
    }

    if (options.sudo) {
        var sudoArgs = [ options.command ].concat(arpArgs);
        arp = sudo(sudoArgs);
    } else {
        arp = spawn(options.command, arpArgs);
    }

    arp.stdout.on('data', function onData(data) { buffer += data; });
    arp.stderr.on('data', function onError(data){ errbuf += data; });

    arp.on('close', function onClose(code){
        if(code != 0) return cb(code, null);

        buffer = buffer.split('\n');
        buffer = buffer.slice(2, -4);

        buffer.forEach(parser);

        cb(null, out);
    });

    arp.on('error', function(err){
        cb(err, null);
    });

    arp.on('exit', function(code, signal){

    });
}

module.exports = scanner;
// exports.DEFAULTS = DEFAULTS;
