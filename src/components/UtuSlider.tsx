// Auto-scrolling marquee of UTU official website slider images (local copies).
// ponytail: CSS infinite-scroll, no JS timer. Upgrade to Embla if interaction needed.
const slides = [
  "H_202609081645450868.jpg","H_202609081645341492.jpg","H_202609081645238813.jpg",
  "H_202609081645149281.jpg","H_202609081645044436.jpg","H_202609081644535216.jpg",
  "H_202609081644435059.jpg","H_202609081644327657.jpg","H_202609081642185536.jpg",
  "H_202609081641588469.jpg","H_202609081641318250.jpg","H_202609081855478633.jpg",
  "H_202608131137373101.jpg","H_202608131137100446.jpg","H_202608131132480272.jpg",
  "H_202608131131259475.jpg","H_202608131130253056.jpg","H_202608131129113976.jpg",
  "H_202608131127511313.jpg","H_202608131124536144.jpg","H_202608131124095202.jpg",
  "H_202608131122161443.jpg","H_202608131121359095.jpg","H_202608131120475653.jpg",
  "H_202608131119580179.jpg","H_202608131119059861.jpg","H_202608131118149856.jpg",
  "H_202608131115145298.jpg","H_202608131114376698.jpg","H_202608131114076536.jpg",
  "H_202608131113300754.jpg","H_202608131110304783.jpg","H_202608131109131652.jpg",
  "H_202608131108123402.jpg","H_202608131107203362.jpg","H_202608131106341327.jpg",
  "H_202608131105395541.jpg","H_202608131104155064.jpg","H_202608131103254903.jpg",
  "H_202608131102486931.jpg","H_202608131102168959.jpg","H_202608131100573168.jpg",
  "H_202608131100105975.jpg","H_202608131058508775.jpg","H_202608131056559692.jpg",
  "H_202608131055019354.jpg","H_202608131053524191.jpg","H_202401111500040399.jpg",
];

// Duplicate for seamless loop
const track = [...slides, ...slides];

const UtuSlider = () => (
  <section className="py-10 overflow-hidden bg-background/50">
    <p className="text-center text-[10px] tracking-[0.25em] uppercase text-foreground/40 mb-6">
      Veer Madho Singh Bhandari Uttarakhand Technical University
    </p>

    <div
      className="flex gap-4 w-max"
      style={{ animation: "utu-scroll 80s linear infinite" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")}
    >
      {track.map((fname, i) => (
        <div key={i} className="flex-shrink-0 w-64 h-44 rounded-xl overflow-hidden shadow-lg">
          <img
            src={`/utu-slider/${fname}`}
            alt="UTU campus"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      ))}
    </div>

    <style>{`
      @keyframes utu-scroll {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </section>
);

export default UtuSlider;
