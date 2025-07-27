
import { MockUser } from "@/types";

const MOCK_USER_EMAIL = "user@test.com";
const MOCK_USER_PASS = "password123";

export function mockLogin(email: string, password_provided: string): MockUser | null {
  if (email === MOCK_USER_EMAIL && password_provided === MOCK_USER_PASS) {
    return {
      uid: "mock-user-01",
      email: MOCK_USER_EMAIL,
      isMockUser: true,
    };
  }
  return null;
}
