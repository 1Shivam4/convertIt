import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { History, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const revalidate = 0;

export default async function JobHistoryPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    redirect("/sign-in");
  }

  const jobs = await prisma.job.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      conversions: true,
      files: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Job History</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Full record of all your file conversion requests
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 bg-[#131722]/50 border border-white/10 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            No jobs recorded
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            You haven&apos;t run any file conversion jobs under this account
            yet.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Start Converting
          </Link>
        </div>
      ) : (
        <div className="bg-[#131722]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Job ID</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Source → Target</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Engine</th>
                  <th className="px-5 py-3.5">Files</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.map((job: (typeof jobs)[number]) => (
                  <tr
                    key={job.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-400">
                      {job.id.substring(0, 12)}…
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                      {new Date(job.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-white">
                      <span className="uppercase text-slate-400">
                        {job.sourceFormat}
                      </span>
                      <span className="mx-2 text-slate-600">→</span>
                      <span className="uppercase text-red-400">
                        {job.targetFormat}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === "COMPLETED"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : job.status === "FAILED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {job.status === "COMPLETED" && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {job.status === "FAILED" && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {job.status === "QUEUED" && (
                          <Clock className="w-3 h-3 animate-pulse" />
                        )}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                      {job.conversions[0]?.engine || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                      {job.files.length} file{job.files.length === 1 ? "" : "s"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
