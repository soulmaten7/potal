export default function Footer() {
  return (
    <footer className="mt-12 bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">POTAL</h2>
          <p className="mt-2 text-sm text-gray-400">
            US Fast vs Global Cheap
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
              <a href="/" className="hover:text-white transition-colors">
                Deals
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
              Email:{" "}
              <a
                href="mailto:support@potal.com"
                className="hover:text-white transition-colors"
              >
                support@potal.com
              </a>
            </li>
            <li>Phone: +1 (000) 000-0000</li>
          </ul>
        </div>
      </div>

      {/* Affiliate Disclosure */}
      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-[11px] leading-snug text-gray-400">
            POTAL is a participant in the Amazon Services LLC Associates Program, an affiliate
            advertising program designed to provide a means for sites to earn advertising fees by
            advertising and linking to Amazon.com.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            © 2026 POTAL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

