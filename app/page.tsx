import Link from "next/link";
import Image from "next/image";
import dbLogo from "../assets/dblogo.png";
import championsPhoto from "../assets/champions.png";
import VisionSection from "../components/VisionSection"; // <- შემოიტანეთ აქ
import ObstaclesSection from "@/components/ObstaclesSection";
import FamilyCultureSection from "@/components/FamilyCultureSection";
import AppRevealSection from "@/components/AppRevealSection";

export default function LandingPage() {
  return (
    <main className="bg-pitch">
      {/* 1. HERO SECTION */}
      <div className="relative min-h-screen overflow-hidden bg-pitch">
        <Image
          src={championsPhoto}
          alt="Dinamo Batumi Champions"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/10" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-6 pb-16 pt-24 text-center sm:pb-24">
          <Image
            src={dbLogo}
            alt="Dinamo Batumi crest"
            width={64}
            height={64}
            className="mb-6 drop-shadow-[0_0_20px_rgba(1,138,190,0.4)]"
            priority
          />

          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-mist sm:text-6xl">
            დინამო ბათუმი U11-ის
            <br />
            თავგადასავალი
          </h1>

          <p className="mt-4 max-w-md font-body text-base text-sky sm:text-lg">
            თითოეული ვარჯიში, გამარჯვება და ნაბიჯი წინ — ერთ სივრცეში, შენი
            შვილისთვის და შენთვის.
          </p>

          <a
            href="#vision"
            className="mt-10 rounded-md bg-ocean px-8 py-4 font-body text-base font-medium text-white shadow-lg shadow-ocean/20 transition hover:bg-[#0299d1] cursor-pointer"
          >
            დაიწყე თავგადასავალი
          </a>
        </div>
      </div>

      {/* 2. VISION SECTION */}
      <VisionSection />
      <ObstaclesSection />
      <FamilyCultureSection />
      <AppRevealSection />
    </main>
  );
}
