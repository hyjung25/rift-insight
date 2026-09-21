import Dashboard from "@/components/dashboard";
import { hasApiKey } from "@/lib/riot";
import { demoAnalysis } from "@/lib/demo";
export const dynamic = "force-dynamic";
export default function Page() {
  const liveAvailable = hasApiKey();
  return (
    <Dashboard
      initial={liveAvailable ? null : demoAnalysis()}
      liveAvailable={liveAvailable}
    />
  );
}
