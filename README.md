# Eventio

Event-driven ticket sales platform. TypeScript, RabbitMQ, MongoDB, Redis.

## Architecture

```
                        +-------------------+
                        |   Nginx Ingress   |
                        |   eventio.dev     |
                        +---+---+---+---+---+
                            |   |   |   |
           /api/users ------+   |   |   +------ /api/payments
           /api/tickets --------+   +---------- /api/orders
                            |           |
+-----------+  +-----------+ | +---------+-+ +-----------+
|   Auth    |  |  Tickets  | | |  Orders   | | Payments  |
+-----------+  +-----------+ | +-----------+ +-----------+
     |              |   |    |      |   |         |   |
 auth-mongo   tickets-mongo  |  orders-mongo  payment-mongo
                        |    |      |              |
                   +----+----+------+--------------+
                   |       RabbitMQ (fanout)        |
                   +-------------------------------+
                                |
                          +-----+-----+
                          |   Redis   |
                          +-----------+
```

Each service has its own MongoDB. Services communicate only through RabbitMQ events.

## Project Structure

```
auth/              Auth service (signup, signin, JWT sessions)
tickets/           Ticket CRUD, stock validation, Redis reservations
orders/            Order lifecycle, outbox-based event publishing
payments/          Payment processing with idempotency
shared/            @mkeventio/shared npm package (listeners, publishers, middlewares, errors)
infra/k8s/         Kubernetes manifests
k6-test/           Load tests
asyncapi.yaml      Event contract definitions
skaffold.yaml      Local dev orchestration
```

## Event Flow

```
Order Creation:
  Orders  --[OrderCreated]--> Tickets (validate stock, reserve in Redis with 15min TTL)
  Tickets --[OrderAccepted]--> Orders, Payments
  Tickets --[OrderRejected]--> Orders

Payment:
  Payments --[OrderCompleted]--> Orders, Tickets

Expiration (no payment within 15min):
  Redis TTL expires --> Tickets releases reservation
  Tickets --[OrderExpired]--> Orders
```

Orders service uses the **outbox pattern** -- events are stored in MongoDB first, then a worker publishes them to RabbitMQ every 2s. Failed messages go to dead-letter queues (`{exchange}.dlx`) after 3 retries.

API specs per service in `openapi.yaml`, event contracts in `asyncapi.yaml`.

## Local Development

Prerequisites: Docker Desktop with Kubernetes enabled, Skaffold, kubectl, ingress-nginx.

```bash
# ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/cloud/deploy.yaml

# /etc/hosts
127.0.0.1 eventio.dev

# secrets
kubectl create secret generic jwt-secret --from-literal=JWT_KEY=your-jwt-secret
kubectl create secret generic redis-secret --from-literal=REDIS_PASSWORD=your-redis-password

# run
skaffold dev
```

Skaffold builds images, deploys to k8s, and syncs `src/**/*.ts` changes into containers. API available at `https://eventio.dev`.

### Updating shared library

```bash
cd shared
npm run build && npm version patch && npm publish
```

Then bump the version in consuming services.

## Deploying to Kubernetes

```bash
# build & push images to your registry
docker build -t your-registry/eventio-auth ./auth
docker build -t your-registry/eventio-tickets ./tickets
docker build -t your-registry/eventio-orders ./orders
docker build -t your-registry/eventio-payments ./payments
docker push your-registry/eventio-{auth,tickets,orders,payments}

# update image refs in infra/k8s/*-depl.yaml

# create secrets
kubectl create secret generic jwt-secret --from-literal=JWT_KEY=<key>
kubectl create secret generic redis-secret --from-literal=REDIS_PASSWORD=<password>

# update host in infra/k8s/ingress-srv.yaml, point DNS to ingress LB

# deploy
kubectl apply -f infra/k8s/
```

## Load Testing

```bash
k6 run k6-test/test.js
```

4 VUs, 2 minutes, p95 < 30ms.
