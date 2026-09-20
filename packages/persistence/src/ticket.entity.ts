import { defineEntity, p } from '@mikro-orm/core';

/**
 * 영속성 엔티티. 도메인 모델과 별개이며 내부 PK(`id`)는 이 패키지 밖으로 나가지 않는다.
 * 스키마는 마이그레이션이 정본이고 이 정의는 조회·저장 매핑에만 쓴다.
 */
export const TicketSchema = defineEntity({
  name: 'Ticket',
  tableName: 'ticket',
  properties: {
    id: p.bigint('string').primary().autoincrement(),
    publicId: p.uuid().unique(),
    title: p.string().length(100),
    description: p.text().nullable(),
    status: p.text(),
    priority: p.smallint(),
    dueAt: p.datetime().nullable(),
    position: p.text(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

/** 인스턴스를 만들 수 있는 구체 클래스. */
export class TicketEntity extends TicketSchema.class {}
TicketSchema.setClass(TicketEntity);
