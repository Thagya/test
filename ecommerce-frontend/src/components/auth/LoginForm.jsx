import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock } from "lucide-react";
import { loginUser } from "../../store/authSlice";

import Input from "../ui/Input";
import Button from "../ui/Button";
import { username } from "../../utils/validators";

const LoginForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginUser(formData)).unwrap();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-md mx-auto p-6 bg-slate-900/80 rounded-2xl shadow-xl border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
        <LogIn className="w-6 h-6 text-eco-green" />
        <span>Login</span>
      </h2>

      {error && <p className="text-red-400 text-sm">{error}</p>}

     <Input
        icon={<User className="w-4 h-4 text-gray-400" />}
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        required
      />

      <Input
        icon={<Lock className="w-4 h-4 text-gray-400" />}
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Button type="submit" disabled={isLoading} full>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </motion.form>
  );
};

export default LoginForm;
