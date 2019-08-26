"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-implicit-dependencies
var ava_1 = require("ava");
var strip_ansi_1 = require("strip-ansi");
var react2dts = require("../src/index");
var orignalConsoleError = console.error;
ava_1.default.beforeEach(function (t) {
    console.error = function () {
        var args = Array.prototype.slice.call(arguments);
        if (!t.context.args) {
            t.context.args = [];
        }
        t.context.args.push(args);
    };
});
ava_1.default.afterEach(function () {
    console.error = orignalConsoleError;
});
ava_1.default('In case of error during shape type inference the error information should be retained', function (t) {
    react2dts.generateFromSource(null, "\n    import React from 'react';\n\n    export class Component extends React.Component {\n      static propTypes = {\n        someShape: React.PropTypes.shape(shape)\n      };\n    }\n  ");
    var args = t.context.args.reduce(function (akku, args) { return akku.concat(args); }, []);
    t.is(strip_ansi_1.default(args[2]), 'Line 6:         someShape: React.PropTypes.shape(shape)');
});
ava_1.default('In case of error during enum type inference the error information should be retained', function (t) {
    react2dts.generateFromSource(null, "\n    import React from 'react';\n\n    export class Component extends React.Component {\n      static propTypes = {\n        list: React.PropTypes.oneOf(list)\n      };\n    }\n  ");
    var args = t.context.args.reduce(function (akku, args) { return akku.concat(args); }, []);
    t.is(strip_ansi_1.default(args[2]), 'Line 6:         list: React.PropTypes.oneOf(list)');
});
ava_1.default('In case of error during enum value creation inference the error information should be retained', function (t) {
    react2dts.generateFromSource(null, "\n    import React from 'react';\n\n    export class Component extends React.Component {\n      static propTypes = {\n        list: React.PropTypes.oneOf(Object.keys(object))\n      };\n    }\n  ");
    var args = t.context.args.reduce(function (akku, args) { return akku.concat(args); }, []);
    t.is(strip_ansi_1.default(args[2]), 'Line 6:         list: React.PropTypes.oneOf(Object.keys(object))');
});
ava_1.default('In case of error during shape type inference the error information should be retained', function (t) {
    react2dts.generateFromSource(null, "\n    import React from 'react';\n\n    export class Component extends React.Component {\n      static propTypes = {\n        shape: React.PropTypes.shape(some.shape)\n      };\n    }\n  ");
    var args = t.context.args.reduce(function (akku, args) { return akku.concat(args); }, []);
    t.is(strip_ansi_1.default(args[2]), 'Line 6:         shape: React.PropTypes.shape(some.shape)');
});
//# sourceMappingURL=error-reporting-test.js.map