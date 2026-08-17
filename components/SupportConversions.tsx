import { navbarItems } from "@/app/utils/vars";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SupportConversions() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Supported Conversions & Tools
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Everything you need to convert, compress, and edit files right in your
          browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {navbarItems.map((category) => (
          <div
            key={category.name}
            className="bg-[#121622]/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/40 hover:bg-[#151a28] transition-all group"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src={category.icon}
                    width={22}
                    height={22}
                    alt={category.name}
                    className="w-5 h-5"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {category.name} Tools
                  </h3>
                  <span className="text-xs text-slate-400">
                    {category.itemsList.length} popular formats
                  </span>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                {category.itemsList.slice(0, 4).map((tool) => (
                  <li key={tool.name}>
                    <Link
                      href={tool.location}
                      className="flex items-center justify-between text-slate-300 hover:text-white py-1 transition-colors"
                    >
                      <span className="truncate">{tool.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="text-xs font-medium text-red-400 group-hover:underline inline-flex items-center gap-1">
                Explore all {category.name} tools &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
