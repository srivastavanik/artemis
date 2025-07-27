import llamaIndexService from '../services/llamaindex.service.js';
import { logger } from '../utils/logger.js';

async function initializeServices() {
  try {
    console.log('🚀 Initializing services...');
    
    // Initialize Pinecone index
    console.log('📊 Initializing Pinecone index...');
    await llamaIndexService.initializeIndex();
    console.log('✅ Pinecone index initialized successfully');
    
    // You can add other one-time setup tasks here
    
    console.log('✅ All services initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    logger.error('Service initialization failed', { error: error.message });
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeServices();
}

export default initializeServices;
