import { NavLink, useNavigate as useRouterNavigate } from "react-router-dom";
import type { ComponentProps, ReactNode } from "react";

type LinkProps = Omit<ComponentProps<"a">, "href"> & {
  to: string;
  children?: ReactNode;
  activeOptions?: { exact?: boolean };
  activeProps?: { className?: string };
};

/** Link compatível com a API que as telas usavam (to / activeProps / activeOptions). */
export function Link({ to, className, activeProps, activeOptions, children, ...rest }: LinkProps) {
  return (
    <NavLink
      to={to}
      end={activeOptions?.exact ?? false}
      className={({ isActive }) =>
        [className, isActive ? activeProps?.className : ""].filter(Boolean).join(" ")
      }
      {...rest}
    >
      {children}
    </NavLink>
  );
}

/** navigate({ to: "/login" }) ou navigate("/login"). */
export function useNavigate() {
  const navigate = useRouterNavigate();
  return (opts: string | { to: string; replace?: boolean }) =>
    typeof opts === "string" ? navigate(opts) : navigate(opts.to, { replace: opts.replace });
}
