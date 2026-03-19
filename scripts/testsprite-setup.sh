#!/bin/bash
# TestSprite Account Setup Script
# Run this from the barpel-drop-ai root directory
# Usage: bash scripts/testsprite-setup.sh

set -e

# Configuration
BASE_URL="https://dropship.barpel.ai"
TEST_EMAIL="testsprite@barpel-test.com"
TEST_PASSWORD="TestSprite2026!"
BUSINESS_NAME="TestSprite Co"
COUNTRY="US"
CREDIT_BALANCE="3600"  # 1 hour in seconds

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 TestSprite Account Setup${NC}"
echo ""

# Step 1: Release BYOC from existing account
echo -e "${YELLOW}[1/4] Releasing BYOC from existing account...${NC}"
echo "You need to be logged in to the existing merchant account."
echo "Opening dashboard in browser. Please manually call:"
echo "  DELETE /api/merchant/ai-voice"
echo ""
echo "Or use curl (if you have session cookies):"
echo "  curl -X DELETE https://dropship.barpel.ai/api/merchant/ai-voice \\"
echo "    -H 'Cookie: <your-session-cookie>' \\"
echo "    -H 'Content-Type: application/json'"
echo ""
echo "⏳ Press Enter when you've released the BYOC..."
read -p ""

# Step 2: Create fresh test account
echo -e "${YELLOW}[2/4] Creating fresh test account...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Signup response: $SIGNUP_RESPONSE"

if echo "$SIGNUP_RESPONSE" | grep -q "error"; then
  echo -e "${RED}✗ Signup failed${NC}"
  echo "$SIGNUP_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Test account created: $TEST_EMAIL${NC}"
echo ""

# Step 3: Seed merchant row (requires manual Supabase admin access)
echo -e "${YELLOW}[3/4] Seeding merchant row...${NC}"
echo "You need to manually update the merchant row in Supabase:"
echo ""
echo "Run this SQL in Supabase SQL Editor:"
echo "  UPDATE merchants"
echo "  SET"
echo "    onboarded_at = NOW(),"
echo "    business_name = '$BUSINESS_NAME',"
echo "    country = '$COUNTRY',"
echo "    credit_balance = $CREDIT_BALANCE,"
echo "    provisioning_status = 'pending'"
echo "  WHERE user_id = (SELECT id FROM auth.users WHERE email = '$TEST_EMAIL')"
echo "  RETURNING *;"
echo ""
echo "⏳ Press Enter when done..."
read -p ""

echo -e "${GREEN}✓ Merchant row seeded${NC}"
echo ""

# Step 4: BYOC Provisioning (requires Twilio credentials)
echo -e "${YELLOW}[4/4] BYOC Provisioning${NC}"
echo "You need to provision the Twilio BYOC for the test account."
echo ""
echo "First, log in as: $TEST_EMAIL / $TEST_PASSWORD"
echo "Then call this endpoint with your Twilio credentials:"
echo ""
echo "  POST $BASE_URL/api/provisioning/byoc"
echo "  Body:"
echo "  {"
echo "    \"accountSid\": \"<your-twilio-account-sid>\","
echo "    \"authToken\": \"<your-twilio-auth-token>\","
echo "    \"phoneNumber\": \"<your-twilio-phone-number>\""
echo "  }"
echo ""
echo "You can make this call via curl:"
echo "  curl -X POST $BASE_URL/api/provisioning/byoc \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Cookie: <your-session-cookie>' \\"
echo "    -d '{"
echo "      \"accountSid\": \"<SID>\","
echo "      \"authToken\": \"<TOKEN>\","
echo "      \"phoneNumber\": \"<PHONE>\""
echo "    }'"
echo ""
echo "⏳ Press Enter when BYOC provisioning is complete..."
read -p ""

echo ""
echo -e "${GREEN}✅ TestSprite account setup complete!${NC}"
echo ""
echo "Test credentials:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo "Next: Run TestSprite via the MCP tools"
echo "  - testsprite_bootstrap_tests"
echo "  - testsprite_generate_code_summary"
echo "  - etc..."
