"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailedSeedService = void 0;
var common_1 = require("@nestjs/common");
var bcrypt = require("bcrypt");
var user_entity_1 = require("../entities/user.entity");
var organization_entity_1 = require("../entities/organization.entity");
var questionnaire_entity_1 = require("../entities/questionnaire.entity");
var response_entity_1 = require("../entities/response.entity");
var expense_entity_1 = require("../../expenses/entities/expense.entity");
var report_entity_1 = require("../entities/report.entity");
var DetailedSeedService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DetailedSeedService = _classThis = /** @class */ (function () {
        function DetailedSeedService_1(userRepository, organizationRepository, questionnaireRepository, responseRepository, expenseRepository, reportRepository) {
            this.userRepository = userRepository;
            this.organizationRepository = organizationRepository;
            this.questionnaireRepository = questionnaireRepository;
            this.responseRepository = responseRepository;
            this.expenseRepository = expenseRepository;
            this.reportRepository = reportRepository;
            this.logger = new common_1.Logger(DetailedSeedService.name);
        }
        DetailedSeedService_1.prototype.seedAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                var users, organizations, questionnaires, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Seeder эхлэл...');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 10, , 11]);
                            // Эхлээд бүх өгөгдлийг устгах
                            return [4 /*yield*/, this.clearDatabase()];
                        case 2:
                            // Эхлээд бүх өгөгдлийг устгах
                            _a.sent();
                            return [4 /*yield*/, this.seedUsers()];
                        case 3:
                            users = _a.sent();
                            return [4 /*yield*/, this.seedOrganizations()];
                        case 4:
                            organizations = _a.sent();
                            // Хэрэглэгчдийг байгууллагад оноох
                            return [4 /*yield*/, this.assignUsersToOrganizations(users, organizations)];
                        case 5:
                            // Хэрэглэгчдийг байгууллагад оноох
                            _a.sent();
                            return [4 /*yield*/, this.seedQuestionnaires(organizations, users)];
                        case 6:
                            questionnaires = _a.sent();
                            // Хариултууд үүсгэх
                            return [4 /*yield*/, this.seedResponses(questionnaires, users)];
                        case 7:
                            // Хариултууд үүсгэх
                            _a.sent();
                            // Зардлууд үүсгэх
                            return [4 /*yield*/, this.seedExpenses(organizations, users)];
                        case 8:
                            // Зардлууд үүсгэх
                            _a.sent();
                            // Тайлангууд үүсгэх
                            return [4 /*yield*/, this.seedReports(organizations, users, questionnaires)];
                        case 9:
                            // Тайлангууд үүсгэх
                            _a.sent();
                            this.logger.log('Seeder амжилттай дууслаа!');
                            return [3 /*break*/, 11];
                        case 10:
                            error_1 = _a.sent();
                            this.logger.error('Seeder алдаа:', error_1);
                            throw error_1;
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.clearDatabase = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Өгөгдлийн сан цэвэрлэж байна...');
                            // Дарааллыг анхаарч устгах (foreign key constraint)
                            return [4 /*yield*/, this.reportRepository.delete({})];
                        case 1:
                            // Дарааллыг анхаарч устгах (foreign key constraint)
                            _a.sent();
                            return [4 /*yield*/, this.expenseRepository.delete({})];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.responseRepository.delete({})];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.questionnaireRepository.delete({})];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.userRepository.delete({})];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, this.organizationRepository.delete({})];
                        case 6:
                            _a.sent();
                            this.logger.log('Өгөгдлийн сан амжилттай цэвэрлэгдлээ');
                            return [2 /*return*/];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.seedUsers = function () {
            return __awaiter(this, void 0, void 0, function () {
                var usersData, users, _i, usersData_1, userData, user, salt, _a, savedUser;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.log('Хэрэглэгчид үүсгэж байна...');
                            usersData = [
                                // Super Admin
                                {
                                    email: 'superadmin@example.com',
                                    password: 'Admin@123',
                                    firstName: 'Супер',
                                    lastName: 'Админ',
                                    role: user_entity_1.UserRole.SUPER_ADMIN,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99119911',
                                    emailVerified: true,
                                },
                                // Админууд
                                {
                                    email: 'admin1@example.com',
                                    password: 'Admin@123',
                                    firstName: 'Бадрах',
                                    lastName: 'Ганбат',
                                    role: user_entity_1.UserRole.ADMIN,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99229922',
                                    emailVerified: true,
                                },
                                {
                                    email: 'admin2@example.com',
                                    password: 'Admin@123',
                                    firstName: 'Энхтайван',
                                    lastName: 'Баярмаа',
                                    role: user_entity_1.UserRole.ADMIN,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99339933',
                                    emailVerified: true,
                                },
                                // Менежерүүд
                                {
                                    email: 'manager1@example.com',
                                    password: 'Manager@123',
                                    firstName: 'Болд',
                                    lastName: 'Төмөр',
                                    role: user_entity_1.UserRole.MANAGER,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99449944',
                                    emailVerified: true,
                                },
                                {
                                    email: 'manager2@example.com',
                                    password: 'Manager@123',
                                    firstName: 'Сүх',
                                    lastName: 'Батаа',
                                    role: user_entity_1.UserRole.MANAGER,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99559955',
                                    emailVerified: true,
                                },
                                // Энгийн хэрэглэгчид
                                {
                                    email: 'user1@example.com',
                                    password: 'User@123',
                                    firstName: 'Номин',
                                    lastName: 'Эрдэнэ',
                                    role: user_entity_1.UserRole.USER,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99669966',
                                    emailVerified: true,
                                },
                                {
                                    email: 'user2@example.com',
                                    password: 'User@123',
                                    firstName: 'Отгонбаяр',
                                    lastName: 'Батбаяр',
                                    role: user_entity_1.UserRole.USER,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99779977',
                                    emailVerified: true,
                                },
                                {
                                    email: 'user3@example.com',
                                    password: 'User@123',
                                    firstName: 'Бат-Эрдэнэ',
                                    lastName: 'Ганболд',
                                    role: user_entity_1.UserRole.USER,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99889988',
                                    emailVerified: true,
                                },
                                {
                                    email: 'user4@example.com',
                                    password: 'User@123',
                                    firstName: 'Цэцэг',
                                    lastName: 'Дорж',
                                    role: user_entity_1.UserRole.USER,
                                    status: user_entity_1.UserStatus.ACTIVE,
                                    phone: '99999999',
                                    emailVerified: true,
                                },
                                {
                                    email: 'user5@example.com',
                                    password: 'User@123',
                                    firstName: 'Хонгорзул',
                                    lastName: 'Баттулга',
                                    role: user_entity_1.UserRole.USER,
                                    status: user_entity_1.UserStatus.PENDING,
                                    phone: '99009900',
                                    emailVerified: false,
                                },
                            ];
                            users = [];
                            _i = 0, usersData_1 = usersData;
                            _b.label = 1;
                        case 1:
                            if (!(_i < usersData_1.length)) return [3 /*break*/, 6];
                            userData = usersData_1[_i];
                            user = this.userRepository.create(userData);
                            return [4 /*yield*/, bcrypt.genSalt(10)];
                        case 2:
                            salt = _b.sent();
                            _a = user;
                            return [4 /*yield*/, bcrypt.hash(userData.password, salt)];
                        case 3:
                            _a.password = _b.sent();
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 4:
                            savedUser = _b.sent();
                            users.push(savedUser);
                            this.logger.log("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D: ".concat(userData.email));
                            _b.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6:
                            this.logger.log("".concat(users.length, " \u0445\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"));
                            return [2 /*return*/, users];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.seedOrganizations = function () {
            return __awaiter(this, void 0, void 0, function () {
                var organizationsData, organizations, _i, organizationsData_1, orgData, organization, savedOrg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Байгууллагууд үүсгэж байна...');
                            organizationsData = [
                                {
                                    name: 'Технологийн Дээд Сургууль',
                                    email: 'info@techuniversity.mn',
                                    phone: '70101010',
                                    address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, Сөүлийн гудамж 9',
                                    description: 'Монголын тэргүүлэх технологийн их сургууль',
                                    taxNumber: '1234567890',
                                    industry: 'Боловсрол',
                                    employeeCount: 500,
                                    contactPersonName: 'Д. Ганбат',
                                    contactPersonPosition: 'Ректор',
                                    status: organization_entity_1.OrganizationStatus.ACTIVE,
                                    website: 'https://techuniversity.mn',
                                },
                                {
                                    name: 'Их Дэлгүүр ХХК',
                                    email: 'contact@ikhdelguur.mn',
                                    phone: '70202020',
                                    address: 'Улаанбаатар хот, Баянгол дүүрэг, Их Дэлгүүрийн гудамж 1',
                                    description: 'Монголын хамгийн том жижиглэнгийн сүлжээ',
                                    taxNumber: '0987654321',
                                    industry: 'Худалдаа',
                                    employeeCount: 2000,
                                    contactPersonName: 'Б. Энхбаяр',
                                    contactPersonPosition: 'Гүйцэтгэх захирал',
                                    status: organization_entity_1.OrganizationStatus.ACTIVE,
                                    website: 'https://ikhdelguur.mn',
                                },
                                {
                                    name: 'Монгол Банк',
                                    email: 'info@mongolbank.mn',
                                    phone: '70303030',
                                    address: 'Улаанбаатар хот, Чингэлтэй дүүрэг, Сүхбаатарын талбай 3',
                                    description: 'Улсын төв банк',
                                    taxNumber: '1122334455',
                                    industry: 'Санхүү',
                                    employeeCount: 800,
                                    contactPersonName: 'Ж. Батжаргал',
                                    contactPersonPosition: 'Төлөөлөгч',
                                    status: organization_entity_1.OrganizationStatus.ACTIVE,
                                    website: 'https://mongolbank.mn',
                                },
                                {
                                    name: 'Говийн Эрчим Хүч ХХК',
                                    email: 'info@gobienergy.mn',
                                    phone: '70404040',
                                    address: 'Дорноговь аймаг, Сайншанд хот, Эрчим хүчний гудамж 5',
                                    description: 'Сэргээгдэх эрчим хүчний компани',
                                    taxNumber: '5544332211',
                                    industry: 'Эрчим хүч',
                                    employeeCount: 150,
                                    contactPersonName: 'Ц. Амарбат',
                                    contactPersonPosition: 'Удирдах захирал',
                                    status: organization_entity_1.OrganizationStatus.ACTIVE,
                                    website: 'https://gobienergy.mn',
                                },
                                {
                                    name: 'Медикал Центр ХХК',
                                    email: 'info@medicalcenter.mn',
                                    phone: '70505050',
                                    address: 'Улаанбаатар хот, Хан-Уул дүүрэг, Эрүүл мэндийн гудамж 12',
                                    description: 'Орчин үеийн эмнэлгийн төв',
                                    taxNumber: '6677889900',
                                    industry: 'Эрүүл мэнд',
                                    employeeCount: 300,
                                    contactPersonName: 'Д. Сэржмядаг',
                                    contactPersonPosition: 'Захирал',
                                    status: organization_entity_1.OrganizationStatus.PENDING,
                                    website: 'https://medicalcenter.mn',
                                },
                            ];
                            organizations = [];
                            _i = 0, organizationsData_1 = organizationsData;
                            _a.label = 1;
                        case 1:
                            if (!(_i < organizationsData_1.length)) return [3 /*break*/, 4];
                            orgData = organizationsData_1[_i];
                            organization = this.organizationRepository.create(orgData);
                            return [4 /*yield*/, this.organizationRepository.save(organization)];
                        case 2:
                            savedOrg = _a.sent();
                            organizations.push(savedOrg);
                            this.logger.log("\u0411\u0430\u0439\u0433\u0443\u0443\u043B\u043B\u0430\u0433\u0430 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D: ".concat(orgData.name));
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            this.logger.log("".concat(organizations.length, " \u0431\u0430\u0439\u0433\u0443\u0443\u043B\u043B\u0430\u0433\u0430 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"));
                            return [2 /*return*/, organizations];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.assignUsersToOrganizations = function (users, organizations) {
            return __awaiter(this, void 0, void 0, function () {
                var superAdmin, otherUsers, i, user, orgIndex;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Хэрэглэгчдийг байгууллагад оноож байна...');
                            superAdmin = users.find(function (u) { return u.role === user_entity_1.UserRole.SUPER_ADMIN; });
                            otherUsers = users.filter(function (u) { return u !== superAdmin; });
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < otherUsers.length)) return [3 /*break*/, 4];
                            user = otherUsers[i];
                            orgIndex = i % organizations.length;
                            user.organizationId = organizations[orgIndex].id;
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 2:
                            _a.sent();
                            this.logger.log("".concat(user.email, " \u0445\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447\u0438\u0439\u0433 ").concat(organizations[orgIndex].name, " \u0431\u0430\u0439\u0433\u0443\u0443\u043B\u043B\u0430\u0433\u0430\u0434 \u043E\u043D\u043E\u043E\u0432"));
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.seedQuestionnaires = function (organizations, users) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnairesData, questionnaires, creators, i, qData, orgIndex, creatorIndex, questionnaire, savedQuestionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Асуулгууд үүсгэж байна...');
                            questionnairesData = [
                                {
                                    title: 'Ажилчдын сэтгэл ханамжийн судалгаа',
                                    description: 'Ажилчдын ажлын орчин, удирдлагын талаарх сэтгэл ханамжийг судлах',
                                    type: questionnaire_entity_1.QuestionnaireType.SURVEY,
                                    status: questionnaire_entity_1.QuestionnaireStatus.PUBLISHED,
                                    isActive: true,
                                    startDate: new Date('2024-01-01'),
                                    endDate: new Date('2024-12-31'),
                                    timeLimit: 30,
                                    questions: [
                                        {
                                            id: 'q1',
                                            text: 'Таны ажлын орчин хэр сэтгэл ханамжтай вэ?',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 5,
                                            weight: 20,
                                        },
                                        {
                                            id: 'q2',
                                            text: 'Удирдлага нь таны санал бодлыг сонсдог уу?',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Тийм, үргэлж', 'Ихэнхдээ', 'Заримдаа', 'Ховор', 'Үгүй'],
                                            weight: 25,
                                        },
                                        {
                                            id: 'q3',
                                            text: 'Ажлын ачаалал таны хувьд тохиромжтой юу?',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Хэт их', 'Бага зэрэг их', 'Тохиромжтой', 'Бага зэрэг бага', 'Хэт бага'],
                                            weight: 20,
                                        },
                                        {
                                            id: 'q4',
                                            text: 'Ажлын цагийн уян хатан байдал хэр хангагддаг вэ?',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 5,
                                            weight: 15,
                                        },
                                        {
                                            id: 'q5',
                                            text: 'Хөгжлийн боломжууд байгаа эсэх?',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Олон боломжтой', 'Хангалттай', 'Хангалтгүй', 'Байхгүй'],
                                            weight: 20,
                                        },
                                    ],
                                    scoring: {
                                        maxScore: 100,
                                        passingScore: 70,
                                        criteria: [
                                            { questionId: 'q1', weight: 20 },
                                            { questionId: 'q2', weight: 25 },
                                            { questionId: 'q3', weight: 20 },
                                            { questionId: 'q4', weight: 15 },
                                            { questionId: 'q5', weight: 20 },
                                        ],
                                    },
                                },
                                {
                                    title: 'Бүтээгдэхүүний чанарын үнэлгээ',
                                    description: 'Бүтээгдэхүүний чанар, үйлчилгээний талаарх үнэлгээ',
                                    type: questionnaire_entity_1.QuestionnaireType.FEEDBACK,
                                    status: questionnaire_entity_1.QuestionnaireStatus.PUBLISHED,
                                    isActive: true,
                                    startDate: new Date('2024-03-01'),
                                    endDate: new Date('2024-12-31'),
                                    questions: [
                                        {
                                            id: 'q1',
                                            text: 'Бүтээгдэхүүний чанар хэр сэтгэл ханамжтай вэ?',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 10,
                                            weight: 30,
                                        },
                                        {
                                            id: 'q2',
                                            text: 'Үйлчилгээний хурд',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Маш хурдан', 'Хурдан', 'Дунд зэрэг', 'Удаан', 'Маш удаан'],
                                            weight: 25,
                                        },
                                        {
                                            id: 'q3',
                                            text: 'Үнийн чанар харьцаа',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Маш сайн', 'Сайн', 'Дунд зэрэг', 'Муу', 'Маш муу'],
                                            weight: 25,
                                        },
                                        {
                                            id: 'q4',
                                            text: 'Дахин худалдан авалт хийх магадлал',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 10,
                                            weight: 20,
                                        },
                                    ],
                                    scoring: {
                                        maxScore: 100,
                                        passingScore: 60,
                                    },
                                },
                                {
                                    title: 'Аюулгүй ажиллагааны мэдлэгийн шалгалт',
                                    description: 'Аюулгүй ажиллагааны дүрэм журам, мэдлэгийн шалгалт',
                                    type: questionnaire_entity_1.QuestionnaireType.QUIZ,
                                    status: questionnaire_entity_1.QuestionnaireStatus.PUBLISHED,
                                    isActive: true,
                                    startDate: new Date('2024-01-15'),
                                    endDate: new Date('2024-06-30'),
                                    timeLimit: 45,
                                    questions: [
                                        {
                                            id: 'q1',
                                            text: 'Гал унтраагчийг ямар төрлийн галд ашигладаг вэ?',
                                            type: 'multiple_choice',
                                            required: true,
                                            options: ['A төрөл - хатуу материал', 'B төрөл - шатдаг шингэн', 'C төрөл - цахилгаан гал', 'D төрөл - шатдаг металл'],
                                            weight: 25,
                                        },
                                        {
                                            id: 'q2',
                                            text: 'Ажлын байранд гэнэтийн осол гарахад юу хийх вэ?',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Шууд гүйж зайлах', 'Удирдлагад мэдэгдэх', 'Өөрөө шийдвэрлэх', 'Юу ч хийхгүй'],
                                            weight: 25,
                                        },
                                        {
                                            id: 'q3',
                                            text: 'Химийн бодистой ажиллахдаа ямар хамгаалалт хэрэглэх вэ?',
                                            type: 'multiple_choice',
                                            required: true,
                                            options: ['Гарын бээлий', 'Нүдний хамгаалалт', 'Амьсгалын хамгаалалт', 'Хийн хувцас'],
                                            weight: 30,
                                        },
                                        {
                                            id: 'q4',
                                            text: 'Галын дохиоллын дуугарвал юу хийх вэ?',
                                            type: 'single_choice',
                                            required: true,
                                            options: ['Шууд гаргах', 'Удирдлагад лавлах', 'Өөрөө унтраах', 'Юу ч хийхгүй'],
                                            weight: 20,
                                        },
                                    ],
                                    scoring: {
                                        maxScore: 100,
                                        passingScore: 75,
                                        criteria: [
                                            {
                                                questionId: 'q1',
                                                weight: 25,
                                                correctAnswers: ['A төрөл - хатуу материал', 'B төрөл - шатдаг шингэн', 'C төрөл - цахилгаан гал'],
                                            },
                                            {
                                                questionId: 'q2',
                                                weight: 25,
                                                correctAnswers: ['Удирдлагад мэдэгдэх'],
                                            },
                                            {
                                                questionId: 'q3',
                                                weight: 30,
                                                correctAnswers: ['Гарын бээлий', 'Нүдний хамгаалалт', 'Амьсгалын хамгаалалт'],
                                            },
                                            {
                                                questionId: 'q4',
                                                weight: 20,
                                                correctAnswers: ['Шууд гаргах'],
                                            },
                                        ],
                                    },
                                },
                                {
                                    title: 'Менежментийн үнэлгээ',
                                    description: 'Менежерүүдийн ажлын үнэлгээ',
                                    type: questionnaire_entity_1.QuestionnaireType.EVALUATION,
                                    status: questionnaire_entity_1.QuestionnaireStatus.DRAFT,
                                    isActive: false,
                                    questions: [
                                        {
                                            id: 'q1',
                                            text: 'Менежерийн харилцааны чанар',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 10,
                                        },
                                        {
                                            id: 'q2',
                                            text: 'Шийдвэр гаргах чадвар',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 10,
                                        },
                                        {
                                            id: 'q3',
                                            text: 'Багийн удирдлага',
                                            type: 'rating',
                                            required: true,
                                            minValue: 1,
                                            maxValue: 10,
                                        },
                                    ],
                                },
                            ];
                            questionnaires = [];
                            creators = users.filter(function (u) { return [user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER].includes(u.role); });
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < questionnairesData.length)) return [3 /*break*/, 4];
                            qData = questionnairesData[i];
                            orgIndex = i % organizations.length;
                            creatorIndex = i % creators.length;
                            questionnaire = this.questionnaireRepository.create(__assign(__assign({}, qData), { organizationId: organizations[orgIndex].id, createdBy: creators[creatorIndex].id, settings: {
                                    allowAnonymous: false,
                                    showResults: true,
                                    requireAuthentication: true,
                                } }));
                            return [4 /*yield*/, this.questionnaireRepository.save(questionnaire)];
                        case 2:
                            savedQuestionnaire = _a.sent();
                            questionnaires.push(savedQuestionnaire);
                            this.logger.log("\u0410\u0441\u0443\u0443\u043B\u0433\u0430 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D: ".concat(qData.title));
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4:
                            this.logger.log("".concat(questionnaires.length, " \u0430\u0441\u0443\u0443\u043B\u0433\u0430 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"));
                            return [2 /*return*/, questionnaires];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.seedResponses = function (questionnaires, users) {
            return __awaiter(this, void 0, void 0, function () {
                var regularUsers, responseCount, _i, questionnaires_1, questionnaire, numResponses, i, user, shouldSubmit, answers, score, maxScore, percentage, response, currentAvg, totalScore;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Хариултууд үүсгэж байна...');
                            regularUsers = users.filter(function (u) { return u.role === user_entity_1.UserRole.USER; });
                            responseCount = 0;
                            _i = 0, questionnaires_1 = questionnaires;
                            _a.label = 1;
                        case 1:
                            if (!(_i < questionnaires_1.length)) return [3 /*break*/, 8];
                            questionnaire = questionnaires_1[_i];
                            if (questionnaire.status !== questionnaire_entity_1.QuestionnaireStatus.PUBLISHED)
                                return [3 /*break*/, 7];
                            numResponses = Math.floor(Math.random() * 3) + 3;
                            i = 0;
                            _a.label = 2;
                        case 2:
                            if (!(i < numResponses)) return [3 /*break*/, 5];
                            user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
                            shouldSubmit = Math.random() > 0.3;
                            answers = questionnaire.questions.map(function (question) {
                                var answer;
                                switch (question.type) {
                                    case 'rating':
                                        answer = Math.floor(Math.random() * (question.maxValue - question.minValue + 1)) + question.minValue;
                                        break;
                                    case 'single_choice':
                                        answer = question.options[Math.floor(Math.random() * question.options.length)];
                                        break;
                                    case 'multiple_choice':
                                        var numSelections = Math.floor(Math.random() * question.options.length) + 1;
                                        answer = [];
                                        var shuffledOptions = __spreadArray([], question.options, true).sort(function () { return Math.random() - 0.5; });
                                        for (var j = 0; j < numSelections; j++) {
                                            answer.push(shuffledOptions[j]);
                                        }
                                        break;
                                    case 'text':
                                        answer = "\u0422\u0443\u0440\u0448\u0438\u043B\u0442\u044B\u043D \u0445\u0430\u0440\u0438\u0443\u043B\u0442: ".concat(question.text.substring(0, 20), "...");
                                        break;
                                    case 'scale':
                                        answer = Math.floor(Math.random() * 10) + 1;
                                        break;
                                    default:
                                        answer = 'Туршилтын хариулт';
                                }
                                return {
                                    questionId: question.id,
                                    answer: answer,
                                    score: question.weight ? Math.floor(Math.random() * question.weight) + 1 : undefined,
                                };
                            });
                            score = void 0;
                            maxScore = void 0;
                            percentage = void 0;
                            if (questionnaire.scoring) {
                                maxScore = questionnaire.scoring.maxScore;
                                score = Math.floor(Math.random() * maxScore);
                                percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                            }
                            response = this.responseRepository.create({
                                userId: user.id,
                                questionnaireId: questionnaire.id,
                                organizationId: questionnaire.organizationId,
                                answers: answers,
                                score: score,
                                maxScore: maxScore,
                                percentage: percentage,
                                status: shouldSubmit ? response_entity_1.ResponseStatus.SUBMITTED : response_entity_1.ResponseStatus.IN_PROGRESS,
                                submittedAt: shouldSubmit ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
                                metadata: {
                                    device: 'web',
                                    browser: 'Chrome',
                                    ip: "192.168.1.".concat(Math.floor(Math.random() * 255)),
                                },
                            });
                            return [4 /*yield*/, this.responseRepository.save(response)];
                        case 3:
                            _a.sent();
                            responseCount++;
                            // Асуулгын статистик шинэчлэх
                            if (shouldSubmit) {
                                questionnaire.responseCount = (questionnaire.responseCount || 0) + 1;
                                // Дундаж оноо шинэчлэх
                                if (score !== undefined) {
                                    currentAvg = questionnaire.averageScore || 0;
                                    totalScore = currentAvg * (questionnaire.responseCount - 1) + score;
                                    questionnaire.averageScore = totalScore / questionnaire.responseCount;
                                }
                            }
                            _a.label = 4;
                        case 4:
                            i++;
                            return [3 /*break*/, 2];
                        case 5: 
                        // Асуулгын мэдээллийг шинэчлэх
                        return [4 /*yield*/, this.questionnaireRepository.save(questionnaire)];
                        case 6:
                            // Асуулгын мэдээллийг шинэчлэх
                            _a.sent();
                            _a.label = 7;
                        case 7:
                            _i++;
                            return [3 /*break*/, 1];
                        case 8:
                            this.logger.log("".concat(responseCount, " \u0445\u0430\u0440\u0438\u0443\u043B\u0442 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.seedExpenses = function (organizations, users) {
            return __awaiter(this, void 0, void 0, function () {
                var expenseCategories, expenseStatuses, regularUsers, managers, expenseCount, _i, organizations_1, organization, numExpenses, i, category, status_1, creator, approver, amount, expenseDate, expenseNames, expense;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.log('Зардлууд үүсгэж байна...');
                            expenseCategories = Object.values(expense_entity_1.ExpenseCategory);
                            expenseStatuses = Object.values(expense_entity_1.ExpenseStatus);
                            regularUsers = users.filter(function (u) { return u.role !== user_entity_1.UserRole.SUPER_ADMIN; });
                            managers = users.filter(function (u) { return u.role === user_entity_1.UserRole.MANAGER; });
                            expenseCount = 0;
                            _i = 0, organizations_1 = organizations;
                            _b.label = 1;
                        case 1:
                            if (!(_i < organizations_1.length)) return [3 /*break*/, 6];
                            organization = organizations_1[_i];
                            numExpenses = Math.floor(Math.random() * 10) + 5;
                            i = 0;
                            _b.label = 2;
                        case 2:
                            if (!(i < numExpenses)) return [3 /*break*/, 5];
                            category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
                            status_1 = expenseStatuses[Math.floor(Math.random() * expenseStatuses.length)];
                            creator = regularUsers[Math.floor(Math.random() * regularUsers.length)];
                            approver = status_1 !== expense_entity_1.ExpenseStatus.PENDING && Math.random() > 0.5
                                ? managers[Math.floor(Math.random() * managers.length)]
                                : undefined;
                            amount = Math.floor(Math.random() * 5000000) + 100000;
                            expenseDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
                            expenseNames = (_a = {},
                                _a[expense_entity_1.ExpenseCategory.SALARY] = ['Ажилчдын цалин', 'Удирдлагын цалин', 'Нэмэлт цалин'],
                                _a[expense_entity_1.ExpenseCategory.UTILITY] = ['Цахилгаан төлбөр', 'Усны төлбөр', 'Дулааны төлбөр', 'Харилцаа холбоо'],
                                _a[expense_entity_1.ExpenseCategory.RENT] = ['Оффисын түрээс', 'Агуулахын түрээс', 'Тоног төхөөрөмжийн түрээс'],
                                _a[expense_entity_1.ExpenseCategory.OFFICE_SUPPLIES] = ['Бичиг хэрэг', 'Хэвлэх материал', 'Оффисын техник хэрэгсэл'],
                                _a[expense_entity_1.ExpenseCategory.MARKETING] = ['Сувгийн зар сурталчилгаа', 'Сошиал медиа маркетинг', 'Ивээн тэтгэгчдийн зар'],
                                _a[expense_entity_1.ExpenseCategory.TRAVEL] = ['Нисэх онгоцны тасалбар', 'Зочид буудал', 'Тээврийн зардал', 'Хоолны зардал'],
                                _a[expense_entity_1.ExpenseCategory.EQUIPMENT] = ['Компьютер худалдан авалт', 'Оффисын тавилга', 'Үйлдвэрийн тоног төхөөрөмж'],
                                _a[expense_entity_1.ExpenseCategory.SOFTWARE] = ['Програм хангамжийн лиценз', 'Клауд үйлчилгээ', 'Техникийн дэмжлэг'],
                                _a[expense_entity_1.ExpenseCategory.TRAINING] = ['Ажилчдын сургалт', 'Семинар оролцоо', 'Мэргэжлийн сургалт'],
                                _a[expense_entity_1.ExpenseCategory.OTHER] = ['Даатгал', 'Нийгмийн хариуцлага', 'Бусад зардал'],
                                _a);
                            expense = this.expenseRepository.create({
                                name: expenseNames[category][Math.floor(Math.random() * expenseNames[category].length)],
                                description: "".concat(category, " \u0437\u0430\u0440\u0434\u043B\u044B\u043D \u0442\u04E9\u043B\u0431\u04E9\u0440"),
                                amount: amount,
                                category: category,
                                status: status_1,
                                expenseDate: expenseDate,
                                paidDate: status_1 === expense_entity_1.ExpenseStatus.PAID
                                    ? new Date(expenseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
                                    : undefined,
                                recipientName: "\u0425\u04AF\u043B\u044D\u044D\u043D \u0430\u0432\u0430\u0433\u0447 ".concat(i + 1),
                                recipientAccount: "5000".concat(Math.floor(Math.random() * 1000000000)),
                                invoiceNumber: "INV-".concat(organization.taxNumber.substring(0, 6), "-").concat(String(i + 1).padStart(4, '0')),
                                attachments: Math.random() > 0.7 ? ['invoice.pdf', 'receipt.jpg'] : undefined,
                                organizationId: organization.id,
                                createdBy: creator.id,
                                approvedBy: approver === null || approver === void 0 ? void 0 : approver.id,
                            });
                            return [4 /*yield*/, this.expenseRepository.save(expense)];
                        case 3:
                            _b.sent();
                            expenseCount++;
                            this.logger.log("\u0417\u0430\u0440\u0434\u0430\u043B \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D: ".concat(expense.name, " - ").concat(amount, " MNT"));
                            _b.label = 4;
                        case 4:
                            i++;
                            return [3 /*break*/, 2];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6:
                            this.logger.log("".concat(expenseCount, " \u0437\u0430\u0440\u0434\u0430\u043B \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.seedReports = function (organizations, users, questionnaires) {
            return __awaiter(this, void 0, void 0, function () {
                var reportTypes, managersAndAdmins, reportCount, _i, organizations_2, organization, numReports, i, type, generatedBy, questionnaire, startDate, endDate, reportData, report;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Тайлангууд үүсгэж байна...');
                            reportTypes = Object.values(report_entity_1.ReportType);
                            managersAndAdmins = users.filter(function (u) {
                                return [user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER].includes(u.role);
                            });
                            reportCount = 0;
                            _i = 0, organizations_2 = organizations;
                            _a.label = 1;
                        case 1:
                            if (!(_i < organizations_2.length)) return [3 /*break*/, 7];
                            organization = organizations_2[_i];
                            numReports = Math.floor(Math.random() * 3) + 2;
                            i = 0;
                            _a.label = 2;
                        case 2:
                            if (!(i < numReports)) return [3 /*break*/, 6];
                            type = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                            generatedBy = managersAndAdmins[Math.floor(Math.random() * managersAndAdmins.length)];
                            questionnaire = type === report_entity_1.ReportType.QUESTIONNAIRE
                                ? questionnaires[Math.floor(Math.random() * questionnaires.length)]
                                : undefined;
                            startDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
                            endDate = new Date(startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
                            return [4 /*yield*/, this.generateReportData(type, organization, startDate, endDate, questionnaire)];
                        case 3:
                            reportData = _a.sent();
                            report = this.reportRepository.create({
                                type: type,
                                title: "".concat(organization.name, " - ").concat(type, " \u0442\u0430\u0439\u043B\u0430\u043D (").concat(startDate.toISOString().split('T')[0], " - ").concat(endDate.toISOString().split('T')[0], ")"),
                                description: "".concat(type, " \u0442\u04E9\u0440\u043B\u0438\u0439\u043D \u0442\u0430\u0439\u043B\u0430\u043D\u0433\u0438\u0439\u043D \u0434\u04AF\u043D \u0448\u0438\u043D\u0436\u0438\u043B\u0433\u044D\u044D"),
                                data: reportData,
                                status: report_entity_1.ReportStatus.COMPLETED,
                                organizationId: organization.id,
                                questionnaireId: questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.id,
                                generatedById: generatedBy.id,
                                parameters: {
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: endDate.toISOString().split('T')[0],
                                    organizationId: organization.id,
                                    questionnaireId: questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.id,
                                },
                                exportedAt: Math.random() > 0.5 ? new Date() : undefined,
                                exportFormat: Math.random() > 0.5 ? 'pdf' : undefined,
                                exportPath: Math.random() > 0.5 ? "/reports/".concat(organization.id, "/").concat(Date.now(), ".pdf") : undefined,
                            });
                            return [4 /*yield*/, this.reportRepository.save(report)];
                        case 4:
                            _a.sent();
                            reportCount++;
                            this.logger.log("\u0422\u0430\u0439\u043B\u0430\u043D \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D: ".concat(report.title));
                            _a.label = 5;
                        case 5:
                            i++;
                            return [3 /*break*/, 2];
                        case 6:
                            _i++;
                            return [3 /*break*/, 1];
                        case 7:
                            this.logger.log("".concat(reportCount, " \u0442\u0430\u0439\u043B\u0430\u043D \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        DetailedSeedService_1.prototype.generateReportData = function (type, organization, startDate, endDate, questionnaire) {
            return __awaiter(this, void 0, void 0, function () {
                var categories, categoryBreakdown_1, totalAmount_1;
                return __generator(this, function (_a) {
                    switch (type) {
                        case report_entity_1.ReportType.QUESTIONNAIRE:
                            return [2 /*return*/, {
                                    organization: {
                                        id: organization.id,
                                        name: organization.name,
                                    },
                                    questionnaire: questionnaire ? {
                                        id: questionnaire.id,
                                        title: questionnaire.title,
                                        questionCount: questionnaire.questions.length,
                                    } : null,
                                    period: {
                                        start: startDate.toISOString().split('T')[0],
                                        end: endDate.toISOString().split('T')[0],
                                    },
                                    statistics: {
                                        totalResponses: Math.floor(Math.random() * 500) + 100,
                                        averageScore: Math.floor(Math.random() * 30) + 60,
                                        completionRate: Math.floor(Math.random() * 40) + 50,
                                        responseRate: Math.floor(Math.random() * 30) + 60,
                                    },
                                    analysis: {
                                        strengths: ['Өндөр оролцоо', 'Сэтгэл ханамжтай хариултууд', 'Цаг баримтлалт'],
                                        weaknesses: ['Зарим асуултууд ойлгомжгүй', 'Хариултын хугацаа удаан'],
                                        recommendations: ['Асуултуудыг хялбарчлах', 'Урамшууллыг нэмэгдүүлэх'],
                                    },
                                }];
                        case report_entity_1.ReportType.EXPENSE:
                            categories = Object.values(expense_entity_1.ExpenseCategory);
                            categoryBreakdown_1 = {};
                            totalAmount_1 = 0;
                            categories.forEach(function (category) {
                                var amount = Math.floor(Math.random() * 10000000) + 500000;
                                categoryBreakdown_1[category] = { amount: amount, percentage: 0 };
                                totalAmount_1 += amount;
                            });
                            // Хувь тооцох
                            Object.keys(categoryBreakdown_1).forEach(function (category) {
                                categoryBreakdown_1[category].percentage = (categoryBreakdown_1[category].amount / totalAmount_1) * 100;
                            });
                            return [2 /*return*/, {
                                    organization: {
                                        id: organization.id,
                                        name: organization.name,
                                    },
                                    period: {
                                        start: startDate.toISOString().split('T')[0],
                                        end: endDate.toISOString().split('T')[0],
                                    },
                                    financialSummary: {
                                        totalAmount: totalAmount_1,
                                        averageDailyExpense: totalAmount_1 / 30,
                                        largestExpense: Math.floor(Math.random() * 5000000) + 1000000,
                                        expenseCount: Math.floor(Math.random() * 50) + 20,
                                    },
                                    categoryBreakdown: categoryBreakdown_1,
                                    trends: {
                                        monthly: Array.from({ length: 6 }, function (_, i) { return ({
                                            month: "2024-".concat(String(i + 1).padStart(2, '0')),
                                            amount: Math.floor(Math.random() * 20000000) + 5000000,
                                        }); }),
                                        weekly: Array.from({ length: 4 }, function (_, i) { return ({
                                            week: "".concat(i + 1, "-\u0440 \u0434\u043E\u043B\u043E\u043E \u0445\u043E\u043D\u043E\u0433"),
                                            amount: Math.floor(Math.random() * 5000000) + 1000000,
                                        }); }),
                                    },
                                    recommendations: [
                                        'Маркетингийн зардлыг бууруулах',
                                        'Цахилгаан хэрэглээг хэмнэх',
                                        'Тоног төхөөрөмжийн засвар үйлчилгээг тогтмолжуулах',
                                    ],
                                }];
                        case report_entity_1.ReportType.COMBINED:
                            return [2 /*return*/, {
                                    organization: {
                                        id: organization.id,
                                        name: organization.name,
                                    },
                                    period: {
                                        start: startDate.toISOString().split('T')[0],
                                        end: endDate.toISOString().split('T')[0],
                                    },
                                    questionnairePerformance: {
                                        totalResponses: Math.floor(Math.random() * 1000) + 500,
                                        averageScore: Math.floor(Math.random() * 40) + 50,
                                        topQuestionnaire: (questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.title) || 'Ажилчдын сэтгэл ханамжийн судалгаа',
                                    },
                                    financialPerformance: {
                                        totalExpenses: Math.floor(Math.random() * 50000000) + 10000000,
                                        costPerResponse: Math.floor(Math.random() * 5000) + 1000,
                                        returnOnInvestment: Math.floor(Math.random() * 200) + 50,
                                    },
                                    kpis: {
                                        engagementScore: Math.floor(Math.random() * 40) + 60,
                                        efficiencyScore: Math.floor(Math.random() * 30) + 65,
                                        overallScore: Math.floor(Math.random() * 35) + 65,
                                        status: ['сайн', 'дунд', 'маш сайн'][Math.floor(Math.random() * 3)],
                                    },
                                    strategicRecommendations: [
                                        'Асуулгын оролцоог 20%-иар нэмэгдүүлэх',
                                        'Зардлын үр ашгийг 15%-иар сайжруулах',
                                        'Шинэ технологи нэвтрүүлэх',
                                    ],
                                }];
                        default:
                            return [2 /*return*/, {
                                    organization: {
                                        id: organization.id,
                                        name: organization.name,
                                    },
                                    period: {
                                        start: startDate.toISOString().split('T')[0],
                                        end: endDate.toISOString().split('T')[0],
                                    },
                                    customData: {
                                        message: 'Тустай тайлангийн өгөгдөл',
                                        generatedAt: new Date().toISOString(),
                                    },
                                }];
                    }
                    return [2 /*return*/];
                });
            });
        };
        DetailedSeedService_1.prototype.getSeedSummary = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, userCount, orgCount, questionnaireCount, responseCount, expenseCount, reportCount;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.userRepository.count(),
                                this.organizationRepository.count(),
                                this.questionnaireRepository.count(),
                                this.responseRepository.count(),
                                this.expenseRepository.count(),
                                this.reportRepository.count(),
                            ])];
                        case 1:
                            _a = _b.sent(), userCount = _a[0], orgCount = _a[1], questionnaireCount = _a[2], responseCount = _a[3], expenseCount = _a[4], reportCount = _a[5];
                            return [2 /*return*/, {
                                    summary: {
                                        users: userCount,
                                        organizations: orgCount,
                                        questionnaires: questionnaireCount,
                                        responses: responseCount,
                                        expenses: expenseCount,
                                        reports: reportCount,
                                    },
                                    generatedAt: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        return DetailedSeedService_1;
    }());
    __setFunctionName(_classThis, "DetailedSeedService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DetailedSeedService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DetailedSeedService = _classThis;
}();
exports.DetailedSeedService = DetailedSeedService;
