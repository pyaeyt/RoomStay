"use client";
import Link from "next/link";
import styles from "@/components/site-header.module.css";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { mockNotificationsChangedEvent, readMockUnreadNotificationCount } from "@/lib/mock-notifications";
import { mockPartnerApplicationsChangedEvent, findMockPartnerCapability } from "@/lib/mock-partner-application";
const desktopMainNavigation = [
    { key: "Home", label: "Home", icon: "homeFilled", href: "/" },
    { key: "Search", label: "Apartments", icon: "apartment", href: "/search?type=Apartment", category: true },
    { key: "Search", label: "Condos", icon: "condo", href: "/search?type=Condo", category: true },
    { key: "Search", label: "Houses", icon: "homeFilled", href: "/search?type=House", category: true },
    { key: "Search", label: "Dormitories", icon: "room", href: "/search?type=Dormitory", category: true },
];
const mobileMainNavigation = [
    { key: "Home", label: "Home", icon: "homeFilled", href: "/" },
    { key: "Search", label: "Search", icon: "search", href: "/search" },
    { key: "Search", label: "Apartments", icon: "apartment", href: "/search?type=Apartment", category: true },
    { key: "Search", label: "Condos", icon: "condo", href: "/search?type=Condo", category: true },
    { key: "Search", label: "Houses", icon: "homeFilled", href: "/search?type=House", category: true },
    { key: "Search", label: "Dormitories", icon: "room", href: "/search?type=Dormitory", category: true },
];
export function SiteHeader({ activePage }) {
    const { user, isReady, logout } = useMockAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [partnerNav, setPartnerNav] = useState({ label: "Become a Partner", href: "/become-a-partner" });
    useEffect(() => {
        function syncUnreadCount() {
            setUnreadCount(user && isReady ? readMockUnreadNotificationCount(user.id) : 0);
        }
        function syncPartnerApplication() {
            if (!user || !isReady) {
                setPartnerNav({ label: "Become a Partner", href: "/become-a-partner" });
                return;
            }
            if (user.role === "ADMIN") {
                setPartnerNav({ label: "Admin", href: "/admin" });
                return;
            }
            const application = findMockPartnerCapability(user.id);
            if (application?.status === "APPROVED") {
                setPartnerNav({ label: "Partner Portal", href: "/partner" });
            }
            else if (application?.status === "SUSPENDED") {
                setPartnerNav({ label: "Partner Access Suspended", href: "/partner-application" });
            }
            else if (application && application.status !== "REJECTED") {
                setPartnerNav({ label: "Application Status", href: "/partner-application" });
            }
            else {
                setPartnerNav({ label: "Become a Partner", href: "/become-a-partner" });
            }
        }
        const timeout = window.setTimeout(() => {
            syncUnreadCount();
            syncPartnerApplication();
        }, 0);
        window.addEventListener(mockNotificationsChangedEvent, syncUnreadCount);
        window.addEventListener(mockPartnerApplicationsChangedEvent, syncPartnerApplication);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockNotificationsChangedEvent, syncUnreadCount);
            window.removeEventListener(mockPartnerApplicationsChangedEvent, syncPartnerApplication);
        };
    }, [isReady, user]);
    const staffAccount = user?.role === "ADMIN" || user?.isPartner === true;
    const messageHref = user?.role === "ADMIN" ? "/admin/payment-chats" : user?.isPartner ? "/partner/messages" : "/messages";
    const userNavigation = [
        ...(user && !staffAccount ? [{ key: "Bookings", label: "My Bookings", icon: "room", href: "/bookings" }] : []),
        ...(!staffAccount ? [{ key: "Favorites", label: "Favorites", icon: "heart", href: "/favorites" }] : []),
        { key: "Messages", label: user?.role === "ADMIN" ? "Payment chats" : "Messages", icon: "messages", href: messageHref },
        { key: "Partner", label: partnerNav.label, icon: "apartment", href: partnerNav.href },
    ];
    const desktopUserNavigation = userNavigation.filter((item) => item.key !== "Partner");
    const mobileBottomNavigation = user?.role === "ADMIN"
        ? [
            { key: "Home", label: "Home", icon: "homeFilled", href: "/" },
            { key: "Search", label: "Search", icon: "search", href: "/search" },
            { key: "Partner", label: "Admin", icon: "user", href: "/admin" },
            { key: "Messages", label: "Payments", icon: "messages", href: "/admin/payment-chats" },
            { key: "Notifications", label: "Updates", icon: "bell", href: "/notifications" },
        ]
        : user?.isPartner
            ? [
                { key: "Home", label: "Home", icon: "homeFilled", href: "/" },
                { key: "Partner", label: "Rooms", icon: "apartment", href: "/partner/listings" },
                { key: "Messages", label: "Messages", icon: "messages", href: "/partner/messages" },
                { key: "Search", label: "Portal", icon: "room", href: "/partner" },
                { key: "Notifications", label: "Updates", icon: "bell", href: "/notifications" },
            ]
            : user
        ? [
            { key: "Home", label: "Home", icon: "homeFilled", href: "/" },
            { key: "Search", label: "Search", icon: "search", href: "/search" },
            { key: "Bookings", label: "Bookings", icon: "room", href: "/bookings" },
            { key: "Messages", label: "Messages", icon: "messages", href: "/messages" },
            { key: "Notifications", label: "Updates", icon: "bell", href: "/notifications" },
        ]
        : [
            { key: "Home", label: "Home", icon: "homeFilled", href: "/" },
            { key: "Search", label: "Search", icon: "search", href: "/search" },
            { key: "Favorites", label: "Favorites", icon: "heart", href: "/favorites" },
            { key: "Messages", label: "Messages", icon: "messages", href: "/messages" },
            { key: "Profile", label: "Profile", icon: "user", href: "/profile" },
        ];
    function isActive(item) {
        if (item.category)
            return false;
        return item.key === activePage;
    }
    function navClass(item, extraClass = "") {
        return `${styles.navLink} ${isActive(item) ? styles.activeLink : ""} ${extraClass}`;
    }
    const notificationLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";
    return (<header className={styles.header}>
      <div className={styles.desktopRow}>
        <Link href="/" aria-label="RoomStay home" className={styles.logo}>
          <Icon name="brand" size={40} className="text-primary"/>
          <span className={styles.logoText}>
            <span className={styles.logoName}>RoomStay</span>
            <span className={styles.logoTagline}>Find. Rent. Belong.</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className={styles.mainNav}>
          {desktopMainNavigation.map((item) => (<Link key={`${item.label}-${item.href}`} href={item.href} aria-current={isActive(item) ? "page" : undefined} className={navClass(item, item.category ? styles.categoryLink : "")}>
              <Icon name={item.key === "Home" && activePage !== "Home" ? "home" : item.icon} size={19} className={styles.mainIcon}/>
              <span>{item.label}</span>
            </Link>))}
        </nav>

        <nav aria-label="User navigation" className={styles.userNav}>
          {desktopUserNavigation.map((item) => (<Link key={`${item.label}-${item.href}`} href={item.href} aria-current={isActive(item) ? "page" : undefined} className={navClass(item, item.key === "Partner" ? styles.partnerLink : "")}>
              <Icon name={item.icon} size={19}/>
              {item.key === "Partner" ? (<span className={styles.partnerLabel}>{item.label}</span>) : (<span>{item.label}</span>)}
            </Link>))}

          {user ? (<details className={styles.profileMenu}>
              <summary aria-label="Profile menu" className={navClass({ key: "Profile", label: "Profile", icon: "user", href: "/profile" })}>
                <Icon name="user" size={19}/>
                <span>Profile</span>
              </summary>
              <div className={styles.profilePanel}>
                <p className={styles.profileName}>{user.fullName}</p>
                <Link href="/profile" aria-current={activePage === "Profile" ? "page" : undefined} className={styles.menuLink}>My Profile</Link>
                {!staffAccount && <Link href="/bookings" className={styles.menuLink}>My Bookings</Link>}
                {!staffAccount && <Link href="/viewings" className={styles.menuLink}>My Viewings</Link>}
                {user.isPartner && <Link href="/partner/messages" className={styles.menuLink}>Renter messages</Link>}
                {user.isPartner && <Link href="/partner/payment-chats" className={styles.menuLink}>Payment chat</Link>}
                {user.role === "ADMIN" && <Link href="/admin/payment-chats" className={styles.menuLink}>Payment chats</Link>}
                <Link href="/notifications" className={styles.menuLink}>Updates{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
              </div>
            </details>) : (<Link href="/profile" aria-current={activePage === "Profile" ? "page" : undefined} className={navClass({ key: "Profile", label: "Profile", icon: "user", href: "/profile" })}>
              <Icon name="user" size={19}/>
              <span>Profile</span>
            </Link>)}

          {user ? (<button type="button" onClick={logout} className={styles.authLink}>Logout</button>) : (<>
              <Link href="/login" className={styles.authLink}>Login</Link>
              <Link href="/register" className={`${styles.authLink} ${styles.register}`}>Register</Link>
            </>)}
        </nav>
      </div>

      <div className={styles.mobileRow}>
        <Link href="/" aria-label="RoomStay home" className={styles.logo}>
          <Icon name="brand" size={38} className="text-primary"/>
          <span className={styles.logoText}>
            <span className={styles.logoName}>RoomStay</span>
            <span className={styles.logoTagline}>Find. Rent. Belong.</span>
          </span>
        </Link>

        <div className={styles.mobileActions}>
          <Link href="/notifications" aria-label={notificationLabel} className={`${styles.mobileIconButton} ${activePage === "Notifications" ? styles.activeLink : ""}`}>
            <Icon name="bell" size={20}/>
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </Link>

          {user ? (<button type="button" onClick={logout} className={styles.mobileLogin}>Logout</button>) : (<Link href="/login" className={styles.mobileLogin}>Login</Link>)}

          <details className={styles.mobileMenu}>
            <summary className={styles.mobileMenuButton}>Menu</summary>
            <div className={styles.mobilePanel}>
              {[...mobileMainNavigation, ...userNavigation].map((item) => (<Link key={`${item.label}-${item.href}-mobile`} href={item.href} aria-current={isActive(item) ? "page" : undefined} className={navClass(item, styles.mobileMenuLink)}>
                  <Icon name={item.key === "Home" && activePage !== "Home" ? "home" : item.icon} size={19}/>
                  <span>{item.label}</span>
                </Link>))}
              {user ? (<>
                  <Link href="/profile" aria-current={activePage === "Profile" ? "page" : undefined} className={navClass({ key: "Profile", label: "Profile", icon: "user", href: "/profile" }, styles.mobileMenuLink)}>
                    <Icon name="user" size={19}/>
                    <span>Profile</span>
                  </Link>
                  <Link href="/notifications" className={navClass({ key: "Notifications", label: "Updates", icon: "bell", href: "/notifications" }, styles.mobileMenuLink)}>
                    <Icon name="bell" size={19}/>
                    <span>Updates{unreadCount > 0 ? ` (${unreadCount})` : ""}</span>
                  </Link>
                  <button type="button" onClick={logout} className={`${styles.authLink} ${styles.mobileLogout}`}>Logout</button>
                </>) : (<>
                  <Link href="/login" className={`${styles.authLink} ${styles.mobileAuthLink}`}>Login</Link>
                  <Link href="/register" className={`${styles.authLink} ${styles.register} ${styles.mobileAuthLink}`}>Register</Link>
                </>)}
            </div>
          </details>
        </div>
      </div>

      <nav aria-label="Mobile primary navigation" className={styles.mobileBottomNav}>
        {mobileBottomNavigation.map((item) => (<Link key={`${item.label}-${item.href}-bottom`} href={item.href} aria-current={isActive(item) ? "page" : undefined} className={`${styles.mobileBottomLink} ${isActive(item) ? styles.activeLink : ""}`}>
            <span className={styles.notificationIcon}>
              <Icon name={item.key === "Home" && activePage !== "Home" ? "home" : item.icon} size={20}/>
              {item.key === "Notifications" && unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </span>
            <span>{item.label}</span>
          </Link>))}
      </nav>
    </header>);
}
