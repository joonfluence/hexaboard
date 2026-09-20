import { Migration } from '@mikro-orm/migrations';

/** 첫 마이그레이션: ticket 테이블. 컬럼과 제약은 docs/data_model.md를 따른다. */
export class Migration20260921000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table "ticket" (
        "id" bigserial primary key,
        "public_id" uuid not null,
        "title" varchar(100) not null,
        "description" text null,
        "status" text not null,
        "priority" smallint not null,
        "due_at" timestamptz null,
        "position" text collate "C" not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "ticket_public_id_key" unique ("public_id"),
        constraint "ticket_status_check" check ("status" in ('TODO', 'IN_PROGRESS', 'DONE')),
        constraint "ticket_status_position_key" unique ("status", "position")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "ticket";');
  }
}
