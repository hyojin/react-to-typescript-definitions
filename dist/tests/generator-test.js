"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-implicit-dependencies
var ava_1 = require("ava");
var generator_1 = require("../src/generator");
var index_1 = require("../src/index");
function setup() {
    return new generator_1.Generator();
}
ava_1.default('The Generator should write a module declaration', function (t) {
    var generator = setup();
    generator.declareModule('name', function () {
        //
    });
    t.is(generator.toString(), "declare module 'name' {\n}\n");
});
ava_1.default('The Generator should write an import statement', function (t) {
    var generator = setup();
    generator.import('decls', 'from');
    t.is(generator.toString(), "import decls from 'from';\n");
});
ava_1.default('The Generator should write a required property', function (t) {
    var generator = setup();
    generator.prop('name', 'type', false);
    t.is(generator.toString(), 'name: type;\n');
});
ava_1.default('The Generator should write an optional property', function (t) {
    var generator = setup();
    generator.prop('name', 'type', true);
    t.is(generator.toString(), 'name?: type;\n');
});
ava_1.default('The Generator should write a property interface', function (t) {
    var generator = setup();
    generator.props('Name', { prop: { type: 'type', optional: true } });
    t.is(generator.toString(), 'export interface NameProps {\n\tprop?: type;\n}\n');
});
ava_1.default('The Generator should write a class with props declaration', function (t) {
    var generator = setup();
    generator.class('Name', true);
    t.is(generator.toString(), 'class Name extends React.Component<NameProps, any> {\n}\n');
});
ava_1.default('The Generator should write a class without props declaration', function (t) {
    var generator = setup();
    generator.class('Name', false);
    t.is(generator.toString(), 'class Name extends React.Component<any, any> {\n}\n');
});
ava_1.default('The Generator should write an indented block comment', function (t) {
    var generator = setup();
    generator.comment('* yada\n\t\t\t\tyada\n ');
    t.is(generator.toString(), '/** yada\nyada\n */\n');
});
ava_1.default('The Generator should write an export default declaration', function (t) {
    var generator = setup();
    generator.exportDeclaration(0, function () { return undefined; });
    t.is(generator.toString(), 'export default ');
});
ava_1.default('The Generator should write a named export declaration', function (t) {
    var generator = setup();
    generator.exportDeclaration(1, function () { return undefined; });
    t.is(generator.toString(), 'export ');
});
ava_1.default('Generating typings with given custom generator should delare a module if name given', function (t) {
    var generator = setup();
    var name;
    generator.declareModule = function (moduleName) {
        name = moduleName;
    };
    var source = "\n    export class Test {}\n  ";
    index_1.generateFromSource('module', source, { generator: generator });
    t.is(name, 'module');
});
ava_1.default('Generating typings with given custom generator should import react', function (t) {
    var generator = setup();
    var decl;
    var from;
    generator.import = function (_decl, _from) {
        decl = _decl;
        from = _from;
    };
    var source = "\n    export class Test {}\n  ";
    index_1.generateFromSource(null, source, { generator: generator });
    t.is(decl, '* as React');
    t.is(from, 'react');
});
//# sourceMappingURL=generator-test.js.map