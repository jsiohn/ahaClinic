#!/bin/bash

# Quick production API test script
# This will help diagnose the invoice fetching issue in production

echo "🚀 Testing Production API - Invoice Debugging"
echo "============================================="

PROD_URL="https://ahaclinic-backend.onrender.com"

# Function to test endpoint with authentication
test_endpoint() {
    local endpoint=$1
    local description=$2
    local token=$3
    
    echo
    echo "📡 Testing: $description"
    echo "🔗 URL: $PROD_URL$endpoint"
    
    if [ -n "$token" ]; then
        echo "🔑 Using auth token"
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$PROD_URL$endpoint")
    else
        echo "🔑 No auth token"
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" \
            -H "Content-Type: application/json" \
            "$PROD_URL$endpoint")
    fi
    
    # Extract status and time
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    time_total=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/,$d')
    
    echo "📊 Status: $http_status"
    echo "⏱️  Time: ${time_total}s"
    echo "📄 Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    echo "----------------------------------------"
}

# Test basic connectivity
echo "1. Basic Health Check"
test_endpoint "/health" "Health Check"

# Test auth endpoint
echo
echo "2. Auth Test (should fail without credentials)"
test_endpoint "/api/auth/profile" "Auth Profile"

# Prompt for token if you have one
echo
echo "🔐 Do you have an auth token to test protected endpoints? (y/n)"
read -r has_token

if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
    echo "📝 Enter your auth token:"
    read -r auth_token
    
    echo
    echo "3. Testing Protected Endpoints"
    test_endpoint "/api/invoices/debug" "Invoice Debug Info" "$auth_token"
    test_endpoint "/api/invoices" "Invoice List" "$auth_token"
else
    echo "⚠️  Skipping protected endpoint tests (no auth token provided)"
fi

echo
echo "✅ API Testing Complete!"
echo
echo "📋 Quick Diagnosis Steps:"
echo "1. Check if the backend is responding (health check)"
echo "2. Verify authentication is working"
echo "3. Test the debug endpoint to see database status"
echo "4. Check the actual invoices endpoint"
echo
echo "💡 If you see 401 errors, you need to login first:"
echo "   - Go to your frontend app"
echo "   - Open browser dev tools"
echo "   - Check localStorage for 'token'"
echo "   - Use that token in this script"