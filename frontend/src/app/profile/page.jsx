import { SiteHeader } from "@/components/site-header";
import { UserProfile } from "@/components/user-profile";
export const metadata = { title: "My Profile | RoomStay" };
export default function ProfilePage() {
    return (<div className="min-h-dvh bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to content</a>
      <SiteHeader activePage="Profile"/>
      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 xl:px-12">
        <UserProfile />
      </main>
    </div>);
}
