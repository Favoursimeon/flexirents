import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps extends Omit<NavLinkProps, "className"> {
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
}

export const NavLink = ({ className, activeClassName, ...props }: CustomNavLinkProps) => {
  return (
    <RouterNavLink
      {...props}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses = typeof className === "function" ? className({ isActive }) : className;
        return cn(baseClasses, isActive && activeClassName);
      }}
    />
  );
};
