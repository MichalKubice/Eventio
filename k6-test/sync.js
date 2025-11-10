import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // počet virtuálních uživatelů
  iterations: 1000, // počet requestů celkem
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95 % odpovědí do 250 ms
  },
  insecureSkipTLSVerify: true, // 🔒 ignoruj neplatný certifikát (jen pro test)
};

export default function () {
  const url = 'https://eventio.dev/api/orders/sync';
  const payload = JSON.stringify({
    ticketId: "691219a3b0ff96db93637e86",
    quantity: 2,
  });

  const headers = {
    'Content-Type': 'application/json',
    'Cookie':
      'session=eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcFpDSTZJalk1TUdabE9XUmpOV1UwWmpJd056UmxZakl6Wm1VNVlpSXNJbVZ0WVdsc0lqb2lkR1Z6YzJWMGMwQm5iV0ZwYkM1amIyMGlMQ0pwWVhRaU9qRTNOakkyTlRBMU9EaDkuMktLVG52YVlsUEl5a29rNXNIMHkyenNJaGlKLW8ycm9BR3ROZk5OWW42QSJ9',
  };

  const res = http.post(url, payload, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  if (res.status === 200 && res.body) {
    try {
      const json = res.json();
      check(json, {
        'communicationType is SYNCHRONOUS': (j) =>
          j.communicationType === 'SYNCHRONOUS',
        'status is awaiting:payment': (j) => j.status === 'awaiting:payment',
      });
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  } else {
    console.error(`Unexpected status: ${res.status} – body: ${res.body}`);
  }

  sleep(0.1);
}
