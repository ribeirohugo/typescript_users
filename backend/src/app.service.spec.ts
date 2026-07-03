import { AppService } from './app.service';

describe('AppService', () => {
  it('returns an ok status with an ISO timestamp', () => {
    const service = new AppService();

    const health = service.getHealth();

    expect(health.status).toBe('ok');
    expect(new Date(health.timestamp).toISOString()).toBe(health.timestamp);
  });
});
