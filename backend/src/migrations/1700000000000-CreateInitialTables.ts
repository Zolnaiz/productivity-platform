import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1700000000000 implements MigrationInterface {
    name = 'CreateInitialTables1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Organizations table
        await queryRunner.query(`
            CREATE TABLE organizations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address TEXT NOT NULL,
                description TEXT,
                tax_number VARCHAR(20) UNIQUE NOT NULL,
                logo VARCHAR(500),
                website VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                industry VARCHAR(100) NOT NULL,
                employee_count INTEGER NOT NULL,
                contact_person_name VARCHAR(255) NOT NULL,
                contact_person_position VARCHAR(100) NOT NULL,
                settings JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            );
        `);

        // Users table
        await queryRunner.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'user',
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                phone VARCHAR(20),
                profile_image VARCHAR(500),
                last_login_at TIMESTAMPTZ,
                reset_password_token VARCHAR(500),
                reset_password_expires TIMESTAMPTZ,
                email_verification_token VARCHAR(500),
                email_verified BOOLEAN NOT NULL DEFAULT false,
                organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
                settings JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            );
        `);

        // Questionnaires table
        await queryRunner.query(`
            CREATE TABLE questionnaires (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(50) NOT NULL DEFAULT 'survey',
                status VARCHAR(50) NOT NULL DEFAULT 'draft',
                is_active BOOLEAN NOT NULL DEFAULT true,
                questions JSONB NOT NULL,
                time_limit INTEGER,
                start_date DATE,
                end_date DATE,
                scoring JSONB,
                response_count INTEGER NOT NULL DEFAULT 0,
                average_score DECIMAL(5,2),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                settings JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            );
        `);

        // Responses table
        await queryRunner.query(`
            CREATE TABLE responses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                answers JSONB NOT NULL,
                score DECIMAL(5,2),
                max_score DECIMAL(5,2),
                percentage DECIMAL(5,2),
                status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
                submitted_at TIMESTAMPTZ,
                reviewed_at TIMESTAMPTZ,
                reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
                comments TEXT,
                revision_history JSONB,
                metadata JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            );
        `);

        // Expenses table
        await queryRunner.query(`
            CREATE TABLE expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                amount DECIMAL(15,2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                expense_date DATE NOT NULL,
                paid_date DATE,
                recipient_name VARCHAR(255) NOT NULL,
                recipient_account VARCHAR(100),
                invoice_number VARCHAR(100),
                attachments JSONB,
                questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL,
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            );
        `);

        // Reports table
        await queryRunner.query(`
            CREATE TABLE reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                data JSONB NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                export_path VARCHAR(500),
                export_format VARCHAR(50),
                exported_at TIMESTAMPTZ,
                parameters JSONB,
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL,
                generated_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                error_message TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMestAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            );
        `);

        // Indexes
        await queryRunner.query(`
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_users_organization_role ON users(organization_id, role);
            CREATE INDEX idx_users_status_last_login ON users(status, last_login_at);
            
            CREATE INDEX idx_organizations_email ON organizations(email);
            CREATE INDEX idx_organizations_tax_number ON organizations(tax_number);
            CREATE INDEX idx_organizations_status_created ON organizations(status, created_at);
            
            CREATE INDEX idx_questionnaires_org_status ON questionnaires(organization_id, status);
            CREATE INDEX idx_questionnaires_created_by ON questionnaires(created_by, created_at);
            CREATE INDEX idx_questionnaires_type_active ON questionnaires(type, is_active);
            
            CREATE INDEX idx_responses_questionnaire_user ON responses(questionnaire_id, user_id);
            CREATE INDEX idx_responses_org_submitted ON responses(organization_id, submitted_at);
            CREATE INDEX idx_responses_status_score ON responses(status, score);
            
            CREATE INDEX idx_expenses_org_date ON expenses(organization_id, expense_date);
            CREATE INDEX idx_expenses_status_date ON expenses(status, expense_date);
            CREATE INDEX idx_expenses_category_org ON expenses(category, organization_id);
            
            CREATE INDEX idx_reports_org_type ON reports(organization_id, type);
            CREATE INDEX idx_reports_generated_by ON reports(generated_by_id, created_at);
            CREATE INDEX idx_reports_status_exported ON reports(status, exported_at);
        `);

        // Triggers for updated_at
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON questionnaires
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
            DROP TRIGGER IF EXISTS update_questionnaires_updated_at ON questionnaires;
            DROP TRIGGER IF EXISTS update_responses_updated_at ON responses;
            DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
            DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
            DROP FUNCTION IF EXISTS update_updated_at_column;
        `);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS reports CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS expenses CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS responses CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS questionnaires CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS organizations CASCADE`);
    }
}