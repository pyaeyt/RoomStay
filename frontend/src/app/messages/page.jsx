import { MessagesList } from "@/components/messages-list";
import { SiteHeader } from "@/components/site-header";
export const metadata = { title: "Messages | RoomStay" };
export default function MessagesPage() {
    return (<div className="min-h-dvh w-full bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      <SiteHeader activePage="Messages"/>

      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 xl:px-12">
        <MessagesList />
      </main>
    </div>);
}
