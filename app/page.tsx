import Link from "next/link";
import Image from "next/image";
import dbLogo from "../assets/dblogo.png";
import championsPhoto from "../assets/champions.png";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-pitch">
      {/* Hero photo */}
      <Image
        src={championsPhoto}
        alt=""
        fill
        priority
        className="object-cover object-top"
      />
      {/* Overlay: dark at the bottom for text legibility, lighter up top to let the photo breathe */}
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

        <Link
          href="/login"
          className="mt-10 rounded-md bg-ocean px-8 py-4 font-body text-base font-medium text-white shadow-lg shadow-ocean/20 transition hover:bg-[#0299d1]"
        >
          დაიწყე თავგადასავალი
        </Link>
      </div>
    </div>
  );
}
