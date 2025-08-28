// src/components/products/ImageUpload.jsx
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";

const ImageUpload = ({ value, onChange }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onChange(reader.result); // base64 URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {preview ? (
        <div className="relative w-40 h-40">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-xl border border-white/20"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 text-white"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current.click()}
          className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-eco-green hover:text-eco-green transition"
        >
          <Upload className="w-8 h-8 mb-2" />
          <span>Upload</span>
        </motion.button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
