export default function Garment({ kind = 'tee' }) {
  const hoodie = kind === 'hoodie';
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={hoodie ? 'Hoodie' : 'T-shirt'} className="garment">
      <path
        d={hoodie
          ? 'M62 50 Q100 12 138 50 L174 82 L156 152 L140 142 L140 174 L60 174 L60 142 L44 152 L26 82 Z'
          : 'M60 40 L90 28 Q100 46 110 28 L140 40 L174 78 L148 94 L138 84 L138 170 L62 170 L62 84 L52 94 L26 78 Z'}
        fill="#1d1d1d" stroke="rgba(255,255,255,.16)" strokeWidth="1.2" />
      {hoodie && <path d="M78 46 Q100 74 122 46" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.2" />}
      <g transform="translate(85.6 94) scale(.32)">
        <path d="M15 6C45 6 45 52 75 52" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        <path d="M15 52C45 52 45 6 75 6" fill="none" stroke="#C6FF3D" strokeWidth="9" strokeLinecap="round" />
      </g>
    </svg>
  );
}
