import './globals.css';
import { Archivo, Fraunces } from 'next/font/google';

const body = Archivo({ subsets: ['latin'], weight: ['400', '500', '800'] });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display' });

export const metadata = {
  title: 'KROSSOVER',
  description: 'KROSSOVER clothing. Printed to order and delivered across Pakistan. Pay when it arrives.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${body.className} ${display.variable}`}>
        <div className="wrap">
          <header className="nav glass">
            <a href="/" className="brand"><img src="/logo.svg" alt="" />KROSSOVER</a>
            <nav className="nav-links" aria-label="Main">
              <a href="/#how">How it works</a>
              <a href="/#shop" className="cta">Shop</a>
            </nav>
          </header>
          {children}
          <footer>
            <span>KROSSOVER. Printed to order in Pakistan.</span>
            <span>Pay when it arrives. We confirm every order on WhatsApp first.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
