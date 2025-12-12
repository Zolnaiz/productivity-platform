"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = void 0;
var common_1 = require("@nestjs/common");
var RateLimitMiddleware = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RateLimitMiddleware = _classThis = /** @class */ (function () {
        function RateLimitMiddleware_1() {
            this.clients = new Map();
            this.config = {
                windowMs: 15 * 60 * 1000, // 15 минут
                maxRequests: 100, // Хугацаанд хийх дээд хэмжээ
            };
        }
        RateLimitMiddleware_1.prototype.use = function (request, response, next) {
            var clientIp = request.ip || request.connection.remoteAddress || 'unknown';
            var now = Date.now();
            if (!this.clients.has(clientIp)) {
                this.clients.set(clientIp, {
                    count: 1,
                    firstRequestTime: now,
                });
            }
            else {
                var client = this.clients.get(clientIp);
                // Хэрэв хугацаа дууссан бол цэвэрлэх
                if (now - client.firstRequestTime > this.config.windowMs) {
                    client.count = 1;
                    client.firstRequestTime = now;
                }
                else {
                    client.count++;
                }
                // Хэт их хүсэлт шалгах
                if (client.count > this.config.maxRequests) {
                    var retryAfter = Math.ceil((this.config.windowMs - (now - client.firstRequestTime)) / 1000);
                    response.setHeader('Retry-After', retryAfter);
                    throw new common_1.HttpException('Хэт олон хүсэлт илгээсэн байна. Дахин оролдохын тулд хүлээнэ үү.', common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
            }
            // Холбоо дээр хязгаарын мэдээлэл нэмэх
            response.setHeader('X-RateLimit-Limit', this.config.maxRequests);
            response.setHeader('X-RateLimit-Remaining', this.config.maxRequests - this.clients.get(clientIp).count);
            response.setHeader('X-RateLimit-Reset', Math.ceil((this.clients.get(clientIp).firstRequestTime + this.config.windowMs) / 1000));
            // Хуучин мэдээллийг цэвэрлэх
            this.cleanup();
            next();
        };
        RateLimitMiddleware_1.prototype.cleanup = function () {
            var now = Date.now();
            for (var _i = 0, _a = this.clients.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], ip = _b[0], client = _b[1];
                if (now - client.firstRequestTime > this.config.windowMs * 2) {
                    this.clients.delete(ip);
                }
            }
        };
        return RateLimitMiddleware_1;
    }());
    __setFunctionName(_classThis, "RateLimitMiddleware");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RateLimitMiddleware = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RateLimitMiddleware = _classThis;
}();
exports.RateLimitMiddleware = RateLimitMiddleware;
