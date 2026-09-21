import { Migration } from '@mikro-orm/migrations';

/** 태그: tag(이름 유니크)와 연결 테이블 ticket_tag(복합 PK, 티켓·태그 삭제 시 연결 삭제). docs/data_model.md. */
export class Migration20260921010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table "tag" (
        "id" bigserial primary key,
        "name" varchar(30) not null,
        constraint "tag_name_key" unique ("name")
      );
    `);
    this.addSql(`
      create table "ticket_tag" (
        "ticket_id" bigint not null references "ticket" ("id") on delete cascade,
        "tag_id" bigint not null references "tag" ("id") on delete cascade,
        primary key ("ticket_id", "tag_id")
      );
    `);
    this.addSql(
      'create index "ticket_tag_tag_id_idx" on "ticket_tag" ("tag_id");',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "ticket_tag";');
    this.addSql('drop table if exists "tag";');
  }
}
