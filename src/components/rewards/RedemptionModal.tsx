"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Coffee,
  Package,
  Wallet,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  UpiIcon,
  GPayIcon,
  PhonePeIcon,
  PaytmIcon,
  AmazonIcon,
  SolanaIcon,
  BitcoinIcon,
  EthereumIcon,
} from "./PaymentIcons";

export type PayoutChannel = "UPI" | "GPAY" | "PHONEPE" | "PAYTM";

export interface RedemptionPayload {
  payoutMethod: string;
  payoutDetails: Record<string, any>;
  formattedPayout: string;
  upiId: string; // Primary fallback identifier for legacy admin tools
}

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    id: number;
    name: string;
    desc: string;
    credits: number;
    img: string;
  } | null;
  userEmail?: string;
  userName?: string;
  isRedeeming: boolean;
  redemptionSuccess: boolean;
  auditError: string | null;
  auditPendingMessage: string | null;
  onSubmit: (payload: RedemptionPayload) => Promise<void>;
}

export function RedemptionModal({
  isOpen,
  onClose,
  reward,
  userEmail = "",
  userName = "",
  isRedeeming,
  redemptionSuccess,
  auditError,
  auditPendingMessage,
  onSubmit,
}: RedemptionModalProps) {
  // Direct Payout Channel: UPI, Google Pay, PhonePe, Paytm
  const [cashChannel, setCashChannel] = useState<PayoutChannel>("GPAY");
  const [upiValue, setUpiValue] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Amazon Voucher fields
  const [amazonEmail, setAmazonEmail] = useState("");
  const [amazonPhone, setAmazonPhone] = useState("");

  // Cafe Voucher fields
  const [cafePhone, setCafePhone] = useState("");
  const [cafeMemberName, setCafeMemberName] = useState("");

  // Physical Delivery fields
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPin, setShippingPin] = useState("");

  // Crypto fields
  const [cryptoMode, setCryptoMode] = useState<"WALLET" | "CASH">("WALLET");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoCashMethod, setCryptoCashMethod] = useState<PayoutChannel>("UPI");
  const [cryptoCashValue, setCryptoCashValue] = useState("");

  // Sync default user data upon opening
  useEffect(() => {
    if (isOpen) {
      setAmazonEmail(userEmail || "");
      setCafeMemberName(userName || "");
      setShippingName(userName || "");
    }
  }, [isOpen, userEmail, userName]);

  // Identify Reward Category
  const rewardType = useMemo(() => {
    if (!reward) return "DIRECT_PAYOUT";
    const name = reward.name.toLowerCase();
    if (name.includes("amazon")) return "AMAZON_VOUCHER";
    if (name.includes("cafe") || name.includes("riderz")) return "CAFE_COINS";
    if (name.includes("box") || name.includes("nimki") || name.includes("thekua")) return "PHYSICAL_BOX";
    if (name.includes("solana")) return "CRYPTO_SOL";
    if (name.includes("bitcoin") || name.includes("btc")) return "CRYPTO_BTC";
    if (name.includes("ethereum") || name.includes("eth")) return "CRYPTO_ETH";
    return "DIRECT_PAYOUT";
  }, [reward]);

  // Validation
  const isValidPhone = (p: string) => /^[6-9]\d{9}$/.test(p.trim());
  const isValidUpi = (u: string) => /^[\w.-]+@[\w.-]+$/.test(u.trim());
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const validationState = useMemo(() => {
    switch (rewardType) {
      case "DIRECT_PAYOUT": {
        if (cashChannel === "UPI") {
          const valid = isValidUpi(upiValue);
          return {
            isValid: valid,
            error: upiValue && !valid ? "Please enter a valid UPI ID (e.g. name@oksbi)" : null,
          };
        } else {
          const valid = isValidPhone(phoneNumber);
          return {
            isValid: valid,
            error: phoneNumber && !valid ? "Please enter a valid 10-digit mobile number" : null,
          };
        }
      }
      case "AMAZON_VOUCHER": {
        const emailValid = isValidEmail(amazonEmail);
        const phoneValid = !amazonPhone.trim() || isValidPhone(amazonPhone);
        return {
          isValid: emailValid && phoneValid,
          error:
            amazonEmail && !emailValid
              ? "Please enter a valid email address"
              : amazonPhone && !phoneValid
              ? "Phone must be a valid 10-digit number"
              : null,
        };
      }
      case "CAFE_COINS": {
        const phoneValid = isValidPhone(cafePhone);
        const nameValid = cafeMemberName.trim().length >= 2;
        return {
          isValid: phoneValid && nameValid,
          error:
            cafePhone && !phoneValid
              ? "Please enter a valid 10-digit WhatsApp/mobile number"
              : cafeMemberName && !nameValid
              ? "Please enter your member name"
              : null,
        };
      }
      case "PHYSICAL_BOX": {
        const nameValid = shippingName.trim().length >= 2;
        const phoneValid = isValidPhone(shippingPhone);
        const addrValid = shippingAddress.trim().length >= 8;
        const cityValid = shippingCity.trim().length >= 2;
        const stateValid = shippingState.trim().length >= 2;
        const pinValid = /^\d{6}$/.test(shippingPin.trim());
        const valid = nameValid && phoneValid && addrValid && cityValid && stateValid && pinValid;
        return {
          isValid: valid,
          error:
            shippingPhone && !phoneValid
              ? "10-digit mobile required for courier delivery"
              : shippingPin && !pinValid
              ? "6-digit postal PIN code required"
              : null,
        };
      }
      case "CRYPTO_SOL":
      case "CRYPTO_BTC":
      case "CRYPTO_ETH": {
        if (cryptoMode === "WALLET") {
          let valid = false;
          let hint = "Valid wallet address required";
          if (rewardType === "CRYPTO_SOL") {
            valid = cryptoAddress.trim().length >= 32 && cryptoAddress.trim().length <= 44;
            hint = "Valid Solana address (32-44 characters) required";
          } else if (rewardType === "CRYPTO_ETH") {
            valid = /^0x[a-fA-F0-9]{40}$/.test(cryptoAddress.trim());
            hint = "Valid Ethereum (0x...) 42-char address required";
          } else {
            valid = cryptoAddress.trim().length >= 26 && cryptoAddress.trim().length <= 62;
            hint = "Valid Bitcoin wallet address required";
          }
          return {
            isValid: valid,
            error: cryptoAddress && !valid ? hint : null,
          };
        } else {
          // Cash alternative
          if (cryptoCashMethod === "UPI") {
            const valid = isValidUpi(cryptoCashValue);
            return {
              isValid: valid,
              error: cryptoCashValue && !valid ? "Enter a valid UPI ID (e.g. name@oksbi)" : null,
            };
          } else {
            const valid = isValidPhone(cryptoCashValue);
            return {
              isValid: valid,
              error: cryptoCashValue && !valid ? "Enter a valid 10-digit phone number" : null,
            };
          }
        }
      }
      default:
        return { isValid: false, error: null };
    }
  }, [
    rewardType,
    cashChannel,
    upiValue,
    phoneNumber,
    amazonEmail,
    amazonPhone,
    cafePhone,
    cafeMemberName,
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingPin,
    cryptoMode,
    cryptoAddress,
    cryptoCashMethod,
    cryptoCashValue,
  ]);

  const handleSubmit = async () => {
    if (!validationState.isValid || isRedeeming) return;

    let payload: RedemptionPayload;

    switch (rewardType) {
      case "DIRECT_PAYOUT": {
        if (cashChannel === "UPI") {
          payload = {
            payoutMethod: "UPI",
            payoutDetails: { upiId: upiValue.trim() },
            formattedPayout: `UPI: ${upiValue.trim()}`,
            upiId: upiValue.trim(),
          };
        } else {
          payload = {
            payoutMethod: cashChannel,
            payoutDetails: { phoneNumber: phoneNumber.trim(), channel: cashChannel },
            formattedPayout: `${cashChannel === "GPAY" ? "Google Pay" : cashChannel === "PHONEPE" ? "PhonePe" : "Paytm"}: +91 ${phoneNumber.trim()}`,
            upiId: `${phoneNumber.trim()}@${cashChannel.toLowerCase()}`,
          };
        }
        break;
      }
      case "AMAZON_VOUCHER": {
        payload = {
          payoutMethod: "AMAZON_GIFT_CARD",
          payoutDetails: {
            email: amazonEmail.trim(),
            phone: amazonPhone.trim() || undefined,
          },
          formattedPayout: `Amazon Voucher -> Email: ${amazonEmail.trim()}${amazonPhone.trim() ? ` (SMS: ${amazonPhone.trim()})` : ""}`,
          upiId: amazonEmail.trim(),
        };
        break;
      }
      case "CAFE_COINS": {
        payload = {
          payoutMethod: "CAFE_COUPON",
          payoutDetails: {
            phone: cafePhone.trim(),
            memberName: cafeMemberName.trim(),
          },
          formattedPayout: `Riderz Hub Cafe -> WhatsApp: +91 ${cafePhone.trim()} (${cafeMemberName.trim()})`,
          upiId: cafePhone.trim(),
        };
        break;
      }
      case "PHYSICAL_BOX": {
        payload = {
          payoutMethod: "PHYSICAL_DELIVERY",
          payoutDetails: {
            fullName: shippingName.trim(),
            phone: shippingPhone.trim(),
            address: shippingAddress.trim(),
            city: shippingCity.trim(),
            state: shippingState.trim(),
            pincode: shippingPin.trim(),
          },
          formattedPayout: `Courier Delivery -> ${shippingName.trim()}, ${shippingAddress.trim()}, ${shippingCity.trim()}, ${shippingState.trim()} - ${shippingPin.trim()} (Phone: ${shippingPhone.trim()})`,
          upiId: `Ship: ${shippingPin.trim()} / ${shippingPhone.trim()}`,
        };
        break;
      }
      case "CRYPTO_SOL":
      case "CRYPTO_BTC":
      case "CRYPTO_ETH": {
        const coinSymbol = rewardType === "CRYPTO_SOL" ? "SOL" : rewardType === "CRYPTO_BTC" ? "BTC" : "ETH";
        if (cryptoMode === "WALLET") {
          payload = {
            payoutMethod: `CRYPTO_${coinSymbol}`,
            payoutDetails: {
              currency: coinSymbol,
              address: cryptoAddress.trim(),
            },
            formattedPayout: `${coinSymbol} Wallet: ${cryptoAddress.trim()}`,
            upiId: `${coinSymbol}: ${cryptoAddress.trim()}`,
          };
        } else {
          payload = {
            payoutMethod: `${cryptoCashMethod}_INR_ALTERNATIVE`,
            payoutDetails: {
              cashMethod: cryptoCashMethod,
              identifier: cryptoCashValue.trim(),
              convertedCurrency: coinSymbol,
            },
            formattedPayout: `INR ₹500 via ${cryptoCashMethod}: ${cryptoCashValue.trim()}`,
            upiId: cryptoCashValue.trim(),
          };
        }
        break;
      }
      default:
        payload = {
          payoutMethod: "UPI",
          payoutDetails: { upiId: upiValue.trim() },
          formattedPayout: `UPI: ${upiValue.trim()}`,
          upiId: upiValue.trim(),
        };
    }

    await onSubmit(payload);
  };

  if (!reward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-950 border border-neutral-800 text-neutral-100 sm:max-w-lg shadow-2xl p-6 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pb-1">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Gift className="w-5 h-5" />
              </span>
              <span>Redeem {reward.name}</span>
            </DialogTitle>
          </div>
          <p className="text-xs text-neutral-400">
            Cost:{" "}
            <span className="font-bold text-amber-400 font-mono">
              {reward.credits.toLocaleString()} DM Coins
            </span>{" "}
            • {reward.desc}
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Audit Error Notification */}
          {auditError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Trust Audit Flagged</p>
                <p className="mt-0.5 opacity-90">{auditError}</p>
              </div>
            </div>
          )}

          {/* Audit Pending Notification */}
          {auditPendingMessage && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Queued For Manual Review</p>
                <p className="mt-0.5 opacity-90">{auditPendingMessage}</p>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {redemptionSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-neutral-100">Redemption Request Sent!</h3>
              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                Your payout request has been verified and registered. The admin team is processing your transfer.
              </p>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 w-full text-xs text-neutral-300 font-mono text-left">
                <span className="text-[10px] uppercase text-neutral-500 block mb-1 font-sans font-semibold">
                  Destination Recorded
                </span>
                {rewardType === "DIRECT_PAYOUT" && (
                  <span>
                    {cashChannel === "UPI" ? `UPI ID: ${upiValue}` : `${cashChannel}: +91 ${phoneNumber}`}
                  </span>
                )}
                {rewardType === "AMAZON_VOUCHER" && <span>Email: {amazonEmail}</span>}
                {rewardType === "CAFE_COINS" && <span>WhatsApp: +91 {cafePhone}</span>}
                {rewardType === "PHYSICAL_BOX" && (
                  <span>
                    {shippingName}, {shippingCity} - {shippingPin}
                  </span>
                )}
                {(rewardType === "CRYPTO_SOL" || rewardType === "CRYPTO_BTC" || rewardType === "CRYPTO_ETH") && (
                  <span>
                    {cryptoMode === "WALLET" ? `Wallet: ${cryptoAddress}` : `INR via ${cryptoCashMethod}: ${cryptoCashValue}`}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* CATEGORY 1: DIRECT PAYOUT (UPI, Google Pay, PhonePe, Paytm) */}
              {rewardType === "DIRECT_PAYOUT" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-neutral-300 mb-2 block">
                      Choose Your Preferred Payout Method
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setCashChannel("GPAY")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                          cashChannel === "GPAY"
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-sm"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <GPayIcon size={24} />
                        <span>Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCashChannel("PHONEPE")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                          cashChannel === "PHONEPE"
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-sm"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <PhonePeIcon size={24} />
                        <span>PhonePe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCashChannel("PAYTM")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                          cashChannel === "PAYTM"
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-sm"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <PaytmIcon size={24} />
                        <span>Paytm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCashChannel("UPI")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                          cashChannel === "UPI"
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-sm"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <UpiIcon size={24} />
                        <span>UPI ID</span>
                      </button>
                    </div>
                  </div>

                  {cashChannel === "UPI" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="upi-input" className="text-xs text-neutral-300">
                        Enter UPI ID (VPA)
                      </Label>
                      <div className="relative">
                        <Input
                          id="upi-input"
                          value={upiValue}
                          onChange={(e) => setUpiValue(e.target.value)}
                          placeholder="e.g. yourname@oksbi, name@ybl"
                          className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500 h-11 pr-10"
                          disabled={isRedeeming}
                          autoFocus
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                          <UpiIcon size={20} />
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Works with any UPI app (GPay, PhonePe, Paytm, BHIM, etc.).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="phone-input" className="text-xs text-neutral-300">
                        Enter 10-Digit Mobile Number
                      </Label>
                      <div className="relative flex rounded-xl border border-neutral-800 bg-neutral-900 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
                        <div className="flex items-center px-3 border-r border-neutral-800 text-neutral-400 text-xs font-mono font-semibold">
                          +91
                        </div>
                        <Input
                          id="phone-input"
                          type="tel"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          className="bg-transparent border-none text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-0 h-11 font-mono text-sm"
                          disabled={isRedeeming}
                          autoFocus
                        />
                        <div className="flex items-center pr-3 pointer-events-none">
                          {cashChannel === "GPAY" && <GPayIcon size={20} />}
                          {cashChannel === "PHONEPE" && <PhonePeIcon size={20} />}
                          {cashChannel === "PAYTM" && <PaytmIcon size={20} />}
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Ensure this number is actively registered with{" "}
                        {cashChannel === "GPAY" ? "Google Pay" : cashChannel === "PHONEPE" ? "PhonePe" : "Paytm"}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CATEGORY 2: AMAZON VOUCHER */}
              {rewardType === "AMAZON_VOUCHER" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <AmazonIcon size={28} />
                    <div className="text-xs">
                      <p className="font-semibold text-amber-300">Amazon Pay Gift Card Voucher</p>
                      <p className="text-neutral-400 text-[11px]">
                        The digital claim code will be dispatched to your email address within 24h.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amazon-email" className="text-xs text-neutral-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      Recipient Email Address (Required)
                    </Label>
                    <Input
                      id="amazon-email"
                      type="email"
                      value={amazonEmail}
                      onChange={(e) => setAmazonEmail(e.target.value)}
                      placeholder="e.g. shyam@example.com"
                      className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500 h-11"
                      disabled={isRedeeming}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amazon-phone" className="text-xs text-neutral-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      Mobile Number for SMS Notification (Optional)
                    </Label>
                    <div className="relative flex rounded-xl border border-neutral-800 bg-neutral-900 focus-within:border-amber-500">
                      <div className="flex items-center px-3 border-r border-neutral-800 text-neutral-400 text-xs font-mono">
                        +91
                      </div>
                      <Input
                        id="amazon-phone"
                        type="tel"
                        maxLength={10}
                        value={amazonPhone}
                        onChange={(e) => setAmazonPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="bg-transparent border-none text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-0 h-11 font-mono text-sm"
                        disabled={isRedeeming}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 3: RIDERZ HUB CAFE COINS */}
              {rewardType === "CAFE_COINS" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-orange-300">Riderz Hub Cafe Counter Voucher</p>
                      <p className="text-neutral-400 text-[11px]">
                        Redeemable for refreshing drinks & snacks at Riderz Hub partner counters.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cafe-phone" className="text-xs text-neutral-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      WhatsApp / Mobile Number for QR Coupon
                    </Label>
                    <div className="relative flex rounded-xl border border-neutral-800 bg-neutral-900 focus-within:border-amber-500">
                      <div className="flex items-center px-3 border-r border-neutral-800 text-neutral-400 text-xs font-mono">
                        +91
                      </div>
                      <Input
                        id="cafe-phone"
                        type="tel"
                        maxLength={10}
                        value={cafePhone}
                        onChange={(e) => setCafePhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="bg-transparent border-none text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-0 h-11 font-mono text-sm"
                        disabled={isRedeeming}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cafe-name" className="text-xs text-neutral-300">
                      Member / Reformer Name
                    </Label>
                    <Input
                      id="cafe-name"
                      value={cafeMemberName}
                      onChange={(e) => setCafeMemberName(e.target.value)}
                      placeholder="e.g. Shyam Pandey"
                      className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500 h-11"
                      disabled={isRedeeming}
                    />
                  </div>
                </div>
              )}

              {/* CATEGORY 4: PHYSICAL DELIVERY (NIMKITHEKUA BOX) */}
              {rewardType === "PHYSICAL_BOX" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-amber-300">Physical Courier Delivery Package</p>
                      <p className="text-neutral-400 text-[11px]">
                        Fresh artisan NimkiThekua box packed and shipped right to your doorstep.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-neutral-300">Recipient Name</Label>
                      <Input
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="Full Name"
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-neutral-300">Mobile Number (Courier)</Label>
                      <Input
                        type="tel"
                        maxLength={10}
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile"
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 h-10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      Street Address / House / Flat / Landmark
                    </Label>
                    <Input
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g. Flat 302, Green Valley Apartments, Near City Park"
                      className="bg-neutral-900 border-neutral-800 text-neutral-100 h-10 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-neutral-400">City</Label>
                      <Input
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="e.g. Patna"
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-neutral-400">State</Label>
                      <Input
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        placeholder="e.g. Bihar"
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-neutral-400">PIN Code</Label>
                      <Input
                        maxLength={6}
                        value={shippingPin}
                        onChange={(e) => setShippingPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="800001"
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 h-10 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 5: CRYPTO REWARDS (SOL, BTC, ETH) */}
              {(rewardType === "CRYPTO_SOL" || rewardType === "CRYPTO_BTC" || rewardType === "CRYPTO_ETH") && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {rewardType === "CRYPTO_SOL" && <SolanaIcon size={28} />}
                      {rewardType === "CRYPTO_BTC" && <BitcoinIcon size={28} />}
                      {rewardType === "CRYPTO_ETH" && <EthereumIcon size={28} />}
                      <div>
                        <p className="text-xs font-semibold text-purple-300">
                          {rewardType === "CRYPTO_SOL" ? "Solana (SOL)" : rewardType === "CRYPTO_BTC" ? "Bitcoin (BTC)" : "Ethereum (ETH)"}
                        </p>
                        <p className="text-[11px] text-neutral-400">Value: ₹500 equivalent crypto</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-300">
                      ₹500 INR
                    </Badge>
                  </div>

                  {/* Mode Selector: Crypto Wallet vs INR Cash Alternative */}
                  <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setCryptoMode("WALLET")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        cryptoMode === "WALLET"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      Crypto Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setCryptoMode("CASH")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        cryptoMode === "CASH"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      INR Cash (₹500)
                    </button>
                  </div>

                  {cryptoMode === "WALLET" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="crypto-addr" className="text-xs text-neutral-300 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-neutral-400" />
                        {rewardType === "CRYPTO_SOL"
                          ? "Solana Wallet Address (SOL)"
                          : rewardType === "CRYPTO_BTC"
                          ? "Bitcoin Wallet Address (BTC)"
                          : "Ethereum ERC-20 Address (ETH)"}
                      </Label>
                      <Input
                        id="crypto-addr"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value.trim())}
                        placeholder={
                          rewardType === "CRYPTO_SOL"
                            ? "e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                            : rewardType === "CRYPTO_ETH"
                            ? "e.g. 0x71C...3974b"
                            : "e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                        }
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 font-mono text-xs placeholder:text-neutral-600 focus-visible:ring-purple-500 h-11"
                        disabled={isRedeeming}
                      />
                      <p className="text-[11px] text-neutral-500">
                        Double-check your recipient address. Blockchain transactions are irreversible.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-xs text-neutral-300">Select Cash Transfer Channel</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setCryptoCashMethod("GPAY")}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold ${
                            cryptoCashMethod === "GPAY"
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400"
                          }`}
                        >
                          <GPayIcon size={20} />
                          <span>GPay</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCryptoCashMethod("PHONEPE")}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold ${
                            cryptoCashMethod === "PHONEPE"
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400"
                          }`}
                        >
                          <PhonePeIcon size={20} />
                          <span>PhonePe</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCryptoCashMethod("UPI")}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold ${
                            cryptoCashMethod === "UPI"
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400"
                          }`}
                        >
                          <UpiIcon size={20} />
                          <span>UPI ID</span>
                        </button>
                      </div>

                      <Input
                        value={cryptoCashValue}
                        onChange={(e) => setCryptoCashValue(e.target.value)}
                        placeholder={
                          cryptoCashMethod === "UPI"
                            ? "e.g. name@oksbi"
                            : "Enter 10-digit mobile number"
                        }
                        className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-emerald-500 h-11 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Validation Feedback */}
              {validationState.error && (
                <p className="text-xs text-amber-400/90 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationState.error}</span>
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!validationState.isValid || isRedeeming}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Trust Audit...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm &amp; Claim Reward</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
