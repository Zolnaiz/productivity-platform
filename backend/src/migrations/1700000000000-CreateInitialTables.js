'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.CreateInitialTables1700000000000 = void 0;
var CreateInitialTables1700000000000 = /** @class */ (function () {
  function CreateInitialTables1700000000000() {
    this.name = 'CreateInitialTables1700000000000';
  }
  CreateInitialTables1700000000000.prototype.up = function (queryRunner) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // Organizations table
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE TABLE organizations (\n                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n                name VARCHAR(255) NOT NULL,\n                email VARCHAR(255) UNIQUE NOT NULL,\n                phone VARCHAR(20) NOT NULL,\n                address TEXT NOT NULL,\n                description TEXT,\n                tax_number VARCHAR(20) UNIQUE NOT NULL,\n                logo VARCHAR(500),\n                website VARCHAR(255),\n                status VARCHAR(50) NOT NULL DEFAULT 'pending',\n                industry VARCHAR(100) NOT NULL,\n                employee_count INTEGER NOT NULL,\n                contact_person_name VARCHAR(255) NOT NULL,\n                contact_person_position VARCHAR(100) NOT NULL,\n                settings JSONB NOT NULL DEFAULT '{}',\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                deleted_at TIMESTAMPTZ\n            );\n        "
              ),
            ];
          case 1:
            // Organizations table
            _a.sent();
            // Users table
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE TABLE users (\n                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n                email VARCHAR(255) UNIQUE NOT NULL,\n                password VARCHAR(255) NOT NULL,\n                first_name VARCHAR(100) NOT NULL,\n                last_name VARCHAR(100) NOT NULL,\n                role VARCHAR(50) NOT NULL DEFAULT 'user',\n                status VARCHAR(50) NOT NULL DEFAULT 'pending',\n                phone VARCHAR(20),\n                profile_image VARCHAR(500),\n                last_login_at TIMESTAMPTZ,\n                reset_password_token VARCHAR(500),\n                reset_password_expires TIMESTAMPTZ,\n                email_verification_token VARCHAR(500),\n                email_verified BOOLEAN NOT NULL DEFAULT false,\n                organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,\n                settings JSONB NOT NULL DEFAULT '{}',\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                deleted_at TIMESTAMPTZ\n            );\n        "
              ),
            ];
          case 2:
            // Users table
            _a.sent();
            // Questionnaires table
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE TABLE questionnaires (\n                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n                title VARCHAR(255) NOT NULL,\n                description TEXT,\n                type VARCHAR(50) NOT NULL DEFAULT 'survey',\n                status VARCHAR(50) NOT NULL DEFAULT 'draft',\n                is_active BOOLEAN NOT NULL DEFAULT true,\n                questions JSONB NOT NULL,\n                time_limit INTEGER,\n                start_date DATE,\n                end_date DATE,\n                scoring JSONB,\n                response_count INTEGER NOT NULL DEFAULT 0,\n                average_score DECIMAL(5,2),\n                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,\n                created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n                settings JSONB NOT NULL DEFAULT '{}',\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                deleted_at TIMESTAMPTZ\n            );\n        "
              ),
            ];
          case 3:
            // Questionnaires table
            _a.sent();
            // Responses table
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE TABLE responses (\n                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n                questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,\n                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,\n                answers JSONB NOT NULL,\n                score DECIMAL(5,2),\n                max_score DECIMAL(5,2),\n                percentage DECIMAL(5,2),\n                status VARCHAR(50) NOT NULL DEFAULT 'in_progress',\n                submitted_at TIMESTAMPTZ,\n                reviewed_at TIMESTAMPTZ,\n                reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,\n                comments TEXT,\n                revision_history JSONB,\n                metadata JSONB,\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                deleted_at TIMESTAMPTZ\n            );\n        "
              ),
            ];
          case 4:
            // Responses table
            _a.sent();
            // Expenses table
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE TABLE expenses (\n                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n                name VARCHAR(255) NOT NULL,\n                description TEXT,\n                amount DECIMAL(15,2) NOT NULL,\n                category VARCHAR(50) NOT NULL,\n                status VARCHAR(50) NOT NULL DEFAULT 'pending',\n                expense_date DATE NOT NULL,\n                paid_date DATE,\n                recipient_name VARCHAR(255) NOT NULL,\n                recipient_account VARCHAR(100),\n                invoice_number VARCHAR(100),\n                attachments JSONB,\n                questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL,\n                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,\n                created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n                approved_by UUID REFERENCES users(id) ON DELETE SET NULL,\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                deleted_at TIMESTAMPTZ\n            );\n        "
              ),
            ];
          case 5:
            // Expenses table
            _a.sent();
            // Reports table
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE TABLE reports (\n                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n                type VARCHAR(50) NOT NULL,\n                title VARCHAR(255) NOT NULL,\n                description TEXT,\n                data JSONB NOT NULL,\n                status VARCHAR(50) NOT NULL DEFAULT 'pending',\n                export_path VARCHAR(500),\n                export_format VARCHAR(50),\n                exported_at TIMESTAMPTZ,\n                parameters JSONB,\n                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,\n                questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL,\n                generated_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n                error_message TEXT,\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n                deleted_at TIMESTAMPTZ\n            );\n        "
              ),
            ];
          case 6:
            // Reports table
            _a.sent();
            // Indexes
            return [
              4 /*yield*/,
              queryRunner.query(
                '\n            CREATE INDEX idx_users_email ON users(email);\n            CREATE INDEX idx_users_organization_role ON users(organization_id, role);\n            CREATE INDEX idx_users_status_last_login ON users(status, last_login_at);\n            \n            CREATE INDEX idx_organizations_email ON organizations(email);\n            CREATE INDEX idx_organizations_tax_number ON organizations(tax_number);\n            CREATE INDEX idx_organizations_status_created ON organizations(status, created_at);\n            \n            CREATE INDEX idx_questionnaires_org_status ON questionnaires(organization_id, status);\n            CREATE INDEX idx_questionnaires_created_by ON questionnaires(created_by, created_at);\n            CREATE INDEX idx_questionnaires_type_active ON questionnaires(type, is_active);\n            \n            CREATE INDEX idx_responses_questionnaire_user ON responses(questionnaire_id, user_id);\n            CREATE INDEX idx_responses_org_submitted ON responses(organization_id, submitted_at);\n            CREATE INDEX idx_responses_status_score ON responses(status, score);\n            \n            CREATE INDEX idx_expenses_org_date ON expenses(organization_id, expense_date);\n            CREATE INDEX idx_expenses_status_date ON expenses(status, expense_date);\n            CREATE INDEX idx_expenses_category_org ON expenses(category, organization_id);\n            \n            CREATE INDEX idx_reports_org_type ON reports(organization_id, type);\n            CREATE INDEX idx_reports_generated_by ON reports(generated_by_id, created_at);\n            CREATE INDEX idx_reports_status_exported ON reports(status, exported_at);\n        '
              ),
            ];
          case 7:
            // Indexes
            _a.sent();
            // Triggers for updated_at
            return [
              4 /*yield*/,
              queryRunner.query(
                "\n            CREATE OR REPLACE FUNCTION update_updated_at_column()\n            RETURNS TRIGGER AS $$\n            BEGIN\n                NEW.updated_at = NOW();\n                RETURN NEW;\n            END;\n            $$ language 'plpgsql';\n\n            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users\n                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n            \n            CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations\n                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n            \n            CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON questionnaires\n                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n            \n            CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses\n                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n            \n            CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses\n                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n            \n            CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports\n                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n        "
              ),
            ];
          case 8:
            // Triggers for updated_at
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  CreateInitialTables1700000000000.prototype.down = function (queryRunner) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // Drop triggers
            return [
              4 /*yield*/,
              queryRunner.query(
                '\n            DROP TRIGGER IF EXISTS update_users_updated_at ON users;\n            DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;\n            DROP TRIGGER IF EXISTS update_questionnaires_updated_at ON questionnaires;\n            DROP TRIGGER IF EXISTS update_responses_updated_at ON responses;\n            DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;\n            DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;\n            DROP FUNCTION IF EXISTS update_updated_at_column;\n        '
              ),
            ];
          case 1:
            // Drop triggers
            _a.sent();
            // Drop tables in reverse order
            return [4 /*yield*/, queryRunner.query('DROP TABLE IF EXISTS reports CASCADE')];
          case 2:
            // Drop tables in reverse order
            _a.sent();
            return [4 /*yield*/, queryRunner.query('DROP TABLE IF EXISTS expenses CASCADE')];
          case 3:
            _a.sent();
            return [4 /*yield*/, queryRunner.query('DROP TABLE IF EXISTS responses CASCADE')];
          case 4:
            _a.sent();
            return [4 /*yield*/, queryRunner.query('DROP TABLE IF EXISTS questionnaires CASCADE')];
          case 5:
            _a.sent();
            return [4 /*yield*/, queryRunner.query('DROP TABLE IF EXISTS users CASCADE')];
          case 6:
            _a.sent();
            return [4 /*yield*/, queryRunner.query('DROP TABLE IF EXISTS organizations CASCADE')];
          case 7:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  return CreateInitialTables1700000000000;
})();
exports.CreateInitialTables1700000000000 = CreateInitialTables1700000000000;
