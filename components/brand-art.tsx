export function BrandMark({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}><rect width="40" height="40" rx="13" fill="#173F35" /><path d="M11 18h18v12H11z" stroke="#FFF9ED" strokeWidth="1.8" /><path d="m10 18 3-8h14l3 8M16 10v8m8-8v8" stroke="#FFF9ED" strokeWidth="1.8" strokeLinejoin="round" /><path d="M16 30v-8h8v8" stroke="#FFF9ED" strokeWidth="1.8" /><path d="M10 18c0 4 6 4 6 0 0 4 8 4 8 0 0 4 6 4 6 0" stroke="#FFF9ED" strokeWidth="1.8" /><circle cx="30" cy="10" r="5" fill="#E7945E" /></svg>;
}

export function NeighborhoodArt() {
  return <svg viewBox="0 0 540 460" fill="none" aria-hidden="true" className="neighborhood-art">
    <path d="M44 339c-39-79-9-226 103-270 79-31 102 6 172-6 113-20 184 80 173 181-11 106-82 161-212 161-108 0-198 9-236-66Z" fill="#E5EBDD" />
    <circle cx="421" cy="95" r="32" fill="#E9AB72" />
    <path d="M78 340h386" stroke="#B7C7AF" strokeWidth="2" strokeLinecap="round" />
    <path d="M89 334v-96m0 49c-38-7-50-51-27-68 11-8 22-1 27 9 1-30 33-40 43-19 16 34-3 64-43 78Z" fill="#76946F" />
    <path d="M89 339v-103m0 43-14-24m14 8 17-28" stroke="#3F6551" strokeWidth="3" strokeLinecap="round" />
    <rect x="150" y="173" width="267" height="169" rx="5" fill="#F2D3AC" />
    <path d="m140 173 18-57h253l18 57H140Z" fill="#FAF4E7" />
    {[0, 2, 4, 6].map(i => <path key={i} d={`m${158 + i * 36} 116-18 57h36l12-57h-30Z`} fill="#CE7350" />)}
    <path d="M140 173v13a18 18 0 0 0 36 0 18 18 0 0 0 36 0 18 18 0 0 0 36 0 18 18 0 0 0 36 0 18 18 0 0 0 36 0 18 18 0 0 0 36 0 18 18 0 0 0 36 0 18 18 0 0 0 36 0v-13H140Z" fill="#FAF4E7" />
    {[0, 2, 4, 6].map(i => <path key={i} d={`M${140 + i * 36} 173v13a18 18 0 0 0 36 0v-13h-36Z`} fill="#CE7350" />)}
    <rect x="177" y="225" width="100" height="91" rx="3" fill="#416754" />
    <path d="M184 272h86m-45-39v75" stroke="#AAC3A7" strokeWidth="3" />
    <rect x="300" y="217" width="87" height="125" rx="3" fill="#284E40" />
    <rect x="309" y="227" width="69" height="61" rx="2" fill="#B7C9AE" />
    <path d="M343 228v59" stroke="#284E40" strokeWidth="3" />
    <circle cx="373" cy="307" r="3" fill="#E9AB72" />
    <rect x="202" y="83" width="165" height="41" rx="8" fill="#173F35" />
    <text x="285" y="109" fill="#FFF9ED" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="700" letterSpacing="1">SHOP LOCAL</text>
    <rect x="132" y="322" width="166" height="18" rx="3" fill="#CE986A" />
    <rect x="145" y="302" width="57" height="22" rx="3" fill="#E4B17D" />
    <path d="M154 312h38m-33-6v13m10-13v13m10-13v13m10-13v13" stroke="#B27D50" strokeWidth="2" />
    <circle cx="157" cy="296" r="9" fill="#8A9B59" /><circle cx="177" cy="295" r="10" fill="#93A765" /><circle cx="192" cy="298" r="8" fill="#6F8A4C" />
    <rect x="212" y="302" width="61" height="22" rx="3" fill="#E4B17D" /><path d="M219 313h47" stroke="#B27D50" strokeWidth="2" />
    <circle cx="222" cy="296" r="8" fill="#DA8253" /><circle cx="240" cy="295" r="9" fill="#E6A25E" /><circle cx="260" cy="297" r="8" fill="#DA8253" />
    <path d="M429 336v-30" stroke="#416754" strokeWidth="3" /><path d="M428 321c-29-5-31-25-19-30 10-4 16 6 19 14 6-28 30-20 22-3-4 9-12 15-22 19Z" fill="#76946F" /><path d="m414 331 5 28h23l5-28h-33Z" fill="#CE7350" />
    <ellipse cx="289" cy="365" rx="119" ry="9" fill="#C8D3BE" opacity=".6" />
    <path d="m119 111 5-10 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" fill="#C5AD76" />
    <path d="m448 204 4-8 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="#76946F" />
  </svg>;
}

export function SmallIcon({ kind }: { kind: "pin" | "arrow" | "bag" | "bread" | "scissors" | "scan" | "check" | "spark" }) {
  const paths = {
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    bag: <><path d="M5 7h14l2 14H3L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    bread: <><path d="M5 11a4 4 0 0 1 0-8h14a4 4 0 0 1 0 8v10H5V11Z" /><path d="m9 7 1 3m4-3 1 3" /></>,
    scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8 8 13 13M8 16 21 3" /></>,
    scan: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 12h18" /><path d="M8 8h3v3H8zm6 6h3v3h-3Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}
