# Grafana Cloud 대시보드·알림

서버 관측성(D-104: OTLP 로그·트레이스·메트릭, D-105: 웹 소스맵)은 이미 Grafana Cloud로 데이터를 보내고 있다. 여기 있는 파일은 그 데이터를 "보는" 대시보드를 선언 파일로 관리하기 위한 것이다(TRD 07 "손으로 만든 인프라를 남기지 않는다" 원칙).

Grafana Cloud에는 이 저장소에서 대시보드/알림 규칙을 자동으로 밀어 넣는 CI가 없다(Phase 2 IaC 전까지는 수동 임포트). `todo-server-overview.json`이 정본이고, Grafana에서 바꾸면 이 파일도 같이 갱신한다.

## 대시보드 임포트

1. Grafana Cloud 포털 → **Dashboards** → **New** → **Import**
2. `todo-server-overview.json` 내용을 붙여넣거나 업로드
3. 데이터소스 선택 화면에서 `DS_PROMETHEUS`는 스택의 Prometheus/Mimir 데이터소스(보통 `grafanacloud-<스택>-prom`), `DS_LOKI`는 Loki 데이터소스(`grafanacloud-<스택>-logs`)를 고른다
4. 임포트 뒤 패널이 비어 있으면(라벨 이름이 안 맞을 수 있음) **Explore**에서 `http_server_request_duration_seconds_count`, `db_client_connection_count` 등을 직접 조회해 실제 라벨 이름을 확인하고 패널 쿼리를 맞춘다. OTel → Prometheus 이름 변환(점을 밑줄로, 단위 접미사 추가)은 Grafana Cloud 스택 설정에 따라 달라질 수 있다

## 지표 이름이 어디서 오는지

서버 자동 계측(`apps/bootstrap-http/src/instrumentation.ts`)이 표준 OTel 시맨틱 컨벤션 이름으로 메트릭을 만든다. Grafana Cloud가 OTLP 수집 시 이를 Prometheus 이름으로 바꾼다(점 → 밑줄, 초 단위는 `_seconds` 접미사):

| OTel 원래 이름 | Prometheus 이름(예상) | 종류 |
|---|---|---|
| `http.server.request.duration` | `http_server_request_duration_seconds_{bucket,sum,count}` | 히스토그램 |
| `db.client.operation.duration` | `db_client_operation_duration_seconds_{bucket,sum,count}` | 히스토그램 |
| `db.client.connection.count` | `db_client_connection_count` (라벨 `db_client_connection_state`=idle/used) | UpDownCounter |
| `db.client.connection.max` | `db_client_connection_max` | UpDownCounter |
| `db.client.connection.pending_requests` | `db_client_connection_pending_requests` | UpDownCounter |

로그는 `service_name="todo-server"` 라벨로 필터하고, 심각도는 접근 로그가 보내는 `severityText`(INFO/ERROR, [request-logging.ts](../../apps/bootstrap-http/src/common/request-logging.ts))를 Grafana Cloud가 `detected_level` 라벨로 자동 추출한다고 가정했다. 다르면 Explore에서 실제 라벨명을 확인한다.

## 알림 규칙 (수동 설정)

Grafana Cloud Alerting은 파일 프로비저닝에 Terraform 등 별도 도구가 필요해(Phase 2 범위) 지금은 아래 표를 보고 **Alerting → Alert rules**에서 손으로 만든다. 1인 운영이라 "과하지 않게"(TRD 07) 4개로 제한했다.

| 이름 | 조건(PromQL/LogQL) | for | 심각도 |
|---|---|---|---|
| 서버 오류율 높음 | `100 * sum(rate(http_server_request_duration_seconds_count{service_name="todo-server", http_response_status_code=~"5.."}[5m])) / sum(rate(http_server_request_duration_seconds_count{service_name="todo-server"}[5m])) > 10` | 5m | Warning |
| 지연시간 높음 (p95) | `histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket{service_name="todo-server"}[5m])) by (le)) > 2` | 10m | Warning |
| DB 커넥션 풀 고갈 징후 | `sum(db_client_connection_pending_requests{service_name="todo-server"}) > 0` | 5m | Warning |
| 서버 다운(헬스체크) | Grafana Cloud **Synthetic Monitoring**에서 `GET /health` HTTP 체크를 별도로 만든다(메트릭이 아니라 외부 체크라 이 대시보드로는 못 봄) | 5m 연속 실패 | Critical |

Contact point(알림 받을 곳)는 처음엔 이메일 하나로 시작한다(가입 이메일). Slack 등으로 늘리는 건 필요해지면 한다.

## 관련 문서

- [TRD 07. 인프라 로드맵과 관측성](../../docs/trd/07-infra-roadmap.md)
- [D-104, D-106](../../docs/decision_log.md) — 서버 OTLP 계측, 대시보드·알림 구성 방식
