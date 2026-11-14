import type { CSSProperties } from "react";

const FIREFLIES = [
  { left: 6, delay: 0, dur: 9, drift: 30, size: 4 },
  { left: 14, delay: 2.2, dur: 11, drift: -24, size: 3 },
  { left: 23, delay: 4.1, dur: 8, drift: 18, size: 5 },
  { left: 31, delay: 1.3, dur: 12, drift: -32, size: 3 },
  { left: 40, delay: 5.4, dur: 9.5, drift: 26, size: 4 },
  { left: 49, delay: 0.8, dur: 10.5, drift: -18, size: 3 },
  { left: 57, delay: 3.6, dur: 8.5, drift: 34, size: 5 },
  { left: 65, delay: 6.2, dur: 11.5, drift: -26, size: 3 },
  { left: 73, delay: 2.9, dur: 9, drift: 20, size: 4 },
  { left: 81, delay: 4.8, dur: 12.5, drift: -30, size: 3 },
  { left: 89, delay: 1.7, dur: 8.8, drift: 24, size: 4 },
  { left: 95, delay: 5.9, dur: 10.2, drift: -20, size: 3 },
];

const STARS = [
  { left: 8, top: 18, size: 2, delay: 0 },
  { left: 18, top: 32, size: 1.5, delay: 1.2 },
  { left: 27, top: 12, size: 2, delay: 2.1 },
  { left: 38, top: 26, size: 1.5, delay: 0.6 },
  { left: 47, top: 16, size: 2.5, delay: 1.8 },
  { left: 58, top: 30, size: 1.5, delay: 2.6 },
  { left: 66, top: 10, size: 2, delay: 0.3 },
  { left: 76, top: 24, size: 1.5, delay: 1.5 },
  { left: 85, top: 14, size: 2, delay: 2.9 },
  { left: 93, top: 28, size: 1.5, delay: 0.9 },
];

export function FooterNature() {
  return (
    <div className="forest-night" aria-hidden="true">
      <div className="forest-night-sky" />
      {STARS.map((s, i) => (
        <span
          key={i}
          className="forest-night-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          } as CSSProperties}
        />
      ))}
      <div className="forest-night-moon" />
      <div className="forest-night-mist forest-night-mist--a" />
      <div className="forest-night-mist forest-night-mist--b" />
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.dur}s`,
            "--fx": `${f.drift}px`,
          } as CSSProperties}
        />
      ))}
      <svg className="forest-night-silhouette" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <g className="sway sway--far" fill="#0e2c1d" opacity="0.7">
          <path d="M0 320 V260 C 21 247 54 209 92 204 C 134 211 156 237 173 249 C 191 246 225 206 257 200 C 293 207 305 235 320 248 C 337 245 361 204 392 198 C 427 205 449 251 463 264 C 478 248 509 212 536 207 C 565 213 572 240 584 251 C 599 253 629 225 657 221 C 688 226 699 248 712 257 C 730 255 751 231 784 228 C 820 232 846 243 861 251 C 885 246 894 207 938 202 C 985 209 1039 242 1059 254 C 1082 245 1121 205 1162 199 C 1208 206 1229 240 1248 253 C 1263 253 1289 225 1316 221 C 1345 226 1358 253 1370 262 C 1386 256 1406 232 1436 229 C 1452 233 1432 247 1440 254 L1440 320 Z" />
        </g>
        <g className="sway sway--mid" fill="#0a2418">
          <path d="M0 320 V306 C 18 275 31 201 65 191 C 101 204 137 290 152 313 C 170 271 179 191 212 180 C 248 194 287 283 302 308 C 316 278 324 211 349 201 C 377 213 406 278 418 299 C 435 273 452 196 482 185 C 516 198 543 286 557 310 C 576 263 593 171 628 158 C 666 174 699 271 715 300 C 733 264 751 174 785 161 C 822 177 854 270 869 299 C 886 270 892 188 923 176 C 956 190 994 286 1008 312 C 1021 259 1026 161 1050 147 C 1076 164 1107 281 1118 312 C 1137 258 1152 158 1187 144 C 1226 162 1262 272 1278 304 C 1290 273 1311 198 1334 187 C 1359 200 1372 279 1382 303 C 1398 266 1427 178 1440 190 L1440 320 Z" />
        </g>
        <g className="sway sway--near" fill="#04100b">
          <path d="M0 320 V309 C 14 260 20 163 45 149 C 72 166 102 278 113 309 C 131 251 144 139 177 123 C 214 143 252 278 267 313 C 287 238 332 105 368 86 C 408 109 416 259 433 301 C 447 235 469 96 496 76 C 524 100 541 259 553 303 C 572 245 594 123 629 106 C 668 127 699 268 715 307 C 731 260 754 164 782 150 C 814 167 833 269 846 300 C 864 233 897 91 931 71 C 967 96 983 268 998 313 C 1014 265 1048 176 1078 164 C 1110 180 1120 277 1134 305 C 1146 249 1157 133 1180 117 C 1205 137 1228 265 1238 302 C 1251 252 1272 142 1296 127 C 1322 146 1335 275 1346 310 C 1360 234 1386 95 1412 75 C 1430 92 1432 269 1440 300 L1440 320 Z" />
        </g>
      </svg>
    </div>
  );
}
