// components/AppRevealSection.tsx
import React from "react";
import Link from "next/link";

export default function AppRevealSection() {
  return (
    <section
      id="platform"
      className="relative h-screen max-h-screen bg-navy-950 px-6 py-6 sm:py-10 overflow-hidden flex flex-col justify-center border-t border-white/5"
    >
      {/* Background Technology Ambient Glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-ocean/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col justify-between h-full max-h-[85vh]">
        {/* Header Block */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-ocean" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-sky">
              ტექნოლოგიური რევოლუცია // U11 PWA
            </span>
            <span className="h-px w-6 bg-ocean" />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-mist uppercase leading-tight">
            ფეხბურთი არ მთავრდება{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky via-ocean to-emerald-400">
              მოედნის დატოვებისთანავე.
            </span>
          </h2>

          <p className="mt-2 text-center max-w-xl mx-auto font-body text-xs sm:text-sm text-sky/75">
            რეალური მონაცემები, ჯანსაღი მოტივაცია და გუნდის ერთიანი ისტორია —
            ერთ სივრცეში.
          </p>
        </div>

        {/* Showcase Grid: Phone Mockup + Marketer's 3 Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-auto items-center">
          {/* Left Column: Interactive Mobile UI Mockup (5 Cols) */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-[260px] sm:w-[280px] rounded-[32px] border-[3px] border-white/20 bg-pitch/90 p-3.5 shadow-2xl shadow-ocean/30 backdrop-blur-xl relative">
              {/* Notch */}
              <div className="w-24 h-3.5 bg-white/10 rounded-full mx-auto mb-3" />

              {/* Mockup: Team Pulse */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center mb-2.5">
                <div className="flex items-center justify-between font-mono text-[9px] text-sky/70 mb-1">
                  <span>გუნდის პულსი</span>
                  <span className="text-emerald-400 font-bold">88% 🔥</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-ocean to-emerald-400 h-full w-[88%]" />
                </div>
              </div>

              {/* Mockup: Player Card */}
              <div className="rounded-xl border border-ocean/40 bg-ocean/[0.08] p-3 text-center relative overflow-hidden mb-2.5">
                <div className="font-mono text-[9px] text-ocean uppercase font-semibold">
                  PLAYER PASSPORT // U11
                </div>
                <div className="mt-1 font-display text-2xl font-black text-mist tracking-tight">
                  88 <span className="text-xs font-normal text-sky">OVR</span>
                </div>
                <div className="font-body text-xs font-bold text-white">
                  გიორგი #10
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[8px] text-sky/80">
                  <div className="bg-white/5 rounded py-0.5">IQ 92</div>
                  <div className="bg-white/5 rounded py-0.5">TEC 89</div>
                  <div className="bg-white/5 rounded py-0.5">DIS 95</div>
                </div>
              </div>

              {/* Mockup: Daily Quest */}
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-2.5 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  ⚡
                </div>
                <div className="text-left">
                  <div className="font-mono text-[8px] text-amber-300 font-bold uppercase">
                    დღის ტაქტიკური ფაზლი
                  </div>
                  <div className="font-body text-[10px] text-mist/90">
                    „როგორ იხსნება #6 პრესინგისას?“
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Real Values Grounded in Product (7 Cols) */}
          <div className="md:col-span-7 space-y-3">
            {/* Value 1: Real Visibility */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md transition hover:border-ocean/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-ocean/20 flex items-center justify-center text-ocean shrink-0 font-bold text-xs">
                  01
                </div>
                <h3 className="font-display text-base font-bold text-mist uppercase">
                  რეალური ხედვა განვითარებაზე — არა მხოლოდ ტაბლო
                </h3>
              </div>
              <p className="mt-1.5 font-body text-xs text-sky/70 pl-9 leading-relaxed">
                მშობელი ხედავს ზუსტად იმავე სამწვრთნელო სიგნალებს, რასაც მე:
                ვარჯიშის დინამიკას, პოზიციურ პროგრესს და ინდივიდუალურ მიზნებს.
                თქვენ გამჭვირვალედ აკვირდებით, როგორ ვითარდება თქვენი შვილი
                კვირიდან კვირამდე.
              </p>
            </div>

            {/* Value 2: Healthy Motivation for 10-year-olds */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md transition hover:border-emerald-400/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                  02
                </div>
                <h3 className="font-display text-base font-bold text-mist uppercase">
                  ჯანსაღი მოტივაცია 10 წლის ბავშვისთვის
                </h3>
              </div>
              <p className="mt-1.5 font-body text-xs text-sky/70 pl-9 leading-relaxed">
                XP, დონეები, სტრიქები და ტაქტიკური ფაზლები. ბავშვი ეჯიბრება
                საკუთარ გუშინდელ თავს და არა მეგობრებს ისეთ მგრძნობიარე თემებში,
                როგორიცაა ქცევა ან დისციპლინა. არავითარი დამთრგუნველი საჯარო
                შედარებები.
              </p>
            </div>

            {/* Value 3: Connected to the Squad's Story */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md transition hover:border-sky/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky/20 flex items-center justify-center text-sky shrink-0 font-bold text-xs">
                  03
                </div>
                <h3 className="font-display text-base font-bold text-mist uppercase">
                  მთელი გუნდის საერთო ისტორიის ნაწილი
                </h3>
              </div>
              <p className="mt-1.5 font-body text-xs text-sky/70 pl-9 leading-relaxed">
                „გუნდის პულსი“, ტურნირების სტატუსი და კვირის ფოკუსი. სისტემაში
                შესვლისას თქვენ ხედავთ არა მხოლოდ თქვენს შვილს იზოლირებულად,
                არამედ მთელი გუნდის მდგომარეობას — თქვენ ხართ ბათუმის „დინამოს“
                ოჯახის ნაწილი.
              </p>
            </div>
          </div>
        </div>

        {/* Live Demo Action Bar */}
        <div className="rounded-lg border border-ocean/30 bg-gradient-to-r from-ocean/20 via-white/[0.02] to-ocean/20 p-3 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-body text-xs text-mist">
            🚀 <strong>ბათუმის დინამოში</strong> იწყება ახალი ეპოქა — ტექნოლოგია
            ბავშვის განვითარების სამსახურში.
          </span>
          <Link
            href="/login"
            className="rounded-md bg-ocean px-5 py-2 font-mono text-xs font-semibold text-white shadow-md shadow-ocean/30 hover:bg-[#0299d1] transition shrink-0"
          >
            პლატფორმის გახსნა / LIVE DEMO →
          </Link>
        </div>
      </div>
    </section>
  );
}
