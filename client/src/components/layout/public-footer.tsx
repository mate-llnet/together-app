import { Link } from "wouter";
import { Heart, Mail, Github, Twitter, Linkedin } from "lucide-react";
import { getVersionInfo } from "@shared/version";

const footerLinks = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "FAQ", href: "/contact#faq" }
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" }
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Community", href: "/community" },
    { name: "Documentation", href: "/docs" },
    { name: "Contact Support", href: "/contact" }
  ]
};

const socialLinks = [
  { name: "Twitter", href: "#", icon: Twitter },
  { name: "LinkedIn", href: "#", icon: Linkedin },
  { name: "GitHub", href: "#", icon: Github }
];

export default function PublicFooter() {
  const versionInfo = getVersionInfo();
  
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" data-testid="public-footer">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity" data-testid="footer-logo">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  AppreciateMate
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium -mt-1">
                  {versionInfo.displayVersion}
                </span>
              </div>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed max-w-md" data-testid="footer-description">
              A relationship appreciation app that helps couples track and celebrate each other's daily contributions, building stronger bonds through recognition and gratitude.
            </p>
            
            <div className="flex space-x-4" data-testid="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-indigo-600 hover:text-white transition-all duration-300 group"
                  data-testid={`social-${social.name.toLowerCase()}`}
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4" data-testid="footer-product-title">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    data-testid={`footer-product-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4" data-testid="footer-company-title">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    data-testid={`footer-company-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4" data-testid="footer-support-title">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    data-testid={`footer-support-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" data-testid="newsletter-title">
              Stay Updated
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm" data-testid="newsletter-description">
              Get the latest relationship tips and AppreciateMate updates delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                data-testid="newsletter-email"
              />
              <button
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg"
                data-testid="newsletter-submit"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400" data-testid="copyright">
            © 2024 AppreciateMate. All rights reserved.
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-testid="footer-privacy">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-testid="footer-terms">
              Terms
            </Link>
            <a href="mailto:hello@appreciatemate.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1" data-testid="footer-email">
              <Mail className="h-4 w-4" />
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}