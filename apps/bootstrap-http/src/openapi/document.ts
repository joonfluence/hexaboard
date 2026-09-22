import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import {
  CREATE_TICKET,
  DELETE_TICKET,
  GET_TICKET,
  LIST_TICKETS,
  MOVE_TICKET,
  SORT_COLUMN,
  UPDATE_TICKET,
} from '@todo/application';
import { configureApp } from '../app.factory';
import { TicketsController } from '../tickets/tickets.controller';

/** 문서 생성에는 컨트롤러의 메타데이터만 필요하다. DB 없이 뜨도록 유스케이스는 빈 대역으로 둔다. */
@Module({
  controllers: [TicketsController],
  providers: [
    CREATE_TICKET,
    DELETE_TICKET,
    GET_TICKET,
    LIST_TICKETS,
    MOVE_TICKET,
    SORT_COLUMN,
    UPDATE_TICKET,
  ].map((token) => ({ provide: token, useValue: {} })),
})
class OpenApiModule {}

/** 서버 DTO와 컨트롤러에서 OpenAPI 문서를 만든다(계약의 진실 원천은 서버). */
export async function buildOpenApiDocument(): Promise<OpenAPIObject> {
  const app = await NestFactory.create(OpenApiModule, { logger: false });
  configureApp(app);
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('To-do API')
      .setDescription('티켓 보드 API. 정본은 docs/api_spec.md.')
      .setVersion('1')
      .build(),
  );
  await app.close();
  return document;
}
