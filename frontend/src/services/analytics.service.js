import api from './api';

class AnalyticsService {
  async getDashboardMetrics() {
    return api.get('/analytics');
  }

  async getAgentPerformance() {
    return api.get('/analytics/agents');
  }

  async getFunnelMetrics() {
    return api.get('/analytics/funnel');
  }

  async getContentPerformance() {
    return api.get('/analytics/content');
  }

  async getEngagementScores() {
    return api.get('/analytics/scores');
  }

  async getROIMetrics() {
    return api.get('/analytics/roi');
  }

  async getRealtimeStats() {
    return api.get('/analytics/realtime');
  }

  // Alias for Analytics page
  async getPerformanceMetrics() {
    return this.getDashboardMetrics();
  }
}

export default new AnalyticsService();
