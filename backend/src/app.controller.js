"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
var common_1 = require("@nestjs/common");
var AppController = function () {
    var _classDecorators = [(0, common_1.Controller)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getHello_decorators;
    var _healthCheck_decorators;
    var _getVersion_decorators;
    var AppController = _classThis = /** @class */ (function () {
        function AppController_1(appService) {
            this.appService = (__runInitializers(this, _instanceExtraInitializers), appService);
        }
        AppController_1.prototype.getHello = function () {
            return this.appService.getHello();
        };
        AppController_1.prototype.healthCheck = function () {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            };
        };
        AppController_1.prototype.getVersion = function () {
            return {
                version: process.env.npm_package_version || '1.0.0',
                name: process.env.npm_package_name || 'productivity-platform',
                environment: process.env.NODE_ENV || 'development',
            };
        };
        return AppController_1;
    }());
    __setFunctionName(_classThis, "AppController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getHello_decorators = [(0, common_1.Get)()];
        _healthCheck_decorators = [(0, common_1.Get)('health')];
        _getVersion_decorators = [(0, common_1.Get)('version')];
        __esDecorate(_classThis, null, _getHello_decorators, { kind: "method", name: "getHello", static: false, private: false, access: { has: function (obj) { return "getHello" in obj; }, get: function (obj) { return obj.getHello; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: function (obj) { return "healthCheck" in obj; }, get: function (obj) { return obj.healthCheck; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getVersion_decorators, { kind: "method", name: "getVersion", static: false, private: false, access: { has: function (obj) { return "getVersion" in obj; }, get: function (obj) { return obj.getVersion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppController = _classThis;
}();
exports.AppController = AppController;
