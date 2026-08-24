import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Looping, self-contained SVG animations — one per agent recipe.
 *
 * They use SMIL (`<animate>` / `<animateTransform>`) rather than CSS or JS so
 * the whole set renders on the server with no client bundle. Colors come from
 * `currentColor`, set per-element via Tailwind text classes, so every scene
 * adapts to light/dark automatically. Everything is laid out inside a shared
 * 220×120 viewBox and kept within a comfortable margin so nothing clips.
 */

const NEUTRAL = "text-muted-foreground/30";
const NEUTRAL_STRONG = "text-muted-foreground/55";
const ACCENT = "text-primary";

interface SceneProps {
  className?: string;
}

const Frame = ({
  className,
  children,
}: SceneProps & { children: React.ReactNode }) => (
  <svg
    aria-hidden="true"
    className={cn("h-full w-full", className)}
    fill="none"
    role="img"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 220 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

const stroke = { stroke: "currentColor" } satisfies SVGProps<SVGElement>;

const DeepSearch = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={ACCENT}>
      <circle cx="100" cy="52" r="24" {...stroke} />
      <line strokeWidth={3} x1="118" x2="138" y1="70" y2="90" {...stroke} />
    </g>
    <line
      className={ACCENT}
      strokeOpacity={0.45}
      x1="100"
      x2="100"
      y1="52"
      y2="30"
      {...stroke}
    >
      <animateTransform
        attributeName="transform"
        dur="3s"
        from="0 100 52"
        repeatCount="indefinite"
        to="360 100 52"
        type="rotate"
      />
    </line>
    <circle className={ACCENT} cx="100" cy="52" r="6" {...stroke}>
      <animate
        attributeName="r"
        dur="2.6s"
        repeatCount="indefinite"
        values="5;23"
      />
      <animate
        attributeName="opacity"
        dur="2.6s"
        repeatCount="indefinite"
        values="0.6;0"
      />
    </circle>
  </Frame>
);

const CsvToQuestions = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={NEUTRAL_STRONG}>
      <rect height="56" rx="6" width="60" x="34" y="32" {...stroke} />
      <line x1="34" x2="94" y1="50" y2="50" {...stroke} />
      <line x1="34" x2="94" y1="69" y2="69" {...stroke} />
      <line x1="64" x2="64" y1="32" y2="88" {...stroke} />
    </g>
    <rect
      className={ACCENT}
      fill="currentColor"
      fillOpacity={0.18}
      height="17"
      rx="2"
      width="58"
      x="35"
      y="33"
    >
      <animate
        attributeName="y"
        dur="3s"
        keyTimes="0;0.33;0.66;1"
        repeatCount="indefinite"
        values="33;33;52;70"
      />
    </rect>
    <path className={NEUTRAL} d="M104 60h22m-8-6 8 6-8 6" {...stroke}>
      <animate
        attributeName="opacity"
        dur="3s"
        repeatCount="indefinite"
        values="0.25;1;0.25"
      />
    </path>
    <text
      className={ACCENT}
      fill="currentColor"
      fontSize="44"
      fontWeight="700"
      textAnchor="middle"
      x="162"
      y="75"
    >
      ?
      <animate
        attributeName="opacity"
        dur="3s"
        keyTimes="0;0.55;0.8;1"
        repeatCount="indefinite"
        values="0;0;1;1"
      />
    </text>
  </Frame>
);

const FeedbackSummary = ({ className }: SceneProps) => (
  <Frame className={className}>
    {[
      { delay: "0s", h: 26, x: 44, y: 62 },
      { delay: "0.25s", h: 42, x: 70, y: 46 },
      { delay: "0.5s", h: 18, x: 96, y: 70 },
    ].map((b) => (
      <rect
        className={ACCENT}
        fill="currentColor"
        height={b.h}
        key={b.x}
        rx="3"
        width="16"
        x={b.x}
        y={b.y}
      >
        <animate
          attributeName="height"
          begin={b.delay}
          dur="2.6s"
          repeatCount="indefinite"
          values={`4;${b.h};${b.h};4`}
        />
        <animate
          attributeName="y"
          begin={b.delay}
          dur="2.6s"
          repeatCount="indefinite"
          values={`88;${b.y};${b.y};88`}
        />
      </rect>
    ))}
    <line
      className={NEUTRAL_STRONG}
      x1="36"
      x2="122"
      y1="89"
      y2="89"
      {...stroke}
    />
    <g className={NEUTRAL_STRONG}>
      <rect height="48" rx="4" width="38" x="142" y="36" {...stroke} />
    </g>
    <g className={ACCENT}>
      <line x1="150" x2="172" y1="48" y2="48" {...stroke} />
      <line x1="150" x2="166" y1="58" y2="58" {...stroke} />
      <line x1="150" x2="172" y1="68" y2="68" {...stroke} />
    </g>
  </Frame>
);

const MeetingNotes = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={ACCENT}>
      {[38, 50, 62, 74, 86].map((x, i) => (
        <line key={x} strokeWidth={3} x1={x} x2={x} y1="60" y2="60" {...stroke}>
          <animate
            attributeName="y1"
            begin={`${i * 0.13}s`}
            dur="1.4s"
            repeatCount="indefinite"
            values="60;42;60"
          />
          <animate
            attributeName="y2"
            begin={`${i * 0.13}s`}
            dur="1.4s"
            repeatCount="indefinite"
            values="60;78;60"
          />
        </line>
      ))}
    </g>
    <path className={NEUTRAL} d="m100 52 8 8-8 8" {...stroke} />
    {[46, 60, 74].map((y, i) => (
      <g key={y}>
        <circle className={ACCENT} cx="126" cy={y} fill="currentColor" r="2.4">
          <animate
            attributeName="opacity"
            begin={`${i * 0.35}s`}
            dur="2.6s"
            repeatCount="indefinite"
            values="0;1;1;0"
          />
        </circle>
        <line
          className={NEUTRAL_STRONG}
          x1="136"
          x2={i === 2 ? 172 : 186}
          y1={y}
          y2={y}
          {...stroke}
        >
          <animate
            attributeName="opacity"
            begin={`${i * 0.35}s`}
            dur="2.6s"
            repeatCount="indefinite"
            values="0;1;1;0"
          />
        </line>
      </g>
    ))}
  </Frame>
);

const ChatWithPdf = ({ className }: SceneProps) => (
  <Frame className={className}>
    <path
      className={NEUTRAL_STRONG}
      d="M48 26h28l12 12v52a4 4 0 0 1-4 4H48a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4Z"
      {...stroke}
    />
    <path className={NEUTRAL_STRONG} d="M76 26v12h12" {...stroke} />
    <g className={NEUTRAL}>
      <line x1="54" x2="80" y1="50" y2="50" {...stroke} />
      <line x1="54" x2="80" y1="64" y2="64" {...stroke} />
      <line x1="54" x2="72" y1="78" y2="78" {...stroke} />
    </g>
    <rect
      className={ACCENT}
      fill="currentColor"
      fillOpacity={0.2}
      height="12"
      rx="2"
      width="36"
      x="48"
      y="44"
    >
      <animate
        attributeName="y"
        dur="3s"
        keyTimes="0;0.33;0.66;1"
        repeatCount="indefinite"
        values="44;44;58;72"
      />
    </rect>
    <g className={ACCENT}>
      <path
        d="M128 40h50a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8h-30l-10 10v-10h-2a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8Z"
        {...stroke}
      />
      {[140, 152, 164].map((cx, i) => (
        <circle
          cx={cx}
          cy="57"
          fill="currentColor"
          key={cx}
          r="2.6"
          stroke="none"
        >
          <animate
            attributeName="opacity"
            begin={`${i * 0.2}s`}
            dur="1.4s"
            repeatCount="indefinite"
            values="0.2;1;0.2"
          />
        </circle>
      ))}
    </g>
  </Frame>
);

const FlashcardsPdf = ({ className }: SceneProps) => (
  <Frame className={className}>
    <rect
      className={NEUTRAL}
      height="56"
      rx="6"
      width="82"
      x="80"
      y="42"
      {...stroke}
    />
    <rect
      className={NEUTRAL_STRONG}
      height="56"
      rx="6"
      width="82"
      x="72"
      y="36"
      {...stroke}
    />
    <g transform="translate(110 60)">
      <rect
        className={ACCENT}
        fill="currentColor"
        fillOpacity={0.12}
        height="56"
        rx="6"
        width="82"
        x="-41"
        y="-28"
        {...stroke}
      >
        <animateTransform
          additive="sum"
          attributeName="transform"
          dur="3.2s"
          keyTimes="0;0.5;1"
          repeatCount="indefinite"
          type="scale"
          values="1 1;0 1;1 1"
        />
      </rect>
      <g className={ACCENT}>
        <line x1="-28" x2="28" y1="-4" y2="-4" {...stroke} />
        <line x1="-28" x2="12" y1="10" y2="10" {...stroke} />
      </g>
    </g>
  </Frame>
);

const ChatWithYoutube = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={ACCENT}>
      <path
        d="M251.988432,7291.58588 L251.988432,7285.97425 C253.980638,7286.91168 255.523602,7287.8172 257.348463,7288.79353 C255.843351,7289.62824 253.980638,7290.56468 251.988432,7291.58588 M263.090998,7283.18289 C262.747343,7282.73013 262.161634,7282.37809 261.538073,7282.26141 C259.705243,7281.91336 248.270974,7281.91237 246.439141,7282.26141 C245.939097,7282.35515 245.493839,7282.58153 245.111335,7282.93357 C243.49964,7284.42947 244.004664,7292.45151 244.393145,7293.75096 C244.556505,7294.31342 244.767679,7294.71931 245.033639,7294.98558 C245.376298,7295.33761 245.845463,7295.57995 246.384355,7295.68865 C247.893451,7296.0008 255.668037,7296.17532 261.506198,7295.73552 C262.044094,7295.64178 262.520231,7295.39147 262.895762,7295.02447 C264.385932,7293.53455 264.28433,7285.06174 263.090998,7283.18289"
        fill="currentColor"
        fillRule="evenodd"
        transform="translate(42.5 18) scale(5) translate(-244 -7282)"
      />
    </g>
    <line className={NEUTRAL} x1="74" x2="146" y1="98" y2="98" {...stroke} />
    <line
      className={ACCENT}
      strokeWidth={3}
      x1="74"
      x2="74"
      y1="98"
      y2="98"
      {...stroke}
    >
      <animate
        attributeName="x2"
        dur="3s"
        repeatCount="indefinite"
        values="74;146;74"
      />
    </line>
    <circle className={ACCENT} cy="98" fill="currentColor" r="4">
      <animate
        attributeName="cx"
        dur="3s"
        repeatCount="indefinite"
        values="74;146;74"
      />
    </circle>
  </Frame>
);

const DocsChatbot = ({ className }: SceneProps) => (
  <Frame className={className}>
    <path
      className={ACCENT}
      d="M84 36c-9 0-9 8-9 16s-7 6-7 6 7 0 7 6 0 16 9 16"
      {...stroke}
    />
    <path
      className={ACCENT}
      d="M136 36c9 0 9 8 9 16s7 6 7 6-7 0-7 6 0 16-9 16"
      {...stroke}
    />
    <g className={NEUTRAL_STRONG}>
      <line x1="96" x2="124" y1="50" y2="50" {...stroke} />
      <line x1="96" x2="116" y1="70" y2="70" {...stroke} />
    </g>
    <line
      className={ACCENT}
      strokeWidth={3}
      x1="110"
      x2="110"
      y1="46"
      y2="74"
      {...stroke}
    >
      <animate
        attributeName="opacity"
        dur="1.1s"
        repeatCount="indefinite"
        values="1;1;0;0"
      />
    </line>
  </Frame>
);

const TextToSql = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={NEUTRAL_STRONG}>
      <line x1="34" x2="74" y1="46" y2="46" {...stroke} />
      <line x1="34" x2="66" y1="60" y2="60" {...stroke} />
      <line x1="34" x2="72" y1="74" y2="74" {...stroke} />
    </g>
    <path className={NEUTRAL} d="M86 60h22m-8-6 8 6-8 6" {...stroke} />
    <g className={ACCENT}>
      <ellipse cx="156" cy="40" rx="26" ry="9" {...stroke} />
      <path d="M130 40v40c0 5 12 9 26 9s26-4 26-9V40" {...stroke} />
      <path d="M130 60c0 5 12 9 26 9s26-4 26-9" {...stroke} />
    </g>
    <circle
      className={ACCENT}
      cx="156"
      cy="40"
      fill="currentColor"
      r="3"
      stroke="none"
    >
      <animate
        attributeName="cy"
        dur="2.4s"
        repeatCount="indefinite"
        values="40;80;40"
      />
      <animate
        attributeName="opacity"
        dur="2.4s"
        repeatCount="indefinite"
        values="1;0.2;1"
      />
    </circle>
  </Frame>
);

const GithubReview = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={NEUTRAL_STRONG}>
      <line x1="68" x2="68" y1="36" y2="84" {...stroke} />
      <circle cx="68" cy="42" r="7" {...stroke} />
      <circle cx="68" cy="78" r="7" {...stroke} />
      <path d="M68 60h22a8 8 0 0 0 8-8v-4" {...stroke} />
      <circle cx="98" cy="42" r="7" {...stroke} />
    </g>
    <g className={ACCENT}>
      <line x1="124" x2="150" y1="48" y2="48" {...stroke}>
        <animate
          attributeName="opacity"
          dur="2.4s"
          repeatCount="indefinite"
          values="0.2;1;0.2"
        />
      </line>
      <line x1="124" x2="142" y1="62" y2="62" {...stroke}>
        <animate
          attributeName="opacity"
          begin="0.3s"
          dur="2.4s"
          repeatCount="indefinite"
          values="0.2;1;0.2"
        />
      </line>
    </g>
    <path className={ACCENT} d="m152 74 6 6 14-16" {...stroke}>
      <animate
        attributeName="opacity"
        dur="2.4s"
        repeatCount="indefinite"
        values="0;0;1;1"
      />
    </path>
  </Frame>
);

const SlackAgent = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={ACCENT} transform="translate(110 60)">
      <animateTransform
        additive="sum"
        attributeName="transform"
        dur="3s"
        repeatCount="indefinite"
        type="scale"
        values="1;1.06;1"
      />
      <g transform="scale(4.6) translate(-8 -8)">
        <path
          clipRule="evenodd"
          d="M2.471 11.318a1.474 1.474 0 001.47-1.471v-1.47h-1.47A1.474 1.474 0 001 9.846c.001.811.659 1.469 1.47 1.47zm3.682-2.942a1.474 1.474 0 00-1.47 1.471v3.683c.002.811.659 1.468 1.47 1.47a1.474 1.474 0 001.47-1.47V9.846a1.474 1.474 0 00-1.47-1.47zM4.683 2.471c.001.811.659 1.469 1.47 1.47h1.47v-1.47A1.474 1.474 0 006.154 1a1.474 1.474 0 00-1.47 1.47zm2.94 3.682a1.474 1.474 0 00-1.47-1.47H2.47A1.474 1.474 0 001 6.153c.002.812.66 1.469 1.47 1.47h3.684a1.474 1.474 0 001.47-1.47zM9.847 7.624a1.474 1.474 0 001.47-1.47V2.47A1.474 1.474 0 009.848 1a1.474 1.474 0 00-1.47 1.47v3.684c.002.81.659 1.468 1.47 1.47zm3.682-2.941a1.474 1.474 0 00-1.47 1.47v1.47h1.47A1.474 1.474 0 0015 6.154a1.474 1.474 0 00-1.47-1.47zM8.377 9.847c.002.811.659 1.469 1.47 1.47h3.683A1.474 1.474 0 0015 9.848a1.474 1.474 0 00-1.47-1.47H9.847a1.474 1.474 0 00-1.47 1.47zm2.94 3.682a1.474 1.474 0 00-1.47-1.47h-1.47v1.47c.002.812.659 1.469 1.47 1.47a1.474 1.474 0 001.47-1.47z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </g>
    </g>
  </Frame>
);

const GoogleSheets = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={NEUTRAL_STRONG}>
      <rect height="64" rx="6" width="92" x="64" y="28" {...stroke} />
      <line x1="64" x2="156" y1="46" y2="46" {...stroke} />
      <line x1="64" x2="156" y1="64" y2="64" {...stroke} />
      <line x1="94" x2="94" y1="28" y2="92" {...stroke} />
      <line x1="126" x2="126" y1="28" y2="92" {...stroke} />
    </g>
    <rect
      className={ACCENT}
      fill="currentColor"
      fillOpacity={0.2}
      height="18"
      rx="1"
      width="30"
      x="65"
      y="29"
    >
      <animate
        attributeName="x"
        dur="3.2s"
        keyTimes="0;0.25;0.5;0.75;1"
        repeatCount="indefinite"
        values="65;95;127;95;65"
      />
      <animate
        attributeName="y"
        dur="3.2s"
        keyTimes="0;0.25;0.5;0.75;1"
        repeatCount="indefinite"
        values="29;47;65;47;29"
      />
    </rect>
  </Frame>
);

const Weather = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={ACCENT}>
      <circle cx="82" cy="48" r="13" {...stroke} />
      <g {...stroke}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            transform={`rotate(${a} 82 48)`}
            x1="82"
            x2="82"
            y1="27"
            y2="31"
          />
        ))}
        <animateTransform
          attributeName="transform"
          dur="9s"
          from="0 82 48"
          repeatCount="indefinite"
          to="360 82 48"
          type="rotate"
        />
      </g>
    </g>
    <g className={NEUTRAL_STRONG}>
      <path
        d="M116 84a13 13 0 0 1 2-26 17 17 0 0 1 32 5 11 11 0 0 1-1 21Z"
        {...stroke}
      >
        <animateTransform
          additive="sum"
          attributeName="transform"
          dur="5s"
          repeatCount="indefinite"
          type="translate"
          values="0 0;7 0;0 0"
        />
      </path>
    </g>
  </Frame>
);

const DocsExpert = ({ className }: SceneProps) => (
  <Frame className={className}>
    <g className={NEUTRAL_STRONG}>
      <circle cx="86" cy="60" r="30" {...stroke} />
      <ellipse cx="86" cy="60" rx="12" ry="30" {...stroke} />
      <line x1="56" x2="116" y1="60" y2="60" {...stroke} />
      <line x1="62" x2="110" y1="45" y2="45" {...stroke} />
      <line x1="62" x2="110" y1="75" y2="75" {...stroke} />
    </g>
    <circle className={ACCENT} cx="86" cy="60" r="6" {...stroke}>
      <animate
        attributeName="r"
        dur="2.8s"
        repeatCount="indefinite"
        values="4;32"
      />
      <animate
        attributeName="opacity"
        dur="2.8s"
        repeatCount="indefinite"
        values="0.7;0"
      />
    </circle>
    <g className={ACCENT}>
      <circle cx="150" cy="48" r="12" {...stroke} />
      <line strokeWidth={3} x1="159" x2="172" y1="57" y2="70" {...stroke} />
      <animateTransform
        additive="sum"
        attributeName="transform"
        dur="3s"
        repeatCount="indefinite"
        type="translate"
        values="0 0;3 4;0 0"
      />
    </g>
  </Frame>
);

const Claw = ({ className }: SceneProps) => (
  <Frame className={className}>
    <rect
      className={NEUTRAL_STRONG}
      height="64"
      rx="8"
      width="116"
      x="52"
      y="28"
      {...stroke}
    />
    <line
      className={NEUTRAL_STRONG}
      x1="52"
      x2="168"
      y1="44"
      y2="44"
      {...stroke}
    />
    <g className={NEUTRAL}>
      <circle cx="62" cy="36" fill="currentColor" r="1.6" stroke="none" />
      <circle cx="70" cy="36" fill="currentColor" r="1.6" stroke="none" />
      <circle cx="78" cy="36" fill="currentColor" r="1.6" stroke="none" />
    </g>
    <path className={ACCENT} d="m64 58 8 6-8 6" {...stroke} />
    <line
      className={ACCENT}
      strokeWidth={3}
      x1="80"
      x2="116"
      y1="64"
      y2="64"
      {...stroke}
    >
      <animate
        attributeName="x2"
        dur="2.4s"
        keyTimes="0;0.7;1"
        repeatCount="indefinite"
        values="80;116;80"
      />
      <animate
        attributeName="opacity"
        dur="2.4s"
        keyTimes="0;0.7;0.71;1"
        repeatCount="indefinite"
        values="1;1;0;1"
      />
    </line>
  </Frame>
);

const BrowserAgent = ({ className }: SceneProps) => (
  <Frame className={className}>
    <rect
      className={NEUTRAL_STRONG}
      height="64"
      rx="8"
      width="116"
      x="52"
      y="28"
      {...stroke}
    />
    <line
      className={NEUTRAL_STRONG}
      x1="52"
      x2="168"
      y1="44"
      y2="44"
      {...stroke}
    />
    <g className={ACCENT}>
      <circle cx="62" cy="36" r="2" {...stroke} />
      <circle cx="70" cy="36" r="2" {...stroke} />
      <circle cx="78" cy="36" r="2" {...stroke} />
    </g>
    <g className={NEUTRAL}>
      <line x1="64" x2="118" y1="58" y2="58" {...stroke} />
      <line x1="64" x2="102" y1="70" y2="70" {...stroke} />
    </g>
    <circle className={ACCENT} cx="130" cy="66" fill="none" r="3" {...stroke}>
      <animate
        attributeName="r"
        dur="3.4s"
        keyTimes="0;0.45;0.6;1"
        repeatCount="indefinite"
        values="0;0;13;0"
      />
      <animate
        attributeName="opacity"
        dur="3.4s"
        keyTimes="0;0.45;0.6;1"
        repeatCount="indefinite"
        values="0;0.8;0;0"
      />
    </circle>
    <path
      className={ACCENT}
      d="m0 0 0 17 4.5-4.5 4 9 2.8-1.2-4-8.8 6.4 0Z"
      fill="currentColor"
      {...stroke}
    >
      <animateTransform
        attributeName="transform"
        dur="3.4s"
        keyTimes="0;0.4;0.6;1"
        repeatCount="indefinite"
        type="translate"
        values="96 40;126 62;126 62;96 40"
      />
    </path>
  </Frame>
);

const CompanyKnowledge = ({ className }: SceneProps) => (
  <Frame className={className}>
    {[
      { x: 38, y: 38 },
      { x: 52, y: 82 },
      { x: 42, y: 60 },
      { x: 70, y: 32 },
    ].map((d, i) => (
      <circle
        className={NEUTRAL_STRONG}
        cx={d.x}
        cy={d.y}
        fill="currentColor"
        key={d.x}
        r="3"
        stroke="none"
      >
        <animate
          attributeName="opacity"
          begin={`${i * 0.3}s`}
          dur="3s"
          repeatCount="indefinite"
          values="0.2;1;0.2"
        />
      </circle>
    ))}
    <g className={NEUTRAL}>
      <line x1="42" x2="112" y1="60" y2="58" {...stroke} />
      <line x1="38" x2="112" y1="38" y2="50" {...stroke} />
      <line x1="52" x2="112" y1="82" y2="66" {...stroke} />
      <line x1="70" x2="112" y1="32" y2="52" {...stroke} />
    </g>
    <g className={ACCENT}>
      <path
        d="M148 26 176 36 V58 C176 78 164 90 148 96 C132 90 120 78 120 58 V36 Z"
        {...stroke}
      />
      <path d="m136 58 8 8 16-18" {...stroke}>
        <animate
          attributeName="opacity"
          dur="3s"
          repeatCount="indefinite"
          values="0;0;1;1"
        />
      </path>
    </g>
  </Frame>
);

const SCENES: Record<string, (props: SceneProps) => React.JSX.Element> = {
  "browser-agent": BrowserAgent,
  "chat-with-pdf": ChatWithPdf,
  "chat-with-youtube": ChatWithYoutube,
  claw: Claw,
  "company-knowledge": CompanyKnowledge,
  "csv-to-questions": CsvToQuestions,
  "deep-search": DeepSearch,
  "docs-chatbot": DocsChatbot,
  "docs-expert": DocsExpert,
  "feedback-summary": FeedbackSummary,
  "flashcards-pdf": FlashcardsPdf,
  "github-review": GithubReview,
  "google-sheets": GoogleSheets,
  "meeting-notes": MeetingNotes,
  "slack-agent": SlackAgent,
  "text-to-sql": TextToSql,
  weather: Weather,
};

export const AgentAnimation = ({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) => {
  const Scene = SCENES[slug] ?? DeepSearch;
  return <Scene className={className} />;
};
