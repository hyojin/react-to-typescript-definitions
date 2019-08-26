"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTQ = require("astq");
var analyzer_1 = require("./analyzer");
var ExportType;
(function (ExportType) {
    ExportType[ExportType["default"] = 0] = "default";
    ExportType[ExportType["named"] = 1] = "named";
})(ExportType = exports.ExportType || (exports.ExportType = {}));
function generateTypings(moduleName, ast, options) {
    var parsingResult = parseAst(ast, options.instanceOfResolver);
    // tslint:disable-next-line deprecation
    return deprecatedGenerator(options.generator, moduleName, parsingResult);
}
exports.generateTypings = generateTypings;
function deprecatedGenerator(generator, moduleName, _a) {
    var exportType = _a.exportType, classname = _a.classname, propTypes = _a.propTypes;
    var componentName = classname || 'Anonymous';
    var generateTypings = function () {
        generator.import('* as React', 'react');
        if (propTypes) {
            Object.keys(propTypes).forEach(function (propName) {
                var prop = propTypes[propName];
                if (prop.importPath) {
                    generator.import(prop.type, prop.importPath);
                }
            });
        }
        generator.nl();
        generator.props(componentName, propTypes);
        generator.nl();
        generator.exportDeclaration(exportType, function () {
            generator.class(componentName, !!propTypes);
        });
    };
    if (moduleName === null) {
        generateTypings();
    }
    else {
        generator.declareModule(moduleName, generateTypings);
    }
    return generator.toString();
}
// tslint:disable:next-line cyclomatic-complexity
function parseAst(ast, instanceOfResolver) {
    var exportType;
    var functionname;
    var propTypes;
    var classname = getClassName(ast);
    if (classname) {
        propTypes = getEs7StyleClassPropTypes(ast, classname, instanceOfResolver);
        exportType = getClassExportType(ast, classname);
    }
    if (!propTypes) {
        var componentName = getComponentNameByPropTypeAssignment(ast);
        if (componentName) {
            var astq = new ASTQ();
            var exportTypeNodes = astq.query(ast, "\n        //ExportNamedDeclaration // VariableDeclarator[\n          /:id Identifier[@name=='" + componentName + "'] &&\n          /:init ArrowFunctionExpression // JSXElement\n        ],\n        //ExportNamedDeclaration // FunctionDeclaration[/:id Identifier[@name == '" + componentName + "']] // JSXElement,\n        //ExportDefaultDeclaration // AssignmentExpression[/:left Identifier[@name == '" + componentName + "']]\n          // ArrowFunctionExpression // JSXElement,\n        //ExportDefaultDeclaration // FunctionDeclaration[/:id Identifier[@name == '" + componentName + "']] // JSXElement\n      ");
            if (exportTypeNodes.length > 0) {
                functionname = componentName;
                exportType = ExportType.named;
            }
            propTypes = getPropTypesFromAssignment(ast, componentName, instanceOfResolver);
        }
        if (!exportType) {
            var astq = new ASTQ();
            var commonJsExports = astq.query(ast, "\n        // AssignmentExpression[\n          /:left MemberExpression[\n            /:object Identifier[@name == 'exports'] &&\n            /:property Identifier[@name == 'default']\n          ] &&\n          /:right Identifier[@name == '" + componentName + "']\n        ]\n      ");
            if (commonJsExports.length > 0) {
                classname = componentName;
                exportType = ExportType.default;
            }
        }
    }
    if (exportType === undefined) {
        throw new Error('No exported component found');
    }
    return {
        exportType: exportType,
        classname: classname,
        functionname: functionname,
        propTypes: propTypes || {}
    };
}
function getClassName(ast) {
    var astq = new ASTQ();
    var classDeclarationNodes = astq.query(ast, "\n    //ClassDeclaration[\n        /:id Identifier[@name]\n    ]\n  ");
    if (classDeclarationNodes.length > 0) {
        return classDeclarationNodes[0].id.name;
    }
    return undefined;
}
function getEs7StyleClassPropTypes(ast, classname, instanceOfResolver) {
    var astq = new ASTQ();
    var propTypesNodes = astq.query(ast, "\n    //ClassDeclaration[/:id Identifier[@name == '" + classname + "']]\n      //ClassProperty[/:key Identifier[@name == 'propTypes']]\n  ");
    if (propTypesNodes.length > 0) {
        return analyzer_1.parsePropTypes(propTypesNodes[0].value, instanceOfResolver);
    }
    return undefined;
}
function getClassExportType(ast, classname) {
    var astq = new ASTQ();
    var exportTypeNodes = astq.query(ast, "\n    //ExportNamedDeclaration [\n      /ClassDeclaration [ /:id Identifier[@name=='" + classname + "'] ]\n    ],\n    //ExportDefaultDeclaration [\n      /ClassDeclaration [ /:id Identifier[@name=='" + classname + "'] ]\n    ]\n  ");
    if (exportTypeNodes.length > 0) {
        return exportTypeNodes[0].type === 'ExportDefaultDeclaration' ? ExportType.default : ExportType.named;
    }
    return undefined;
}
function getComponentNameByPropTypeAssignment(ast) {
    var astq = new ASTQ();
    var componentNames = astq.query(ast, "\n    //AssignmentExpression\n      /:left MemberExpression[\n        /:object Identifier &&\n        /:property Identifier[@name == 'propTypes']\n      ]\n  ");
    if (componentNames.length > 0) {
        return componentNames[0].object.name;
    }
    return undefined;
}
function getPropTypesFromAssignment(ast, componentName, instanceOfResolver) {
    var astq = new ASTQ();
    var propTypesNodes = astq.query(ast, "\n    //AssignmentExpression[\n      /:left MemberExpression[\n        /:object Identifier[@name == '" + componentName + "'] &&\n        /:property Identifier[@name == 'propTypes']\n      ]\n    ] /:right *\n  ");
    if (propTypesNodes.length > 0) {
        return analyzer_1.parsePropTypes(propTypesNodes[0], instanceOfResolver);
    }
    return undefined;
}
//# sourceMappingURL=deprecated.js.map