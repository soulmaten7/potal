export default function Footer() {
  return (
    <footer className="mt-12 bg-slate-950 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">POTAL</h2>
          <p className="mt-2 text-sm text-slate-400">
            Local Fast Delivery vs Global Best Price
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Quick Links
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="/" className="hover:text-white transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="/" className="hover:text-white transition-colors">
                Search
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                About AI
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Legal
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Contact
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href="mailto:support@potal.com"
                className="hover:text-white transition-colors"
              >
                support@potal.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Comprehensive Affiliate Disclaimer */}
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-xs leading-snug text-slate-500">
            POTAL participates in various affiliate marketing programs, which means we may get paid
            commissions on products purchased through our links to retailer sites. As an Amazon
            Associate, we earn from qualifying purchases.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            © 2026 POTAL. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Mobile Version</a>
            <span className="mx-1.5 text-slate-600">|</span>
            <a href="#" className="hover:text-slate-300 transition-colors">PC Version</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
