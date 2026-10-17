"use client";

import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Open-source SVG Brand Icons for Payments & Rewards
 */

// UPI (Unified Payments Interface)
export const UpiIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M14.5 3L8 21H11.5L18 3H14.5Z"
      fill="#097939"
    />
    <path
      d="M10 3L3.5 21H7L13.5 3H10Z"
      fill="#ED752E"
    />
    <path
      d="M17.5 12L15.5 17.5H19L21 12H17.5Z"
      fill="#097939"
    />
  </svg>
);

// Google Pay (GPay)
export const GPayIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Google G Symbol */}
    <path
      d="M23 12.26c0-.8-.07-1.56-.2-2.3H12v4.44h6.18c-.27 1.42-1.07 2.62-2.28 3.42v2.85h3.69c2.16-1.99 3.41-4.91 3.41-8.41z"
      fill="#4285F4"
    />
    <path
      d="M12 23.5c3.1 0 5.71-1.03 7.61-2.79l-3.69-2.85c-1.03.69-2.35 1.1-3.92 1.1-3.02 0-5.58-2.04-6.49-4.78H1.68v2.94C3.58 20.9 7.51 23.5 12 23.5z"
      fill="#34A853"
    />
    <path
      d="M5.51 14.18c-.23-.69-.36-1.43-.36-2.18s.13-1.49.36-2.18V6.88H1.68C.91 8.42.47 10.16.47 12s.44 3.58 1.21 5.12l3.83-2.94z"
      fill="#FBBC05"
    />
    <path
      d="M12 4.96c1.69 0 3.2.58 4.39 1.72l3.3-3.3C17.7 1.57 15.09.5 12 .5 7.51.5 3.58 3.1 1.68 6.88l3.83 2.94c.91-2.74 3.47-4.86 6.49-4.86z"
      fill="#EA4335"
    />
  </svg>
);

// PhonePe
export const PhonePeIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect width="24" height="24" rx="6" fill="#5F259F" />
    <path
      d="M14.8 6.5H12.5C9.8 6.5 8.2 8.1 8.2 10.8V18.5H10.8V15.2H14.8C17.5 15.2 19 13.6 19 10.8C19 8.1 17.5 6.5 14.8 6.5ZM14.6 12.8H10.8V8.9H14.6C15.9 8.9 16.5 9.6 16.5 10.8C16.5 12.1 15.9 12.8 14.6 12.8Z"
      fill="white"
    />
    <path
      d="M12.2 13.8L6 18.5H9.6L14 15.2L12.2 13.8Z"
      fill="white"
    />
  </svg>
);

// Paytm
export const PaytmIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect width="24" height="24" rx="6" fill="#002E6E" />
    <path
      d="M4.5 15.5V8.5H7.2C8.5 8.5 9.3 9.2 9.3 10.3C9.3 11.4 8.5 12.1 7.2 12.1H6V15.5H4.5ZM6 10.8H7C7.6 10.8 7.9 10.5 7.9 10.3C7.9 10.1 7.6 9.8 7 9.8H6V10.8Z"
      fill="#00BAF2"
    />
    <path
      d="M10 15.5L12 8.5H13.6L11.6 15.5H10Z"
      fill="white"
    />
    <path
      d="M14 15.5V10H12.8V8.7H14V7.5C14 6.7 14.5 6.2 15.4 6.2H16.5V7.4H15.6C15.4 7.4 15.3 7.5 15.3 7.8V8.7H16.8V10H15.3V15.5H14Z"
      fill="#00BAF2"
    />
    <path
      d="M17.5 15.5V8.5H19V15.5H17.5Z"
      fill="white"
    />
  </svg>
);

// Amazon / Amazon Gift Card
export const AmazonIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect width="24" height="24" rx="6" fill="#232F3E" />
    {/* Amazon Smile Curve */}
    <path
      d="M4.5 15.5C8.5 18 15.5 18 19.5 14.5"
      stroke="#FF9900"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M18.2 13.5L20 14.5L19 16.5"
      stroke="#FF9900"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.2 8.5C6.5 8.5 5.5 9.7 5.5 11.2C5.5 12.8 6.6 13.8 8.1 13.8C9.2 13.8 10.1 13.2 10.6 12.4V13.7H12.1V7H10.6V8.2C10.1 7.4 9.2 6.8 8.2 6.8C6.3 6.8 4.9 8.3 4.9 10.3C4.9 12.3 6.3 13.9 8.2 13.9C9.4 13.9 10.3 13.2 10.8 12.2V13.7H12.3V7H10.8V8.3C10.3 7.5 9.4 6.8 8.2 6.8V8.5Z"
      fill="white"
      opacity="0.9"
    />
  </svg>
);

// Solana (SOL)
export const SolanaIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M5 6.2C5.3 5.8 5.7 5.5 6.2 5.5H20.2C20.6 5.5 20.8 6 20.5 6.3L19 7.8C18.7 8.2 18.3 8.5 17.8 8.5H3.8C3.4 8.5 3.2 8 3.5 7.7L5 6.2Z"
      fill="url(#solana-grad1)"
    />
    <path
      d="M5 16.2C5.3 15.8 5.7 15.5 6.2 15.5H20.2C20.6 15.5 20.8 16 20.5 16.3L19 17.8C18.7 18.2 18.3 18.5 17.8 18.5H3.8C3.4 18.5 3.2 18 3.5 17.7L5 16.2Z"
      fill="url(#solana-grad2)"
    />
    <path
      d="M19 11.2C18.7 10.8 18.3 10.5 17.8 10.5H3.8C3.4 10.5 3.2 11 3.5 11.3L5 12.8C5.3 13.2 5.7 13.5 6.2 13.5H20.2C20.6 13.5 20.8 13 20.5 12.7L19 11.2Z"
      fill="url(#solana-grad3)"
    />
    <defs>
      <linearGradient id="solana-grad1" x1="3" y1="7" x2="21" y2="7" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <linearGradient id="solana-grad2" x1="3" y1="17" x2="21" y2="17" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <linearGradient id="solana-grad3" x1="3" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DC1FFF" />
        <stop offset="1" stopColor="#00FFA3" />
      </linearGradient>
    </defs>
  </svg>
);

// Bitcoin (BTC)
export const BitcoinIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="11" fill="#F7931A" />
    <path
      d="M15.8 10.2C16.1 8.8 15.2 8.1 13.9 7.7L14.4 5.7L13.2 5.4L12.7 7.3C12.4 7.2 12.1 7.2 11.8 7.1L12.3 5.2L11.1 4.9L10.6 6.8C10.3 6.7 10.1 6.7 9.8 6.6L9.8 6.6L8.2 6.2L7.9 7.4C7.9 7.4 8.7 7.6 8.7 7.6C9.2 7.7 9.3 8 9.2 8.3L8.4 11.6C8.5 11.6 8.6 11.7 8.7 11.7L8.6 11.7L7.4 16.4C7.3 16.7 7 16.9 6.6 16.8C6.6 16.8 5.8 16.6 5.8 16.6L5.3 17.8L6.8 18.2C7.1 18.3 7.4 18.4 7.6 18.4L7.1 20.4L8.3 20.7L8.8 18.7C9.1 18.8 9.4 18.9 9.7 18.9L9.2 20.9L10.4 21.2L10.9 19.2C13 19.6 14.5 19.4 15.2 17.6C15.8 16.1 15.3 15.2 14.2 14.7C15 14.3 15.6 13.5 15.8 12.3C15.9 12.1 16 11.8 16 11.5C16 11 15.9 10.6 15.8 10.2ZM13.3 14.9C12.9 16.5 10.3 15.7 9.5 15.5L10.3 12.3C11.1 12.5 13.7 13.2 13.3 14.9ZM13.8 10.6C13.5 12 11.3 11.4 10.6 11.2L11.3 8.3C12 8.5 14.2 9.1 13.8 10.6Z"
      fill="white"
    />
  </svg>
);

// Ethereum (ETH)
export const EthereumIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect width="24" height="24" rx="6" fill="#1C1E24" />
    <path
      d="M12 3.5L6.5 12.5L12 15.8L17.5 12.5L12 3.5Z"
      fill="#8A92B2"
    />
    <path
      d="M12 3.5V15.8L17.5 12.5L12 3.5Z"
      fill="#62688F"
    />
    <path
      d="M12 16.8L6.5 13.6L12 21.2L17.5 13.6L12 16.8Z"
      fill="#8A92B2"
    />
    <path
      d="M12 16.8V21.2L17.5 13.6L12 16.8Z"
      fill="#62688F"
    />
    <path
      d="M12 15.8L6.5 12.5L12 9.9L17.5 12.5L12 15.8Z"
      fill="#454A75"
    />
  </svg>
);
