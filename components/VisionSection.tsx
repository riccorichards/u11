// components/VisionSection.tsx
import React from "react";

export default function VisionSection() {
  return (
    <section
      id="vision"
      className="relative h-screen max-h-screen bg-navy-950 px-6 py-6 sm:py-10 overflow-hidden flex flex-col justify-center"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-ocean/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col justify-between h-full max-h-[85vh]">
        {/* Header Block */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-ocean" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-sky">
              ფილოსოფია და ხედვა
            </span>
            <span className="h-px w-6 bg-ocean" />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-mist uppercase leading-tight">
            ჩვენ არ ვირჩევთ ერთ-ერთს.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky via-ocean to-[#0299d1]">
              ჩვენ ვირჩევთ ორივეს.
            </span>
          </h2>

          <p className="mt-2 text-center max-w-xl mx-auto font-body text-xs sm:text-sm text-sky/75">
            გამარჯვება არის არა მიზანი ნებისმიერ ფასად, არამედ სწორი
            განვითარების გარდაუვალი შედეგი.
          </p>
        </div>

        {/* Dual Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto">
          {/* Pillar 1: Winning Mentality */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between transition hover:border-ocean/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-sky/60 uppercase">
                  პრინციპი 01
                </span>
                <span className="rounded-full bg-ocean/10 px-2.5 py-0.5 text-[10px] font-medium text-sky border border-ocean/20">
                  მენტალიტეტი
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-ocean/20 flex items-center justify-center border border-ocean/30 text-ocean shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-mist uppercase">
                  ყოველდღიური გამარჯვებულები
                </h3>
              </div>

              <p className="mt-2.5 font-body text-xs sm:text-[13px] text-sky/70 leading-relaxed">
                გამარჯვებული არ განისაზღვრება მხოლოდ ტაბლოთი. გამარჯვებულია
                ბავშვი, რომელიც ყოველ ვარჯიშზე ამარცხებს სიზარმაცეს,
                უყურადღებობას და შეცდომის შიშს.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ocean animate-pulse" />
              <span className="font-mono text-[10px] text-mist/80">
                მაღალი ინტენსივობა • ხასიათი • ლიდერობა
              </span>
            </div>
          </div>

          {/* Pillar 2: Player Development */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between transition hover:border-emerald-500/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-sky/60 uppercase">
                  პრინციპი 02
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                  პროცესი
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-mist uppercase">
                  მოაზროვნე ფეხბურთელი (Game IQ)
                </h3>
              </div>

              <p className="mt-2.5 font-body text-xs sm:text-[13px] text-sky/70 leading-relaxed">
                ჩვენ არ ვზრდით რობოტებს. U11 ასაკში უმთავრესია სივრცის დანახვა,
                სწორი სხეულის პოზიცია და გადაწყვეტილების თავისუფლება. ტაბლო
                დროებითია — საფეხბურთო ინტელექტი სამუდამო.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-mist/80">
                Scanning • პოზიციური აღქმა • თავისუფლება
              </span>
            </div>
          </div>
        </div>

        {/* The Golden Synthesis Statement (Compact Footer) */}
        <div className="rounded-lg border border-ocean/20 bg-gradient-to-r from-ocean/10 via-white/[0.02] to-ocean/10 p-3.5 text-center">
          <p className="font-body text-xs sm:text-sm font-medium text-mist">
            „ჩვენი მიზანია არა მხოლოდ მორიგი მატჩის მოგება, არამედ ამ ბავშვების
            მთავარ გუნდში და ევროპაში ხილვა.“
          </p>
        </div>
      </div>
    </section>
  );
}
