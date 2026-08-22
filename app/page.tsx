import { AuthGate } from "@/components/auth-screen";
import { Assistant } from "./assistant";

export default function Home() {
  return (
    <AuthGate>
      <Assistant />
    </AuthGate>
  );
}
