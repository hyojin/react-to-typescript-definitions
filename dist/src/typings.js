"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTQ = require("astq");
var dom = require("dts-dom");
var types = require("./types");
var pascalCase = require("pascal-case");
function generateModuleDeclaration(moduleName, programAst, options, reactImport) {
    // #609: configure eol character
    dom.config.outputEol = options.eol || '\r\n';
    var astq = new ASTQ();
    var ast = {
        ast: programAst,
        query: function (query) {
            return astq.query(programAst, query);
        },
        querySubtree: function (subtree, query) {
            return astq.query(subtree, query);
        }
    };
    var reactComponentName = getReactComponentName(ast);
    var importedPropTypes = {
        propTypesName: getPropTypesName(ast),
        propTypes: getImportedPropTypes(ast)
    };
    var importedTypes = getInstanceOfPropTypes(ast, importedPropTypes);
    var importStatements = getImportStatements(ast, importedTypes, options.instanceOfResolver);
    var componentNames = getUniqueNames(getComponentNamesByPropTypeAssignment(ast).concat(getComponentNamesByStaticPropTypeAttribute(ast), getComponentNamesByJsxInBody(ast)));
    var m = dom.create.module(moduleName || 'moduleName');
    m.members.push(dom.create.importAll('React', reactImport));
    if (importStatements.length > 0) {
        importStatements.forEach(function (importStatement) {
            if (importStatement.name === undefined) {
                m.members.push(dom.create.importDefault(importStatement.local, importStatement.path));
            }
            else {
                throw new Error('Named imports are currently unsupported');
            }
        });
    }
    componentNames.forEach(function (componentName) {
        var exportType = getComponentExportType(ast, componentName);
        var propTypes = getPropTypes(ast, componentName);
        if (exportType) {
            createExportedTypes(m, ast, componentName, reactComponentName, propTypes, importedPropTypes, exportType, options);
        }
    });
    return m;
}
function createTypings(moduleName, programAst, options, reactImport) {
    var tripleSlashDirectives = [];
    var m = generateModuleDeclaration(moduleName, programAst, options, reactImport);
    if (moduleName === null) {
        return m.members.map(function (member) { return dom.emit(member); }).join('');
    }
    else {
        return dom.emit(m, { tripleSlashDirectives: tripleSlashDirectives });
    }
}
exports.createTypings = createTypings;
function createTypingsWithMetadata(moduleName, programAst, options, reactImport) {
    var m = generateModuleDeclaration(moduleName, programAst, options, reactImport);
    return m.members.map(function (member) {
        return {
            kind: member.kind,
            name: member.kind !== 'import' && member.kind !== 'export=' ? member.name : '',
            emitted: dom.emit(member),
        };
    });
}
exports.createTypingsWithMetadata = createTypingsWithMetadata;
function createExportedTypes(m, ast, componentName, reactComponentName, propTypes, importedPropTypes, exportType, options) {
    var classComponent = isClassComponent(ast, componentName, reactComponentName);
    var interf = dom.create.interface(componentName + "Props");
    interf.flags = dom.DeclarationFlags.Export;
    if (propTypes) {
        createPropTypeTypings(interf, ast, propTypes, importedPropTypes, options);
        extractComplexTypes(m, interf, componentName);
    }
    if (propTypes || classComponent) {
        m.members.push(interf);
    }
    if (classComponent) {
        createExportedClassComponent(m, componentName, reactComponentName, exportType, interf);
    }
    else {
        createExportedFunctionalComponent(m, componentName, propTypes, exportType, interf);
    }
}
function createExportedClassComponent(m, componentName, reactComponentName, exportType, interf) {
    var classDecl = dom.create.class(componentName);
    classDecl.baseType = dom.create.interface("React." + (reactComponentName || 'Component') + "<" + interf.name + ", any>");
    classDecl.flags = exportType;
    classDecl.members.push(dom.create.method('render', [], dom.create.namedTypeReference('JSX.Element')));
    m.members.push(classDecl);
}
function createExportedFunctionalComponent(m, componentName, propTypes, exportType, interf) {
    var typeDecl = dom.create.namedTypeReference("React.FC" + (propTypes ? "<" + interf.name + ">" : ''));
    var constDecl = dom.create.const(componentName, typeDecl);
    m.members.push(constDecl);
    if (exportType === dom.DeclarationFlags.ExportDefault) {
        m.members.push(dom.create.exportDefault(componentName));
    }
    else {
        constDecl.flags = exportType;
    }
}
function createPropTypeTypings(interf, ast, propTypes, importedPropTypes, options) {
    var res = ast.querySubtree(propTypes, "\n    / ObjectProperty\n  ");
    res.forEach(function (propertyAst) {
        var typeDecl = types.get(ast, propertyAst.value, importedPropTypes, options);
        var property = dom.create.property(propertyAst.key.name || propertyAst.key.value, typeDecl.type, typeDecl.optional ? dom.DeclarationFlags.Optional : 0);
        if (propertyAst.leadingComments && propertyAst.leadingComments[0].type === 'CommentBlock') {
            var trimLines = function () {
                return function (line) { return Boolean(line); };
            };
            property.jsDocComment = propertyAst.leadingComments[0].value
                .split('\n')
                .map(function (line) { return line.trim(); })
                .map(function (line) { return line.replace(/^\*\*?/, ''); })
                .map(function (line) { return line.trim(); })
                .filter(trimLines())
                .reverse()
                .filter(trimLines())
                .reverse()
                .join('\n');
        }
        interf.members.push(property);
    });
}
function extractComplexTypes(m, interf, componentName) {
    interf.members.forEach(function (member) {
        if (member.kind === 'property' && isExtractableType(member.type)) {
            var name_1 = "" + componentName + pascalCase(member.name);
            var extractedMember = createModuleMember(name_1, member.type);
            if (extractedMember) {
                extractedMember.flags = dom.DeclarationFlags.Export;
                m.members.push(extractedMember);
                member.type = createTypeReference(name_1, member.type);
            }
        }
    });
}
function isExtractableType(type) {
    if (typeof type === 'object') {
        return ['union', 'intersection', 'object', 'array'].indexOf(type.kind) > -1;
    }
    return false;
}
function createModuleMember(name, type) {
    switch (type.kind) {
        case 'intersection':
        case 'union':
            return dom.create.alias(name, type);
        case 'object':
            var interf = dom.create.interface(name);
            interf.members = type.members;
            return interf;
        case 'array':
            return isExtractableType(type.type) ? createModuleMember(name, type.type) : undefined;
    }
}
function createTypeReference(name, type) {
    var namedTypeReference = dom.create.namedTypeReference(name);
    if (type.kind === 'array') {
        return dom.create.array(namedTypeReference);
    }
    else {
        return namedTypeReference;
    }
}
function getUniqueNames(input) {
    return Object.keys(input.reduce(function (all, name) {
        all[name] = true;
        return all;
    }, {}));
}
function propTypeQueryExpression(propTypesName) {
    return "\n    '" + propTypesName + "' == 'undefined'\n    ?\n      /:object MemberExpression[\n        /:property Identifier[@name == 'PropTypes']\n      ]\n    :\n      /:object Identifier[@name == '" + propTypesName + "']\n  ";
}
exports.propTypeQueryExpression = propTypeQueryExpression;
function getReactComponentName(ast) {
    var res = ast.query("\n    // ImportDeclaration[\n      /:source StringLiteral[@value == 'react']\n    ]\n    /:specifiers *[\n      / Identifier[@name == 'Component'] || / Identifier[@name == 'PureComponent']\n    ]\n    /:local Identifier\n  ");
    if (res.length > 0) {
        return res[0].name;
    }
    return undefined;
}
function getPropTypesName(ast) {
    var res = ast.query("\n    // ImportDeclaration[\n      /:source StringLiteral[@value == 'react']\n    ]\n    /:specifiers *[\n      / Identifier[@name == 'PropTypes']\n    ]\n    /:local Identifier\n  ");
    if (res.length > 0) {
        return res[0].name;
    }
    res = ast.query("\n    // ImportDeclaration[\n      /:source StringLiteral[@value == 'prop-types']\n    ]\n    /:specifiers *[\n      ImportNamespaceSpecifier || / Identifier[@name == 'PropTypes']\n    ]\n    /:local Identifier\n  ");
    if (res.length > 0) {
        return res[0].name;
    }
    return undefined;
}
function getImportedPropTypes(ast) {
    return ast.query("\n    // ImportDeclaration[\n      /:source StringLiteral[@value == 'prop-types']\n    ]\n    /:specifiers ImportSpecifier\n  ").map(function (_a) {
        var imported = _a.imported, local = _a.local;
        return ({
            importedName: imported.name,
            localName: local.name
        });
    });
}
function getInstanceOfPropTypes(ast, importedPropTypes) {
    var propTypesName = importedPropTypes.propTypesName, propTypes = importedPropTypes.propTypes;
    var instanceOfPropType = propTypes.find(function (_a) {
        var importedName = _a.importedName;
        return importedName === 'instanceOf';
    });
    var localInstanceOfName = instanceOfPropType ? instanceOfPropType.localName : undefined;
    var res = ast.query("\n    // CallExpression[\n      /:callee MemberExpression[\n        (" + propTypeQueryExpression(propTypesName) + ")\n        &&\n          /:property Identifier[@name == 'instanceOf']\n      ]\n      ||\n      /:callee Identifier[@name == '" + localInstanceOfName + "']\n    ]\n    /:arguments *\n  ");
    return res.map(function (identifer) { return identifer.name; });
}
function getImportStatements(ast, typeNames, instanceOfResolver) {
    return typeNames.map(function (name) {
        var res = ast.query("\n      // ImportDeclaration[\n        /:specifiers * /:local Identifier[@name == '" + name + "']\n      ]\n    ");
        return {
            name: res.length > 0 && res[0].specifiers[0].imported ?
                res[0].specifiers[0].imported.name :
                undefined,
            local: name,
            path: res.length > 0 ? res[0].source.value : undefined
        };
    })
        .map(function (importStatement) {
        if (importStatement && instanceOfResolver) {
            var resolvedPath = importStatement.name ?
                instanceOfResolver(importStatement.name) :
                instanceOfResolver(importStatement.local);
            if (resolvedPath) {
                importStatement.path = resolvedPath;
            }
        }
        return importStatement;
    })
        .filter(function (importStatement) { return Boolean(importStatement.path); });
}
function getComponentNamesByPropTypeAssignment(ast) {
    var res = ast.query("\n    //AssignmentExpression\n      /:left MemberExpression[\n        /:object Identifier &&\n        /:property Identifier[@name == 'propTypes']\n      ]\n  ");
    if (res.length > 0) {
        return res.map(function (match) { return match.object.name; });
    }
    return [];
}
function getComponentNamesByStaticPropTypeAttribute(ast) {
    var res = ast.query("\n    //ClassDeclaration[\n      /:body * //ClassProperty /:key Identifier[@name == 'propTypes']\n    ]\n  ");
    if (res.length > 0) {
        return res.map(function (match) { return match.id ? match.id.name : ''; });
    }
    return [];
}
function getComponentNamesByJsxInBody(ast) {
    var res = ast.query("\n    // ClassDeclaration[\n      /:body * //JSXElement\n    ],\n    // FunctionDeclaration[\n      /:body * //JSXElement\n    ],\n    // VariableDeclarator[\n      /:init ArrowFunctionExpression\n      // JSXElement\n    ]\n  ");
    if (res.length > 0) {
        return res.map(function (match) { return match.id ? match.id.name : ''; });
    }
    return [];
}
function getPropTypes(ast, componentName) {
    var propTypes = getPropTypesFromAssignment(ast, componentName) ||
        getPropTypesFromStaticAttribute(ast, componentName);
    var referencedComponentName = getReferencedPropTypesComponentName(ast, propTypes);
    if (referencedComponentName) {
        return getPropTypes(ast, referencedComponentName);
    }
    if (propTypes) {
        var referencedVariable = ast.query("\n      //VariableDeclarator[\n        /:id Identifier[@name == '" + propTypes.name + "']\n      ]\n      /:init *\n    ");
        if (referencedVariable && referencedVariable.length) {
            return referencedVariable[0];
        }
    }
    return propTypes;
}
function getPropTypesFromAssignment(ast, componentName) {
    var res = ast.query("\n    //AssignmentExpression[\n      /:left MemberExpression[\n        /:object Identifier[@name == '" + componentName + "'] &&\n        /:property Identifier[@name == 'propTypes']\n      ]\n    ] /:right *\n  ");
    if (res.length > 0) {
        return res[0];
    }
    return undefined;
}
function getPropTypesFromStaticAttribute(ast, componentName) {
    if (componentName === '') {
        var res_1 = ast.query("\n      //ClassDeclaration\n      /:body *\n      //ClassProperty[\n        /:key Identifier[@name == 'propTypes']\n      ]\n      /:value*\n    ");
        if (res_1.length > 0 && !res_1[0].id) {
            return res_1[0];
        }
    }
    var res = ast.query("\n    //ClassDeclaration[\n      /:id Identifier[@name == '" + componentName + "']\n    ]\n    /:body *\n    //ClassProperty[\n      /:key Identifier[@name == 'propTypes']\n    ]\n    /:value*\n  ");
    if (res.length > 0) {
        return res[0];
    }
    return undefined;
}
function getReferencedPropTypesComponentName(ast, propTypes) {
    if (propTypes) {
        var propTypesReference = ast.querySubtree(propTypes, "\n      MemberExpression [\n        /:property Identifier[@name == 'propTypes']\n      ] /:object Identifier\n    ");
        if (propTypesReference.length > 0) {
            return propTypesReference[0].name;
        }
    }
    return undefined;
}
function getComponentExportType(ast, componentName) {
    if (isDefaultExport(ast, componentName)) {
        return dom.DeclarationFlags.ExportDefault;
    }
    if (isNamedExport(ast, componentName)) {
        return dom.DeclarationFlags.Export;
    }
    return undefined;
}
function isDefaultExport(ast, componentName) {
    return isUnnamedDefaultExport(ast, componentName) || isNamedDefaultExport(ast, componentName) ||
        isNamedExportAsDefault(ast, componentName);
}
function isUnnamedDefaultExport(ast, componentName) {
    if (componentName !== '') {
        return false;
    }
    var res = ast.query("\n    // ExportDefaultDeclaration[\n        // ClassDeclaration\n      ||\n        // FunctionDeclaration\n    ]\n  ");
    return res.length > 0 && !res[0].id;
}
function isNamedDefaultExport(ast, componentName) {
    var res = ast.query("\n    // ExportDefaultDeclaration[\n        // ClassDeclaration\n        /:id Identifier[@name == '" + componentName + "']\n      ||\n        // FunctionDeclaration\n        /:id Identifier[@name == '" + componentName + "']\n      ||\n        // VariableDeclaration\n        / VariableDeclarator\n        /:id Identifier[@name == '" + componentName + "']\n      ||\n        /Identifier[@name == '" + componentName + "']\n    ]\n  ,\n    // AssignmentExpression[\n        /:left MemberExpression[\n            /:object Identifier[@name == 'exports']\n          &&\n            /:property Identifier[@name == 'default']\n        ]\n      &&\n        /:right Identifier[@name == '" + componentName + "']\n    ]\n  ");
    return res.length > 0;
}
function isNamedExportAsDefault(ast, componentName) {
    var res = ast.query("\n    // ExportNamedDeclaration[\n      // ExportSpecifier [\n        /:local Identifier[@name == '" + componentName + "'] &&\n        /:exported Identifier[@name == 'default']\n      ]\n    ]\n  ");
    return res.length > 0;
}
function isNamedExport(ast, componentName) {
    var res = ast.query("\n    // ExportNamedDeclaration[\n      // ClassDeclaration\n      /:id Identifier[@name == '" + componentName + "']\n    ||\n      // FunctionDeclaration\n      /:id Identifier[@name == '" + componentName + "']\n    ||\n      // VariableDeclaration\n      / VariableDeclarator\n      /:id Identifier[@name == '" + componentName + "']\n    ||\n      // ExportSpecifier\n      /:exported Identifier[@name == '" + componentName + "']\n    ]\n  ");
    return res.length > 0;
}
function isClassComponent(ast, componentName, reactComponentName) {
    if (componentName === '') {
        var res_2 = ast.query("\n        // ClassDeclaration\n    ");
        if (res_2.length > 0 && !res_2[0].id) {
            return true;
        }
    }
    var res = ast.query("\n      // ClassDeclaration\n      /:id Identifier[@name == '" + componentName + "']\n    ,\n      // VariableDeclaration\n      / VariableDeclarator[\n          /:id Identifier[@name == '" + componentName + "']\n        &&\n          /:init CallExpression[\n            '" + reactComponentName + "' == 'undefined'\n            ?\n              /:arguments MemberExpression[\n                /:object Identifier[@name == 'React'] &&\n                /:property Identifier[@name == 'Component']\n              ]\n            :\n              /:arguments Identifier[@name == '" + reactComponentName + "']\n          ]\n      ]\n  ");
    if (res.length > 0) {
        return true;
    }
    return false;
}
//# sourceMappingURL=typings.js.map