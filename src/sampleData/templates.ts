export interface ArchitectureTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  markup: string;
}

export const COMMERCE_PLATFORM_MARKUP = `# Digital Commerce Platform
# High-performance distributed e-commerce architecture supporting global order workflows.

// People
person Customer "Customer" {
  description "Shoppers browsing catalog, placing orders, and tracking status"
  responsibility "Browses products, manages cart, and completes checkout"
  responsibility "Tracks shipment notifications and views order history"
}

person StoreManager "Store Manager" {
  description "Operations staff overseeing catalog inventory and fulfilment"
  responsibility "Manages warehouse dispatch and updates stock thresholds"
}

// Systems
system CommercePlatform "Digital Commerce Platform" {
  description "Core enterprise platform orchestrating customer orders, payments, and inventory"
  technology "Cloud Native Microservices"

  // Containers
  container WebApp "Web Application" {
    technology "React 19, TypeScript, Tailwind CSS"
    description "Delivers customer shopping interface, product search, and responsive checkout"
    responsibility "Single-page responsive storefront with SSR hydration"
    responsibility "Client-side state caching and basket sync"
  }

  container ApiGateway "API Gateway" {
    technology "Node.js, Express, Envoy"
    description "Central reverse proxy handling authentication, rate limiting, and request routing"
    responsibility "Validates JWT bearer tokens"
    responsibility "Enforces per-client rate limits and circuit breaking"
  }

  container IdentityService "Identity Service" {
    technology "Go, OAuth2 / OIDC"
    description "Handles customer accounts, federated SSO, and permission scopes"
    responsibility "Generates and signs cryptographic user access tokens"
    responsibility "Multi-factor authentication (MFA) validation"
  }

  container OrderService "Order Service" {
    technology "Java 21, Spring Boot 3"
    description "Manages order placement, state transitions, and asynchronous fulfillment pipeline"
    responsibility "Executes order validation and fraud checks"
    responsibility "Orchestrates order saga with payment and warehouse services"
    responsibility "Publishes domain events for downstream notifications"

    // Components inside Order Service
    component OrderController "Order Controller" {
      technology "Spring REST Controller"
      description "Provides secure REST endpoints for order creation, cancellation, and retrieval"
      responsibility "Exposes /api/v1/orders endpoints"
      responsibility "Validates incoming HTTP payload headers and format"
    }

    component OrderValidator "Order Validator" {
      technology "Jakarta Bean Validation & Custom Rules"
      description "Enforces business constraints, stock availability, and price validity"
      responsibility "Verifies minimum checkout value and line item quantities"
      responsibility "Checks geographical shipping eligibility"
    }

    component OrderProcessor "Order Processor" {
      technology "Spring Service Core Engine"
      description "Coordinates the transactional order lifecycle, transitions, and saga choreography"
      responsibility "Executes order state transitions: PENDING -> CONFIRMED -> PROCESSING"
      responsibility "Triggers synchronous reservation calls"
    }

    component OrderRepository "Order Repository" {
      technology "Spring Data JPA, Hibernate"
      description "Handles relational mapping and ACID transactional queries against PostgreSQL"
      responsibility "Manages entity lifecycle for Order and OrderItem records"
      responsibility "Maintains optimistic locking for concurrent modifications"
    }

    component EventPublisher "Event Publisher" {
      technology "Apache Kafka Producer"
      description "Dispatches immutable domain events to Kafka topics for asynchronous processing"
      responsibility "Publishes order.created, order.paid, and order.cancelled events"
      responsibility "Guarantees at-least-once delivery with idempotency keys"
    }

    // Component-level relationships
    OrderController -> OrderValidator: "Delegates payload [Java Method]"
    OrderValidator -> OrderProcessor: "Supplies validated order [Java Method]"
    OrderProcessor -> OrderRepository: "Saves order state [JPA/SQL]"
    OrderProcessor -> EventPublisher: "Dispatches domain event [Event]"
  }

  container PaymentService "Payment Service" {
    technology "Go 1.22, gRPC"
    description "Tokenizes credit cards and securely invokes external financial gateways"
    responsibility "PCI-DSS compliant token storage"
    responsibility "Idempotent payment capture and refund processing"
  }

  database OrderDb "Order Database" {
    technology "PostgreSQL 16, pgBouncer"
    description "Stores orders, line items, transaction logs, and customer order history"
    responsibility "ACID transaction storage with partitioned history tables"
    responsibility "Automated point-in-time recovery and read replicas"
  }

  container EventBroker "Event Broker" {
    technology "Apache Kafka 3.6, Schema Registry"
    description "High-throughput distributed event streaming platform for decoupled domain events"
    responsibility "Persistent partitioned event streaming logs"
    responsibility "Replays historical order events for reporting"
  }

  // Container-level relationships
  WebApp -> ApiGateway: "API requests [HTTPS/JSON]"
  ApiGateway -> IdentityService: "Validates auth [HTTPS]"
  ApiGateway -> OrderService: "Routes order requests [gRPC/REST]"
  ApiGateway -> PaymentService: "Routes payment intents [gRPC]"
  OrderService -> OrderDb: "Reads and writes orders [PostgreSQL Wire/TLS]"
  OrderService -> EventBroker: "Publishes domain events [Kafka Protocol]"
  PaymentService -> EventBroker: "Publishes payment captured events [Kafka Protocol]"
}

// External Systems
system PaymentGateway "Payment Gateway" external {
  description "Third-party merchant acquiring provider (Stripe / Adyen)"
  technology "External PCI Gateway"
}

system EmailProvider "Email Provider" external {
  description "Cloud transactional email and SMS notification delivery platform (SendGrid)"
  technology "External Cloud API"
}

system CrmSystem "External CRM" external {
  description "Enterprise customer relationship platform and support suite (Salesforce)"
  technology "Cloud SaaS REST API"
}

// High-level System Relationships
Customer -> WebApp: "Browses catalog and checks out [HTTPS]"
Customer -> EmailProvider: "Receives receipt and dispatch emails"
StoreManager -> WebApp: "Reviews order fulfillment queues [HTTPS]"
PaymentService -> PaymentGateway: "Authorizes card charges [REST / TLS 1.3]"
EventBroker -> EmailProvider: "Dispatches email triggers [Webhook / HTTPS]"
CommercePlatform -> CrmSystem: "Synchronizes customer purchase data [REST API]"
`;

export const FINTECH_BANKING_MARKUP = `# Modern Digital Core Banking
# Real-time ledger, instant payment rails, and biometric authentication architecture.

person BankingCustomer "Retail Banking Customer" {
  description "Mobile banking customer initiating transfers and checking balances"
}

person ComplianceOfficer "AML & Compliance Officer" {
  description "Monitors suspicious activities and audits high-value transfers"
}

system BankingCore "Digital Banking Core" {
  description "Cloud-native real-time double-entry ledger and accounts system"
  technology "Microservices, Distributed Ledger"

  container MobileApp "Mobile Banking App" {
    technology "Swift / Kotlin, Secure Enclave"
    description "Customer native mobile experience with biometric authentication"
  }

  container EdgeGateway "Edge API Gateway" {
    technology "Kong, mTLS"
    description "Enforces Zero Trust ingress, device attestation, and token inspection"
  }

  container LedgerService "Ledger Engine" {
    technology "Rust, Actix"
    description "High-frequency immutable double-entry financial transaction engine"

    component TransactionController "Transaction Ingress" {
      technology "gRPC Handler"
      description "Validates incoming transaction envelopes and idempotency headers"
    }

    component RuleEngine "Balance & Credit Evaluator" {
      technology "Rust Rules Engine"
      description "Calculates real-time available funds and holds"
    }

    component JournalWriter "Journal Writer" {
      technology "Append-only Log Engine"
      description "Writes balanced debit and credit entries to immutable ledger partitions"
    }

    TransactionController -> RuleEngine: "Evaluates liquidity"
    RuleEngine -> JournalWriter: "Appends double-entry journal"
  }

  database LedgerDb "Ledger Storage" {
    technology "CockroachDB, Raft Distributed Consensus"
    description "Globally distributed multi-master SQL ledger database"
  }

  MobileApp -> EdgeGateway: "Transfers & balance queries [mTLS]"
  EdgeGateway -> LedgerService: "Dispatches transaction [gRPC]"
  LedgerService -> LedgerDb: "Commits journal entries [Distributed SQL]"
}

system PaymentRails "National Instant Rails" external {
  description "Federal clearing house and instant real-time settlement rails (FedNow / SEPA)"
}

system CreditBureau "Credit Scoring Bureau" external {
  description "Real-time credit score and fraud detection intelligence provider"
}

BankingCustomer -> MobileApp: "Authenticates via biometrics & initiates transfer"
LedgerService -> PaymentRails: "Submits interbank clearing message [ISO 20022]"
BankingCore -> CreditBureau: "Performs fraud risk scoring [REST API]"
`;

export const AI_AGENT_CLOUD_MARKUP = `# Autonomous AI Platform
# Multi-agent workflow orchestrator, vector memory, and model gateway.

person Developer "AI Platform Engineer" {
  description "Deploys multi-agent workflows, evaluates benchmarks, and manages API keys"
}

system AgentPlatform "Agentic Intelligence Platform" {
  description "Enterprise engine executing recursive reasoning chains and tool grounding"
  technology "Python, TypeScript, Vector DB"

  container WebStudio "Agent Studio UI" {
    technology "React, Canvas Graph"
    description "Visual workflow designer and trace inspector"
  }

  container OrchestratorService "Orchestrator Service" {
    technology "FastAPI, AsyncIO"
    description "Manages agent turn loops, tool invocation, and state machines"

    component LoopController "Turn Loop Controller" {
      technology "Async Event Loop"
      description "Maintains execution turn state, budget tokens, and stopping criteria"
    }

    component ToolExecutor "Tool Execution Sandbox" {
      technology "Docker / gVisor"
      description "Runs isolated code, web searches, and database queries"
    }

    component MemoryRetriever "Memory Retriever" {
      technology "RAG Pipeline"
      description "Queries semantic similarity against conversation memory vectors"
    }

    LoopController -> MemoryRetriever: "Fetches context"
    LoopController -> ToolExecutor: "Invokes tool sandbox"
  }

  database VectorMemory "Vector & Embeddings Store" {
    technology "Qdrant / pgvector"
    description "Stores conversational episodic memory and document embeddings"
  }

  WebStudio -> OrchestratorService: "Dispatches workflow execution [WebSocket]"
  OrchestratorService -> VectorMemory: "Vector similarity search [HNSW Index]"
}

system ModelGateway "Foundation Model Provider" external {
  description "Gemini 2.5 / Claude 3.7 LLM inference cluster"
}

Developer -> WebStudio: "Builds and tests autonomous workflows"
OrchestratorService -> ModelGateway: "Streams prompt completions [Server-Sent Events]"
`;

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'ecommerce',
    name: 'Digital Commerce Platform',
    badge: 'Standard C4 3-Level Spec',
    description: 'Complete e-commerce platform with Systems, Containers, and Component details for Order Service.',
    markup: COMMERCE_PLATFORM_MARKUP,
  },
  {
    id: 'fintech',
    name: 'Digital Banking Core',
    badge: 'Fintech & Ledger',
    description: 'High-resilience banking core with double-entry ledger, instant rails, and biometric security.',
    markup: FINTECH_BANKING_MARKUP,
  },
  {
    id: 'ai-agents',
    name: 'Agentic AI Platform',
    badge: 'Cloud & Vector RAG',
    description: 'Multi-agent reasoning loops, tool sandboxes, and vector memory retrieval pipelines.',
    markup: AI_AGENT_CLOUD_MARKUP,
  },
];
