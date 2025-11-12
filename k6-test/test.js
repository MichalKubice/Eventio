import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 4,
  duration: "2m",
  thresholds: {
    http_req_duration: ["p(95)<30"],
  },
  insecureSkipTLSVerify: true,
};

export default function () {
  const url = 'https://eventio.dev/api/orders';
  const payload = JSON.stringify({
    ticketId: "691250ce587ea89f8c6bdb15",
    quantity: 1,
  });

  const headers = {
    'Content-Type': 'application/json',
    'Cookie':
      'session=eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcFpDSTZJalk1TUdabE9XUmpOV1UwWmpJd056UmxZakl6Wm1VNVlpSXNJbVZ0WVdsc0lqb2lkR1Z6YzJWMGMwQm5iV0ZwYkM1amIyMGlMQ0pwWVhRaU9qRTNOakkyTlRBMU9EaDkuMktLVG52YVlsUEl5a29rNXNIMHkyenNJaGlKLW8ycm9BR3ROZk5OWW42QSJ9',
  };

  const res = http.post(url, payload, { headers });

  check(res, {
    'status is 200': (r) => r.status === 201,
  });

  if (res.status === 200 && res.body) {
    try {
      const json = res.json();
      check(json, {
        'communicationType is ASYNCHRONOUS': (j) =>
          j.communicationType === 'ASYNCHRONOUS',
      });
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  } else {
    console.error(`Unexpected status: ${res.status} – body: ${res.body}`);
  }

  sleep(0.1);
}
