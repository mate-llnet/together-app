#!/usr/bin/env node
// Simple HTTP test for couple insights API endpoints
console.log('🧪 Testing Couple Insights Endpoints');
console.log('=====================================');

async function testCoupleInsightsEndpoints() {
  try {
    // Test Case 1: /api/couple/insights without user (should fail)
    console.log('\n🔍 Test Case 1: /api/couple/insights - No User ID');
    const noUserInsights = await testEndpoint('/api/couple/insights', null, 401);
    console.log(`✅ No user ID: Correctly returned 401 status`);
    
    // Test Case 2: /api/couple/ai-analysis without user (should fail)
    console.log('\n🔍 Test Case 2: /api/couple/ai-analysis - No User ID');
    const noUserAnalysis = await testEndpoint('/api/couple/ai-analysis', null, 401);
    console.log(`✅ No user ID: Correctly returned 401 status`);
    
    // Test Case 3: Test with dummy user ID (no couple)
    console.log('\n🔍 Test Case 3: Testing No-Couple State');
    const dummyUserId = 'test-user-no-couple-' + Date.now();
    
    const noPartnerInsights = await testEndpoint('/api/couple/insights', dummyUserId, 404);
    console.log(`✅ No-couple insights: Correctly returned 404 status`);
    
    const noPartnerAnalysis = await testEndpoint('/api/couple/ai-analysis', dummyUserId, 404);
    console.log(`✅ No-couple analysis: Correctly returned 404 status`);
    
    // Test Case 4: Test response structure validation (if we have actual test users)
    console.log('\n🔍 Test Case 4: Response Structure Validation');
    console.log('Note: Skipping detailed structure tests without actual test data setup');
    console.log('This would require complex database setup, which is better handled by the existing application');
    
    console.log('\n🎉 Basic endpoint tests completed successfully!');
    console.log('The endpoints correctly handle authentication and no-couple scenarios.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function testEndpoint(path, userId, expectedStatus = 200) {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${path}`;
  
  const headers = {};
  if (userId) {
    headers['x-user-id'] = userId;
  }
  
  try {
    const response = await fetch(url, { headers });
    
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus} but got ${response.status} for ${path}`);
    }
    
    if (expectedStatus === 200) {
      const data = await response.json();
      return data;
    }
    
    return null;
  } catch (fetchError) {
    if (fetchError.code === 'ECONNREFUSED') {
      throw new Error('Server is not running on localhost:5000. Please start the server first.');
    }
    throw fetchError;
  }
}

// Run tests
testCoupleInsightsEndpoints();