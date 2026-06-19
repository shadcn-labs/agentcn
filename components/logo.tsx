import { cn } from "@/lib/utils";

export const LogoMark = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("size-4", className)}
    {...props}
  >
    <path d="M14 18a2 2 0 0 0-4 0m9-7-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11m-3 0h20" />
    <circle cx={17} cy={18} r={3} />
    <circle cx={7} cy={18} r={3} />
    <path
      d="M15.46 7.1 13.3 9.26m1.728-4.536-4.104 4.104"
      strokeWidth={1.575}
    />
  </svg>
);

export const getLogoMarkSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 18a2 2 0 0 0-4 0m9-7-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11m-3 0h20"/>
    <circle cx="17" cy="18" r="3"/>
    <circle cx="7" cy="18" r="3"/>
    <path d="M15.46 7.1 13.3 9.26m1.728-4.536-4.104 4.104" stroke-width="1.575"/>
  </svg>
`;
