import React from "react";

const Input = ({ value, onChange, placeholder, type = "text", error = "", icon: Icon }) => {
  return (
    <div className="relative mb-4">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green transition-all duration-300 ${
          error ? "border-red-400" : "border-white/20 hover:border-white/40"
        }`}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
