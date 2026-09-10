import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Layers,
  ArrowRight,
  Activity,
  Clock,
} from "lucide-react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const revalidate = 0;

export default async function DashboardOverviewPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // Query user stats from Prisma
  const [totalJobs, pdfJobs, imageJobs, mediaJobs, recentJobs] =
    await Promise.all([
      prisma.job.count({ where: { userId } }),
      prisma.job.count({
        where: {
          userId,
          OR: [{ sourceFormat: "pdf" }, { targetFormat: "pdf" }],
        },
      }),
      prisma.job.count({
        where: {
          userId,
          OR: [
            {
              sourceFormat: {
                in: ["png", "jpg", "jpeg", "webp", "avif", "gif", "tiff"],
              },
            },
            {
              targetFormat: {
                in: ["png", "jpg", "jpeg", "webp", "avif", "gif", "tiff"],
              },
            },
          ],
        },
      }),
      prisma.job.count({
        where: {
          userId,
          OR: [
            {
              sourceFormat: {
                in: [
                  "mp4",
                  "webm",
                  "mov",
                  "avi",
                  "mkv",
                  "mp3",
                  "wav",
                  "aac",
                  "flac",
                ],
              },
            },
            {
              targetFormat: {
                in: [
                  "mp4",
                  "webm",
                  "mov",
                  "avi",
                  "mkv",
                  "mp3",
                  "wav",
                  "aac",
                  "flac",
                ],
              },
            },
          ],
        },
      }),
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { conversions: true },
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {session.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Here is an overview of your file conversion activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#131722]/80 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{totalJobs}</p>
          <p className="text-xs text-slate-500">Processed conversions</p>
        </div>

        <div className="p-5 bg-[#131722]/80 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              PDF Conversions
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{pdfJobs}</p>
          <p className="text-xs text-slate-500">PDFs transformed or edited</p>
        </div>

        <div className="p-5 bg-[#131722]/80 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Image Conversions
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{imageJobs}</p>
          <p className="text-xs text-slate-500">
            Raster & vector images processed
          </p>
        </div>

        <div className="p-5 bg-[#131722]/80 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Media Conversions
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{mediaJobs}</p>
          <p className="text-xs text-slate-500">Audio & video transcodes</p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-6 bg-gradient-to-r from-red-950/40 via-[#131722] to-[#131722] border border-red-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            Need to convert a new file?
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Use our high-speed engines for PDF, Image, and Media transformations
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 shrink-0"
        >
          Start Converting
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
          </div>
          {totalJobs > 0 && (
            <Link
              href="/dashboard/history"
              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              View all history →
            </Link>
          )}
        </div>

        {recentJobs.length === 0 ? (
          <div className="p-8 bg-[#131722]/50 border border-white/10 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              No conversion history yet
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Your recent conversion jobs will appear here once you process
              files with ConvertIt.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Convert a File Now
            </Link>
          </div>
        ) : (
          <div className="bg-[#131722]/80 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Source → Target</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentJobs.map((job: (typeof recentJobs)[number]) => (
                    <tr
                      key={job.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                        {new Date(job.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            job.status === "COMPLETED"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : job.status === "FAILED"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                        {job.conversions[0]?.engine || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
