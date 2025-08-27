import React from "react";

const Badge = ({ children, className = "" }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-eco-green/20 text-eco-green ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
