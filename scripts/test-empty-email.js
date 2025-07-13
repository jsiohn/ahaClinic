// Test script to verify empty email handling
console.log("Testing empty email conversion...");

const testClientData = {
  firstName: "Test",
  lastName: "Client",
  email: "",
  phone: "123-456-7890",
};

console.log("Original data:", testClientData);

// Simulate the frontend processing
const processedData = {
  ...testClientData,
  email:
    testClientData.email && testClientData.email.trim()
      ? testClientData.email
      : null,
};

console.log("Processed data (frontend):", processedData);

// Simulate the backend processing
const backendData = { ...processedData };
if (backendData.email === "") {
  backendData.email = null;
}

console.log("Final data (backend):", backendData);
console.log("Email is null:", backendData.email === null);
