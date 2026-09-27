import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Which part of its record a file shows.
 *
 * A photograph belonged to a whole audit run, so a checklist of twelve
 * questions with one failing item could not say which one the picture was of.
 * For a run the part is the question's id; empty means the record as a whole,
 * which is every file uploaded before this.
 */
export class AddOperationsAttachmentPart1781264400000 implements MigrationInterface {
  name = 'AddOperationsAttachmentPart1781264400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS part varchar(100)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE attachments DROP COLUMN IF EXISTS part`);
  }
}
