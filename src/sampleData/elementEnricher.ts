import { ArchitectureProject } from '../types/c4';

/**
 * Enriches the parsed sample project elements with detailed documentation,
 * API contracts, interfaces, and architecture links.
 */
export function enrichProjectDetails(project: ArchitectureProject): ArchitectureProject {
  const elements = { ...project.elements };

  // Enrich Order Service
  const orderServiceKey = Object.keys(elements).find(
    (k) => k.includes('orderservice') || elements[k].name === 'Order Service'
  );

  if (orderServiceKey) {
    const el = elements[orderServiceKey];
    el.documentation = `## Order Service Architecture

The **Order Service** is the central transactional component in the Digital Commerce Platform. It orchestrates the lifecycle of customer orders from initial placement through credit card settlement, stock reservation, and dispatch initiation.

### Core Architecture Highlights
- **Architecture Pattern**: Domain-Driven Design (DDD) with Hexagonal (Ports & Adapters) architecture.
- **Concurrency Control**: Optimistic locking via JPA \`@Version\` attribute to prevent race conditions during checkout.
- **Saga Pattern**: Orchestrated distributed transaction with compensating transactions if payment or inventory reservation fails.
- **Failure Recovery**: Dead Letter Queues (DLQ) in Apache Kafka for unrecoverable messaging failures.

### Non-Functional Targets
- **Throughput**: 15,000 orders/minute peak capacity.
- **Latency**: P99 response time $< 120\\text{ms}$ on \`POST /api/v1/orders\`.
- **Availability**: 99.99% uptime target with multi-AZ failover.
`;
    el.interfaces = [
      {
        name: 'Create Order Endpoint',
        type: 'REST',
        pathOrTopic: 'POST /api/v1/orders',
        description: 'Receives signed customer cart payload and generates pending order',
      },
      {
        name: 'Get Order Status',
        type: 'REST',
        pathOrTopic: 'GET /api/v1/orders/{orderId}',
        description: 'Fetches real-time status and fulfillment tracking history',
      },
      {
        name: 'Order Events Stream',
        type: 'Event',
        pathOrTopic: 'ecommerce.orders.v1',
        description: 'Publishes immutable order.created, order.paid, order.shipped events',
      },
      {
        name: 'PostgreSQL Order Storage',
        type: 'SQL',
        pathOrTopic: 'orders_db_primary:5432',
        description: 'Connection pool with maximum 50 concurrent active connections',
      },
    ];
    el.links = [
      {
        title: 'OpenAPI 3.1 Specification',
        url: 'https://github.com/example/ecommerce-order-service/blob/main/docs/api.yaml',
        type: 'api',
      },
      {
        title: 'GitHub Repository',
        url: 'https://github.com/example/ecommerce-order-service',
        type: 'github',
      },
      {
        title: 'Saga Orchestration Runbook',
        url: 'https://docs.example.internal/runbooks/orders-saga-troubleshooting',
        type: 'runbook',
      },
    ];
  }

  // Enrich Order Controller
  const orderControllerKey = Object.keys(elements).find(
    (k) => k.includes('ordercontroller') || elements[k].name === 'Order Controller'
  );
  if (orderControllerKey) {
    const el = elements[orderControllerKey];
    el.documentation = `### Order Controller Implementation

\`\`\`java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderValidator orderValidator;
    private final OrderProcessor orderProcessor;

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request,
                                     @AuthenticationPrincipal UserPrincipal user) {
        orderValidator.validateOrder(request, user);
        OrderResult result = orderProcessor.processOrder(request.toCommand(user.getId()));
        return OrderResponse.from(result);
    }
}
\`\`\`

#### Security & Auth
- Validates Authorization Bearer JWT.
- Enforces HMAC idempotency keys (\`Idempotency-Key\` header) to prevent double charge on connection dropouts.
`;
    el.interfaces = [
      {
        name: 'REST API Ingress',
        type: 'REST',
        pathOrTopic: 'POST /api/v1/orders',
        description: 'Standard JSON payload adhering to OrderCreateContract v1',
      },
    ];
  }

  // Enrich Order Processor
  const orderProcessorKey = Object.keys(elements).find(
    (k) => k.includes('orderprocessor') || elements[k].name === 'Order Processor'
  );
  if (orderProcessorKey) {
    const el = elements[orderProcessorKey];
    el.documentation = `### Order Processor Workflow

1. Receives validated command.
2. Allocates unique Snowflake identifier (\`OrderId\`).
3. Persists order in status \`PENDING_PAYMENT\` within a database transaction.
4. Emits \`OrderCreated\` event via Apache Kafka.
5. Listens to \`PaymentCaptured\` event from Payment Service.
6. Upon payment confirmation, updates status to \`CONFIRMED\` and triggers warehouse dispatch saga.
`;
  }

  // Enrich Web Application
  const webAppKey = Object.keys(elements).find(
    (k) => k.includes('webapp') || elements[k].name === 'Web Application'
  );
  if (webAppKey) {
    const el = elements[webAppKey];
    el.documentation = `### Web Application Architecture

Modern single-page storefront built on React 19 and Tailwind CSS.
- **SSR & Streaming**: Server-side rendered edge routes for SEO product catalog indexing.
- **State Management**: Distributed client cache for basket persistence across browser tabs.
- **Performance**: Zero-layout-shift design, image optimization CDN, and web vitals tracking.
`;
  }

  // Enrich Order Database
  const orderDbKey = Object.keys(elements).find(
    (k) => k.includes('orderdb') || elements[k].name === 'Order Database'
  );
  if (orderDbKey) {
    const el = elements[orderDbKey];
    el.documentation = `### Database Schema & Performance Tuning

- **Engine**: PostgreSQL 16 on Managed Cloud Instance.
- **Partitioning Strategy**: Partitioned by date (\`RANGE (created_at)\`) monthly partitions.
- **Replication**: 1 Primary writer node + 2 Read Replicas across distinct availability zones.
- **Backup**: Continuous WAL archiving + daily automated snapshots.
`;
  }

  return {
    ...project,
    elements,
  };
}
