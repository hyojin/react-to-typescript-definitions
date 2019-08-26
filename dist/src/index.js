"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylon = require("babylon");
var fs = require("fs");
var getStdin = require("get-stdin");
var deprecated_1 = require("./deprecated");
var typings_1 = require("./typings");
function cli(options) {
    var processInput = function (code) {
        var result = generateFromSource(options.topLevelModule ? null : options.moduleName, code, {}, options.reactImport);
        process.stdout.write(result);
    };
    if (options.file) {
        fs.readFile(options.file, function (err, data) {
            if (err) {
                throw err;
            }
            processInput(data.toString());
        });
    }
    else {
        getStdin().then(processInput);
    }
}
exports.cli = cli;
function generateFromFile(moduleName, path, options, reactImport) {
    if (options === void 0) { options = {}; }
    if (reactImport === void 0) { reactImport = 'react'; }
    if (!options.filename) {
        options.filename = path;
    }
    return generateFromSource(moduleName, fs.readFileSync(path).toString(), options, reactImport);
}
exports.generateFromFile = generateFromFile;
function generateFromSource(moduleName, code, options, reactImport) {
    if (options === void 0) { options = {}; }
    if (reactImport === void 0) { reactImport = 'react'; }
    var additionalBabylonPlugins = Array.isArray(options.babylonPlugins) ? options.babylonPlugins : [];
    var ast = babylon.parse(code, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowSuperOutsideMethod: true,
        plugins: [
            'jsx',
            'flow',
            'asyncFunctions',
            'classConstructorCall',
            'doExpressions',
            'trailingFunctionCommas',
            'objectRestSpread',
            'decorators',
            'classProperties',
            'exportExtensions',
            'exponentiationOperator',
            'asyncGenerators',
            'functionBind',
            'functionSent'
        ].concat(additionalBabylonPlugins)
    });
    if (!options.source) {
        options.source = code;
    }
    return generateFromAst(moduleName, ast, options, reactImport);
}
exports.generateFromSource = generateFromSource;
function generateFromAst(moduleName, ast, options, reactImport) {
    if (options === void 0) { options = {}; }
    if (reactImport === void 0) { reactImport = 'react'; }
    // tslint:disable-next-line:deprecation
    if (options.generator) {
        return deprecated_1.generateTypings(moduleName, ast, options);
    }
    return typings_1.createTypings(moduleName, ast, options, reactImport);
}
exports.generateFromAst = generateFromAst;
function generateWithMetadataFromSource(moduleName, code, options, reactImport) {
    if (options === void 0) { options = {}; }
    if (reactImport === void 0) { reactImport = 'react'; }
    var additionalBabylonPlugins = Array.isArray(options.babylonPlugins) ? options.babylonPlugins : [];
    var ast = babylon.parse(code, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowSuperOutsideMethod: true,
        plugins: [
            'jsx',
            'flow',
            'asyncFunctions',
            'classConstructorCall',
            'doExpressions',
            'trailingFunctionCommas',
            'objectRestSpread',
            'decorators',
            'classProperties',
            'exportExtensions',
            'exponentiationOperator',
            'asyncGenerators',
            'functionBind',
            'functionSent'
        ].concat(additionalBabylonPlugins)
    });
    if (!options.source) {
        options.source = code;
    }
    return generateWithMetadataFromAst(moduleName, ast, options, reactImport);
}
exports.generateWithMetadataFromSource = generateWithMetadataFromSource;
function generateWithMetadataFromAst(moduleName, ast, options, reactImport) {
    if (options === void 0) { options = {}; }
    if (reactImport === void 0) { reactImport = 'react'; }
    return typings_1.createTypingsWithMetadata(moduleName, ast, options, reactImport);
}
exports.generateWithMetadataFromAst = generateWithMetadataFromAst;
//# sourceMappingURL=index.js.map