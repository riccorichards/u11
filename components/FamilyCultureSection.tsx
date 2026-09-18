// components/FamilyCultureSection.tsx
import React from "react";

export default function FamilyCultureSection() {
  return (
    <section
      id="family"
      className="relative h-screen max-h-screen bg-navy-950 px-6 py-6 sm:py-10 overflow-hidden flex flex-col justify-center border-t border-white/5"
    >
      {/* Background Unity Warm Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ocean/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col justify-between h-full max-h-[85vh]">
        {/* Header Block */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-ocean" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-sky">
              კულტურა და ღირებულებები // 03
            </span>
            <span className="h-px w-6 bg-ocean" />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-mist uppercase leading-tight">
            ერთი დიდი ოჯახი.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky via-ocean to-emerald-400">
              ყველაფერი იწყება სახლიდან.
            </span>
          </h2>

          <p className="mt-2 text-center max-w-xl mx-auto font-body text-xs sm:text-sm text-sky/75">
            დიდი გამარჯვებები იჭედება არა მხოლოდ მოედანზე, არამედ იმ გარემოში,
            რომელსაც ბავშვს ერთად ვუქმნით.
          </p>
        </div>

        {/* 3 Family Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
          {/* Card 1: On the Pitch (Covering Mistakes) */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md flex flex-col justify-between transition hover:border-ocean/40">
            <div>
              <div className="w-8 h-8 rounded-lg bg-ocean/20 flex items-center justify-center text-ocean mb-3">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <h3 className="font-display text-lg font-bold text-mist uppercase">
                მოედანზე: ერთობა
              </h3>

              <p className="mt-2 font-body text-xs text-sky/70 leading-relaxed">
                ჩვენთან არ არსებობს ხელების გაშლა და თანაგუნდელის დადანაშაულება.
                თუ ერთმა დაკარგა ბურთი — ათივე გარბის მის დასაბრუნებლად.
                ერთმანეთის შეცდომებს ვაზღვევთ ჩუმი შრომით.
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-white/5 font-mono text-[10px] text-ocean">
              წესი: „ერთი ყველასთვის, ყველა ერთისთვის“
            </div>
          </div>

          {/* Card 2: At Home (Safe Haven) */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md flex flex-col justify-between transition hover:border-emerald-400/40">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>

              <h3 className="font-display text-lg font-bold text-mist uppercase">
                სახლში: მხარდაჭერა
              </h3>

              <p className="mt-2 font-body text-xs text-sky/70 leading-relaxed">
                სახლი და მანქანა არ უნდა იქცეს საგამოძიებო ოთახად. არ ვარჩევთ
                თამაშს კრიტიკით. სახლი არის ადგილი, სადაც ბავშვმა იცის, რომ ის
                უყვართ შედეგის მიუხედავად. რეჟიმი და ძილი კი მისი საწვავია.
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-white/5 font-mono text-[10px] text-emerald-400">
              წესი: „უსაფრთხო ნავსაყუდელი“
            </div>
          </div>

          {/* Card 3: In the Stands (Pure Passion) */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md flex flex-col justify-between transition hover:border-sky/40">
            <div>
              <div className="w-8 h-8 rounded-lg bg-sky/20 flex items-center justify-center text-sky mb-3">
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
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3 className="font-display text-lg font-bold text-mist uppercase">
                ტრიბუნაზე: სიამაყე
              </h3>

              <p className="mt-2 font-body text-xs text-sky/70 leading-relaxed">
                ტრიბუნა ეკუთვნის მხოლოდ ემოციურ მხარდაჭერას, ტაშს და სიხარულს.
                არავითარი ყვირილი მსაჯზე, მეტოქეზე ან საკუთარ შვილზე. ჩვენ ვართ
                ბათუმის „დინამო“ და ჩვენი კულტურა ელიტურია.
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-white/5 font-mono text-[10px] text-sky">
              წესი: „100% ტაში • 0% კარნახი“
            </div>
          </div>
        </div>

        {/* The Golden Family Promise */}
        <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-white/[0.02] to-ocean/10 p-3.5 text-center">
          <p className="font-body text-xs sm:text-sm font-medium text-mist">
            „როდესაც ბავშვმა იცის, რომ ზურგს უმაგრებს მწვრთნელი, გუნდელი და
            მშობელი — ის მოედანზე უშიშარი ხდება!“
          </p>
        </div>
      </div>
    </section>
  );
}
