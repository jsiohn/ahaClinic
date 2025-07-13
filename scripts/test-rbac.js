// Simple test script to verify RBAC functionality
const API_BASE = "http://localhost:5000/api";

async function testRBAC() {
  try {
    console.log("🧪 Testing RBAC Implementation...\n");

    // Test 1: Try to access protected endpoint without auth
    console.log("1. Testing unauthenticated access...");
    try {
      const response = await fetch(`${API_BASE}/users`);
      console.log(
        `   ❌ Should have failed but got status: ${response.status}`
      );
    } catch (error) {
      console.log("   ✅ Correctly blocked unauthenticated access");
    }

    // Test 2: Login with admin credentials (using existing testuser)
    console.log("\n2. Testing admin login...");
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser", password: "admin123" }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const adminToken = loginData.token;
      console.log("   ✅ Admin login successful");

      // Test 3: Admin can access user management
      console.log("\n3. Testing admin user management access...");
      const usersResponse = await fetch(`${API_BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (usersResponse.ok) {
        const users = await usersResponse.json();
        console.log(
          `   ✅ Admin can access users (found ${users.length} users)`
        );
      } else {
        console.log(
          `   ❌ Admin couldn't access users: ${usersResponse.status}`
        );
      }

      // Test 4: Admin can create new users
      console.log("\n4. Testing admin user creation...");
      const createUserResponse = await fetch(
        `${API_BASE}/auth/admin/create-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "teststaff",
            email: "teststaff@test.com",
            password: "temp123",
            role: "staff",
          }),
        }
      );

      if (createUserResponse.ok) {
        const newUser = await createUserResponse.json();
        console.log("   ✅ Admin can create new users");
        console.log(
          `   📝 Created user: ${newUser.user.username} (${newUser.user.role})`
        );
        console.log(
          `   🔒 Must change password: ${newUser.user.mustChangePassword}`
        );
      } else {
        const error = await createUserResponse.text();
        console.log(
          `   ❌ Admin couldn't create user: ${createUserResponse.status} - ${error}`
        );
      }
    } else {
      const errorData = await loginResponse.json();
      console.log(
        `   ❌ Admin login failed: ${loginResponse.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }

    console.log("\n🎉 RBAC tests completed!");
    console.log("\nNext steps:");
    console.log("1. Open http://localhost:3000 in your browser");
    console.log("2. Try logging in with different roles");
    console.log("3. Verify permission restrictions in the UI");
    console.log("4. Test the password change flow for new users");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testRBAC();
