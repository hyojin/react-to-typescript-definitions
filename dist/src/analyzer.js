"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTQ = require("astq");
var defaultInstanceOfResolver = function (_name) { return undefined; };
function parsePropTypes(node, instanceOfResolver) {
    var astq = new ASTQ();
    return astq
        .query(node, "/ObjectProperty")
        .reduce(function (propTypes, propertyNode) {
        var prop = getTypeFromPropType(propertyNode.value, instanceOfResolver);
        prop.documentation = getOptionalDocumentation(propertyNode);
        propTypes[propertyNode.key.name] = prop;
        return propTypes;
    }, {});
}
exports.parsePropTypes = parsePropTypes;
function getOptionalDocumentation(propertyNode) {
    return ((propertyNode.leadingComments || [])
        .filter(function (comment) { return comment.type === 'CommentBlock'; })[0] || {})
        .value;
}
/**
 * @internal
 */
// tslint:disable:next-line cyclomatic-complexity
function getTypeFromPropType(node, instanceOfResolver) {
    if (instanceOfResolver === void 0) { instanceOfResolver = defaultInstanceOfResolver; }
    var result = {
        type: 'any',
        optional: true
    };
    if (isNode(node)) {
        var _a = isRequiredPropType(node, instanceOfResolver), isRequired = _a.isRequired, type = _a.type;
        result.optional = !isRequired;
        switch (type.name) {
            case 'any':
                result.type = 'any';
                break;
            case 'array':
                result.type = (type.arrayType || 'any') + '[]';
                break;
            case 'bool':
                result.type = 'boolean';
                break;
            case 'func':
                result.type = '(...args: any[]) => any';
                break;
            case 'number':
                result.type = 'number';
                break;
            case 'object':
                result.type = 'Object';
                break;
            case 'string':
                result.type = 'string';
                break;
            case 'node':
                result.type = 'React.ReactNode';
                break;
            case 'element':
                result.type = 'React.ReactElement<any>';
                break;
            case 'union':
                result.type = type.types.map(function (unionType) { return unionType; }).join('|');
                break;
            case 'instanceOf':
                if (type.importPath) {
                    result.type = type.type;
                    result.importPath = type.importPath;
                }
                else {
                    result.type = 'any';
                }
                break;
        }
    }
    return result;
}
exports.getTypeFromPropType = getTypeFromPropType;
function isNode(obj) {
    return obj && typeof obj.type !== 'undefined' && typeof obj.loc !== 'undefined';
}
function getReactPropTypeFromExpression(node, instanceOfResolver) {
    if (node.type === 'MemberExpression' && node.object.type === 'MemberExpression'
        && node.object.object.name === 'React' && node.object.property.name === 'PropTypes') {
        return node.property;
    }
    else if (node.type === 'CallExpression') {
        var callType = getReactPropTypeFromExpression(node.callee, instanceOfResolver);
        switch (callType.name) {
            case 'instanceOf':
                return {
                    name: 'instanceOf',
                    type: node.arguments[0].name,
                    importPath: instanceOfResolver(node.arguments[0].name)
                };
            case 'arrayOf':
                var arrayType = getTypeFromPropType(node.arguments[0], instanceOfResolver);
                return {
                    name: 'array',
                    arrayType: arrayType.type
                };
            case 'oneOfType':
                var unionTypes = node.arguments[0].elements.map(function (element) {
                    return getTypeFromPropType(element, instanceOfResolver);
                });
                return {
                    name: 'union',
                    types: unionTypes.map(function (type) { return type.type; })
                };
        }
    }
    return 'undefined';
}
function isRequiredPropType(node, instanceOfResolver) {
    var isRequired = node.type === 'MemberExpression' && node.property.name === 'isRequired';
    return {
        isRequired: isRequired,
        type: getReactPropTypeFromExpression(isRequired ? node.object : node, instanceOfResolver)
    };
}
//# sourceMappingURL=analyzer.js.map