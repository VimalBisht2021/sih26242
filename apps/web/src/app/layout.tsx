import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'AI-Assisted RPL Assessment Platform | SIH PS26242',
  description: 'Recognition of Prior Learning (RPL) Assessment Tool with deterministic scoring, evidence traceability, and offline sync for Ministry of Skill Development and Entrepreneurship (MSDE).'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
