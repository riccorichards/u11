// components/ObstaclesSection.tsx
import React from "react";

export default function ObstaclesSection() {
  return (
    <section
      id="obstacles"
      className="relative h-screen max-h-screen bg-navy-950 px-6 py-6 sm:py-10 overflow-hidden flex flex-col justify-center border-t border-white/5"
    >
      {/* Background Warning/Attention Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col justify-between h-full max-h-[85vh]">
        {/* Header Block */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-amber-400/60" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-amber-400/90">
              მთავარი გამოწვევა // U11 რეალობა
            </span>
            <span className="h-px w-6 bg-amber-400/60" />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-mist uppercase leading-tight">
            რა სჭირდება ბავშვს და{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-rose-500">
              რა უშლის მას ხელს?
            </span>
          </h2>

          <p className="mt-2 text-center max-w-xl mx-auto font-body text-xs sm:text-sm text-sky/75">
            თანამედროვე ფეხბურთში გადაწყვეტილება წამებში მიიღება. ბავშვის ტვინი
            უნდა იყოს თავისუფალი და არა გადატვირთული.
          </p>
        </div>

        {/* Comparison Grid: What we need VS What destroys it */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto">
          {/* Box 1: Freedom of Decision (What We Cultivate) */}
          <div className="relative rounded-xl border border-ocean/30 bg-ocean/[0.04] p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-ocean uppercase">
                  რა გვჭირდება მოედანზე
                </span>
                <span className="rounded-full bg-ocean/20 px-2 py-0.5 text-[10px] font-medium text-sky border border-ocean/30">
                  თავისუფლება
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-ocean/20 flex items-center justify-center text-ocean shrink-0">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-mist uppercase">
                  გადაწყვეტილების გამბედაობა
                </h3>
              </div>

              <ul className="mt-3 space-y-2 font-body text-xs sm:text-[13px] text-sky/80">
                <li className="flex items-start gap-2">
                  <span className="text-ocean font-bold">•</span>
                  <span>
                    <strong>შეცდომის შიშის მოხსნა:</strong> შეცდომა არის სწავლის
                    ერთადერთი გზა, მასზე დასჯა არ არსებობს.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ocean font-bold">•</span>
                  <span>
                    <strong>შემოქმედებითობა:</strong> ბავშვმა თავად უნდა აირჩიოს
                    დრიბლინგი, პასი თუ დარტყმა.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ocean font-bold">•</span>
                  <span>
                    <strong>თამაშით ტკბობა:</strong> მხოლოდ გაბედული და ლაღი
                    ბავშვი აღწევს ელიტურ დონეს.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-ocean/20 flex items-center gap-2">
              <span className="font-mono text-[10px] text-sky/90">
                შედეგი: მოაზროვნე, თვითდაჯერებული ლიდერი
              </span>
            </div>
          </div>

          {/* Box 2: The Obstacle (What Paralyzes the Kid) */}
          <div className="relative rounded-xl border border-rose-500/20 bg-rose-500/[0.02] p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-rose-400 uppercase">
                  მთავარი ხელისშემშლელი
                </span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300 border border-rose-500/20">
                  წნეხი
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-mist uppercase">
                  „არეული ტვინი“ და შეცდომის შიში
                </h3>
              </div>

              <ul className="mt-3 space-y-2 font-body text-xs sm:text-[13px] text-rose-200/70">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>
                    <strong>კარნახი ტრიბუნიდან:</strong> როცა მშობელი ყვირის
                    „დაარტყი!“, მწვრთნელი კი „გაიხსენს“, ბავშვი პარალიზდება.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>
                    <strong>მოლოდინების წნეხი:</strong> ფიქრი იმაზე, თუ რას
                    იტყვის მშობელი მანქანაში სახლში დაბრუნებისას.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>
                    <strong>რობოტად ქცევა:</strong> ბავშვი თამაშობს იმისთვის,
                    რომ არ შეცდეს და არა იმისთვის, რომ შექმნას.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center gap-2">
              <span className="font-mono text-[10px] text-rose-300/80">
                შედეგი: შებოჭილობა, შიში, პროგრესის გაჩერება
              </span>
            </div>
          </div>
        </div>

        {/* Formula Footer */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5 text-center">
          <p className="font-body text-xs sm:text-sm font-medium text-mist">
            <span className="text-ocean font-bold">ჩვენი ოქროს წესი:</span>{" "}
            დისციპლინა მოედნის მიღმა (რეჟიმი, ძილი, პატივისცემა) ={" "}
            <span className="text-sky font-bold">
              აბსოლუტური თავისუფლება და შემოქმედებითობა მოედანზე!
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
