"use client";
import { useEffect, useState } from "react";
export function PropertySectionNav({ sections }) {
    const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
    useEffect(() => {
        const elements = sections
            .map((section) => document.getElementById(section.id))
            .filter((element) => Boolean(element));
        if (elements.length === 0)
            return undefined;
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
            if (visible?.target.id)
                setActiveId(visible.target.id);
        }, { rootMargin: "-25% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] });
        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [sections]);
    function scrollToSection(id) {
        const target = document.getElementById(id);
        if (!target)
            return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `#${id}`);
        setActiveId(id);
    }
    return (<nav aria-label="Property sections" className="mt-6 overflow-x-auto rounded-xl border border-line bg-white px-2 py-2 shadow-sm shadow-ink/5">
      <div className="flex min-w-max gap-1">
        {sections.map((section) => {
            const active = activeId === section.id;
            return (<button key={section.id} type="button" onClick={() => scrollToSection(section.id)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-primary text-white" : "text-ink-secondary hover:bg-primary-tint hover:text-primary"}`}>
              {section.label}
            </button>);
        })}
      </div>
    </nav>);
}
