import Dashboard from "@/components/dashboard";

export default function Page() {
  // Read the environment variable securely on the server
  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
  
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-mono selection:bg-rose-500/30">
      <Dashboard apiKey={apiKey} />
    </main>
  );
}
