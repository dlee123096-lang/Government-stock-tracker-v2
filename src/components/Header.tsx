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
            className="flex items-center gap-2.5 font-bold text-lg text-slate-900"
          >
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logo-g)" />
              <path
                d="M4,24 L8,18 L12,21 L17,11 L21,15 L26,8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="17" cy="11" r="3" fill="white" />
            </svg>
            <span>
              Signal<span className="text-blue-600">Alpha</span>
            </span>
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
            <Link
              href="/officials"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Officials
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
            <Link
              href="/officials"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Officials
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
