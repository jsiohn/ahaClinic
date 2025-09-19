import fetch from "node-fetch";

const PROD_URL = "https://ahaclinic-backend.onrender.com";

async function testAPI() {
  console.log("🚀 Testing Production API - Invoice Debugging");
  console.log("==============================================");

  try {
    // Test 1: Basic health check
    console.log("\n1. Health Check");
    try {
      const healthResponse = await fetch(`${PROD_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log(`📊 Status: ${healthResponse.status}`);
      const healthData = await healthResponse.text();
      console.log(`📄 Response: ${healthData}`);
    } catch (error) {
      console.log(`❌ Health check failed: ${error.message}`);
    }

    // Test 2: Try invoices endpoint without auth (should get 401)
    console.log("\n2. Invoices Endpoint (no auth)");
    try {
      const invoicesResponse = await fetch(`${PROD_URL}/api/invoices`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log(`📊 Status: ${invoicesResponse.status}`);
      const invoicesData = await invoicesResponse.json();
      console.log(`📄 Response:`, JSON.stringify(invoicesData, null, 2));
    } catch (error) {
      console.log(`❌ Invoices test failed: ${error.message}`);
    }

    // Test 3: Try debug endpoint without auth
    console.log("\n3. Debug Endpoint (no auth)");
    try {
      const debugResponse = await fetch(`${PROD_URL}/api/invoices/debug`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log(`📊 Status: ${debugResponse.status}`);
      const debugData = await debugResponse.json();
      console.log(`📄 Response:`, JSON.stringify(debugData, null, 2));
    } catch (error) {
      console.log(`❌ Debug test failed: ${error.message}`);
    }

    // Test 4: Database connectivity check via any public endpoint
    console.log("\n4. Server Response Time Test");
    const start = Date.now();
    try {
      const response = await fetch(`${PROD_URL}/api/auth/check`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const responseTime = Date.now() - start;
      console.log(`📊 Status: ${response.status}`);
      console.log(`⏱️  Response Time: ${responseTime}ms`);
    } catch (error) {
      console.log(`❌ Response time test failed: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Overall test failed:", error);
  }

  console.log("\n✅ API Testing Complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. If you see 401 errors, that's expected (auth required)");
  console.log("2. If you see 500 errors, there's a server issue");
  console.log("3. If you see timeouts, the server might be down");
  console.log("4. Use browser dev tools to get an auth token for full testing");
}

testAPI();
