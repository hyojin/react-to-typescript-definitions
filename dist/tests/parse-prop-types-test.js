"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-implicit-dependencies
var ava_1 = require("ava");
var analyzer_1 = require("../src/analyzer");
var instanceOfResolver = function () { return undefined; };
var reactPropTypesMemberExpression = {
    type: 'MemberExpression',
    object: {
        name: 'React'
    },
    property: {
        name: 'PropTypes'
    }
};
ava_1.default('The PropType parser should return any on unknown PropTypes', function (t) {
    var ast = {
        type: '',
        loc: {}
    };
    var expected = {
        type: 'any',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return any[] for generic array prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'array'
        }
    };
    var expected = {
        type: 'any[]',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return boolean for bool prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'bool'
        }
    };
    var expected = {
        type: 'boolean',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return a generic function for func prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'func'
        }
    };
    var expected = {
        type: '(...args: any[]) => any',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return a generic required function for func.isRequired prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: {
            type: 'MemberExpression',
            object: reactPropTypesMemberExpression,
            property: {
                name: 'func'
            }
        },
        property: {
            name: 'isRequired'
        }
    };
    var result = analyzer_1.getTypeFromPropType(ast, instanceOfResolver);
    t.is(result.type, '(...args: any[]) => any');
    t.is(result.optional, false);
});
ava_1.default('The PropType parser should return number for number prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'number'
        }
    };
    var expected = {
        type: 'number',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return Object for object prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'object'
        }
    };
    var expected = {
        type: 'Object',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return string for string prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'string'
        }
    };
    var expected = {
        type: 'string',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return React.ReactNode for node prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'node'
        }
    };
    var expected = {
        type: 'React.ReactNode',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return React.ReactElement<any> for element prop types', function (t) {
    var ast = {
        type: 'MemberExpression',
        loc: {},
        object: reactPropTypesMemberExpression,
        property: {
            name: 'element'
        }
    };
    var expected = {
        type: 'React.ReactElement<any>',
        optional: true
    };
    t.deepEqual(analyzer_1.getTypeFromPropType(ast, instanceOfResolver), expected);
});
ava_1.default('The PropType parser should return number[] for arrayOf(React.PropTypes.number) prop types', function (t) {
    var ast = {
        type: 'CallExpression',
        loc: {},
        callee: {
            type: 'MemberExpression',
            loc: {},
            object: reactPropTypesMemberExpression,
            property: {
                name: 'arrayOf'
            }
        },
        arguments: [
            {
                type: 'MemberExpression',
                loc: {},
                object: reactPropTypesMemberExpression,
                property: {
                    name: 'number'
                }
            }
        ]
    };
    var result = analyzer_1.getTypeFromPropType(ast, instanceOfResolver);
    t.is(result.type, 'number[]');
    t.is(result.optional, true);
});
ava_1.default('The PropType parser should return number|string for' +
    'oneOfType([React.PropTypes.number, React.PropTypes.string]) prop types', function (t) {
    var ast = {
        type: 'CallExpression',
        loc: {},
        callee: {
            type: 'MemberExpression',
            loc: {},
            object: reactPropTypesMemberExpression,
            property: {
                name: 'oneOfType'
            }
        },
        arguments: [
            {
                type: 'ArrayExpression',
                loc: {},
                elements: [
                    {
                        type: 'MemberExpression',
                        loc: {},
                        object: reactPropTypesMemberExpression,
                        property: {
                            name: 'number'
                        }
                    },
                    {
                        type: 'MemberExpression',
                        loc: {},
                        object: reactPropTypesMemberExpression,
                        property: {
                            name: 'string'
                        }
                    }
                ]
            }
        ]
    };
    var result = analyzer_1.getTypeFromPropType(ast, instanceOfResolver);
    t.is(result.type, 'number|string');
    t.is(result.optional, true);
});
ava_1.default('The PropType parser should return Message for instanceOf(Message) prop types', function (t) {
    var ast = {
        type: 'CallExpression',
        loc: {},
        callee: {
            type: 'MemberExpression',
            loc: {},
            object: reactPropTypesMemberExpression,
            property: {
                name: 'instanceOf'
            }
        },
        arguments: [
            {
                type: 'Identifier',
                loc: {},
                name: 'Message'
            }
        ]
    };
    var result = analyzer_1.getTypeFromPropType(ast, function () { return './some/path'; });
    t.is(result.type, 'Message');
    t.is(result.optional, true);
    t.is(result.importPath, './some/path');
});
ava_1.default('The PropType parser should return any for unresolved instanceOf(Message) prop types', function (t) {
    var ast = {
        type: 'CallExpression',
        loc: {},
        callee: {
            type: 'MemberExpression',
            loc: {},
            object: reactPropTypesMemberExpression,
            property: {
                name: 'instanceOf'
            }
        },
        arguments: [
            {
                type: 'Identifier',
                loc: {},
                name: 'Message'
            }
        ]
    };
    var result = analyzer_1.getTypeFromPropType(ast);
    t.is(result.type, 'any');
    t.is(result.optional, true);
    t.is(result.importPath, undefined);
});
//# sourceMappingURL=parse-prop-types-test.js.map