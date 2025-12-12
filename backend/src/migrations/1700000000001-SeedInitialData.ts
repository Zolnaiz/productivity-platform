import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class SeedInitialData1700000000001 implements MigrationInterface {
    name = 'SeedInitialData1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Hash password for all users
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        // Insert organizations
        await queryRunner.query(`
            INSERT INTO organizations (
                id, name, email, phone, address, description, tax_number, 
                industry, employee_count, contact_person_name, contact_person_position, status
            ) VALUES 
            (
                '11111111-1111-1111-1111-111111111111',
                'Технологийн Дээд Сургууль',
                'info@techuniversity.mn',
                '70101010',
                'Улаанбаатар хот, Сүхбаатар дүүрэг, Сөүлийн гудамж 9',
                'Монголын тэргүүлэх технологийн их сургууль',
                '1234567890',
                'Боловсрол',
                500,
                'Д. Ганбат',
                'Ректор',
                'active'
            ),
            (
                '22222222-2222-2222-2222-222222222222',
                'Их Дэлгүүр ХХК',
                'contact@ikhdelguur.mn',
                '70202020',
                'Улаанбаатар хот, Баянгол дүүрэг, Их Дэлгүүрийн гудамж 1',
                'Монголын хамгийн том жижиглэнгийн сүлжээ',
                '0987654321',
                'Худалдаа',
                2000,
                'Б. Энхбаяр',
                'Гүйцэтгэх захирал',
                'active'
            ),
            (
                '33333333-3333-3333-3333-333333333333',
                'Монгол Банк',
                'info@mongolbank.mn',
                '70303030',
                'Улаанбаатар хот, Чингэлтэй дүүрэг, Сүхбаатарын талбай 3',
                'Улсын төв банк',
                '1122334455',
                'Санхүү',
                800,
                'Ж. Батжаргал',
                'Төлөөлөгч',
                'active'
            );
        `);

        // Insert users
        await queryRunner.query(`
            INSERT INTO users (
                id, email, password, first_name, last_name, role, status, phone, 
                email_verified, organization_id, last_login_at
            ) VALUES 
            (
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                'superadmin@example.com',
                '${hashedPassword}',
                'Супер',
                'Админ',
                'super_admin',
                'active',
                '99119911',
                true,
                NULL,
                NOW()
            ),
            (
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                'admin1@example.com',
                '${hashedPassword}',
                'Бадрах',
                'Ганбат',
                'admin',
                'active',
                '99229922',
                true,
                '11111111-1111-1111-1111-111111111111',
                NOW()
            ),
            (
                'cccccccc-cccc-cccc-cccc-cccccccccccc',
                'manager1@example.com',
                '${hashedPassword}',
                'Болд',
                'Төмөр',
                'manager',
                'active',
                '99339933',
                true,
                '11111111-1111-1111-1111-111111111111',
                NOW()
            ),
            (
                'dddddddd-dddd-dddd-dddd-dddddddddddd',
                'user1@example.com',
                '${hashedPassword}',
                'Номин',
                'Эрдэнэ',
                'user',
                'active',
                '99449944',
                true,
                '11111111-1111-1111-1111-111111111111',
                NOW()
            ),
            (
                'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
                'user2@example.com',
                '${hashedPassword}',
                'Отгонбаяр',
                'Батбаяр',
                'user',
                'active',
                '99559955',
                true,
                '22222222-2222-2222-2222-222222222222',
                NOW()
            ),
            (
                'ffffffff-ffff-ffff-ffff-ffffffffffff',
                'user3@example.com',
                '${hashedPassword}',
                'Бат-Эрдэнэ',
                'Ганболд',
                'user',
                'active',
                '99669966',
                true,
                '33333333-3333-3333-3333-333333333333',
                NOW()
            );
        `);

        // Insert questionnaires
        await queryRunner.query(`
            INSERT INTO questionnaires (
                id, title, description, type, status, is_active, questions, 
                time_limit, start_date, end_date, scoring, response_count,
                average_score, organization_id, created_by
            ) VALUES 
            (
                'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
                'Ажилчдын сэтгэл ханамжийн судалгаа',
                'Ажилчдын ажлын орчин, удирдлагын талаарх сэтгэл ханамжийг судлах',
                'survey',
                'published',
                true,
                '[{"id": "q1", "text": "Таны ажлын орчин хэр сэтгэл ханамжтай вэ?", "type": "rating", "required": true, "minValue": 1, "maxValue": 5, "weight": 20}, {"id": "q2", "text": "Удирдлага нь таны санал бодлыг сонсдог уу?", "type": "single_choice", "required": true, "options": ["Тийм, үргэлж", "Ихэнхдээ", "Заримдаа", "Ховор", "Үгүй"], "weight": 25}, {"id": "q3", "text": "Ажлын ачаалал таны хувьд тохиромжтой юу?", "type": "single_choice", "required": true, "options": ["Хэт их", "Бага зэрэг их", "Тохиромжтой", "Бага зэрэг бага", "Хэт бага"], "weight": 20}, {"id": "q4", "text": "Ажлын цагийн уян хатан байдал хэр хангагддаг вэ?", "type": "rating", "required": true, "minValue": 1, "maxValue": 5, "weight": 15}, {"id": "q5", "text": "Хөгжлийн боломжууд байгаа эсэх?", "type": "single_choice", "required": true, "options": ["Олон боломжтой", "Хангалттай", "Хангалтгүй", "Байхгүй"], "weight": 20}]',
                30,
                '2024-01-01',
                '2024-12-31',
                '{"maxScore": 100, "passingScore": 70, "criteria": [{"questionId": "q1", "weight": 20}, {"questionId": "q2", "weight": 25}, {"questionId": "q3", "weight": 20}, {"questionId": "q4", "weight": 15}, {"questionId": "q5", "weight": 20}]}',
                15,
                78.5,
                '11111111-1111-1111-1111-111111111111',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            ),
            (
                'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
                'Бүтээгдэхүүний чанарын үнэлгээ',
                'Бүтээгдэхүүний чанар, үйлчилгээний талаарх үнэлгээ',
                'feedback',
                'published',
                true,
                '[{"id": "q1", "text": "Бүтээгдэхүүний чанар хэр сэтгэл ханамжтай вэ?", "type": "rating", "required": true, "minValue": 1, "maxValue": 10, "weight": 30}, {"id": "q2", "text": "Үйлчилгээний хурд", "type": "single_choice", "required": true, "options": ["Маш хурдан", "Хурдан", "Дунд зэрэг", "Удаан", "Маш удаан"], "weight": 25}, {"id": "q3", "text": "Үнийн чанар харьцаа", "type": "single_choice", "required": true, "options": ["Маш сайн", "Сайн", "Дунд зэрэг", "Муу", "Маш муу"], "weight": 25}, {"id": "q4", "text": "Дахин худалдан авалт хийх магадлал", "type": "rating", "required": true, "minValue": 1, "maxValue": 10, "weight": 20}]',
                NULL,
                '2024-03-01',
                '2024-12-31',
                '{"maxScore": 100, "passingScore": 60}',
                8,
                85.0,
                '22222222-2222-2222-2222-222222222222',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            );
        `);

        // Insert sample responses
        await queryRunner.query(`
            INSERT INTO responses (
                id, user_id, questionnaire_id, organization_id, answers, 
                score, max_score, percentage, status, submitted_at
            ) VALUES 
            (
                'aaaaaaaa-aaaa-1111-aaaa-aaaaaaaaaaaa',
                'dddddddd-dddd-dddd-dddd-dddddddddddd',
                'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
                '11111111-1111-1111-1111-111111111111',
                '[{"questionId": "q1", "answer": 4, "score": 16}, {"questionId": "q2", "answer": "Ихэнхдээ", "score": 20}, {"questionId": "q3", "answer": "Тохиромжтой", "score": 18}, {"questionId": "q4", "answer": 3, "score": 12}, {"questionId": "q5", "answer": "Хангалттай", "score": 16}]',
                82,
                100,
                82.0,
                'submitted',
                NOW() - INTERVAL '5 days'
            ),
            (
                'bbbbbbbb-bbbb-2222-bbbb-bbbbbbbbbbbb',
                'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
                'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
                '22222222-2222-2222-2222-222222222222',
                '[{"questionId": "q1", "answer": 8, "score": 24}, {"questionId": "q2", "answer": "Хурдан", "score": 20}, {"questionId": "q3", "answer": "Сайн", "score": 20}, {"questionId": "q4", "answer": 9, "score": 18}]',
                82,
                100,
                82.0,
                'submitted',
                NOW() - INTERVAL '3 days'
            );
        `);

        // Insert sample expenses
        await queryRunner.query(`
            INSERT INTO expenses (
                id, name, description, amount, category, status, expense_date, 
                paid_date, recipient_name, organization_id, created_by
            ) VALUES 
            (
                'aaaaaaaa-aaaa-aaaa-1111-aaaaaaaaaaaa',
                'Цахилгаан төлбөр',
                '2024 оны 1-р сарын цахилгаан төлбөр',
                150000.00,
                'utility',
                'paid',
                '2024-01-15',
                '2024-01-20',
                'Дархан цахилгаан түгээх',
                '11111111-1111-1111-1111-111111111111',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            ),
            (
                'bbbbbbbb-bbbb-bbbb-2222-bbbbbbbbbbbb',
                'Оффисын материал',
                'Бичиг хэрэг, хэвлэх материал',
                250000.00,
                'office_supplies',
                'approved',
                '2024-01-20',
                NULL,
                'Бичиг хэрэг ХХК',
                '22222222-2222-2222-2222-222222222222',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            ),
            (
                'cccccccc-cccc-cccc-3333-cccccccccccc',
                'Ажилчдын цалин',
                '2024 оны 1-р сарын цалин',
                3500000.00,
                'salary',
                'paid',
                '2024-01-25',
                '2024-01-28',
                'Цалингийн данс',
                '33333333-3333-3333-3333-333333333333',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            );
        `);

        // Insert sample reports
        await queryRunner.query(`
            INSERT INTO reports (
                id, type, title, description, data, status, 
                organization_id, generated_by_id, exported_at
            ) VALUES 
            (
                'aaaaaaaa-aaaa-bbbb-aaaa-aaaaaaaaaaaa',
                'questionnaire',
                'Ажилчдын сэтгэл ханамжийн судалгааны тайлан',
                '2024 оны 1-р улирлын тайлан',
                '{"statistics": {"totalResponses": 15, "averageScore": 78.5, "completionRate": 85.0}, "analysis": {"strengths": ["Өндөр оролцоо", "Сэтгэл ханамжтай хариултууд"], "weaknesses": ["Зарим асуултууд ойлгомжгүй"], "recommendations": ["Асуултуудыг хялбарчлах"]}}',
                'completed',
                '11111111-1111-1111-1111-111111111111',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                NOW()
            ),
            (
                'bbbbbbbb-bbbb-cccc-bbbb-bbbbbbbbbbbb',
                'expense',
                '2024 оны 1-р сарын зардлын тайлан',
                'Нийт зардлын тойм',
                '{"summary": {"totalAmount": 3900000.00, "averageExpense": 1300000.00, "expenseCount": 3}, "categoryBreakdown": {"utility": {"amount": 150000.00, "percentage": 3.85}, "office_supplies": {"amount": 250000.00, "percentage": 6.41}, "salary": {"amount": 3500000.00, "percentage": 89.74}}}',
                'exported',
                '33333333-3333-3333-3333-333333333333',
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                NOW()
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all data in reverse order
        await queryRunner.query(`DELETE FROM reports`);
        await queryRunner.query(`DELETE FROM expenses`);
        await queryRunner.query(`DELETE FROM responses`);
        await queryRunner.query(`DELETE FROM questionnaires`);
        await queryRunner.query(`DELETE FROM users`);
        await queryRunner.query(`DELETE FROM organizations`);
    }
}