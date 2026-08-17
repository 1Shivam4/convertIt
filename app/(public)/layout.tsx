import Footer from "@/components/Footer";
import Navbar from "../../components/Navbar";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
