"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-gray-900"
          >
            <span className="inline-block w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-purple-600" />
            SignalAlpha
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
