// Test cookie functionality
import { setCookie, getCookie } from './cookies';

export function testCookieStorage() {
  const testData = {
    name: "Test User",
    email: "test@example.com",
    token: "test-token-123",
    role: "admin",
    isAdmin: true
  };

  console.log("=== COOKIE TEST ===");
  console.log("Setting test cookie...");
  
  // Set test cookie
  setCookie('test_user', JSON.stringify(testData), { 
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
    path: '/' 
  });
  
  console.log("Cookies after setting:", document.cookie);
  
  // Get test cookie
  const retrieved = getCookie('test_user');
  console.log("Retrieved cookie:", retrieved);
  
  if (retrieved) {
    try {
      const parsed = JSON.parse(retrieved);
      console.log("Parsed data:", parsed);
      return true;
    } catch (e) {
      console.error("Parse error:", e);
      return false;
    }
  }
  
  return false;
}
