import Link from "next/link";
import { ShopLink } from "@/components/shop-link";
import { NeighborhoodArt, SmallIcon } from "@/components/brand-art";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="location-pill"><span className="live-dot" /> A little more local · Hyderabad</p>
          <h1>Your neighborhood.<br />A little <em>closer.</em></h1>
          <p className="hero-description">The corner shop. The familiar faces. The offers worth dropping by for. Find your local favorites, all in one simple place.</p>
          <div className="hero-actions"><Link href="/nearby" className="button-primary">Find nearby shops <SmallIcon kind="arrow" /></Link><ShopLink href="/s/demo-shop" className="button-text">Explore the demo shop →</ShopLink></div>
          <p className="hero-reassurance"><SmallIcon kind="check" /> No app to download. No customer login.</p>
        </div>
        <div className="hero-art"><NeighborhoodArt /><div className="art-note"><span className="note-icon"><SmallIcon kind="bag" /></span><div><strong>Good things, just around the corner.</strong><p>Your neighborhood, connected.</p></div></div><span className="art-caption">A little illustration of local life</span></div>
      </section>
      <section className="neighborhood-section" aria-labelledby="places-heading">
        <div className="section-intro"><div><p className="eyebrow">BIG LOVE FOR SMALL BUSINESSES</p><h2 id="places-heading">Everyday places. <em>Extra special.</em></h2></div><p>For the shops that make your<br className="hidden sm:block" /> neighborhood feel like home.</p></div>
        <div className="category-grid">{[
          { kind: "bag" as const, name: "Everyday essentials", detail: "Your trusty neighborhood kirana", tone: "sage" },
          { kind: "bread" as const, name: "Fresh from the oven", detail: "Bakeries and little local treats", tone: "peach" },
          { kind: "scissors" as const, name: "A little self-care", detail: "Salons around your corner", tone: "sand" },
        ].map(category => <div className={`category-card ${category.tone}`} key={category.name}><span className="category-icon"><SmallIcon kind={category.kind} /></span><div><h3>{category.name}</h3><p>{category.detail}</p></div></div>)}</div>
      </section>
      <section className="how-section" aria-labelledby="how-heading"><div className="how-title"><p className="eyebrow">LESS FUSS. MORE LOCAL.</p><h2 id="how-heading">Just a scan<br /> away.</h2><Link href="/nearby" className="button-text">Explore your neighborhood ↗</Link></div><ol className="how-steps">{[
        { icon: "scan" as const, title: "Scan or discover", text: "Scan a shop’s QR, or find a place in your neighborhood." },
        { icon: "spark" as const, title: "See what’s on offer", text: "Browse the latest published offers, straight from the shop." },
        { icon: "pin" as const, title: "Drop by. Say hello.", text: "Get directions, share a find, and shop in person." },
      ].map((step, i) => <li key={step.title}><span className="step-icon"><SmallIcon kind={step.icon} /></span><div><span className="step-number">0{i + 1}</span><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></section>
      <section className="owner-banner"><div><p className="eyebrow">YOUR SHOP. YOUR STORY.</p><h2>A place online.<br />For your place around the corner.</h2><p>One permanent QR. Offers you control. A simpler way to stay connected.</p></div><Link href="/owner" className="button-light">I’m a shop owner <SmallIcon kind="arrow" /></Link></section>
    </div>
  );
}
