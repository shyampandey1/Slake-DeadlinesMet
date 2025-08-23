
"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedTrashIconProps {
  isHovered: boolean;
}

const AnimatedTrashIcon = ({ isHovered }: AnimatedTrashIconProps) => {
  const lidVariants = {
    closed: { rotate: 0, y: 0, originX: "50%", originY: "100%" },
    open: { rotate: -45, y: -4, originX: "100%", originY: "100%" },
  };

  return (
    <motion.svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      {/* Base */}
      <path
        d="M6 8H18V20H6V8Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Lid */}
      <motion.path
        d="M4 6H20V8H4V6Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        variants={lidVariants}
        initial="closed"
        animate={isHovered ? "open" : "closed"}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      />
    </motion.svg>
  );
};

export default AnimatedTrashIcon;
