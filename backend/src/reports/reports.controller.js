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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../shared/decorators/roles.decorator");
var user_entity_1 = require("../shared/entities/user.entity");
var ReportsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('reports'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('reports'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _findAll_decorators;
    var _findOne_decorators;
    var _generateReport_decorators;
    var _generateQuickReport_decorators;
    var _getDashboardSummary_decorators;
    var _getOrganizationReports_decorators;
    var _exportReport_decorators;
    var ReportsController = _classThis = /** @class */ (function () {
        function ReportsController_1(reportsService) {
            this.reportsService = (__runInitializers(this, _instanceExtraInitializers), reportsService);
        }
        ReportsController_1.prototype.findAll = function () {
            return __awaiter(this, arguments, void 0, function (page, limit, type) {
                if (page === void 0) { page = 1; }
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.findAll({ page: page, limit: limit, type: type })];
                });
            });
        };
        ReportsController_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.findOne(id)];
                });
            });
        };
        ReportsController_1.prototype.generateReport = function (generateReportDto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.generateReport(generateReportDto)];
                });
            });
        };
        ReportsController_1.prototype.generateQuickReport = function (filterDto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.generateQuickReport(filterDto)];
                });
            });
        };
        ReportsController_1.prototype.getDashboardSummary = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.getDashboardSummary()];
                });
            });
        };
        ReportsController_1.prototype.getOrganizationReports = function (organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.getOrganizationReports(organizationId, startDate, endDate)];
                });
            });
        };
        ReportsController_1.prototype.exportReport = function (id, format) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.reportsService.exportReport(id, format)];
                });
            });
        };
        return ReportsController_1;
    }());
    __setFunctionName(_classThis, "ReportsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [(0, common_1.Get)(), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER), (0, swagger_1.ApiOperation)({ summary: 'Тайлангийн жагсаалт', description: 'Бүх тайлангийн жагсаалт авах' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['questionnaire', 'expense', 'combined'] }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Тайлангийн жагсаалт амжилттай авлаа' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER), (0, swagger_1.ApiOperation)({ summary: 'Тайлан дэлгэрэнгүй', description: 'Тайлангийн дэлгэрэнгүй мэдээлэл авах' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Тайлангийн дэлгэрэнгүй амжилттай авлаа' })];
        _generateReport_decorators = [(0, common_1.Post)('generate'), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER), (0, swagger_1.ApiOperation)({ summary: 'Тайлан үүсгэх', description: 'Шинэ тайлан үүсгэх' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Тайлан амжилттай үүсгэгдлээ' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Тайлан үүсгэхэд алдаа гарлаа' })];
        _generateQuickReport_decorators = [(0, common_1.Post)('generate/quick'), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER, user_entity_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Түргэн тайлан', description: 'Түргэн тайлан үүсгэх' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Түргэн тайлан амжилттай үүсгэгдлээ' })];
        _getDashboardSummary_decorators = [(0, common_1.Get)('dashboard/summary'), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER), (0, swagger_1.ApiOperation)({ summary: 'Хяналтын самбарын тойм', description: 'Хяналтын самбарын тойм статистик авах' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Тойм статистик амжилттай авлаа' })];
        _getOrganizationReports_decorators = [(0, common_1.Get)('organization/:organizationId'), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER), (0, swagger_1.ApiOperation)({ summary: 'Байгууллагын тайлан', description: 'Тодорхой байгууллагын тайлан авах' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Байгууллагын тайлан амжилттай авлаа' })];
        _exportReport_decorators = [(0, common_1.Get)('export/:id/:format'), (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER), (0, swagger_1.ApiOperation)({ summary: 'Тайлан экспортлох', description: 'Тайланг экспортлох (PDF, Excel)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Тайлан амжилттай экспортлогдлоо' })];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateReport_decorators, { kind: "method", name: "generateReport", static: false, private: false, access: { has: function (obj) { return "generateReport" in obj; }, get: function (obj) { return obj.generateReport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateQuickReport_decorators, { kind: "method", name: "generateQuickReport", static: false, private: false, access: { has: function (obj) { return "generateQuickReport" in obj; }, get: function (obj) { return obj.generateQuickReport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDashboardSummary_decorators, { kind: "method", name: "getDashboardSummary", static: false, private: false, access: { has: function (obj) { return "getDashboardSummary" in obj; }, get: function (obj) { return obj.getDashboardSummary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOrganizationReports_decorators, { kind: "method", name: "getOrganizationReports", static: false, private: false, access: { has: function (obj) { return "getOrganizationReports" in obj; }, get: function (obj) { return obj.getOrganizationReports; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportReport_decorators, { kind: "method", name: "exportReport", static: false, private: false, access: { has: function (obj) { return "exportReport" in obj; }, get: function (obj) { return obj.exportReport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReportsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReportsController = _classThis;
}();
exports.ReportsController = ReportsController;
