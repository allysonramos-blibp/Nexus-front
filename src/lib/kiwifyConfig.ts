export interface KiwifyLinks {
  starterMonthly?: string;
  starterYearly?: string;
  proMonthly?: string;
  proYearly?: string;
  enterpriseMonthly?: string;
  enterpriseYearly?: string;
}

const STORAGE_KEY = "nexus.kiwify_links";

export const DEFAULT_KIWIFY_LINKS: KiwifyLinks = {
  starterMonthly: "",
  starterYearly: "",
  proMonthly: "",
  proYearly: "",
  enterpriseMonthly: "",
  enterpriseYearly: "",
};

export function getKiwifyLinks(): KiwifyLinks {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      return { ...DEFAULT_KIWIFY_LINKS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_KIWIFY_LINKS;
}

export function saveKiwifyLinks(links: KiwifyLinks) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    }
  } catch {}
}

export function getKiwifyUrlForPlan(planId: string, cycle: "MONTHLY" | "YEARLY"): string {
  const links = getKiwifyLinks();
  if (planId === "STARTER") {
    return cycle === "YEARLY" ? (links.starterYearly || "") : (links.starterMonthly || "");
  }
  if (planId === "PRO") {
    return cycle === "YEARLY" ? (links.proYearly || "") : (links.proMonthly || "");
  }
  if (planId === "ENTERPRISE") {
    return cycle === "YEARLY" ? (links.enterpriseYearly || "") : (links.enterpriseMonthly || "");
  }
  return "";
}

export function buildKiwifyCheckoutUrl(
  baseUrl: string,
  userEmail?: string,
  userName?: string
): string {
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    if (userEmail) url.searchParams.set("email", userEmail);
    if (userName) url.searchParams.set("name", userName);
    return url.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    let params = "";
    if (userEmail) params += `email=${encodeURIComponent(userEmail)}`;
    if (userName) params += `${params ? "&" : ""}name=${encodeURIComponent(userName)}`;
    return params ? `${baseUrl}${sep}${params}` : baseUrl;
  }
}
