import Image from "next/image";
import Link from "next/link";
import { AuthLogo } from "@/components/auth-logo";
import { RegisterForm } from "@/components/auth-forms";
export const metadata = { title: "Register | RoomStay" };
const benefitChips = ["Save properties", "Request viewings", "Manage bookings"];
export default async function RegisterPage({ searchParams, }) {
    const params = await searchParams;
    const returnTo = typeof params.returnTo === "string" ? params.returnTo : undefined;
    const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
    return (<main className="min-h-dvh bg-primary-tint/60">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] items-stretch gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section aria-label="Welcome to RoomStay" className="relative hidden min-w-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
          <div aria-hidden="true" className="absolute inset-0">
            <Image src="/images/home/luxury-room.jpg" alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover"/>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-indigo-deep/90 via-primary/80 to-primary/55" 
    // Match Login's overlay after its client-side visual effect runs.
    style={{ backgroundImage: "linear-gradient(to bottom right, rgb(23 16 68 / 72%), rgb(72 43 244 / 56%), rgb(72 43 244 / 30%))" }}/>
            <div aria-hidden="true" className="absolute -top-20 -right-20 size-72 rounded-full bg-accent/25 blur-3xl"/>
          </div>

          <Link href="/" aria-label="RoomStay home" className="relative inline-flex w-fit items-center gap-2.5 rounded-lg">
            <AuthLogo variant="inverse"/>
          </Link>

          <div className="relative mt-10">
            <h1 className="max-w-md text-4xl leading-tight font-semibold tracking-[-0.035em] text-white xl:text-5xl">
              Start your RoomStay journey.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/85">
              Create an account to save properties, message Partners, request viewings, and manage bookings.
            </p>
            <ul aria-label="RoomStay benefits" className="mt-6 flex flex-wrap gap-2">
              {benefitChips.map((benefit) => (<li key={benefit} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white">
                  {benefit}
                </li>))}
            </ul>
          </div>

          <p className="relative mt-10 text-xs text-white/70">
            Every account starts as a Normal User. Partner access is granted through a separate application.
          </p>
        </section>

        <section aria-label="Create your account" className="flex min-w-0 flex-col bg-white px-[22px] py-7 md:px-10 md:py-10 lg:justify-center lg:px-12 xl:px-16">
          <div className="mx-auto mb-6 flex w-full max-w-md items-center gap-2.5 lg:hidden">
            <Link href="/" aria-label="RoomStay home" className="inline-flex items-center gap-2 rounded-lg">
              <AuthLogo variant="compact"/>
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0">
            <Link href="/" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:text-primary">
              <span aria-hidden="true">‹</span> Back to Home
            </Link>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink">Create your account</h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Sign up to find your next home and manage your rental journey.
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_rgba(72,43,244,0.10)] ring-1 ring-primary/10 md:p-6 [&_form]:gap-5 [&_button[type=submit]]:mt-0 [&_button[type=submit]]:min-h-12 [&_button[type=submit]]:rounded-xl">
              <RegisterForm returnTo={returnTo}/>
            </div>

            <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-secondary">
              Already have an account?{" "}
              <Link href={loginHref} className="font-semibold text-primary">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>);
}
