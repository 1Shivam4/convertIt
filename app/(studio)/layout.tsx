import Navbar from "@/components/Navbar";

export default function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0b0d11]">
      <Navbar />
      <main className="flex-1 min-h-0 w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}
