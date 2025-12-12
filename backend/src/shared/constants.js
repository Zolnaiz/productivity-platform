"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireStatus = exports.QuestionnaireType = exports.ExpenseStatus = exports.ExpenseCategory = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["USER"] = "user";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["PENDING"] = "pending";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["TRAVEL"] = "travel";
    ExpenseCategory["MEALS"] = "meals";
    ExpenseCategory["EQUIPMENT"] = "equipment";
    ExpenseCategory["SOFTWARE"] = "software";
    ExpenseCategory["TRAINING"] = "training";
    ExpenseCategory["OTHER"] = "other";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
var ExpenseStatus;
(function (ExpenseStatus) {
    ExpenseStatus["DRAFT"] = "draft";
    ExpenseStatus["SUBMITTED"] = "submitted";
    ExpenseStatus["APPROVED"] = "approved";
    ExpenseStatus["REJECTED"] = "rejected";
    ExpenseStatus["PAID"] = "paid";
})(ExpenseStatus || (exports.ExpenseStatus = ExpenseStatus = {}));
var QuestionnaireType;
(function (QuestionnaireType) {
    QuestionnaireType["SURVEY"] = "survey";
    QuestionnaireType["ASSESSMENT"] = "assessment";
    QuestionnaireType["FEEDBACK"] = "feedback";
    QuestionnaireType["EVALUATION"] = "evaluation";
})(QuestionnaireType || (exports.QuestionnaireType = QuestionnaireType = {}));
var QuestionnaireStatus;
(function (QuestionnaireStatus) {
    QuestionnaireStatus["DRAFT"] = "draft";
    QuestionnaireStatus["ACTIVE"] = "active";
    QuestionnaireStatus["COMPLETED"] = "completed";
    QuestionnaireStatus["ARCHIVED"] = "archived";
})(QuestionnaireStatus || (exports.QuestionnaireStatus = QuestionnaireStatus = {}));
